import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateApiKeyDto, UpdateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  async listApiKeys(@Req() req: any) {
    return this.apiKeyService.listApiKeys(req.user.userId);
  }

  @Get(':id')
  async getApiKey(@Req() req: any, @Param('id') id: string) {
    return this.apiKeyService.getApiKey(req.user.userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(@Req() req: any, @Body() dto: CreateApiKeyDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    return this.apiKeyService.generateApiKey(
      req.user.userId,
      dto.name,
      dto.permissions || [],
      expiresAt,
    );
  }

  @Patch(':id')
  async updateApiKey(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    return this.apiKeyService.updateApiKey(req.user.userId, id, {
      name: dto.name,
      permissions: dto.permissions,
      expiresAt,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@Req() req: any, @Param('id') id: string) {
    await this.apiKeyService.revokeApiKey(req.user.userId, id);
    return { success: true };
  }

  @Post(':id/rotate')
  @HttpCode(HttpStatus.CREATED)
  async rotateApiKey(@Req() req: any, @Param('id') id: string, @Body() dto: { name?: string }) {
    return this.apiKeyService.rotateApiKey(req.user.userId, id, dto.name);
  }
}
