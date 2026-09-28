const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { JwtService } = require('@nestjs/jwt');
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}
const prisma = new PrismaClient();
const jwt = new JwtService({ secret: process.env.JWT_SECRET });
const base = process.env.SMOKE_API_URL || 'http://localhost:3001/api';
const suffix = randomUUID().slice(0, 8);
const ids = [];
let checks = 0;
const check = (label, valid) => { assert.ok(valid, label); console.log('OK ' + label); checks++; };
const token = user => jwt.sign({ sub: user.id, version: user.tokenVersion }, { expiresIn: '15m' });
async function request(route, auth, method = 'GET', body) {
  const response = await fetch(base + route, { method, signal: AbortSignal.timeout(30000), headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer ' + auth } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json().catch(() => null) };
}
(async () => {
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'ramon@pirambeira.com' } });
  assert.equal(owner.role, 'SUPERADMIN');
  assert.equal(owner.mustChangePassword, false, 'Execute a verificação antes da redefinição final de Ramon.');
  const ownerToken = token(owner);
  const other = await prisma.user.create({ data: { email: 'qa-other-' + suffix + '@example.test', passwordHash: 'not-a-login-password', role: 'SUPERADMIN' } });
  ids.push(other.id);
  const payload = { name: 'QA Primeiro Acesso', email: 'qa-first-' + suffix + '@pirambeira.com', role: 'RESTAURANT_ADMIN', restaurantSlug: 'pirambeira' };
  check('cadastro público bloqueia domínio institucional em maiúsculas', (await request('/auth/register', null, 'POST', { email: payload.email.toUpperCase(), username: 'qa_' + suffix, name: 'Teste', password: 'Acesso@123' })).status === 403);
  check('cadastro da equipe exige sessão', (await request('/admin/team', null, 'POST', payload)).status === 401);
  check('outro superadmin não pode cadastrar equipe', (await request('/admin/team', token(other), 'POST', payload)).status === 403);
  check('outro superadmin não pode listar equipe', (await request('/admin/team', token(other))).status === 403);
  check('Ramon não pode criar outro superadmin pela API de equipe', (await request('/admin/team', ownerToken, 'POST', { ...payload, role: 'SUPERADMIN' })).status === 400);
  const created = await request('/admin/team', ownerToken, 'POST', payload);
  if (created.data?.id) ids.push(created.data.id);
  check('Ramon cria conta institucional pendente', created.status === 201 && created.data.mustChangePassword);
  check('resposta não vaza hash ou versão de sessão', !JSON.stringify(created.data).includes('passwordHash') && !JSON.stringify(created.data).includes('tokenVersion'));
  check('e-mail duplicado não redefine conta existente', (await request('/admin/team', ownerToken, 'POST', payload)).status === 409);
  const first = await request('/auth/login', null, 'POST', { email: payload.email, password: 'Acesso@123' });
  check('senha padrão entra no fluxo de primeiro acesso', first.status === 201 && first.data.user.mustChangePassword);
  const initialToken = first.data.token;
  check('sessão inicial dura 15 minutos', jwt.decode(initialToken).exp - jwt.decode(initialToken).iat === 900);
  check('sessão inicial pode consultar somente os dados de acesso', (await request('/auth/me', initialToken)).data.mustChangePassword);
  const locked = await request('/admin/restaurants', initialToken);
  check('painel bloqueado no backend até trocar senha', locked.status === 403 && locked.data.code === 'PASSWORD_CHANGE_REQUIRED');
  check('upload bloqueado antes da troca', (await request('/media', initialToken, 'POST', { dataUrl: 'invalid' })).status === 403);
  check('troca comum não contorna primeiro acesso', (await request('/auth/password', initialToken, 'PUT', { currentPassword: 'Acesso@123', newPassword: 'OutraSenhaQA123' })).status === 403);
  check('senha inicial não pode ser mantida', (await request('/auth/first-access-password', initialToken, 'PUT', { newPassword: 'Acesso@123' })).status === 400);
  check('senha curta é recusada', (await request('/auth/first-access-password', initialToken, 'PUT', { newPassword: 'curta' })).status === 400);
  const newPassword = 'QA-' + randomUUID();
  const changed = await request('/auth/first-access-password', initialToken, 'PUT', { newPassword });
  check('nova senha conclui o primeiro acesso', changed.status === 200 && !changed.data.user.mustChangePassword);
  const normalToken = changed.data.token;
  check('token inicial é revogado depois da troca', (await request('/auth/me', initialToken)).status === 401);
  check('senha padrão deixa de funcionar', (await request('/auth/login', null, 'POST', { email: payload.email, password: 'Acesso@123' })).status === 401);
  check('novo login não força a troca novamente', (await request('/auth/login', null, 'POST', { email: payload.email, password: newPassword })).data.user.mustChangePassword === false);
  check('gestor criado acessa seu restaurante após trocar a senha', (await request('/admin/restaurants', normalToken)).data.some(r => r.slug === 'pirambeira'));
  check('gestor não cadastra contas institucionais', (await request('/admin/team', normalToken, 'POST', { ...payload, email: 'qa-denied-' + suffix + '@pirambeira.com' })).status === 403);
  check('primeiro acesso não pode ser repetido', (await request('/auth/first-access-password', normalToken, 'PUT', { newPassword: newPassword + 'X' })).status === 400);
  check('Ramon pode redefinir senha de membro da equipe', (await request('/admin/team/' + created.data.id + '/reset-password', ownerToken, 'POST')).status === 201);
  check('redefinição revoga sessões abertas', (await request('/auth/me', normalToken)).status === 401);
  const resetLogin = await request('/auth/login', null, 'POST', { email: payload.email, password: 'Acesso@123' });
  check('redefinição exige primeiro acesso de novo', resetLogin.status === 201 && resetLogin.data.user.mustChangePassword);
  check('lista da equipe reflete senha pendente', (await request('/admin/team', ownerToken)).data.items.some(u => u.id === created.data.id && u.mustChangePassword));
  console.log('Total: ' + checks + ' verificações aprovadas.');
})().catch(error => { console.error('FALHA: ' + error.message); process.exitCode = 1; }).finally(async () => {
  // Apenas as contas criadas e registradas nesta execução são removidas.
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { entity: 'User', entityId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
  console.log('Contas temporárias removidas; conta de Ramon preservada.');
});
