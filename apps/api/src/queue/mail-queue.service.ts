import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailJob {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailQueueService implements OnModuleInit {
  private mailQueue: Queue<MailJob>;
  private worker: Worker<MailJob>;
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.mailQueue = new Queue('mail-queue', {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: parseInt(this.configService.get('REDIS_PORT', '6379'), 10),
      },
    });

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'localhost'),
      port: this.configService.get('MAIL_PORT', 1025),
      secure: false,
    });
  }

  async onModuleInit() {
    this.worker = new Worker<MailJob>(
      'mail-queue',
      async (job: Job<MailJob>) => {
        await this.transporter.sendMail({
          from: this.configService.get('MAIL_FROM', '"ChessOps" <noreply@chessops.local>'),
          to: job.data.to,
          subject: job.data.subject,
          html: job.data.html,
        });
        console.log(`Email sent to ${job.data.to}: ${job.data.subject}`);
      },
      {
        connection: {
          host: this.configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(this.configService.get('REDIS_PORT', '6379'), 10),
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
  }

  async addMailJob(mailData: MailJob): Promise<Job<MailJob>> {
    return this.mailQueue.add('send-mail', mailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
