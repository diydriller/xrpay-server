import { WalletService } from 'src/wallet/wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from 'src/outbox/outbox.service';
import { asyncLocalStorage } from 'src/prisma/transaction-storage';
import { InternalServerErrorException } from '@nestjs/common';
import { OutboxWorker } from 'src/outbox/outbox.worker';
import { ExchangeService } from 'src/exchange/exchange.service';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;
  let walletService: WalletService;
  let outboxService: OutboxService;
  let outboxWorker: OutboxWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        UserService,
        OutboxService,
        WalletService,
        OutboxWorker,
        ExchangeService,
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
    outboxService = module.get<OutboxService>(OutboxService);
    outboxWorker = module.get<OutboxWorker>(OutboxWorker);

    await prismaService.trustLine.deleteMany();
    await prismaService.outbox.deleteMany();
    await prismaService.wallet.deleteMany();
    await prismaService.user.deleteMany();
  });

  it('commit 실패시 데이터베이스와 XRPL의 일관성 검증', async () => {
    const email = 'test@naver.com';
    const password = 'test';
    const name = 'test';
    const address = 'test';
    const publicKey = 'test';
    const privateKey = 'test';
    const seed = 'test';
    const currency = 'test';

    jest.spyOn(walletService, 'setTrust').mockResolvedValue('SIGNED_TX_BLOB');
    jest.spyOn(walletService, 'executeSignedTx').mockResolvedValue({
      result: { meta: { TransactionResult: 'tesSUCCESS' } },
    });
    jest.spyOn(walletService, 'createFromSeed').mockReturnValue({
      address,
      seed,
      publicKey,
      privateKey,
    });

    const user = await prismaService.user.create({
      data: { email, password, name },
    });
    const wallet = await prismaService.wallet.create({
      data: {
        address,
        publicKey,
        privateKey,
        seed,
        userId: user.id,
      },
    });

    await expect(
      prismaService.$transaction(async (tx) => {
        return asyncLocalStorage.run(tx, async () => {
          await userService.createTrustLine(currency, user.id);
          throw new InternalServerErrorException('서버 이상으로 인한 실패');
        });
      }),
    ).rejects.toThrow();

    const trustLines = await prismaService.trustLine.findMany({
      where: { walletId: wallet.id },
    });
    expect(trustLines.length).toBe(0);

    const outboxes = await prismaService.outbox.findMany({
      where: { walletId: wallet.id },
    });
    expect(outboxes.length).toBe(0);

    await outboxWorker.processPending();
    expect(walletService.executeSignedTx).toHaveBeenCalledTimes(0);
  });
});
