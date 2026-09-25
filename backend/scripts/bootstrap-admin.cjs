const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}
const prisma = new PrismaClient();
(async () => {
  const email = process.argv[2];
  if (!email || !email.includes('@')) throw new Error('Informe o e-mail do administrador.');
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'pirambeira' }, update: {},
    create: { name: 'Restaurante Pirambeira', slug: 'pirambeira', address: 'Pituba, Salvador - BA', tagline: 'Eu estou aqui. Você está aqui.' },
  });
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const password = randomBytes(24).toString('base64url');
    user = await prisma.user.create({ data: {
      email, passwordHash: await bcrypt.hash(password, 12), role: 'RESTAURANT_ADMIN',
      profile: { create: { name: 'Administração Pirambeira', username: 'gestao_' + randomBytes(4).toString('hex'), city: 'Salvador, BA', invisibleMode: true, showInFlirtRadar: false } },
    } });
    const credentialsPath = path.join(__dirname, '../../.admin-access.local');
    fs.writeFileSync(credentialsPath, 'Acesso inicial ao painel\nE-mail: ' + email + '\nSenha: ' + password + '\nEntre em /login e altere a senha em Administração > Ajustes.\n', { mode: 0o600 });
    console.log('Conta criada. Credencial inicial salva em .admin-access.local (ignorado pelo Git).');
  } else if (user.role === 'USER') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'RESTAURANT_ADMIN' } });
  }
  await prisma.restaurantMember.upsert({
    where: { restaurantId_userId: { restaurantId: restaurant.id, userId: user.id } },
    update: { role: 'OWNER' }, create: { restaurantId: restaurant.id, userId: user.id, role: 'OWNER' },
  });
  console.log('Administrador vinculado ao restaurante. Nenhum dado de demonstração foi criado.');
})().catch(e => { console.error('Falha no cadastro administrativo:', e.code || e.name); process.exitCode = 1; }).finally(() => prisma.$disconnect());
