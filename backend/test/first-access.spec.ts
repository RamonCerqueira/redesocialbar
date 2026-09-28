import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { PrismaService } from '../src/prisma/prisma.service';
import { TeamService } from '../src/admin/team.service';
import { isInstitutionalEmail } from '../src/auth/institutional-policy';

const prisma = (value: unknown) => value as PrismaService;
const jwt = new JwtService({ secret: 'test-only-secret-not-used-in-production' });
describe('Primeiro acesso institucional', () => {
  it('normaliza domínio sem aceitar domínios parecidos', () => {
    expect(isInstitutionalEmail(' RAMON@PIRAMBEIRA.COM ')).toBe(true);
    expect(isInstitutionalEmail('ramon@pirambeira.com.exemplo.com')).toBe(false);
  });
  it('recusa conta institucional no cadastro público antes de consultar o banco', async () => {
    const findUnique = vi.fn();
    const service = new AuthService(prisma({ user: { findUnique } }), jwt);
    await expect(service.register({ email: 'NOVO@PIRAMBEIRA.COM', name: 'Teste', username: 'teste', password: 'SenhaDeTeste123' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('recusa outro superadministrador no gerenciamento de contas', async () => {
    const service = new TeamService(prisma({ user: { findUnique: vi.fn().mockResolvedValue({ email: 'outra@pirambeira.com', role: 'SUPERADMIN', status: 'ACTIVE', mustChangePassword: false }) } }));
    await expect(service.authorize('other')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('recusa Ramon enquanto a senha inicial estiver pendente', async () => {
    const service = new TeamService(prisma({ user: { findUnique: vi.fn().mockResolvedValue({ email: 'ramon@pirambeira.com', role: 'SUPERADMIN', status: 'ACTIVE', mustChangePassword: true }) } }));
    await expect(service.authorize('ramon')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('senha inicial só emite sessão curta marcada como pendente', async () => {
    const record = { id: 'new', email: 'new@pirambeira.com', passwordHash: await bcrypt.hash('Acesso@123', 4), role: 'RESTAURANT_ADMIN', status: 'ACTIVE', tokenVersion: 7, mustChangePassword: true, profile: {} };
    const service = new AuthService(prisma({ user: { findUnique: vi.fn().mockResolvedValue(record) } }), jwt);
    const result = await service.login({ email: record.email, password: 'Acesso@123' });
    const payload = jwt.verify(result.token);
    expect(payload.exp - payload.iat).toBe(900);
    expect(payload.version).toBe(7);
    expect(result.user.mustChangePassword).toBe(true);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });
  it('não permite manter a senha padrão', async () => {
    const updateMany = vi.fn();
    const service = new AuthService(prisma({ user: { findUnique: vi.fn().mockResolvedValue({ mustChangePassword: true }), updateMany } }), jwt);
    await expect(service.completeFirstAccess('new', 'Acesso@123')).rejects.toBeInstanceOf(BadRequestException);
    expect(updateMany).not.toHaveBeenCalled();
  });
  it('primeiro acesso não pode ser reutilizado após a troca', async () => {
    const service = new AuthService(prisma({ user: { findUnique: vi.fn().mockResolvedValue({ mustChangePassword: false }) } }), jwt);
    await expect(service.completeFirstAccess('new', 'SenhaNova123')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('nega token de versão anterior após redefinição', async () => {
    const strategy = new JwtStrategy(prisma({ user: { findUnique: vi.fn().mockResolvedValue({ id: 'new', status: 'ACTIVE', tokenVersion: 2 }) } }), new ConfigService({ JWT_SECRET: 's'.repeat(48) }));
    await expect(strategy.validate({ sub: 'new', email: '', role: 'SUPERADMIN', version: 1 })).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('protege a troca contra duas sessões concorrentes', async () => {
    const record = { id: 'new', passwordHash: await bcrypt.hash('Acesso@123', 4), mustChangePassword: true, tokenVersion: 1 };
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new AuthService(prisma({ user: { findUnique: vi.fn().mockResolvedValue(record), updateMany } }), jwt);
    await expect(service.completeFirstAccess('new', 'SenhaNova123')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tokenVersion: 1 }), data: expect.objectContaining({ mustChangePassword: false, tokenVersion: { increment: 1 } }) }));
  });
});
