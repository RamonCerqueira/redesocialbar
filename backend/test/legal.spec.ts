import { describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';
import { LegalAcceptanceDto, LegalService } from '../src/legal/legal.module';
import { assertAcceptance, acceptanceData, LEGAL_VERSION, LEGAL_ENTITY_ID } from '../src/legal/legal-policy';
describe('Legal demonstration records', () => {
  const valid = { termsAccepted: true, privacyAcknowledged: true, adultConfirmed: true, legalVersion: LEGAL_VERSION };
  it('rejects missing, false and obsolete acceptance', async () => {
    expect(() => assertAcceptance({ ...valid, termsAccepted: false })).toThrow();
    expect(() => assertAcceptance({ ...valid, legalVersion: 'old' })).toThrow();
    expect((await validate(Object.assign(new LegalAcceptanceDto(), valid))).length).toBe(0);
    expect((await validate(Object.assign(new LegalAcceptanceDto(), { ...valid, adultConfirmed: 'true' }))).length).toBeGreaterThan(0);
  });
  it('does not fabricate acceptance for existing accounts', async () => {
    const prisma = { auditLog: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() } };
    const result = await new LegalService(prisma as any).status('own-user');
    expect(result.accepted).toBe(false); expect(result.productionAcceptance).toBe(false);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.findFirst.mock.calls[0][0].where).toMatchObject({ userId: 'own-user', entityId: LEGAL_ENTITY_ID });
  });
  it('records explicit demo acceptance with document hash and source', () => {
    const data = acceptanceData('registration');
    expect(data.action).toBe('LEGAL_ACCEPTANCE_DEMO');
    expect(data.details).toMatchObject({ mode: 'DEMO', source: 'registration', termsAccepted: true });
    expect(data.details.documentHash).toHaveLength(64);
  });
  it('privacy requests remain pending and scoped to the authenticated user', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'protocol', createdAt: new Date() });
    const prisma = { auditLog: { create } };
    const result = await new LegalService(prisma as any).request('own-user', { type: 'DELETION', description: 'Pedido' });
    expect(create.mock.calls[0][0].data).toMatchObject({ userId: 'own-user', entityId: 'own-user', details: { status: 'PENDING', type: 'DELETION' } });
    expect(result.status).toBe('PENDING');
  });
  it('exports only the authenticated account and excludes credential fields', async () => {
    const findUniqueOrThrow = vi.fn().mockResolvedValue({ id: 'own-user' });
    const prisma = { user: { findUniqueOrThrow }, auditLog: { findMany: vi.fn().mockResolvedValue([]) } };
    await new LegalService(prisma as any).exportData('own-user');
    expect(findUniqueOrThrow.mock.calls[0][0].where).toEqual({ id: 'own-user' });
    expect(findUniqueOrThrow.mock.calls[0][0].select.passwordHash).toBeUndefined();
  });
});

