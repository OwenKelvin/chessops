import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailQueueService } from './mail-queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          // Don't block on connect
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying
            return Math.min(times * 200, 2000);
          },
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
    }),
  ],
  providers: [MailQueueService],
  exports: [MailQueueService],
})
export class QueueModule {}
