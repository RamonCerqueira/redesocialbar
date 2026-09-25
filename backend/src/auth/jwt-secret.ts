export function requireJwtSecret(value: string | undefined): string {
  if (!value || value.length < 32 || /super-secret|change.me|troque|your-secret/i.test(value)) {
    throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres aleatórios.');
  }
  return value;
}
