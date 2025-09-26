import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { WalletModule } from 'src/wallet/wallet.module';
import { PortoneService } from './portone.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PaymentController],
  providers: [PaymentService, PortoneService],
  exports: [PaymentService],
})
export class PaymentModule {}
