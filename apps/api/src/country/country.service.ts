import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(code: string) {
    return this.prisma.country.findUnique({
      where: { code },
    });
  }
}
