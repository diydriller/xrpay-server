import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { OutboxService } from './outbox.service';
import { OutboxScheduler } from './outbox.scheduler';
import { OutboxWorker } from './outbox.worker';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [],
  providers: [OutboxService, OutboxScheduler, OutboxWorker],
  exports: [OutboxService],
})
export class OutboxModule {}
