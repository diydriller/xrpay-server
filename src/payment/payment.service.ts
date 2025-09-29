import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { v4 as uuid } from 'uuid';
import { PortoneService } from './portone.service';
import { Wallet } from 'xrpl';
import { Transactional } from 'src/common/decorator/transaction.decorator';
import { OutboxService } from 'src/outbox/outbox.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private portoneService: PortoneService,
    private outboxService: OutboxService,
  ) {}

  encryptedApiSecretKey =
    'Basic ' +
    Buffer.from(process.env.PAYMENT_API_SECRET + ':').toString('base64');

  async payment(amount: number, currency: string, userId: number) {
    const orderId = uuid();

    const payment = await this.prisma.payment.create({
      data: {
        orderId: orderId,
        amount: amount,
        currency: currency,
        userId: userId,
        status: 'PENDING',
      },
    });

    return {
      orderId: payment.orderId,
      amount: payment.amount,
      userId: userId,
    };
  }

  @Transactional()
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
    currency: string,
    userId: number,
  ) {
    const savedPayment = await this.prisma.payment.findUnique({
      where: { orderId: orderId },
    });
    if (!savedPayment) {
      throw new BadRequestException('존재하지 않는 주문입니다.');
    }

    const data = await this.portoneService.getPaymentData(paymentKey);

    if (amount != data.amount || currency != data.currency) {
      throw new BadRequestException('금액이 일치하지 않습니다.');
    }

    await this.prisma.payment.update({
      where: { orderId: orderId },
      data: {
        paymentKey: data.imp_uid,
        status: 'SUCCESS',
      },
    });

    await this.issueIOU(userId, data.amount, data.currency);
  }

  private async issueIOU(userId: number, amount: number, currency: string) {
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

    const savedTrustLine = await this.prisma.trustLine.findUnique({
      where: {
        address_currency_issuer: {
          address: userWallet.address,
          currency: currency,
          issuer: adminWallet.address,
        },
      },
    });
    if (!savedTrustLine) {
      throw new NotFoundException('trustline이 존재하지 않습니다.');
    }

    const txBlob = await this.walletService.sendIOU(
      adminWallet.address,
      adminWallet,
      userWallet.address,
      currency,
      amount,
    );
    await this.outboxService.create('PAYMENT_IOU', txBlob, userWallet.address);
  }
}
