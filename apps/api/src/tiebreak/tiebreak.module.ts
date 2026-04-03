import { Module } from '@nestjs/common';
import { TiebreakController } from './tiebreak.controller';
import { TiebreakService } from './tiebreak.service';

@Module({
  controllers: [TiebreakController],
  providers: [TiebreakService],
  exports: [TiebreakService],
})
export class TiebreakModule {}
