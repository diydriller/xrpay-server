import { Injectable, NotFoundException } from '@nestjs/common';
import { parseMyBalanceChanges } from 'src/common/util/xrpl.util';
import { OutboxService } from 'src/outbox/outbox.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Wallet } from 'xrpl';

@Injectable()
export class ExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletSerivce: WalletService,
    private readonly outboxService: OutboxService,
  ) {}

  async swapAmm(
    payAssetCurrency: string,
    payAssetMaxAmount: number,
    getAssetCurrency: string,
    getAssetMinAmount: number,
    userId: number,
  ) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        seed: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const adminWallet = Wallet.fromSeed(process.env.IOU_ADMIN_SEED!);
    const userWallet = Wallet.fromSeed(savedWallet.seed);

    const savedPayAseetTrustLine = await this.prisma.trustLine.findUnique({
      where: {
        address_currency_issuer: {
          address: userWallet.address,
          currency: payAssetCurrency,
          issuer: adminWallet.address,
        },
      },
    });
    const savedGetAssetTrustLine = await this.prisma.trustLine.findUnique({
      where: {
        address_currency_issuer: {
          address: userWallet.address,
          currency: getAssetCurrency,
          issuer: adminWallet.address,
        },
      },
    });
    if (!savedPayAseetTrustLine || !savedGetAssetTrustLine) {
      throw new NotFoundException('trustline이 존재하지 않습니다.');
    }

    const txBlob = await this.walletSerivce.swapAMM(
      payAssetCurrency,
      payAssetMaxAmount,
      getAssetCurrency,
      getAssetMinAmount,
      adminWallet.address,
      userWallet,
    );
    await this.outboxService.create('SWAP_AMM', txBlob, userWallet.address);
  }

  async handleSwapResult(result: any, address: string) {
    const meta = result?.result?.meta;
    const txHash = result?.result?.hash;

    if (!meta || meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error('Swap 트랜잭션 실패');
    }

    const changes = parseMyBalanceChanges(meta, address);

    if (changes.length === 0) return;

    for (const change of changes) {
      await this.prisma.exchangeLog.upsert({
        where: {
          txHash_address_currency_issuer: {
            txHash: txHash,
            address: address,
            currency: change.currency,
            issuer: change.issuer,
          },
        },
        update: { delta: change.delta },
        create: {
          txHash: txHash,
          address: address,
          currency: change.currency,
          issuer: change.issuer,
          delta: change.delta,
        },
      });
    }
  }

  async getSwapAmmInfo(asset1Currency: string, asset2Currency: string) {
    const adminWallet = Wallet.fromSeed(process.env.IOU_ADMIN_SEED!);
    return await this.walletSerivce.getAmmInfo(
      adminWallet.address,
      asset1Currency,
      asset2Currency,
    );
  }
}
