import { IsString, IsOptional, IsArray, IsUrl, IsBoolean } from 'class-validator';

export class CreateAppDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  callbackUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  redirectUris?: string[];

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

export class UpdateAppDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  callbackUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  redirectUris?: string[];

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegenerateSecretDto {
  @IsString()
  currentSecret!: string;
}
