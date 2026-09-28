import { AuthRateGuard } from './auth-rate.guard';
import { Controller, Post, Body, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AllowFirstAccess } from './decorators/allow-first-access.decorator';

class FirstAccessDto {
  @IsString() @MinLength(8) @MaxLength(72) newPassword!: string;
}

class PasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(8) @MaxLength(72) newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateGuard)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthRateGuard)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard, AuthRateGuard)
  changePassword(@CurrentUser('id') id: string, @Body() dto: PasswordDto) { return this.authService.changePassword(id, dto.currentPassword, dto.newPassword); }

  @Put('first-access-password')
  @AllowFirstAccess()
  @UseGuards(JwtAuthGuard, AuthRateGuard)
  firstAccess(@CurrentUser('id') id: string, @Body() dto: FirstAccessDto) { return this.authService.completeFirstAccess(id, dto.newPassword); }

  @Get('check-username/:username')
  checkUsername(@Param('username') username: string) { return this.authService.checkUsername(username); }

  @Get('me')
  @AllowFirstAccess()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
