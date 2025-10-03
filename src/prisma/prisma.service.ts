import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { asyncLocalStorage } from './transaction-storage';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.$transaction(async (tx) => {
      return asyncLocalStorage.run(tx, () => fn(tx));
    });
  }

  get tx(): Prisma.TransactionClient | this {
    const store = asyncLocalStorage.getStore();
    return store ?? this;
  }
}
