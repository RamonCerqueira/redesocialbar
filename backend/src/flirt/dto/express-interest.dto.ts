import { IsNotEmpty, IsString } from 'class-validator';

export class ExpressInterestDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do usuário de interesse é obrigatório' })
  targetUserId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug do restaurante é obrigatório' })
  restaurantSlug!: string;
}
