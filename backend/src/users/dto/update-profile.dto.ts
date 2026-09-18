import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsArray()
  @IsOptional()
  interests?: string[];

  @IsBoolean()
  @IsOptional()
  showInFlirtRadar?: boolean;

  @IsString()
  @IsOptional()
  allowFlirtFrom?: string;

  @IsBoolean()
  @IsOptional()
  invisibleMode?: boolean;
}
