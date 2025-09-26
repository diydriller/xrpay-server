import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { EscrowModule } from './escrow/escrow.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WalletModule,
    UserModule,
    PaymentModule,
    EscrowModule,
  ],
})
export class AppModule {}
