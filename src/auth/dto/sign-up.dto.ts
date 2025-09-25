import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @MinLength(8, { message: '비밀번호는 최소 8자리 이상이어야 합니다.' })
  password: string;

  @IsNotEmpty()
  name: string;
}
