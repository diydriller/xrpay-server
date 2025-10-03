import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Client,
  Wallet,
  Wallet as XrplWallet,
  TrustSet as TrustSetTx,
  Payment,
  Transaction,
  IssuedCurrencyAmount,
} from 'xrpl';
import { encodeForSigning, encode } from 'ripple-binary-codec';
import { sign as kpSign, deriveKeypair } from 'ripple-keypairs';
import { TRUST_LIMIT } from 'src/common/util/constant';

@Injectable()
export class WalletService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {
    this.client = new Client(process.env.XRPL_NODE_URL!);
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  createFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
  }

  async createWallet(userId: number) {
    const wallet = XrplWallet.generate();
    await this.client.fundWallet(wallet);

    const savedWallet = await this.prisma.wallet.create({
      data: {
        address: wallet.classicAddress,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        userId,
        seed: wallet.seed!,
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

  async executeSignedTx(txBlob: any) {
    const result = await this.client.submitAndWait(txBlob);
    this.logger.log(result);
    return result;
  }

  async setTrust(issuerAddress: string, userWallet: Wallet, currency: string) {
    const tx: TrustSetTx = {
      TransactionType: 'TrustSet',
      Account: userWallet.address,
      LimitAmount: {
        currency: currency,
        issuer: issuerAddress,
        value: TRUST_LIMIT,
      },
    };
    const prepared = await this.client.autofill(tx);
    const signedTx = userWallet.sign(prepared);
    return signedTx.tx_blob;
  }

  async sendIOU(
    issuerAddress: string,
    senderWallet: Wallet,
    receiverAddress: string,
    currency: string,
    amount: number,
  ) {
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: senderWallet.address,
      Destination: receiverAddress,
      Amount: {
        currency: currency,
        issuer: issuerAddress,
        value: amount.toString(),
      },
    };

    const prepared = await this.client.autofill(tx);
    const signedTx = senderWallet.sign(prepared);
    return signedTx.tx_blob;
  }

  async createIOUEscrow(
    issuerAddress: string,
    senderWallet: Wallet,
    receiverAddress: string,
    currency: string,
    amount: number,
    finishAfter: number,
    cancelAfter: number,
  ) {
    const tx: Transaction = {
      TransactionType: 'EscrowCreate',
      Account: senderWallet.address,
      Destination: receiverAddress,
      Amount: {
        currency: currency,
        issuer: issuerAddress,
        value: amount.toString(),
      } as IssuedCurrencyAmount,
      FinishAfter: finishAfter,
      CancelAfter: cancelAfter,
    };

    const prepared = await this.client.autofill(tx);
    const toSign = {
      ...prepared,
      SigningPubKey: senderWallet.publicKey,
    };
    const { privateKey } = deriveKeypair(senderWallet.seed || '');
    const signingData = encodeForSigning(toSign as any);
    const signature = kpSign(signingData, privateKey);
    const signedTx = { ...toSign, TxnSignature: signature };
    const tx_blob = encode(signedTx);
    return {
      sequence: prepared.Sequence,
      txBlob: tx_blob,
    };
  }

  async finishIOUEscrow(
    senderAddress: string,
    receiverWallet: Wallet,
    offerSequence: number,
  ) {
    const tx: Transaction = {
      TransactionType: 'EscrowFinish',
      Account: receiverWallet.address,
      Owner: senderAddress,
      OfferSequence: offerSequence,
    };

    const prepared = await this.client.autofill(tx);
    const signed = receiverWallet.sign(prepared);
    return signed.tx_blob;
  }

  async swapAMM(
    payAssetCurrency: string,
    payAssetAmount: number,
    getAssetCurrency: string,
    getAssetAmount: number,
    issuerAddress: string,
    userWallet: Wallet,
  ) {
    const tx: Transaction = {
      TransactionType: 'Payment',
      Account: userWallet.address,
      Destination: userWallet.address,
      Amount: {
        currency: getAssetCurrency,
        issuer: issuerAddress,
        value: getAssetAmount.toString(),
      },
      SendMax: {
        currency: payAssetCurrency,
        issuer: issuerAddress,
        value: payAssetAmount.toString(),
      },
      Flags: 0x00020000,
    };

    const prepared = await this.client.autofill(tx);
    const signed = userWallet.sign(prepared);
    return signed.tx_blob;
  }

  async getAmmInfo(
    issuerAddress: string,
    asset1Currency: string,
    asset2Currency: string,
  ) {
    const req: any = {
      command: 'amm_info',
      asset: { currency: asset1Currency, issuer: issuerAddress },
      asset2: { currency: asset2Currency, issuer: issuerAddress },
    };
    return await this.client.request(req as any);
  }

  async getXrpBalance(address: string) {
    return await this.client.getXrpBalance(address);
  }

  async getAccountLine(address: string) {
    return await this.client.request({
      command: 'account_lines',
      account: address,
    });
  }
}
