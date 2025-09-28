import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { OutboxModule } from 'src/outbox/outbox.module';

@Module({
  imports: [PrismaModule, WalletModule, OutboxModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
