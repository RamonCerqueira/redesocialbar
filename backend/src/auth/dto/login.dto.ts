import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve conter pelo menos 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password!: string;
}
