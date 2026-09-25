import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @IsString()
  @MaxLength(72)
  @MinLength(8, { message: 'Senha deve conter pelo menos 8 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome de usuário (@username) é obrigatório' })
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, { message: 'Use de 3 a 30 letras, números ou sublinhado no nome de usuário.' })
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
