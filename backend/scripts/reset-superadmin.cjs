const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}
const prisma = new PrismaClient();
const email = 'ramon@pirambeira.com';
(async () => {
  const accounts = await prisma.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, status: true } });
  if (accounts.length !== 1) throw new Error('É necessária exatamente uma conta existente do Ramon.');
  if (accounts[0].status !== 'ACTIVE') throw new Error('A conta está suspensa; nenhuma alteração foi feita.');
  if (process.argv.includes('--promote-only')) {
    await prisma.user.update({ where: { id: accounts[0].id }, data: { email, role: 'SUPERADMIN' } });
    console.log('Ramon configurado como SUPERADMIN. Senha ainda preservada.');
    return;
  }
  if (!process.argv.includes('--reset')) throw new Error('Use --reset para redefinir explicitamente a senha inicial.');
  const passwordHash = await bcrypt.hash('Acesso@123', 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: accounts[0].id }, data: { email, role: 'SUPERADMIN', passwordHash, mustChangePassword: true, tokenVersion: { increment: 1 } } }),
    prisma.auditLog.create({ data: { userId: accounts[0].id, action: 'RESET_SUPERADMIN_FIRST_ACCESS', entity: 'User', entityId: accounts[0].id } }),
  ]);
  fs.writeFileSync(path.join(__dirname, '../../.admin-access.local'), 'Primeiro acesso administrativo\nE-mail: ' + email + '\nSenha inicial: Acesso@123\nTroca obrigatória após o login. Senhas e sessões anteriores foram invalidadas.\n');
  console.log('Senha inicial redefinida. Troca obrigatória ativada e sessões anteriores revogadas.');
})().catch(error => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
