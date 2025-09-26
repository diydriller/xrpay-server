import { IsNotEmpty } from 'class-validator';

export class RegisterIOUEscrowDto {
  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  currency: string;

  @IsNotEmpty()
  receiverAddress: string;
}
