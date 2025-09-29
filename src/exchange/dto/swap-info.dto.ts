import { IsString } from 'class-validator';

export class SwapInfoQueryDto {
  @IsString()
  asset1Currency: string;

  @IsString()
  asset2Currency: string;
}
