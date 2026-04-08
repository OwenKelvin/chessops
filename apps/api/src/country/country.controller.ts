import { Controller, Get, Param } from '@nestjs/common';
import { CountryService } from './country.service';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  async findAll() {
    return this.countryService.findAll();
  }

  @Get(':code')
  async findOne(@Param('code') code: string) {
    return this.countryService.findOne(code);
  }
}
