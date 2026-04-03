import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AppRegistrationService } from './app-registration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAppDto, UpdateAppDto, RegenerateSecretDto } from './dto/create-app.dto';

@Controller('apps')
@UseGuards(JwtAuthGuard)
export class AppRegistrationController {
  constructor(private appService: AppRegistrationService) {}

  @Get()
  async listApps(@Req() req: any) {
    return this.appService.listApps(req.user.userId);
  }

  @Get(':id')
  async getApp(@Req() req: any, @Param('id') id: string) {
    return this.appService.getApp(req.user.userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createApp(@Req() req: any, @Body() dto: CreateAppDto) {
    return this.appService.createApp(req.user.userId, {
      name: dto.name,
      description: dto.description,
      callbackUrls: dto.callbackUrls,
      redirectUris: dto.redirectUris,
      webhookUrl: dto.webhookUrl,
    });
  }

  @Patch(':id')
  async updateApp(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAppDto) {
    return this.appService.updateApp(req.user.userId, id, {
      name: dto.name,
      description: dto.description,
      callbackUrls: dto.callbackUrls,
      redirectUris: dto.redirectUris,
      webhookUrl: dto.webhookUrl,
      isActive: dto.isActive,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteApp(@Req() req: any, @Param('id') id: string) {
    return this.appService.deleteApp(req.user.userId, id);
  }

  @Post(':id/regenerate-secret')
  @HttpCode(HttpStatus.CREATED)
  async regenerateSecret(@Req() req: any, @Param('id') id: string, @Body() dto: RegenerateSecretDto) {
    return this.appService.regenerateSecret(req.user.userId, id, dto.currentSecret);
  }

  @Post(':id/regenerate-webhook-secret')
  @HttpCode(HttpStatus.CREATED)
  async regenerateWebhookSecret(@Req() req: any, @Param('id') id: string) {
    return this.appService.regenerateWebhookSecret(req.user.userId, id);
  }
}
