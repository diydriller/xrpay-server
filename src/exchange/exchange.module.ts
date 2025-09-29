import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { ExchangeController } from './exchange.controller';
import { ExchangeService } from './exchange.service';
import { OutboxModule } from 'src/outbox/outbox.module';

@Module({
  imports: [PrismaModule, WalletModule, forwardRef(() => OutboxModule)],
  controllers: [ExchangeController],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
