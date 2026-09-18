import { PrismaClient, Role, UserStatus, RestaurantRole, CheckInStatus, PostType, ReactionType, InterestStatus, EventRsvpStatus, CouponStatus, MeetupStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Tô no Piramba...');

  // Limpar tabelas caso necessário
  await prisma.auditLog.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.block.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.meetupParticipant.deleteMany();
  await prisma.meetup.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.match.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.post.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.restaurantMember.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Piramba@2026', 10);

  // 1. Restaurante Pirambeira
  const pirambeira = await prisma.restaurant.create({
    data: {
      name: 'Restaurante Pirambeira',
      slug: 'pirambeira',
      tagline: 'O boteco contemporâneo da Pituba com alma baiana',
      description:
        'Resgate dos botecos tradicionais com alta gastronomia do Chef Edu Moraes, drinks autorais por Jonathan Albuquerque e chopp Brahma com colarinho super cremoso. Música boa, transmissões esportivas e a comunidade mais calorosa de Salvador.',
      address: 'Rua Guillard Muniz, 629',
      neighborhood: 'Pituba',
      city: 'Salvador',
      state: 'BA',
      phone: '(71) 98844-3210',
      instagram: '@pirambeira.bar',
      logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=80',
      rating: 4.9,
      approxLatitude: -13.0031,
      approxLongitude: -38.4554,
      openingHours: {
        wednesday: '17:00 - 00:00',
        thursday: '17:00 - 00:00',
        friday: '17:00 - 01:00',
        saturday: '14:00 - 01:00',
        sunday: '14:00 - 22:00',
      },
      menuCategories: [
        {
          name: 'Petiscos do Chef Edu Moraes',
          items: [
            { name: 'Coxinha Cremosa de Frango com Catupiry Real', price: 'R$ 38,00', description: 'Porção com 6 unidades empanadas no panko' },
            { name: 'Dadinhos de Tapioca com Geleia de Pimenta Biquinho', price: 'R$ 34,00', description: 'Crocantes por fora, macios por dentro' },
            { name: 'Carne de Sol Acebolada com Macaxeira na Manteiga de Garrafa', price: 'R$ 68,00', description: 'Acompanha farofa de biju e vinagrete' },
            { name: 'Pastéis de Camarão com Queijo Coalho (4 un)', price: 'R$ 44,00', description: 'Recheio abundante e massa sequinha' }
          ]
        },
        {
          name: 'Drinks por Jonathan Albuquerque',
          items: [
            { name: 'Caju Amigo Piramba', price: 'R$ 32,00', description: 'Cachaça artesanal envelhecida, compota de caju e limão siciliano' },
            { name: 'Gin Tônica Pituba Tropical', price: 'R$ 36,00', description: 'Gin premium, maracujá, redução de manga e alecrim' },
            { name: 'Chopp Brahma Caneca Congelada (350ml)', price: 'R$ 11,90', description: 'Colarinho cremoso servido a -2°C' },
            { name: 'Caipirinha Tradicional de Limão Taiti', price: 'R$ 26,00', description: 'Feita com cachaça baiana de alambique' }
          ]
        }
      ]
    }
  });

  console.log(`✅ Restaurante criado: ${pirambeira.name} (${pirambeira.slug})`);

  // 2. Criar Usuários Demonstrativos
  const usersData = [
    {
      email: 'ramon@tonopiramba.com.br',
      name: 'Ramon Valente',
      username: 'ramonvalente',
      role: Role.RESTAURANT_ADMIN,
      bio: 'Arquiteto de software e frequentador fiel do Pirambeira. Apaixonado por chopp gelado, MPB e boas conversas.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      interests: ['Tecnologia', 'Chopp Brahma', 'Samba', 'Pituba'],
      isHere: true,
      checkInCount: 14,
    },
    {
      email: 'carolina.mendes@tonopiramba.com.br',
      name: 'Carolina Mendes',
      username: 'carol_mendes',
      role: Role.USER,
      bio: 'Jornalista cultural, fotógrafa amadora e fã da Sexta dos Organizados. Sempre na mesa externa!',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      interests: ['Fotografia', 'Cultura Baiana', 'Drinks Autoriais', 'Música'],
      isHere: true,
      checkInCount: 8,
    },
    {
      email: 'lucas.oliveira@tonopiramba.com.br',
      name: 'Lucas Oliveira',
      username: 'lucas_ssa',
      role: Role.USER,
      bio: 'Engenheiro civil, torcedor fanático do Bahia. Ponto certo no Pirambeira nos dias de jogo.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      interests: ['Futebol', 'Petiscos', 'Cerveja', 'Amigos'],
      isHere: true,
      checkInCount: 19,
    },
    {
      email: 'marina.castro@tonopiramba.com.br',
      name: 'Marina Castro',
      username: 'marinacastro',
      role: Role.USER,
      bio: 'Designer de produto, viciada no dadinho de tapioca e no Caju Amigo. Aberta a conhecer pessoas bacanas!',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      interests: ['Design', 'Gastronomia', 'Arte', 'Viagens'],
      isHere: true,
      checkInCount: 11,
    },
    {
      email: 'gabriel.costa@tonopiramba.com.br',
      name: 'Gabriel Costa',
      username: 'gabrielcosta',
      role: Role.USER,
      bio: 'Músico e violonista. Se tiver roda de samba no Piramba, com certeza estou por perto.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      interests: ['Samba de Roda', 'Violão', 'Noite Baiana', 'Chopp'],
      isHere: true,
      checkInCount: 6,
    },
    {
      email: 'beatriz.silva@tonopiramba.com.br',
      name: 'Beatriz Silva',
      username: 'biassilva',
      role: Role.USER,
      bio: 'Publicitária, adoro o happy hour da sexta-feira para descontrair da correria da agência.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      interests: ['Happy Hour', 'Marketing', 'Risadas', 'Drinks'],
      isHere: true,
      checkInCount: 5,
    },
    {
      email: 'thiago.almeida@tonopiramba.com.br',
      name: 'Thiago Almeida',
      username: 'thiago_almeida',
      role: Role.USER,
      bio: 'Advogado nas horas vagas e apreciador de boa carne de sol nos finais de semana.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
      interests: ['Gastronomia', 'Vinho', 'Direito', 'Praia'],
      isHere: true,
      checkInCount: 4,
    },
    {
      email: 'juliana.rocha@tonopiramba.com.br',
      name: 'Juliana Rocha',
      username: 'jurocha_ssa',
      role: Role.USER,
      bio: 'Nutricionista (que sabe que equilíbrio também é comer um pastelzinho crocante com a galera!).',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      interests: ['Bem-Estar', 'Petiscos', 'Ciclismo', 'Amizade'],
      isHere: true,
      checkInCount: 7,
    },
    {
      email: 'rodrigo.santos@tonopiramba.com.br',
      name: 'Rodrigo Santos',
      username: 'rodrigosantos',
      role: Role.USER,
      bio: 'Chef amador e curioso por coquetelaria. Sempre experimentando um drink novo da carta do Pirambeira.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      interests: ['Coquetelaria', 'Culinária', 'Música Latina'],
      isHere: false,
      checkInCount: 15,
    },
    {
      email: 'amanda.ferreira@tonopiramba.com.br',
      name: 'Amanda Ferreira',
      username: 'amandaferreira',
      role: Role.USER,
      bio: 'Bióloga marinha e apaixonada pelo pôr do sol de Salvador. Amando o novo Tô no Piramba!',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      interests: ['Mar', 'Natureza', 'Samba', 'Chopp'],
      isHere: true,
      checkInCount: 9,
    },
    {
      email: 'eduardo.moraes@tonopiramba.com.br',
      name: 'Chef Edu Moraes',
      username: 'chef_edumoraes',
      role: Role.RESTAURANT_ADMIN,
      bio: 'Chef executivo e consultor gastronômico. A cozinha do Pirambeira é meu quintal e meu coração.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      interests: ['Alta Gastronomia', 'Boteco', 'Culinária Baiana'],
      isHere: true,
      checkInCount: 42,
    },
    {
      email: 'jonathan.albuquerque@tonopiramba.com.br',
      name: 'Jonathan Albuquerque',
      username: 'jonathan_mixology',
      role: Role.RESTAURANT_ADMIN,
      bio: 'Mixologista responsável pela carta autoral de drinks do Pirambeira Bar.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      interests: ['Mixologia', 'Coquetelaria Autoral', 'Destilados'],
      isHere: true,
      checkInCount: 38,
    },
    {
      email: 'larissa.nunes@tonopiramba.com.br',
      name: 'Larissa Nunes',
      username: 'larissa_nunes',
      role: Role.USER,
      bio: 'Dermatologista, adoro sentar no balcão e papear depois de um plantão corrido.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=400&q=80',
      interests: ['Medicina', 'Vinho', 'Conversas'],
      isHere: true,
      checkInCount: 6,
    },
    {
      email: 'felipe.dias@tonopiramba.com.br',
      name: 'Felipe Dias',
      username: 'felipedias_ba',
      role: Role.USER,
      bio: 'Empreendedor, entusiasta de startups e apreciador de um bom chopp bem tirado.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80',
      interests: ['Negócios', 'Inovação', 'Happy Hour'],
      isHere: true,
      checkInCount: 13,
    },
    {
      email: 'camila.peixoto@tonopiramba.com.br',
      name: 'Camila Peixoto',
      username: 'camilapeixoto',
      role: Role.USER,
      bio: 'Professora de dança, energia contagiante e fã número 1 da playlist do bar.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=400&q=80',
      interests: ['Dança', 'Música', 'Alegria', 'Amigos'],
      isHere: true,
      checkInCount: 10,
    },
    {
      email: 'andre.barreto@tonopiramba.com.br',
      name: 'André Barreto',
      username: 'andrebarreto',
      role: Role.USER,
      bio: 'Fotógrafo profissional e produtor de eventos. Registrando os melhores momentos da Bahia.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      interests: ['Fotografia', 'Eventos', 'Arte'],
      isHere: false,
      checkInCount: 8,
    },
    {
      email: 'patricia.leite@tonopiramba.com.br',
      name: 'Patrícia Leite',
      username: 'patyleite',
      role: Role.USER,
      bio: 'Psicóloga e entusiasta da convivência em comunidade. O Pirambeira é meu refúgio.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171ed280d88?auto=format&fit=crop&w=400&q=80',
      interests: ['Psicologia', 'Livros', 'Café', 'Drinks'],
      isHere: true,
      checkInCount: 12,
    },
    {
      email: 'victor.hugo@tonopiramba.com.br',
      name: 'Victor Hugo',
      username: 'victorhugo_ssa',
      role: Role.USER,
      bio: 'Dev frontend, fã de design minimalista e de chopp trincando de gelado.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      interests: ['Programação', 'Tech', 'Boteco Moderno'],
      isHere: true,
      checkInCount: 7,
    },
    {
      email: 'fernanda.lima@tonopiramba.com.br',
      name: 'Fernanda Lima',
      username: 'ferlimaba',
      role: Role.USER,
      bio: 'Veterinária, mãe de dois cachorros e apaixonada pela energia boêmia de Salvador.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      interests: ['Pets', 'Natureza', 'Petiscos', 'Família'],
      isHere: true,
      checkInCount: 11,
    },
    {
      email: 'marcelo.veiga@tonopiramba.com.br',
      name: 'Marcelo Veiga',
      username: 'marceloveiga',
      role: Role.USER,
      bio: 'Sommelier de cervejas especiais e colecionador de bolachas de chopp do mundo inteiro.',
      city: 'Salvador, BA',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      interests: ['Cervejas Artesanais', 'Lúpulo', 'História'],
      isHere: true,
      checkInCount: 22,
    }
  ];

  const createdUsers: any[] = [];

  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        role: u.role,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            name: u.name,
            username: u.username,
            bio: u.bio,
            avatarUrl: u.avatarUrl,
            city: u.city,
            interests: u.interests,
            checkInCount: u.checkInCount,
            showInFlirtRadar: true,
            allowFlirtFrom: 'EVERYONE',
            invisibleMode: false,
          }
        }
      },
      include: {
        profile: true,
      }
    });

    createdUsers.push({ ...user, isHere: u.isHere });

    // Se for admin, associar ao membro do restaurante
    if (u.role === Role.RESTAURANT_ADMIN) {
      await prisma.restaurantMember.create({
        data: {
          restaurantId: pirambeira.id,
          userId: user.id,
          role: u.username === 'chef_edumoraes' ? RestaurantRole.OWNER : RestaurantRole.MANAGER,
        }
      });
    }

    // Se estiver presente, criar check-in ativo (expira em 4 horas)
    if (u.isHere) {
      const now = new Date();
      const startedAt = new Date(now.getTime() - Math.floor(Math.random() * 90 + 15) * 60000); // 15 a 105 minutos atrás
      const expiresAt = new Date(startedAt.getTime() + 4 * 3600000);

      await prisma.checkIn.create({
        data: {
          userId: user.id,
          restaurantId: pirambeira.id,
          status: CheckInStatus.ACTIVE,
          startedAt,
          expiresAt,
          approxDistanceMeters: Math.floor(Math.random() * 25 + 5),
        }
      });
    }
  }

  console.log(`✅ ${createdUsers.length} usuários criados e check-ins atribuídos.`);

  // 3. Criar Relações de Follow
  const ramon = createdUsers.find(u => u.profile.username === 'ramonvalente');
  const carol = createdUsers.find(u => u.profile.username === 'carol_mendes');
  const lucas = createdUsers.find(u => u.profile.username === 'lucas_ssa');
  const marina = createdUsers.find(u => u.profile.username === 'marinacastro');
  const gabriel = createdUsers.find(u => u.profile.username === 'gabrielcosta');

  if (ramon && carol && lucas && marina && gabriel) {
    await prisma.follow.createMany({
      data: [
        { followerId: ramon.id, followingId: carol.id },
        { followerId: carol.id, followingId: ramon.id },
        { followerId: ramon.id, followingId: lucas.id },
        { followerId: marina.id, followingId: ramon.id },
        { followerId: gabriel.id, followingId: carol.id },
      ]
    });
  }

  // 4. Publicações no Feed
  const post1 = await prisma.post.create({
    data: {
      type: PostType.FEED,
      restaurantId: pirambeira.id,
      authorId: ramon.id,
      content: 'Chopp trincando e dadinho de tapioca na mesa! A sexta-feira no Pirambeira começou daquele jeito que a gente gosta. Quem mais tá por aqui?',
      likesCount: 18,
      commentsCount: 4,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=1200&q=80',
            type: 'IMAGE',
            sortOrder: 0,
          }
        ]
      }
    }
  });

  const post2 = await prisma.post.create({
    data: {
      type: PostType.FEED,
      restaurantId: pirambeira.id,
      authorId: carol.id,
      content: 'A carta de drinks do Jonathan Albuquerque nunca erra! Esse Caju Amigo com limão siciliano é poesia líquida. Parabéns @pirambeira.bar!',
      likesCount: 24,
      commentsCount: 6,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
            type: 'IMAGE',
            sortOrder: 0,
          }
        ]
      }
    }
  });

  const post3 = await prisma.post.create({
    data: {
      type: PostType.FEED,
      restaurantId: pirambeira.id,
      authorId: lucas.id,
      content: 'Mesa cheia, telão ligado pro jogo e porção de carne de sol com macaxeira. Melhor ponto da Pituba sem discussão!',
      likesCount: 15,
      commentsCount: 2,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
            type: 'IMAGE',
            sortOrder: 0,
          }
        ]
      }
    }
  });

  // Comentários e Reações nos Posts
  await prisma.comment.createMany({
    data: [
      { postId: post1.id, authorId: carol.id, content: 'Tô chegando na mesa de fora daqui a 10 minutinhos! Guarda um chopp pra mim!' },
      { postId: post1.id, authorId: lucas.id, content: 'A carne de sol hoje tá espetacular, pede também!' },
      { postId: post2.id, authorId: ramon.id, content: 'O melhor drink da casa de longe! Um brinde 🍻' },
      { postId: post2.id, authorId: marina.id, content: 'Nossa, sou apaixonada por esse drink! Daqui a pouco peço o meu.' },
    ]
  });

  await prisma.reaction.createMany({
    data: [
      { postId: post1.id, userId: carol.id, type: ReactionType.CHEERS },
      { postId: post1.id, userId: lucas.id, type: ReactionType.FIRE },
      { postId: post1.id, userId: marina.id, type: ReactionType.HEART },
      { postId: post2.id, userId: ramon.id, type: ReactionType.CHEERS },
      { postId: post2.id, userId: gabriel.id, type: ReactionType.HEART },
    ]
  });

  // 5. Mural da Paquera (Notas e Interesses)
  const flirtPost1 = await prisma.post.create({
    data: {
      type: PostType.FLIRT,
      flirtContext: 'Mesa 14 • Próximo ao bar',
      restaurantId: pirambeira.id,
      authorId: ramon.id,
      content: 'Vi alguém de jaqueta jeans e riso fácil na mesa de canto... Se estiver solteira e a fim de uma conversa boa, o Chopp do Piramba tá pago! 👀🍻',
      likesCount: 12,
      commentsCount: 2,
    }
  });

  const flirtPost2 = await prisma.post.create({
    data: {
      type: PostType.FLIRT,
      flirtContext: 'Balcão de Drinks',
      restaurantId: pirambeira.id,
      authorId: marina.id,
      content: 'Alguém no balcão tomando Gin Tônica com cara de quem precisa de uma companhia leve pra papear nessa sexta calorosa?',
      likesCount: 19,
      commentsCount: 3,
    }
  });

  const flirtPost3 = await prisma.post.create({
    data: {
      type: PostType.FLIRT,
      flirtContext: 'Mesa Externa',
      restaurantId: pirambeira.id,
      authorId: gabriel.id,
      content: 'Troquei olhares com uma moça de vestido estampado que passou cantando o refrão do samba agora há pouco. Fiquei muito curioso! ✨',
      likesCount: 14,
      commentsCount: 1,
    }
  });

  // 6. Mecânica de Match (Ramon & Marina demonstraram interesse mútuo!)
  await prisma.interest.createMany({
    data: [
      { fromUserId: ramon.id, toUserId: marina.id, restaurantId: pirambeira.id, status: InterestStatus.MATCHED },
      { fromUserId: marina.id, toUserId: ramon.id, restaurantId: pirambeira.id, status: InterestStatus.MATCHED },
      { fromUserId: lucas.id, toUserId: carol.id, restaurantId: pirambeira.id, status: InterestStatus.PENDING },
    ]
  });

  // Criar a conversa desbloqueada pelo Match
  const conversation = await prisma.conversation.create({
    data: {
      restaurantId: pirambeira.id,
      type: 'MATCH',
      participants: {
        create: [
          { userId: ramon.id },
          { userId: marina.id },
        ]
      }
    }
  });

  await prisma.match.create({
    data: {
      user1Id: ramon.id,
      user2Id: marina.id,
      restaurantId: pirambeira.id,
      conversationId: conversation.id,
    }
  });

  // Mensagens na conversa do Match
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, senderId: marina.id, content: 'Oi Ramon! Vi sua nota no Mural da Paquera, achei super fofa haha' },
      { conversationId: conversation.id, senderId: ramon.id, content: 'Oi Marina! Que bom que você viu! Vi que você tá aqui agora, tá na mesa interna ou na varanda?' },
      { conversationId: conversation.id, senderId: marina.id, content: 'Tô pertinho do balcão! Vamos tomar um chopp juntos?' },
    ]
  });

  // 7. Eventos Oficiais do Pirambeira
  const event1 = await prisma.event.create({
    data: {
      title: 'Sexta dos Organizados & Chopp Dobrado',
      category: 'HAPPY HOUR',
      description: 'A tradicional sexta baiana no Pirambeira com Chopp Brahma dobrado das 17h às 19h30 e playlist especial de MPB e brasilidades ao vivo.',
      date: new Date(Date.now() + 86400000 * 2), // daqui a 2 dias
      startTime: '17:30',
      coverImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      restaurantId: pirambeira.id,
    }
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Samba do Piramba com Grupo Botequim',
      category: 'MÚSICA AO VIVO',
      description: 'Roda de samba tradicional acústica no pátio do Pirambeira. Clássicos de Noel Rosa, Cartola, Paulinho da Viola e samba da Bahia.',
      date: new Date(Date.now() + 86400000 * 5), // daqui a 5 dias
      startTime: '16:00',
      coverImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      restaurantId: pirambeira.id,
    }
  });

  await prisma.eventParticipant.createMany({
    data: [
      { eventId: event1.id, userId: ramon.id, status: EventRsvpStatus.GOING },
      { eventId: event1.id, userId: carol.id, status: EventRsvpStatus.GOING },
      { eventId: event1.id, userId: lucas.id, status: EventRsvpStatus.GOING },
      { eventId: event2.id, userId: gabriel.id, status: EventRsvpStatus.GOING },
      { eventId: event2.id, userId: marina.id, status: EventRsvpStatus.INTERESTED },
    ]
  });

  // 8. Promoções e Cupons
  const promo1 = await prisma.promotion.create({
    data: {
      title: 'Chopp Brahma 20% OFF',
      discountText: '20% OFF no Chopp Caneca Congelada',
      description: 'Exclusivo para frequentadores com check-in ativo no Tô no Piramba durante o Happy Hour das 17h às 19h.',
      validUntil: new Date(Date.now() + 86400000 * 30),
      terms: 'Válido para consumo no local. Limite de 1 resgate por cliente por dia.',
      totalCoupons: 100,
      redeemedCount: 14,
      badge: 'MAIS POPULAR',
      restaurantId: pirambeira.id,
    }
  });

  const promo2 = await prisma.promotion.create({
    data: {
      title: 'Dadinho de Tapioca em Dobro',
      discountText: 'Na compra de 1 porção, ganhe outra',
      description: 'Apresente o cupom ao garçom no momento do pedido. Válido às quartas e quintas.',
      validUntil: new Date(Date.now() + 86400000 * 15),
      terms: 'Não cumulativo com outras promoções.',
      totalCoupons: 50,
      redeemedCount: 8,
      badge: 'PETISCO DO CHEF',
      restaurantId: pirambeira.id,
    }
  });

  // Cupons gerados para o usuário de teste Ramon
  await prisma.coupon.create({
    data: {
      code: 'PIRAMBA-CHOPP-8821',
      promotionId: promo1.id,
      userId: ramon.id,
      status: CouponStatus.CLAIMED,
    }
  });

  // 9. Encontros Comunitários (Meetups da Galera)
  const meetup1 = await prisma.meetup.create({
    data: {
      title: '🍻 Mesa Aberta dos Devs & Criativos',
      description: 'Vou sentar na mesa externa a partir das 19h30 para relaxar, tomar um chopp e bater papo sobre tecnologia, arte e a vida. Quem quiser colar é super bem-vindo!',
      scheduledFor: new Date(Date.now() + 3600000 * 3), // hoje daqui a 3 horas
      status: MeetupStatus.SCHEDULED,
      creatorId: ramon.id,
      restaurantId: pirambeira.id,
    }
  });

  await prisma.meetupParticipant.createMany({
    data: [
      { meetupId: meetup1.id, userId: ramon.id },
      { meetupId: meetup1.id, userId: carol.id },
      { meetupId: meetup1.id, userId: lucas.id },
      { meetupId: meetup1.id, userId: marina.id },
    ]
  });

  // 10. Publicidade Interna Elegante
  await prisma.advertisement.create({
    data: {
      title: 'Conheça a Cachaça Artesanal Rio de Engenho',
      description: 'Diretamente do sul da Bahia para o seu drink no Pirambeira Bar. Peça ao garçom.',
      imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://instagram.com/pirambeira.bar',
      sponsorName: 'Destilaria Rio de Engenho',
      restaurantId: pirambeira.id,
      impressions: 420,
      clicks: 34,
    }
  });

  // 11. Notificações para o Ramon
  await prisma.notification.createMany({
    data: [
      {
        userId: ramon.id,
        type: 'MATCH',
        title: '✨ Deu Match no Piramba!',
        body: 'Você e Marina Castro demonstraram interesse mútuo. A conversa já está aberta!',
        link: `/chat/${conversation.id}`,
      },
      {
        userId: ramon.id,
        type: 'COMMENT',
        title: 'Novo comentário na sua foto',
        body: 'Carolina Mendes comentou: "Tô chegando na mesa de fora daqui a 10 minutinhos!"',
        link: '/',
      },
      {
        userId: ramon.id,
        type: 'COUPON',
        title: 'Cupom de Chopp ativado',
        body: 'Seu cupom PIRAMBA-CHOPP-8821 está pronto para resgate no bar.',
        link: '/promocoes',
      }
    ]
  });

  console.log('🎉 Seed concluído com sucesso!');
  console.log('--------------------------------------------------');
  console.log(`Restaurante: ${pirambeira.name} (slug: ${pirambeira.slug})`);
  console.log(`Credenciais de Teste Admin: ramon@tonopiramba.com.br / Piramba@2026`);
  console.log(`Credenciais de Teste Usuário: carol_mendes@tonopiramba.com.br / Piramba@2026`);
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
