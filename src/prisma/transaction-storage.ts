import { AsyncLocalStorage } from 'async_hooks';
import { Prisma } from '@prisma/client';

export const asyncLocalStorage =
  new AsyncLocalStorage<Prisma.TransactionClient>();
