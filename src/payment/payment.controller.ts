import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentService } from './payment.service';
import { PaymentDto } from './dto/payment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async payment(@Body() dto: PaymentDto, @Req() req) {
    return this.paymentService.payment(
      dto.amount,
      dto.currency,
      req.user.userId,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('confirm')
  async confirmPayment(@Body() dto: ConfirmPaymentDto, @Req() req) {
    return this.paymentService.confirmPayment(
      dto.paymentKey,
      dto.orderId,
      dto.amount,
      dto.currency,
      req.user.userId,
    );
  }
}
