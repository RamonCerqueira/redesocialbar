import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUrl, ArrayMaxSize, MaxLength } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo da publicação é obrigatório' })
  @MaxLength(5000)
  content!: string;

  @IsString()
  @IsNotEmpty({ message: 'Identificador do restaurante é obrigatório' })
  restaurantSlug!: string;

  @IsEnum(PostType)
  @IsOptional()
  type?: PostType;

  @IsString()
  @IsOptional()
  flirtContext?: string;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsString()
  @IsOptional()
  targetPatron?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(6)
  @IsUrl({ require_tld: false, protocols: ['http','https'], require_protocol: true }, { each: true })
  mediaUrls?: string[];
}
