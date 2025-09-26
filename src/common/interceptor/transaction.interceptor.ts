import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    return this.prisma.$transaction(async (tx) => {
      Reflect.defineMetadata('prismaTx', tx, context.getHandler());
      return next.handle();
    });
  }
}
