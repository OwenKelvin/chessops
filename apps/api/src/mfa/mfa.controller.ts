import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class EnableMfaDto {
  token: string;
}

class DisableMfaDto {
  token: string;
}

class VerifyMfaDto {
  token: string;
}

class VerifyBackupCodeDto {
  code: string;
}

@Controller('mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private mfaService: MfaService) {}

  @Get('setup')
  async setup(@Req() req: any) {
    const secret = await this.mfaService.generateMfaSecret(req.user.userId);
    return secret;
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enable(@Req() req: any, @Body() dto: EnableMfaDto) {
    const result = await this.mfaService.enableMfa(req.user.userId, dto.token, dto.token);
    return result;
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disable(@Req() req: any, @Body() dto: DisableMfaDto) {
    await this.mfaService.disableMfa(req.user.userId, dto.token);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Req() req: any, @Body() dto: VerifyMfaDto) {
    const isValid = await this.mfaService.verifyMfaToken(req.user.userId, dto.token);
    return { valid: isValid };
  }

  @Post('verify-backup')
  @HttpCode(HttpStatus.OK)
  async verifyBackup(@Req() req: any, @Body() dto: VerifyBackupCodeDto) {
    const isValid = await this.mfaService.verifyBackupCode(req.user.userId, dto.code);
    return { valid: isValid };
  }

  @Get('status')
  async status(@Req() req: any) {
    const enabled = await this.mfaService.isMfaEnabled(req.user.userId);
    return { enabled };
  }
}
