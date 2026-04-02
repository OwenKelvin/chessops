import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthRecoveryService } from './auth-recovery.service';

class RequestResetDto {
  email: string;
}

class ResetPasswordDto {
  token: string;
  newPassword: string;
}

@Controller('auth')
export class AuthRecoveryController {
  constructor(private recoveryService: AuthRecoveryService) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: RequestResetDto) {
    return this.recoveryService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.recoveryService.resetPassword(dto.token, dto.newPassword);
  }
}
