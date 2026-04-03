import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Get('logs')
  async getLogs(@Req() req: any, @Query('appId') appId: string, @Query('limit') limit?: string) {
    return this.webhookService.getDeliveryLogs(
      req.user.userId,
      appId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('logs/:deliveryId')
  async getDeliveryDetails(@Req() req: any, @Query('appId') appId: string, @Param('deliveryId') deliveryId: string) {
    return this.webhookService.getDeliveryDetails(req.user.userId, appId, deliveryId);
  }

  @Post('logs/:deliveryId/redeliver')
  @HttpCode(HttpStatus.OK)
  async redeliver(@Req() req: any, @Query('appId') appId: string, @Param('deliveryId') deliveryId: string) {
    return this.webhookService.redeliver(req.user.userId, appId, deliveryId);
  }
}
