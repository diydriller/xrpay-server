import { IsNotEmpty } from 'class-validator';

export class SwapAMMDto {
  @IsNotEmpty()
  payAssetCurrency: string;
  @IsNotEmpty()
  payAssetMaxAmount: number;
  @IsNotEmpty()
  getAssetCurrency: string;
  @IsNotEmpty()
  getAssetMinAmount: number;
}
