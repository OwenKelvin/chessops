import { Module } from '@nestjs/common';
import { AppRegistrationService } from './app-registration.service';
import { AppRegistrationController } from './app-registration.controller';

@Module({
  controllers: [AppRegistrationController],
  providers: [AppRegistrationService],
  exports: [AppRegistrationService],
})
export class AppRegistrationModule {}
