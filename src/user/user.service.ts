import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'src/common/decorator/transaction.decorator';
import { TRUST_LIMIT } from 'src/common/util/constant';
import { WalletService } from 'src/wallet/wallet.service';
import { Wallet } from 'xrpl';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from 'src/outbox/outbox.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly outboxSerice: OutboxService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            address: true,
            publicKey: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    return user;
  }

  @Transactional()
  async createTrustLine(currency: string, userId: number) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        seed: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const adminWallet = Wallet.fromSeed(process.env.IOU_ADMIN_SEED!);
    const userWallet = Wallet.fromSeed(savedWallet.seed);
    await this.prisma.trustLine.upsert({
      where: {
        address_currency_issuer: {
          address: userWallet.address,
          currency: currency,
          issuer: adminWallet.address,
        },
      },
      update: {},
      create: {
        currency: currency,
        issuer: adminWallet.address,
        address: userWallet.address,
        walletId: savedWallet.id,
        limit: TRUST_LIMIT,
      },
    });

    const txBlob = await this.walletService.setTrust(
      adminWallet.address,
      userWallet,
      currency,
    );
    await this.outboxSerice.create(
      'TRUST_SET',
      txBlob,
      userWallet.address,
      savedWallet.id,
    );
  }

  async getBalance(userId: number) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        address: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const xrpBalance = await this.walletService.getXrpBalance(
      savedWallet.address,
    );
    const accountLine = await this.walletService.getAccountLine(
      savedWallet.address,
    );
    const processedLine = accountLine.result.lines.map((line: any) => {
      return {
        issuer: line.account,
        currency: line.currency,
        balance: line.balance,
        limit: line.limit,
      };
    });

    return {
      xrp: xrpBalance,
      token: processedLine,
    };
  }
}
