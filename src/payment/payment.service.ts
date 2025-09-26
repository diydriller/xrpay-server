import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { v4 as uuid } from 'uuid';
import { PortoneService } from './portone.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private portoneService: PortoneService,
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

  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
    currency: string,
    userId: number,
  ) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId: orderId },
    });
    if (!existingPayment) {
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

    await this.walletService.issueIOU(userId, data.amount, data.currency);
  }
}
