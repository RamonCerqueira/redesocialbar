# Arquitetura do Sistema - Tô no Piramba

## 1. Visão Geral

O **Tô no Piramba** é uma plataforma social orientada a contexto físico e comunitário para frequentadores de estabelecimentos gastronômicos e de entretenimento, tendo como primeiro piloto o **Restaurante Pirambeira** (Salvador, Bahia).

Diferente de redes sociais tradicionais de amplo espectro (como Instagram ou X), o Tô no Piramba opera sob a premissa de que:
> **"O estabelecimento deixa de ser apenas um local de consumo e passa a ter sua própria comunidade viva."**

O motor central da experiência é a dinâmica de presença: **"Quem está aqui agora?"**.

```mermaid
graph TD
    Client[Mobile / Web Client (Next.js 16 + PWA)] -->|HTTPS / REST / SSE| Gateway[API Gateway / NestJS App]
    Gateway --> Auth[Auth & RBAC Module]
    Gateway --> CheckIn[Check-in & Presence Engine]
    Gateway --> Social[Feed, Posts, Comments & Reactions]
    Gateway --> Flirt[Mural da Paquera & Radar]
    Gateway --> Meetups[Encontros & Eventos da Casa]
    Gateway --> Promos[Promoções & Cupons]
    Gateway --> Chat[Chat Seguro 1-on-1]
    Gateway --> Moderation[Moderação & Denúncias]
    Gateway --> Admin[Dashboard Multi-Tenant]
    
    Auth --> DB[(PostgreSQL 16 via Prisma ORM)]
    CheckIn --> DB
    Social --> DB
    Flirt --> DB
    Meetups --> DB
    Promos --> DB
    Chat --> DB
    Moderation --> DB
    Admin --> DB
```

---

## 2. Padrões de Design e Multi-Tenancy

### 2.1 Multi-Tenancy Isolado
A plataforma foi desenhada desde o dia zero para suportar múltiplos estabelecimentos (`Restaurant A`, `Restaurant B`, `Pirambeira`).
* Cada `Restaurant` possui um `slug` único e imutável.
* Todos os dados de contexto social (Check-ins, Posts, Mural da Paquera, Promoções, Eventos, Encontros, Conversas) vinculam obrigatoriamente um `restaurantId`.
* Consultas públicas e feed respeitam o contexto do restaurante ativo.
* Nenhum gestor de restaurante pode visualizar ou gerenciar métricas de outro estabelecimento graças ao guarda `RestaurantAccessGuard` e RBAC.

### 2.2 Motor de Presença e Auto-Expiração de Check-In
Para preservar a veracidade do *"Quem está aqui agora?"*:
* O check-in possui validade temporal limitada (padrão: 4 horas).
* Um worker interno de expiração e queries temporais com índice `[status, expiresAt]` garantem que apenas clientes efetivamente presentes apareçam na listagem.
* Não é exposta latitude/longitude precisa dos frequentadores, apenas distância estimada aproximada em metros e tempo de permanência ("Ramon está no Pirambeira desde 19:32").

### 2.3 Mecânica Discreta de Interesse e Match
O Mural da Paquera afasta-se de dinâmicas invasivas de aplicativos de namoro tradicionais:
* Usuários podem publicar notas poéticas, descontraídas ou bem-humoradas no bar.
* O botão `👀 Tenho interesse` só é revelado à outra pessoa caso ela **também** demonstre interesse mútuo (*double opt-in* silencioso).
* Ao ocorrer correspondência mútua:
  1. É gerado um registro de `Match`.
  2. Uma `Conversation` privada é liberada instantaneamente entre ambos.
  3. É disparada a celebração visual com confetes e notificação *"✨ Deu match! Vocês dois demonstraram interesse."*.
* Usuários podem ativar a qualquer momento o **Modo Invisível** ou desativar o radar da paquera em suas preferências de privacidade.

---

## 3. Tecnologias Empregadas

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16+ App Router, React 19, TypeScript | Server Components para SEO e performance + Client Components interativos |
| **Estilização** | Tailwind CSS v4, Vanilla CSS, Glassmorphism | Design System "Boteco Chic Noturno" customizado e responsivo |
| **Animações** | Framer Motion & Canvas Confetti | Microinterações ricas, transições táteis mobile e celebração de match |
| **Backend** | NestJS 11+, TypeScript Strict | Arquitetura modular corporativa, injeção de dependências e escalabilidade |
| **ORM & DB** | Prisma 6+, PostgreSQL 16 | Tipagem ponta a ponta, migrações seguras, relacionamentos estritos |
| **Autenticação** | JWT, Passport, bcryptjs | Tokens portáveis, RBAC robusto e criptografia de senhas |
| **Segurança** | Helmet, Throttler, CORS, Zod/Class-Validator | Proteção contra ataques comuns, sanitização e rate limiting |
