import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckInDto {
  @IsString()
  @IsNotEmpty({ message: 'Identificador do restaurante é obrigatório' })
  restaurantSlug!: string;

  @IsNumber()
  @IsOptional()
  approxLatitude?: number;

  @IsNumber()
  @IsOptional()
  approxLongitude?: number;
}
