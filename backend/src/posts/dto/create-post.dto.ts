import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo da publicação é obrigatório' })
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
  isAnonymous?: boolean;

  @IsArray()
  @IsOptional()
  mediaUrls?: string[];
}
