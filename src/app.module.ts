import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { WalletService } from './wallet/wallet.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, WalletService],
})
export class AppModule {}
