import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailQueueService } from './mail-queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  providers: [MailQueueService],
  exports: [MailQueueService],
})
export class QueueModule {}
