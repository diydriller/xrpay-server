import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Client, Wallet as XrplWallet } from 'xrpl';

@Injectable()
export class WalletService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor(private prisma: PrismaService) {
    this.client = new Client(process.env.XRPL_NODE_URL!);
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  async createWallet(userId: number) {
    const wallet = XrplWallet.generate();
    await this.client.fundWallet(wallet);

    const savedWallet = await this.prisma.wallet.create({
      data: {
        address: wallet.classicAddress,
        publicKey: wallet.publicKey,
        userId,
      },
    });

    return {
      id: savedWallet.id,
      address: savedWallet.address,
      publicKey: savedWallet.publicKey,
    };
  }

  async getUserWallets(userId: number) {
    return this.prisma.wallet.findMany({
      where: { userId },
      select: { id: true, address: true, publicKey: true, createdAt: true },
    });
  }

  async getWalletById(walletId: number) {
    return this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, address: true, publicKey: true, createdAt: true },
    });
  }
}
