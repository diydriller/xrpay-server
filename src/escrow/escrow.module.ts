import { PrismaModule } from 'src/prisma/prisma.module';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { Module } from '@nestjs/common';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
