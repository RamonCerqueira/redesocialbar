const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
for (const line of fs.readFileSync(require('node:path').join(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
(async () => {
  const tables = await prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log(JSON.stringify({ connected: true, tables }, null, 2));
  if (tables.some(t => t.tablename === 'User')) {
    const admin = await prisma.user.findUnique({ where: { email: 'ramon@pirambeira.com' }, select: { id: true, role: true } });
    console.log(JSON.stringify({ administratorExists: !!admin, role: admin?.role }));
  }
})().catch(e => { console.error('Falha na conexão:', e.code || e.errorCode || e.name); process.exitCode = 1; }).finally(() => prisma.$disconnect());
