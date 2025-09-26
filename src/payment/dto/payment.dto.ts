import { IsNotEmpty } from 'class-validator';

export class PaymentDto {
  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  currency: string;
}
