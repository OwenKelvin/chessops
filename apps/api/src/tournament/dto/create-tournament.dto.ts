import { IsString, IsOptional, IsDateString, IsInt, IsBoolean, Min, IsIn } from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['draft', 'registration', 'active', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsIn(['swiss', 'roundrobin', 'elimination'])
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRounds?: number;

  @IsOptional()
  @IsString()
  timeControl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;
}

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['draft', 'registration', 'active', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsIn(['swiss', 'roundrobin', 'elimination'])
  format?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRounds?: number;

  @IsOptional()
  @IsString()
  timeControl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;
}
