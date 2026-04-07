import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailJob {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private mailQueue: Queue<MailJob> | null = null;
  private worker: Worker<MailJob> | null = null;
  private transporter: nodemailer.Transporter;
  private queueEnabled = false;
  private initPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: this.configService.get('MAIL_PORT', 1025),
      secure: false,
    });
  }

  async onModuleInit() {
    // Initialize in background without blocking
    this.initPromise = this.initQueue();
  }

  private async initQueue(): Promise<void> {
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = parseInt(this.configService.get('REDIS_PORT', '6379'), 10);

    try {
      this.mailQueue = new Queue('mail-queue', {
        connection: {
          host: redisHost,
          port: redisPort,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      this.worker = new Worker<MailJob>(
        'mail-queue',
        async (job: Job<MailJob>) => {
          try {
            await this.transporter.sendMail({
              from: this.configService.get('MAIL_FROM', '"ChessOps" <noreply@chessops.local>'),
              to: job.data.to,
              subject: job.data.subject,
              html: job.data.html,
            });
            console.log(`Email sent to ${job.data.to}: ${job.data.subject}`);
          } catch (err) {
            console.error(`Failed to send email: ${err.message}`);
            throw err;
          }
        },
        {
          connection: {
            host: redisHost,
            port: redisPort,
          },
          concurrency: 5,
        },
      );

      this.worker.on('completed', (job: Job<MailJob>) => {
        console.log(`Mail job ${job.id} completed`);
      });

      this.worker.on('failed', (job: Job<MailJob>, err) => {
        console.error(`Mail job ${job?.id} failed:`, err);
      });

      // Wait for connection with timeout
      await Promise.race([
        this.mailQueue.waitUntilReady(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 5000)),
      ]);

      this.queueEnabled = true;
      console.log('Mail queue connected to Redis');
    } catch (error) {
      console.warn('Mail queue disabled - Redis not available:', error.message);
      this.queueEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.mailQueue) {
      await this.mailQueue.close();
    }
    if (this.worker) {
      await this.worker.close();
    }
  }

  async addMailJob(mailData: MailJob): Promise<void> {
    // Wait for initialization with timeout
    if (this.initPromise) {
      try {
        await Promise.race([
          this.initPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 3000)),
        ]);
      } catch (err) {
        console.warn('Queue initialization not complete, using fallback');
      }
    }

    if (!this.queueEnabled || !this.mailQueue) {
      console.log('Mail queue disabled, sending email directly');
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM', '"ChessOps" <noreply@chessops.local>'),
        to: mailData.to,
        subject: mailData.subject,
        html: mailData.html,
      });
      return;
    }

    try {
      await this.mailQueue.add('send-mail', mailData);
    } catch (error) {
      console.error('Failed to add job to queue, sending directly:', error.message);
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM', '"ChessOps" <noreply@chessops.local>'),
        to: mailData.to,
        subject: mailData.subject,
        html: mailData.html,
      });
    }
  }
}
