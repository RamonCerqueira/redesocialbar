import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateMeetupDto {
  @IsString()
  @IsNotEmpty({ message: 'Título do encontro é obrigatório' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição do encontro é obrigatória' })
  description!: string;

  @IsDateString({}, { message: 'Horário programado inválido' })
  scheduledFor!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug do restaurante é obrigatório' })
  restaurantSlug!: string;
}
