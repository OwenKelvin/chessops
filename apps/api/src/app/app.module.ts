import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MfaModule } from '../mfa/mfa.module';
import { MailModule } from '../mail/mail.module';
import { AdminModule } from '../admin/admin.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { AppRegistrationModule } from '../app-registration/app-registration.module';
import { WebhookModule } from '../webhook/webhook.module';
import { TournamentModule } from '../tournament/tournament.module';
import { PlayerModule } from '../player/player.module';
import { PairingModule } from '../pairing/pairing.module';
import { TiebreakModule } from '../tiebreak/tiebreak.module';
import { ExportModule } from '../export/export.module';
import { ImportModule } from '../import/import.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MfaModule,
    MailModule,
    AdminModule,
    ApiKeyModule,
    AppRegistrationModule,
    WebhookModule,
    TournamentModule,
    PlayerModule,
    PairingModule,
    TiebreakModule,
    ExportModule,
    ImportModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
