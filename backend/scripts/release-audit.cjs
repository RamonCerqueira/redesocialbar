// Somente leitura. Nunca imprime credenciais ou URLs de conexão.
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}
const prisma = new PrismaClient();
(async()=>{
  const restaurant = await prisma.restaurant.findUnique({where:{slug:'pirambeira'}});
  const items = (Array.isArray(restaurant?.menuCategories)?restaurant.menuCategories:[]).flatMap(category=>category.items||[]);
  const tables = await prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  const pending = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL`;
  console.log(JSON.stringify({
    database:'connected',restaurantConfigured:!!restaurant,
    menuItems:items.length,productsWithoutPhotos:items.filter(item=>!item.imageUrl).length,
    galleryPhotos:restaurant?.galleryPhotos.length||0,
    openingHoursConfigured:!!restaurant?.openingHours&&Object.values(restaurant.openingHours).some(Boolean),
    phoneConfigured:!!restaurant?.phone,
    descriptionConfigured:!!restaurant?.description,
    localMediaReferences:JSON.stringify(restaurant||{}).match(/https?:\/\/(localhost|127\.0\.0\.1)/g)?.length||0,
    tablesWithoutRLS:tables.filter(table=>!table.rowsecurity).map(table=>table.tablename),
    unfinishedMigrations:pending.length,
    productionFrontendConfigured:!!process.env.FRONTEND_URL&&!/localhost|127\.0\.0\.1/.test(process.env.FRONTEND_URL),
    productionApiConfigured:!!process.env.PUBLIC_API_URL&&!/localhost|127\.0\.0\.1/.test(process.env.PUBLIC_API_URL),
  },null,2));
})().catch(error=>{console.error(error.code||'Falha na auditoria');process.exitCode=1;}).finally(()=>prisma.$disconnect());
