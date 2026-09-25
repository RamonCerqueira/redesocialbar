import { AccessService } from '../src/auth/access.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ReactionType, PostType, CheckInStatus } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { CheckInsService } from '../src/check-ins/check-ins.service';
import { FlirtService } from '../src/flirt/flirt.service';
import { PostsService } from '../src/posts/posts.service';
import { PromotionsService } from '../src/promotions/promotions.service';
import { ModerationService } from '../src/moderation/moderation.service';
import { JwtService } from '@nestjs/jwt';

describe.skipIf(!process.env.TEST_DATABASE_URL)('Tô no Piramba - Suíte Completa de Testes de Integração Backend', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let checkInsService: CheckInsService;
  let flirtService: FlirtService;
  let postsService: PostsService;
  let promotionsService: PromotionsService;
  let moderationService: ModerationService;

  let testUser1Id: string;
  let testUser2Id: string;
  const restaurantSlug = 'test-' + Date.now();
  const createdRestaurants: string[] = [];

  beforeAll(async () => {
    if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) throw new Error('Use um banco exclusivo de testes.');
    prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
    const restaurant = await prisma.restaurant.create({ data: { name: 'Restaurante de teste', slug: restaurantSlug, address: 'Teste' } });
    createdRestaurants.push(restaurant.id);
    await prisma.promotion.create({ data: { restaurantId: restaurant.id, title: 'Teste', description: 'Teste', discountText: '10%', validUntil: new Date(Date.now()+86400000), totalCoupons: 10 } });
    const jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    // Instanciar serviços diretamente usando o prisma compartilhado
    authService = new AuthService(prisma as any, jwtService);
    checkInsService = new CheckInsService(prisma as any);
    flirtService = new FlirtService(prisma as any);
    postsService = new PostsService(prisma as any, new AccessService(prisma as any));
    promotionsService = new PromotionsService(prisma as any, new AccessService(prisma as any));
    moderationService = new ModerationService(prisma as any, new AccessService(prisma as any));
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { id: { in: [testUser1Id, testUser2Id].filter(Boolean) } } });
    await prisma.restaurant.deleteMany({ where: { id: { in: createdRestaurants } } });
    await prisma.$disconnect();
  });

  describe('1. Autenticação e Cadastro', () => {
    it('deve cadastrar um novo usuário com sucesso', async () => {
      const timestamp = Date.now();
      const res = await authService.register({
        name: 'Usuário Teste 1',
        email: `teste1_${timestamp}@tonopiramba.com.br`,
        username: `teste1_${timestamp}`,
        password: 'Password@123',
        city: 'Salvador, BA',
        bio: 'Adoro o Pirambeira!',
      });

      expect(res).toBeDefined();
      expect(res.token).toBeDefined();
      expect(res.user.email).toBe(`teste1_${timestamp}@tonopiramba.com.br`);
      testUser1Id = res.user.id;
    });

    it('deve realizar login com credenciais válidas', async () => {
      const user = await prisma.user.findUnique({ where: { id: testUser1Id } });
      const res = await authService.login({
        email: user!.email,
        password: 'Password@123',
      });

      expect(res.token).toBeDefined();
      expect(res.user.id).toBe(testUser1Id);
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const user = await prisma.user.findUnique({ where: { id: testUser1Id } });
      await expect(
        authService.login({
          email: user!.email,
          password: 'SenhaIncorreta',
        }),
      ).rejects.toThrow();
    });

    it('deve cadastrar um segundo usuário para testes de interação', async () => {
      const timestamp = Date.now();
      const res = await authService.register({
        name: 'Usuário Teste 2',
        email: `teste2_${timestamp}@tonopiramba.com.br`,
        username: `teste2_${timestamp}`,
        password: 'Password@123',
        city: 'Salvador, BA',
        bio: 'Presente no bar!',
      });

      testUser2Id = res.user.id;
      expect(testUser2Id).toBeDefined();
    });
  });

  describe('2. Check-in e Presença Física ("Quem está aqui agora?")', () => {
    it('deve realizar check-in no Restaurante Pirambeira', async () => {
      const checkIn = await checkInsService.checkIn(testUser1Id, {
        restaurantSlug,
        approxLatitude: -13.0031,
        approxLongitude: -38.4554,
      });

      expect(checkIn).toBeDefined();
      expect(checkIn.status).toBe(CheckInStatus.ACTIVE);
      expect(checkIn.restaurant.slug).toBe(restaurantSlug);
    });

    it('deve listar o usuário ativo no "Quem está aqui agora?"', async () => {
      const whoIsHere = await checkInsService.getWhoIsHere(restaurantSlug, testUser1Id, 'all');

      expect(whoIsHere.totalActivePatrons).toBeGreaterThan(0);
      const isPresent = whoIsHere.patrons.some((p) => p.userId === testUser1Id);
      expect(isPresent).toBe(true);
    });

    it('deve expirar check-ins com validade temporal ultrapassada', async () => {
      // Simular check-in antigo com expiresAt no passado
      const expiredCheckIn = await prisma.checkIn.create({
        data: {
          userId: testUser2Id,
          restaurantId: (await prisma.restaurant.findUnique({ where: { slug: restaurantSlug } }))!.id,
          status: CheckInStatus.ACTIVE,
          startedAt: new Date(Date.now() - 5 * 3600000),
          expiresAt: new Date(Date.now() - 1 * 3600000), // Expirou há 1 hora
        },
      });

      // Ao consultar quem está aqui, deve rodar auto-expiração
      await checkInsService.getWhoIsHere(restaurantSlug);

      const updated = await prisma.checkIn.findUnique({ where: { id: expiredCheckIn.id } });
      expect(updated?.status).toBe(CheckInStatus.EXPIRED);
    });
  });

  describe('3. Feed Social, Publicações, Reações e Comentários', () => {
    let createdPostId: string;

    it('deve criar uma publicação no feed do restaurante', async () => {
      const post = await postsService.create(testUser1Id, {
        content: 'Chopp trincando de gelado no teste automatizado!',
        restaurantSlug,
        type: PostType.FEED,
        mediaUrls: ['https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80'],
      });

      expect(post).toBeDefined();
      expect(post.authorId).toBe(testUser1Id);
      createdPostId = post.id;
    });

    it('deve permitir reagir com Brinde (CHEERS 🍻) e alternar reação', async () => {
      const res = await postsService.toggleReaction(createdPostId, testUser2Id, ReactionType.CHEERS);
      expect(res.reacted).toBe(true);
      expect(res.type).toBe(ReactionType.CHEERS);

      // Desmarcar reação
      const res2 = await postsService.toggleReaction(createdPostId, testUser2Id, ReactionType.CHEERS);
      expect(res2.reacted).toBe(false);
    });

    it('deve adicionar um comentário à publicação', async () => {
      const comment = await postsService.addComment(createdPostId, testUser2Id, {
        content: 'Mesa excelente! Guarda meu lugar!',
      });

      expect(comment).toBeDefined();
      expect(comment.content).toBe('Mesa excelente! Guarda meu lugar!');
    });
  });

  describe('4. Mural da Paquera e Mecânica Discreta de Match', () => {
    it('deve registrar interesse unilateral como PENDING sem revelar match', async () => {
      const res = await flirtService.expressInterest(testUser1Id, {
        targetUserId: testUser2Id,
        restaurantSlug,
      });

      expect(res.isMatch).toBe(false);
      expect(res.message).toContain('Interesse registrado com discrição');
    });

    it('deve desencadear "✨ Deu Match!" e abrir conversa quando houver interesse mútuo', async () => {
      const res = await flirtService.expressInterest(testUser2Id, {
        targetUserId: testUser1Id,
        restaurantSlug,
      });

      expect(res.isMatch).toBe(true);
      expect(res.matchId).toBeDefined();
      expect(res.matchedUser).toBeDefined();
    });

    it('deve listar o match na lista de matches do usuário', async () => {
      const matches = await flirtService.getMyMatches(testUser1Id);
      expect(matches.length).toBeGreaterThan(0);
      const hasMatchWithUser2 = matches.some((m) => m.partner.id === testUser2Id);
      expect(hasMatchWithUser2).toBe(true);
    });
  });

  describe('5. Promoções e Resgate de Cupons', () => {
    let promoId: string;
    let claimedCode: string;

    it('deve resgatar um cupom único para o usuário', async () => {
      const promos = await promotionsService.findAll(restaurantSlug, testUser1Id);
      expect(promos.length).toBeGreaterThan(0);
      promoId = promos[0].id;

      const res = await promotionsService.claimCoupon(promoId, testUser1Id);
      expect(res.coupon).toBeDefined();
      expect(res.coupon.code).toContain('PIRAMBA-');
      claimedCode = res.coupon.code;
    });

    it('deve permitir que a equipe do restaurante valide o cupom', async () => {
      const val = await promotionsService.validateCoupon(claimedCode, restaurantSlug, { id: testUser1Id, role: 'SUPERADMIN' });
      expect(val.success).toBe(true);
      expect(val.coupon.status).toBe('USED');
    });

    it('não deve permitir validar o mesmo cupom duas vezes', async () => {
      await expect(
        promotionsService.validateCoupon(claimedCode, restaurantSlug, { id: testUser1Id, role: 'SUPERADMIN' }),
      ).rejects.toThrow();
    });
  });

  describe('6. Moderação e Denúncias', () => {
    it('deve registrar denúncia de conteúdo com sucesso', async () => {
      const res = await moderationService.createReport(testUser1Id, {
        targetType: 'USER',
        restaurantSlug,
        targetId: testUser2Id,
        reason: 'Comportamento inconveniente no bar',
        notes: 'Relato verificado pela mesa',
      });

      expect(res.reportId).toBeDefined();
    });

    it('deve listar denúncias pendentes para a moderação', async () => {
      const reports = await moderationService.getReports({ id: testUser1Id, role: 'SUPERADMIN' }, restaurantSlug);
      expect(reports.length).toBeGreaterThan(0);
    });
  });

  describe('7. Multi-Tenancy e Isolamento entre Estabelecimentos', () => {
    it('não deve permitir resgatar cupom de outro estabelecimento', async () => {
      // Criar segundo restaurante
      const otherRestaurant = await prisma.restaurant.create({
        data: {
          name: 'Boteco do Farol',
          slug: `boteco-farol-${Date.now()}`,
          address: 'Barra, Salvador',
        },
      });

      createdRestaurants.push(otherRestaurant.id);
      const coupon = await prisma.coupon.findFirst({ where: { userId: testUser1Id } });
      await expect(
        promotionsService.validateCoupon(coupon!.code, otherRestaurant.slug, { id: testUser1Id, role: 'SUPERADMIN' }),
      ).rejects.toThrow();
    });
  });
});
