import { Injectable, NotFoundException } from '@nestjs/common';
import { fromRippleTime, toRippleTime } from 'src/common/util/time.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Wallet } from 'xrpl';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EscrowService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async registerIOUEscrow(
    amount: number,
    currency: string,
    receiverAddress: string,
    userId: number,
  ) {
    const escrowId = await this.createIOUEscrow(
      userId,
      receiverAddress,
      amount,
      currency,
    );

    return {
      escrowId: escrowId,
    };
  }

  async settleIOUEscrow(escrowId: string, userId: number) {
    await this.finishIOUEscrow(userId, escrowId);
  }

  private async createIOUEscrow(
    userId: number,
    address: string,
    amount: number,
    currency: string,
  ) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        seed: true,
        address: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const adminWallet = Wallet.fromSeed(process.env.ADMIN_SEED || '');
    const userWallet = Wallet.fromSeed(savedWallet.seed);
    const finishAfter = toRippleTime(new Date(Date.now() + 10_000));
    const cancelAfter = toRippleTime(new Date(Date.now() + 150_000));
    const offerSequence = await this.walletService.createIOUEscrow(
      adminWallet.address,
      userWallet,
      address,
      currency,
      amount,
      finishAfter,
      cancelAfter,
    );

    const escrowId = uuid();
    await this.prisma.iOUEscrow.create({
      data: {
        escrowId: escrowId,
        senderAddress: savedWallet.address,
        receiverAddress: address,
        offerSequence: offerSequence,
        amount: amount,
        currency: currency,
        status: 'PENDING',
        finishAfter: fromRippleTime(finishAfter),
        cancelAfter: fromRippleTime(cancelAfter),
      },
    });
    return escrowId;
  }

  private async finishIOUEscrow(userId: number, escrowId: string) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        seed: true,
        address: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const userWallet = Wallet.fromSeed(savedWallet.seed);

    const existingIOUEscrow = await this.prisma.iOUEscrow.findUnique({
      where: { escrowId: escrowId },
    });
    if (!existingIOUEscrow) {
      throw new NotFoundException('존재 하지 않는 에스크로우입니다.');
    }

    await this.walletService.finishIOUEscrow(
      existingIOUEscrow.senderAddress,
      userWallet,
      existingIOUEscrow.offerSequence!,
    );

    await this.prisma.iOUEscrow.update({
      where: { escrowId: escrowId },
      data: {
        status: 'FINISHED',
      },
    });
  }
}
