import { Injectable } from '@nestjs/common';
import { OutboxWorker } from './outbox.worker';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OutboxScheduler {
  constructor(private readonly worker: OutboxWorker) {}

  @Cron('*/10 * * * * *')
  async handleCron() {
    await this.worker.processPending();
  }
}
