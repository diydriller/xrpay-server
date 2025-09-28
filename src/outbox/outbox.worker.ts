import { Injectable, Logger } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly walletService: WalletService,
  ) {}

  async processPending() {
    const messages = await this.outboxService.findPending(5);
    for (const msg of messages) {
      try {
        const result = await this.walletService.executeSignedTx(msg.payload);
        const meta = result?.result?.meta as any;
        if (meta?.TransactionResult === 'tesSUCCESS') {
          await this.outboxService.markSuccess(msg.id);
        } else {
          await this.outboxService.markFailed(msg.id);
        }
      } catch (error) {
        await this.outboxService.markFailed(msg.id);
        this.logger.error(`Outbox ${msg.id} 실패: ${msg.type} - ${error}`);
      }
    }
  }
}
