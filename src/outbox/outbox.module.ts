import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { OutboxService } from './outbox.service';
import { OutboxScheduler } from './outbox.scheduler';
import { OutboxWorker } from './outbox.worker';
import { ExchangeModule } from 'src/exchange/exchange.module';

@Module({
  imports: [PrismaModule, WalletModule, forwardRef(() => ExchangeModule)],
  controllers: [],
  providers: [OutboxService, OutboxScheduler, OutboxWorker],
  exports: [OutboxService, OutboxWorker],
})
export class OutboxModule {}
