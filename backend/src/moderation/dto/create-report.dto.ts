import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  @IsNotEmpty({ message: 'Tipo do alvo da denúncia é obrigatório' })
  targetType!: ReportTargetType;

  @IsString()
  @IsNotEmpty({ message: 'ID do alvo da denúncia é obrigatório' })
  targetId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Motivo da denúncia é obrigatório' })
  reason!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
