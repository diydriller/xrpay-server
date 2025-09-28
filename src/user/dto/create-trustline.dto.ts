import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTrustLineDto {
  @IsString()
  @IsNotEmpty()
  currency: string;
}
