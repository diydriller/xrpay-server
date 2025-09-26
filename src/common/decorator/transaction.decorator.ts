import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { TransactionInterceptor } from '../interceptor/transaction.interceptor';

export function Transactional() {
  return applyDecorators(UseInterceptors(TransactionInterceptor));
}
