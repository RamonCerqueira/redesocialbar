import { Body, Controller, Get, Injectable, Module, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, Equals, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AllowFirstAccess } from '../auth/decorators/allow-first-access.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthRateGuard } from '../auth/auth-rate.guard';
import { Role } from '@prisma/client';
import { acceptanceData, assertAcceptance, LEGAL_ACTION, LEGAL_ENTITY_ID, LEGAL_HASH, LEGAL_VERSION } from './legal-policy';
import documents from './legal-documents.json';

export class LegalAcceptanceDto {
  @IsBoolean() @Equals(true) termsAccepted!: boolean;
  @IsBoolean() @Equals(true) privacyAcknowledged!: boolean;
  @IsBoolean() @Equals(true) adultConfirmed!: boolean;
  @IsString() legalVersion!: string;
}
class PrivacyRequestDto {
  @IsIn(['ACCESS', 'CORRECTION', 'DELETION', 'CONSENT', 'OTHER']) type!: string;
  @IsString() @IsOptional() @MaxLength(1000) description?: string;
}

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}
  async status(id: string) {
    const record = await this.prisma.auditLog.findFirst({ where: { userId: id, action: LEGAL_ACTION, entity: 'LegalDocument', entityId: LEGAL_ENTITY_ID }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
    return { version: LEGAL_VERSION, documentHash: LEGAL_HASH, mode: 'DEMO', accepted: !!record, acceptedAt: record?.createdAt || null, productionAcceptance: false };
  }
  async accept(id: string, dto: LegalAcceptanceDto) {
    assertAcceptance(dto);
    const status = await this.status(id);
    if (!status.accepted) await this.prisma.auditLog.create({ data: { userId: id, ...acceptanceData('existing-user') } });
    return this.status(id);
  }
  async request(id: string, dto: PrivacyRequestDto) {
    const record = await this.prisma.auditLog.create({ data: { userId: id, action: 'PRIVACY_REQUEST', entity: 'User', entityId: id, details: { type: dto.type, description: dto.description?.trim() || '', status: 'PENDING', mode: 'DEMO' } } });
    return { protocol: record.id, createdAt: record.createdAt, status: 'PENDING', message: 'Solicitação registrada para análise. Nenhum dado foi excluído automaticamente.' };
  }
  requests(id: string) {
    return this.prisma.auditLog.findMany({ where: { userId: id, action: 'PRIVACY_REQUEST' }, select: { id: true, createdAt: true, details: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async exportData(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id }, select: { id: true, email: true, createdAt: true, profile: true, posts: { select: { id: true, content: true, media: true, createdAt: true } }, checkIns: { select: { id: true, startedAt: true, expiresAt: true, status: true, restaurantId: true } }, comments: { select: { id: true, content: true, createdAt: true } } } });
    return { generatedAt: new Date().toISOString(), scope: 'Dados de conta, perfil, publicações, comentários e check-ins. Para outros dados, registre uma solicitação de acesso.', user, requests: await this.requests(id) };
  }
  adminRequests() {
    return this.prisma.auditLog.findMany({ where: { action: 'PRIVACY_REQUEST' }, select: { id: true, createdAt: true, details: true, user: { select: { id: true, email: true, profile: { select: { name: true, username: true } } } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  }
}

@Controller('legal')
export class LegalController {
  constructor(private service: LegalService) {}
  @Get('documents') documents() { return { ...documents, documentHash: LEGAL_HASH }; }
  @Get('status') @AllowFirstAccess() @UseGuards(JwtAuthGuard)
  status(@CurrentUser('id') id: string) { return this.service.status(id); }
  @Post('accept') @AllowFirstAccess() @UseGuards(JwtAuthGuard, AuthRateGuard)
  accept(@CurrentUser('id') id: string, @Body() dto: LegalAcceptanceDto) { return this.service.accept(id, dto); }
  @Get('requests') @AllowFirstAccess() @UseGuards(JwtAuthGuard)
  requests(@CurrentUser('id') id: string) { return this.service.requests(id); }
  @Post('requests') @AllowFirstAccess() @UseGuards(JwtAuthGuard, AuthRateGuard)
  request(@CurrentUser('id') id: string, @Body() dto: PrivacyRequestDto) { return this.service.request(id, dto); }
  @Get('export') @AllowFirstAccess() @UseGuards(JwtAuthGuard)
  exportData(@CurrentUser('id') id: string) { return this.service.exportData(id); }
  @Get('admin/requests') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.SUPERADMIN)
  adminRequests() { return this.service.adminRequests(); }
}

@Module({ imports: [AuthModule], controllers: [LegalController], providers: [LegalService, AuthRateGuard] })
export class LegalModule {}
