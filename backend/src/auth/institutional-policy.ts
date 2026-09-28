export const INSTITUTIONAL_DOMAIN = '@pirambeira.com';
export const SUPERADMIN_EMAIL = 'ramon@pirambeira.com';
export const INITIAL_PASSWORD = 'Acesso@123';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isInstitutionalEmail(email: string) {
  return normalizeEmail(email).endsWith(INSTITUTIONAL_DOMAIN);
}
