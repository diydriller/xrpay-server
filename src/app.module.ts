import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, WalletModule, UserModule],
})
export class AppModule {}
