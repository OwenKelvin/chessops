import { Module, Global } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Global()
@Module({
  imports: [JwtModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminGuard, JwtService],
  exports: [AdminGuard, JwtService],
})
export class AdminModule {}
