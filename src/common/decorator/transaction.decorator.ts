import { asyncLocalStorage } from 'src/prisma/transaction-storage';

export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const existingTx = asyncLocalStorage.getStore();
      if (existingTx) {
        return await original.apply(this, args);
      } else {
        return this.prisma.$transaction(async (tx) => {
          return asyncLocalStorage.run(tx, async () => {
            return await original.apply(this, args);
          });
        });
      }
    };
  };
}
