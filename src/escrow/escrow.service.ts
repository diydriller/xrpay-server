import { Injectable, NotFoundException } from '@nestjs/common';
import { fromRippleTime, toRippleTime } from 'src/common/util/time.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { Wallet } from 'xrpl';
import { v4 as uuid } from 'uuid';
import { Transactional } from 'src/common/decorator/transaction.decorator';
import { OutboxService } from 'src/outbox/outbox.service';

@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly outboxService: OutboxService,
  ) {}

  @Transactional()
  async registerIOUEscrow(
    amount: number,
    currency: string,
    receiverAddress: string,
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
    const senderWallet = Wallet.fromSeed(savedWallet.seed);

    const savedTrustLine = await this.prisma.trustLine.findUnique({
      where: {
        address_currency_issuer: {
          address: senderWallet.address,
          currency: currency,
          issuer: adminWallet.address,
        },
      },
    });
    if (!savedTrustLine) {
      throw new NotFoundException('trustline이 존재하지 않습니다.');
    }

    const finishAfter = toRippleTime(new Date(Date.now() + 10_000));
    const cancelAfter = toRippleTime(new Date(Date.now() + 150_000));
    const { txBlob, sequence } = await this.walletService.createIOUEscrow(
      adminWallet.address,
      senderWallet,
      receiverAddress,
      currency,
      amount,
      finishAfter,
      cancelAfter,
    );
    const escrowId = uuid();
    await this.prisma.iOUEscrow.create({
      data: {
        escrowId: escrowId,
        senderAddress: senderWallet.address,
        receiverAddress: receiverAddress,
        offerSequence: sequence,
        amount: amount,
        currency: currency,
        status: 'PENDING',
        finishAfter: fromRippleTime(finishAfter),
        cancelAfter: fromRippleTime(cancelAfter),
      },
    });

    await this.outboxService.create('CREATE_ESCROW', txBlob);
    return {
      escrowId: escrowId,
    };
  }

  @Transactional()
  async settleIOUEscrow(escrowId: string, userId: number) {
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

    const savedIOUEscrow = await this.prisma.iOUEscrow.findUnique({
      where: { escrowId: escrowId },
    });
    if (!savedIOUEscrow) {
      throw new NotFoundException('존재 하지 않는 에스크로우입니다.');
    }

    const savedTrustLine = await this.prisma.trustLine.findUnique({
      where: {
        address_currency_issuer: {
          address: userWallet.address,
          currency: savedIOUEscrow.currency,
          issuer: adminWallet.address,
        },
      },
    });
    if (!savedTrustLine) {
      throw new NotFoundException('trustline이 존재하지 않습니다.');
    }

    const txBlob = await this.walletService.finishIOUEscrow(
      savedIOUEscrow.senderAddress,
      userWallet,
      savedIOUEscrow.offerSequence!,
    );
    await this.prisma.iOUEscrow.update({
      where: { escrowId: escrowId },
      data: {
        status: 'FINISHED',
      },
    });
    await this.outboxService.create('ESCROW_FINISH', txBlob);
  }

  async getIOUEscrow(page: number, limit: number, userId: number) {
    const savedWallet = await this.prisma.wallet.findUnique({
      where: { userId: userId },
      select: {
        address: true,
      },
    });
    if (!savedWallet) {
      throw new NotFoundException('존재하지 않는 지갑입니다.');
    }

    const IOUEscrows = await this.prisma.iOUEscrow.findMany({
      where: {
        OR: [
          { senderAddress: savedWallet.address },
          { receiverAddress: savedWallet.address },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: Math.max(0, (page - 1) * limit),
      take: Math.max(1, limit),
    });

    const result = IOUEscrows.map((iouEscrow) => ({
      isFinished: iouEscrow.status === 'FINISHED',
      isReceiver: iouEscrow.receiverAddress === savedWallet.address,
      amount: iouEscrow.amount,
      currency: iouEscrow.currency,
      finishAfter: iouEscrow.finishAfter,
      cancelAfter: iouEscrow.cancelAfter,
    }));
    return result;
  }
}
