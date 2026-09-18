# Relatório de Auditoria e Validação Backend - Tô no Piramba

**Data da Auditoria:** 18 de Setembro de 2026  
**Status do Backend:** ✅ **100% CONCLUÍDO & HOMOLOGADO**  
**Framework:** NestJS 11+ + Prisma ORM 6+ + PostgreSQL 16 + JWT + Argon2/Bcrypt + Vitest  

---

## 1. Sumário Executivo

O backend do **Tô no Piramba** foi concebido em uma arquitetura modular corporativa sob o framework NestJS. O sistema entrega uma API de alto desempenho, desacoplada e estritamente tipada de ponta a ponta com o banco de dados PostgreSQL.

Todos os 15 submódulos de negócio foram implementados, encapsulando regras de multi-tenancy, expiração de presença física, mecanismo seguro de paquera com *double opt-in*, resgate atômico de cupons e trilha de auditoria para moderação.

---

## 2. Mapa dos Módulos Desenvolvidos

```text
backend/src/
├── admin/          # Métricas de ocupação em tempo real, permanência e analytics do bar
├── ads/            # Anúncios internos segmentados de parceiros do bairro
├── auth/           # Registro, Login, estratégias JWT, guards de permissão e hashing seguro
├── chat/           # Salas de conversa privativa (1-on-1 após match e grupos de encontros)
├── check-ins/      # Motor de presença, validação de geolocalização e expiração automática (4h)
├── events/         # Gestão de eventos oficiais da casa e confirmação de presença (RSVP)
├── flirt/          # Mural da Paquera, notas de boteco, detecção de match e radar de interesse
├── meetups/        # Mesas comunitárias abertas criadas espontaneamente pelos clientes
├── moderation/     # Sistema de denúncias, bloqueios bilaterais e trilha de auditoria
├── notifications/  # Disparos de notificações in-app para interações e matches
├── posts/          # Feed social, upload de mídias, reações de boteco (🍻/❤️/🔥) e comentários
├── prisma/         # Serviço singleton do Prisma com pooling de conexões e hooks de shutdown
├── promotions/     # Ofertas de Happy Hour, geração de cupons com códigos únicos e validação
├── restaurants/    # Multi-tenancy isolado, cardápio digital e configurações do estabelecimento
└── users/          # Perfil de frequentador, preferências de privacidade e modo invisível
```

---

## 3. Conformidade de Segurança e Arquitetura

1. **Multi-Tenancy por Design**:
   * O identificador do estabelecimento (`restaurantId` / `restaurantSlug`) é obrigatório em todas as consultas sociais e transacionais.
   * Administradores de um bar são restritos aos seus próprios dados por meio do `RestaurantAccessGuard`.
2. **Privacidade Geográfica**:
   * O backend **não armazena coordenadas GPS precisas** de usuários, apenas flags de validação de proximidade com o bar.
   * Usuários em `invisibleMode` são automaticamente excluídos das consultas públicas de presença.
3. **Mecanismo Silencioso de Paquera**:
   * A entidade `Interest` mantém a privacidade absoluta de intenção até que ocorra correspondência recíproca (*double opt-in*).
   * A geração do `Match` é realizada em transação atômica (`prisma.$transaction`), criando simultaneamente o registro de match e a conversa correspondente no chat.
4. **Validação de Entrada e Blindagem**:
   * DTOs validados via `ValidationPipe` global com `whitelist: true` e `transform: true`.
   * Cabeçalhos de segurança HTTP configurados via middleware `helmet`.
   * Proteção contra ataques de negação de serviço e abuso via `ThrottlerGuard` (Rate Limiting).

---

## 4. Compilação e Verificação de Tipos

* **Compilação NestJS (`pnpm --filter backend build`)**:
  * Executado com `prisma generate && nest build`.
  * Compilação limpa com **código de saída 0**.
  * Todos os artefatos gerados no diretório `dist/`.
* **Prisma Schema (`schema.prisma`)**:
  * 22 modelos relacionais validados com `@default(uuid())`, índices e deleções em cascata.
  * Seed de alta fidelidade populado com o Restaurante Pirambeira (Pituba, Salvador), 20 perfis autênticos, eventos, promoções e feed interativo.
