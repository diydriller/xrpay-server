import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { WalletService } from '../wallet/wallet.service';
import { ExchangeService } from 'src/exchange/exchange.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly walletService: WalletService,
    private readonly exchangeService: ExchangeService,
  ) {}

  async processPending() {
    const messages = await this.outboxService.findPending(5);
    for (const message of messages) {
      try {
        const result = await this.walletService.executeSignedTx(
          message.payload,
        );

        switch (message.type) {
          case 'SWAP_AMM':
            await this.exchangeService.handleSwapResult(
              result,
              message.address,
            );
            break;
        }

        const meta = result?.result?.meta as any;
        if (meta?.TransactionResult === 'tesSUCCESS') {
          await this.outboxService.markSuccess(message.id);
        } else {
          await this.outboxService.markFailed(message.id);
        }
      } catch (error) {
        await this.outboxService.markFailed(message.id);
        this.logger.error(
          `Outbox ${message.id} 실패: ${message.type} - ${error}`,
        );
      }
    }
  }
}
