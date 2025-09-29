import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutboxService {
  constructor(private prisma: PrismaService) {}

  async create(type: string, payload: any, address: string, walletId: number) {
    return this.prisma.outbox.create({
      data: {
        type,
        payload,
        walletId,
        address,
      },
    });
  }

  async markSuccess(id: number) {
    return this.prisma.outbox.update({
      where: { id },
      data: { status: 'SUCCESS' },
    });
  }

  async markFailed(id: number) {
    return this.prisma.outbox.update({
      where: { id },
      data: {
        status: 'FAILED',
        retryCount: { increment: 1 },
      },
    });
  }

  async findPending(limit = 10) {
    return this.prisma.outbox.findMany({
      where: { status: 'PENDING' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }
}
