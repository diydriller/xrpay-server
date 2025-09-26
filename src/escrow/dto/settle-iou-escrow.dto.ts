import { IsNotEmpty } from 'class-validator';

export class SettleIOUEscrowDto {
  @IsNotEmpty()
  escrowId: string;
}
