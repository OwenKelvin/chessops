import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlayerService } from './player.service';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/create-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreatePlayerDto) {
    return this.playerService.create(req.user.userId, createDto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('rating') rating?: number,
  ) {
    const filters: any = {};
    if (search) filters.search = search;
    if (rating !== undefined) filters.rating = rating;
    return this.playerService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.playerService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdatePlayerDto,
  ) {
    return this.playerService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.playerService.delete(id, req.user.userId);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string) {
    return this.playerService.getStatistics(id);
  }
}
