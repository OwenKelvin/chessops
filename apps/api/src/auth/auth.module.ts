import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { OAuthController } from './controllers/oauth.controller';
import { AuthRecoveryController } from './auth-recovery.controller';
import { AuthRecoveryService } from './auth-recovery.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: '15m' },
    }),
    MailModule,
  ],
  controllers: [AuthController, OAuthController, AuthRecoveryController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy, AuthRecoveryService],
  exports: [AuthService],
})
export class AuthModule {}
