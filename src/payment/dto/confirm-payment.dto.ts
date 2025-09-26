import { IsNotEmpty } from 'class-validator';

export class ConfirmPaymentDto {
  @IsNotEmpty()
  paymentKey: string;

  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  currency: string;
}
