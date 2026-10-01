import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import documents from './legal-documents.json';

export const LEGAL_VERSION = documents.version;
export const LEGAL_HASH = createHash('sha256').update(JSON.stringify(documents)).digest('hex');
export const LEGAL_ENTITY_ID = `${LEGAL_VERSION}:${LEGAL_HASH}`;
export const LEGAL_ACTION = 'LEGAL_ACCEPTANCE_DEMO';
export function assertAcceptance(value: { termsAccepted?: boolean; privacyAcknowledged?: boolean; adultConfirmed?: boolean; legalVersion?: string }) {
  if (value.termsAccepted !== true || value.privacyAcknowledged !== true || value.adultConfirmed !== true || value.legalVersion !== LEGAL_VERSION) {
    throw new BadRequestException('Leia a versão atual das minutas, confirme o aceite e que você tem 18 anos ou mais.');
  }
}
export function acceptanceData(source: 'registration' | 'existing-user') {
  return { action: LEGAL_ACTION, entity: 'LegalDocument', entityId: LEGAL_ENTITY_ID, details: { version: LEGAL_VERSION, documentHash: LEGAL_HASH, mode: 'DEMO', termsAccepted: true, privacyAcknowledged: true, adultConfirmed: true, source } };
}
