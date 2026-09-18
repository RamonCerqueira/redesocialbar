import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve conter pelo menos 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome de usuário (@username) é obrigatório' })
  username!: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
