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
const base = 'http://localhost:3001/api';
const prefix = 'qa-gallery-' + randomUUID().slice(0, 8);
const users = [], restaurants = [];
let checks = 0;
function check(label, condition) { assert.ok(condition, label); checks++; console.log('OK ' + label); }
async function request(route, token, method = 'GET', body) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  return { status: response.status, data: await response.json().catch(() => null) };
}
async function user(index, role) {
  const record = await prisma.user.create({ data: { email: prefix + index + '@example.test', role, passwordHash: 'not-a-login-password', profile: { create: { username: prefix + index, name: 'QA ' + index } } } });
  users.push(record.id);
  return { ...record, token: jwt.sign({ sub: record.id, tokenVersion: 0 }, { expiresIn: '20m' }) };
}
(async () => {
  try {
    if (process.argv[2] === '--cleanup') {
      const slug = process.argv[3];
      if (!/^qa-gallery-[a-f0-9]{8}$/.test(slug || '')) throw new Error('Slug de fixture inválido');
      restaurants.push(...(await prisma.restaurant.findMany({ where: { slug }, select: { id: true } })).map(item => item.id));
      users.push(...(await prisma.user.findMany({ where: { email: { in: ['admin', 'user', 'other'].map(suffix => slug + suffix + '@example.test') } }, select: { id: true } })).map(item => item.id));
      return;
    }
    const photo = 'http://localhost:3000/hero-brinde-v2.png';
    const r = await prisma.restaurant.create({ data: { slug: prefix, name: 'Validação temporária do cardápio', address: 'QA', menuCategories: [{ name: 'Bebidas', items: [{ name: 'Chopp dobrado', price: '14,00', description: 'Chopp gelado. Oferta temporária para validação.', imageUrl: photo, tags: ['2X', 'HOJE'] }, { name: 'Sem foto', price: '20,00', description: 'Produto sem imagem para conferir alturas.' }, { name: 'Drink da casa', price: '25,00', imageUrl: photo, isChefPick: true }] }, { name: 'Petiscos', items: [{ name: 'Petisco', price: '30,00', imageUrl: photo, isPromo: true }] }] } });
    restaurants.push(r.id);
    const admin = await user('admin', 'RESTAURANT_ADMIN'), regular = await user('user', 'USER'), other = await user('other', 'RESTAURANT_ADMIN');
    await prisma.restaurantMember.create({ data: { restaurantId: r.id, userId: admin.id, role: 'OWNER' } });
    const route = `/admin/${r.slug}/gallery`;
    check('galeria exige login', (await request(route, null, 'PUT', { photos: [] })).status === 401);
    check('usuário comum não altera galeria', (await request(route, regular.token, 'PUT', { photos: [] })).status === 403);
    check('gestor sem vínculo não altera galeria', (await request(route, other.token, 'PUT', { photos: [] })).status === 403);
    check('galeria rejeita URL inválida', (await request(route, admin.token, 'PUT', { photos: ['javascript:alert(1)'] })).status === 400);
    check('galeria rejeita mais de 20 fotos', (await request(route, admin.token, 'PUT', { photos: Array(21).fill(photo) })).status === 400);
    check('admin publica fotos', (await request(route, admin.token, 'PUT', { photos: [photo] })).status === 200);
    const stored = await prisma.restaurant.findUnique({ where: { id: r.id } });
    check('fotos persistem no Supabase', stored.galleryPhotos[0] === photo);
    const publicPage = await request(`/restaurants/${r.slug}`);
    check('app recebe galeria e categorias com tags', publicPage.data.galleryPhotos[0] === photo && publicPage.data.menuCategories[0].items[0].tags.join(',') === '2X,HOJE');
    await request(route, admin.token, 'PUT', { photos: [] });
    check('remoção persiste na API pública', (await request(`/restaurants/${r.slug}`)).data.galleryPhotos.length === 0);
    await request(route, admin.token, 'PUT', { photos: [photo] });
    const now = Date.now();
    await prisma.story.createMany({ data: Array.from({ length: 102 }, (_, index) => ({ restaurantId: r.id, authorId: regular.id, mediaUrl: photo, createdAt: new Date(now - index * 1000), expiresAt: new Date(now + 3600000) })) });
    const page1 = await request(`/stories/restaurant/${r.slug}`);
    check('primeira página de DE AGORA traz 100 momentos', page1.data.length === 100);
    const page2 = await request(`/stories/restaurant/${r.slug}?cursor=${page1.data[99].id}`);
    check('segunda página traz os restantes sem repetir', page2.data.length === 2 && !page1.data.some(item => page2.data.some(other => item.id === other.id)));
    await prisma.profile.update({ where: { userId: regular.id }, data: { isPrivate: true } });
    check('paginação preserva a privacidade', (await request(`/stories/restaurant/${r.slug}`)).data.length === 0);
    console.log(`${checks} verificações passaram.`);
    if (process.argv.includes('--ui')) {
      console.log(`UI_FIXTURE=http://localhost:3000/restaurante/${r.slug}`);
      console.log('Envie uma linha para remover os dados temporários.');
      await new Promise(resolve => {
        const timer = setTimeout(resolve, 180000);
        process.stdin.once('data', () => { clearTimeout(timer); resolve(); });
        process.stdin.resume();
      });
      process.stdin.pause();
    }
  } finally {
    if (restaurants.length) await prisma.restaurant.deleteMany({ where: { id: { in: restaurants } } });
    if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
    console.log('Dados temporários removidos.');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
