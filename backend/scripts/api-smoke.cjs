// Exercita a API com dados temporários, sempre removidos por IDs ao terminar.
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
const prefix = 'qa-' + randomUUID().slice(0, 8);
const users = [], restaurants = [];
let checks = 0;
function check(label, condition) { assert.ok(condition, label); checks++; console.log('OK ' + label); }
async function request(route, token, method = 'GET', body) {
  const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json().catch(() => null) };
}
async function user(index, role = 'USER') {
  const record = await prisma.user.create({ data: { email: prefix + index + '@example.test', role, passwordHash: 'not-a-login-password', profile: { create: { username: 'pirambeira_' + prefix.replaceAll('-', '') + index, name: 'Teste ' + index } } } });
  users.push(record.id);
  return { ...record, token: jwt.sign({ sub: record.id }, { expiresIn: '10m' }) };
}
(async () => {
  const r = await prisma.restaurant.create({ data: { slug: prefix, name: 'QA temporário', address: 'Fixture' } }); restaurants.push(r.id);
  const other = await prisma.restaurant.create({ data: { slug: prefix + '-other', name: 'Outro QA', address: 'Fixture' } }); restaurants.push(other.id);
  const owner = await user('admin', 'RESTAURANT_ADMIN');
  const outsider = await user('otheradmin', 'RESTAURANT_ADMIN');
  const a = await user('a'), b = await user('b'), c = await user('c');
  await prisma.restaurantMember.createMany({ data: [{ userId: owner.id, restaurantId: r.id, role: 'OWNER' }, { userId: outsider.id, restaurantId: other.id, role: 'OWNER' }] });
  const adminPath = '/admin/' + r.slug;
  check('painel exige autenticação', (await request('/admin/restaurants')).status === 401);
  check('usuário comum não administra', (await request('/admin/restaurants', a.token)).status === 403);
  check('restaurante de outro gestor é inacessível', (await request(adminPath + '/settings', outsider.token)).status === 403);
  check('papel adulterado no token não substitui o banco', (await request('/admin/restaurants', jwt.sign({ sub: a.id, role: 'SUPERADMIN' }))).status === 403);
  const metrics = await request('/admin/dashboard/' + r.slug, owner.token);
  check('indicadores vazios são zero', metrics.status === 200 && metrics.data.metrics.activePatronsCount === 0 && metrics.data.charts.hourlyTraffic.every(h => h.patrons === 0));

  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=';
  check('upload exige autenticação', (await request('/media', null, 'POST', { dataUrl: png })).status === 401);
  check('arquivo falsificado é recusado', (await request('/media', owner.token, 'POST', { dataUrl: 'data:image/png;base64,aGVsbG8=' })).status === 400);
  const media = await request('/media', owner.token, 'POST', { dataUrl: png });
  check('upload persiste imagem', media.status === 201 && typeof media.data.url === 'string');
  const image = await fetch(media.data.url);
  check('imagem pode ser carregada após upload', image.status === 200 && image.headers.get('content-type').includes('image/png'));

  const post = await request(adminPath + '/posts', owner.token, 'POST', { content: 'Oferta de teste', mediaUrls: [media.data.url], buttonText: 'Ver oferta', buttonUrl: 'https://example.com', isPinned: true });
  check('gestor cria publicação oficial com botão', post.status === 201 && post.data.isOfficial);
  check('outro gestor não edita publicação', (await request(adminPath + '/posts/' + post.data.id, outsider.token, 'PUT', { content: 'Não permitido' })).status === 403);
  await request('/posts', a.token, 'POST', { restaurantSlug: r.slug, content: 'Nome com pirambeira não vira oficial' });
  const official = await request('/posts/bar/' + r.slug);
  check('nome de usuário não falsifica selo oficial', official.data.length === 1 && official.data[0].id === post.data.id);
  check('botão chega ao aplicativo', official.data[0].buttonText === 'Ver oferta');
  check('rotas de chat removidas', (await request('/chat/conversations', a.token)).status === 404);
  const secretNote=await request('/posts', a.token, 'POST', {restaurantSlug:r.slug,type:'FLIRT',content:'Recado anônimo QA',isAnonymous:true});
  const notes=await request('/flirt/notes/'+r.slug);
  check('recado anônimo não revela identidade', notes.data.find(n=>n.id===secretNote.data.id).author.id==='anon');
  check('feed não revela autor do recado anônimo', !(await request('/posts/feed/'+r.slug)).data.some(n=>n.id===secretNote.data.id));
  const profileName=(await prisma.profile.findUnique({where:{userId:a.id}})).username;
  check('perfil não associa recado anônimo ao autor', !JSON.stringify((await request('/users/profile/'+profileName)).data).includes(secretNote.data.id));
  const regular = await request('/posts', a.token, 'POST', { restaurantSlug: r.slug, content: 'Teste de serialização' });
  check('resposta de publicação não inclui senha ou e-mail', !JSON.stringify(regular.data).includes('passwordHash') && !JSON.stringify(regular.data).includes('@example.test'));
  check('URL javascript é recusada', (await request(adminPath + '/posts', owner.token, 'POST', { content: 'Inseguro', buttonText: 'Ver', buttonUrl: 'javascript:alert(1)' })).status === 400);

  await request('/check-ins', a.token, 'POST', { restaurantSlug: r.slug });
  await request('/users/profile', a.token, 'PUT', { invisibleMode: true });
  const username = (await prisma.profile.findUnique({ where: { userId: a.id } })).username;
  check('perfil invisível não revela presença', (await request('/users/profile/' + username)).data.activeCheckIn === null);
  check('titular ainda vê seu check-in', !!(await request('/auth/me', a.token)).data.activeCheckIn);
  await request('/users/' + a.id + '/block', b.token, 'POST');
  check('perfil bloqueado é indisponível', (await request('/users/profile/' + username, b.token)).status === 404);

  const promoBody = { title: 'Último cupom', discountText: '10%', description: 'Fixture', validUntil: new Date(Date.now() + 86400000).toISOString(), totalCoupons: 1, buttonText: 'Pegar oferta', imageUrl: media.data.url, isActive: true };
  const promo = await request(adminPath + '/promotions', owner.token, 'POST', promoBody);
  check('promoção criada', promo.status === 201);
  const claims = await Promise.all([a,b,c].map(person => request('/promotions/' + promo.data.id + '/claim', person.token, 'POST')));
  check('somente um cliente recebe o último cupom', claims.filter(x => x.status === 201).length === 1 && claims.filter(x => x.status === 400).length === 2);
  const reserved = await prisma.promotion.findUnique({ where: { id: promo.data.id } });
  check('estoque não ultrapassa o limite', reserved.redeemedCount === 1);
  const issued = claims.find(x => x.status === 201).data.coupon;
  check('gestor de outro restaurante não valida cupom', (await request('/promotions/validate', outsider.token, 'POST', { code: issued.code, restaurantSlug: r.slug })).status === 403);
  const redemptions = await Promise.all([1,2].map(() => request('/promotions/validate', owner.token, 'POST', { code: issued.code, restaurantSlug: r.slug })));
  check('cupom é validado somente uma vez sob concorrência', redemptions.filter(x => x.status === 201).length === 1 && redemptions.filter(x => x.status === 400).length === 1);
  const dupPromo = await request(adminPath + '/promotions', owner.token, 'POST', { ...promoBody, title: 'Idempotência', totalCoupons: 5 });
  const dup = await Promise.all([1,2].map(() => request('/promotions/' + dupPromo.data.id + '/claim', c.token, 'POST')));
  check('resgates concorrentes do mesmo cliente retornam o mesmo cupom', dup.every(x => x.status === 201) && dup[0].data.coupon.id === dup[1].data.coupon.id);
  check('editar abaixo do estoque emitido é recusado', (await request(adminPath + '/promotions/' + promo.data.id, owner.token, 'PUT', { ...promoBody, totalCoupons: 0 })).status === 400);
  check('histórico mostra os cupons reais', (await request(adminPath + '/coupons', owner.token)).data.items.length === 2);

  const ad = await request(adminPath + '/ads', owner.token, 'POST', { title: 'Banner QA', description: 'Texto', imageUrl: media.data.url, targetUrl: 'https://example.com', buttonText: 'Conheça', sponsorName: 'Fixture', type: 'BANNER', isActive: true });
  check('banner com imagem e botão aparece na API pública', ad.status === 201 && (await request('/ads/restaurant/' + r.slug)).data[0].buttonText === 'Conheça');
  await request(adminPath + '/ads/' + ad.data.id, owner.token, 'DELETE');
  check('desativar banner remove da exibição', (await request('/ads/restaurant/' + r.slug)).data.length === 0);
  const event = await request(adminPath + '/events', owner.token, 'POST', { title: 'Evento QA', category: 'MÚSICA', description: 'Fixture', date: new Date(Date.now()+86400000).toISOString(), startTime: '19:00', isActive: true });
  check('evento é criado e listado no aplicativo', event.status === 201 && (await request('/events/restaurant/' + r.slug)).data.some(x => x.id === event.data.id));
  await request(adminPath + '/events/' + event.data.id, owner.token, 'DELETE');
  check('evento cancelado sai da agenda', (await request('/events/restaurant/' + r.slug)).data.length === 0);
  await request(adminPath + '/settings', owner.token, 'PUT', { name: 'Nome atualizado', address: 'Endereço atualizado', coverUrl: media.data.url, openingHours: { Segunda: '17h às 23h' } });
  check('ajustes persistem na página pública', (await request('/restaurants/' + r.slug)).data.name === 'Nome atualizado');

  const story = await request('/stories', c.token, 'POST', { restaurantSlug: r.slug, mediaUrl: media.data.url, caption: 'Momento real', mediaType: 'IMAGE' });
  check('De Agora persiste no banco', story.status === 201 && (await request('/stories/restaurant/' + r.slug)).data.some(x => x.id === story.data.id));
  check('resposta de story gera notificação', (await request('/stories/' + story.data.id + '/reply', owner.token, 'POST', { content: 'Boa noite!' })).status === 201 && !!await prisma.notification.findFirst({ where: { userId: c.id, type: 'STORY_REPLY' } }));

  const report = await request('/moderation/reports', b.token, 'POST', { targetType: 'POST', targetId: post.data.id, reason: 'Teste de escopo' });
  check('denúncia tem restaurante associado', report.status === 201);
  check('outro restaurante não resolve denúncia', (await request('/moderation/reports/' + report.data.reportId + '/resolve', outsider.token, 'POST', { action: 'DISMISS' })).status === 403);
  check('gestor não pode banir contas globalmente', (await request('/moderation/reports/' + report.data.reportId + '/resolve', owner.token, 'POST', { action: 'BAN_USER' })).status === 403);
  check('gestor resolve denúncia do estabelecimento', (await request('/moderation/reports/' + report.data.reportId + '/resolve', owner.token, 'POST', { action: 'DISMISS' })).status === 201);
  const tables = await prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  check('RLS ativo em todas as tabelas da aplicação', tables.length > 20 && tables.every(t => t.rowsecurity));
  console.log('Total: ' + checks + ' verificações HTTP/banco aprovadas.');
})().catch(error => { console.error('FALHA:', error.message); process.exitCode = 1; }).finally(async () => {
  // IDs pertencem somente às fixtures criadas nesta execução.
  if (restaurants.length) await prisma.restaurant.deleteMany({ where: { id: { in: restaurants } } });
  if (users.length) await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
  console.log('Fixtures temporárias removidas.');
});
