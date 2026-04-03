import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

export interface WebhookPayload {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly httpTimeout = 10000; // 10 seconds

  constructor(private prisma: PrismaService) {
    // Start retry processor
    this.startRetryProcessor();
  }

  /**
   * Publish an event to all subscribed apps
   */
  async publish(eventType: string, data: Record<string, unknown>) {
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Create webhook event
    const event = await this.prisma.webhookEvent.create({
      data: {
        type: eventType,
        payload: JSON.stringify(payload),
      },
    });

    // Find all apps with webhook URLs
    const apps = await this.prisma.app.findMany({
      where: {
        isActive: true,
        webhookUrl: {
          not: null,
        },
      },
    });

    // Create delivery records for each app
    for (const app of apps) {
      await this.prisma.webhookDelivery.create({
        data: {
          eventId: event.id,
          appId: app.id,
          url: app.webhookUrl!,
          status: 'pending',
          nextRetryAt: new Date(), // Try immediately
        },
      });
    }

    this.logger.debug(`Published event ${eventType} to ${apps.length} apps`);
    return event;
  }

  /**
   * Process pending webhook deliveries
   */
  async processDeliveries() {
    const now = new Date();

    // Get pending deliveries that are due for retry
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: 'pending',
        nextRetryAt: {
          lte: now,
        },
      },
      include: {
        event: true,
        app: true,
      },
      take: 100, // Process in batches
    });

    for (const delivery of deliveries) {
      await this.deliverWebhook(delivery);
    }
  }

  /**
   * Deliver a webhook to a specific endpoint
   */
  private async deliverWebhook(delivery: any) {
    const payload = JSON.parse(delivery.event.payload) as WebhookPayload;
    const signature = this.signPayload(payload, delivery.app.webhookSecret);

    const updateData: Record<string, unknown> = {
      attempt: delivery.attempt + 1,
    };

    try {
      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': payload.id,
          'X-Webhook-Type': payload.type,
          'User-Agent': 'ChessOps-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.httpTimeout),
      });

      updateData.responseCode = response.status;
      updateData.responseBody = await response.text();

      if (response.ok) {
        updateData.status = 'success';
        this.logger.debug(`Webhook delivered successfully to ${delivery.url}`);
      } else {
        updateData.status = 'failed';
        this.logger.warn(`Webhook delivery failed with status ${response.status} to ${delivery.url}`);
        this.scheduleRetry(updateData as any, delivery);
      }
    } catch (error) {
      updateData.status = 'failed';
      updateData.responseBody = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook delivery error to ${delivery.url}: ${error}`);
      this.scheduleRetry(updateData as any, delivery);
    }

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: updateData,
    });
  }

  /**
   * Schedule next retry with exponential backoff
   */
  private scheduleRetry(updateData: Record<string, unknown>, delivery: any) {
    const { attempt, maxAttempts } = delivery;

    if (attempt >= maxAttempts) {
      updateData.status = 'failed';
      this.logger.warn(`Webhook ${delivery.id} failed after ${maxAttempts} attempts`);
      return;
    }

    // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
    const delays = [60000, 300000, 900000, 3600000, 14400000];
    const delay = delays[Math.min(attempt, delays.length - 1)];
    updateData.nextRetryAt = new Date(Date.now() + delay);
  }

  /**
   * Sign payload with HMAC-SHA256
   */
  private signPayload(payload: WebhookPayload, secret?: string | null): string {
    if (!secret) {
      return '';
    }

    const body = JSON.stringify(payload);
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Start background processor for retries
   */
  private startRetryProcessor() {
    // Process deliveries every 30 seconds
    setInterval(() => {
      this.processDeliveries().catch((err) => {
        this.logger.error('Error processing webhook deliveries:', err);
      });
    }, 30000);
  }

  /**
   * Get delivery logs for an app
   */
  async getDeliveryLogs(userId: string, appId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { appId },
      include: {
        event: {
          select: {
            type: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get specific delivery details
   */
  async getDeliveryDetails(userId: string, appId: string, deliveryId: string) {
    return this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, appId },
      include: {
        event: true,
      },
    });
  }

  /**
   * Redeliver a failed webhook
   */
  async redeliver(userId: string, appId: string, deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, appId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    return this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'pending',
        attempt: 0,
        nextRetryAt: new Date(),
        responseCode: null,
        responseBody: null,
      },
    });
  }
}
