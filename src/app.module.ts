import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { EscrowModule } from './escrow/escrow.module';
import { ExchangeModule } from './exchange/exchange.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxModule } from './outbox/outbox.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WalletModule,
    UserModule,
    PaymentModule,
    EscrowModule,
    ExchangeModule,
    OutboxModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
