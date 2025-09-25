import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        wallets: {
          select: {
            id: true,
            address: true,
            publicKey: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
    return user;
  }
}
