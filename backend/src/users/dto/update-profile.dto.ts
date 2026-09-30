import { IsArray, IsBoolean, IsOptional, IsString, IsIn, MaxLength, ArrayMaxSize, IsUrl, ValidateIf, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/\S/, { message: 'Informe seu nome.' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_tld: false, protocols: ['http','https'], require_protocol: true })
  avatarUrl?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20) @IsString({each:true}) @MaxLength(50,{each:true})
  interests?: string[];

  @IsBoolean()
  @IsOptional()
  showInFlirtRadar?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['EVERYONE','FOLLOWERS','NONE'])
  allowFlirtFrom?: string;

  @IsBoolean()
  @IsOptional()
  invisibleMode?: boolean;

  @IsBoolean() @IsOptional()
  isPrivate?: boolean;
}
