# 🍻 Tô no Piramba

Plataforma social exclusiva orientada à experiência física e comunitária de bares, botecos e restaurantes.
Caso piloto: **Restaurante Pirambeira** (Pituba, Salvador - BA).

> **"Quem está aqui agora?"** — Transformando frequentadores em uma comunidade viva e engajada.

---

## 🌟 Funcionalidades Principais

* 📍 **Motor de Presença ("Quem está aqui agora?")**: Check-in temporário (4h) que revela frequentadores ativos no local sem expor dados de localização sensíveis.
* 📸 **Feed Social do Bar**: Fotos de pratos, brindes e encontros, com reações temáticas de boteco (🍻 *Tim-tim*, ❤️ *Coração*, 🔥 *Pegando fogo*) e comentários.
* 💌 **Mural da Paquera & Radar Discreto**: Bilhetes descontraídos afixados no bar e mecanismo de interesse com *double opt-in* silencioso.
* ✨ **"Deu Match!"**: Celebração com confetes animados e abertura automática de conversa privada 1-on-1.
* 👥 **Mesas Comunitárias (Encontros)**: Criação de mesas espontâneas de chopp e adesão de novos amigos.
* 📅 **Agenda Cultural**: Shows de Samba, transmissões de futebol (Ba-Vi) e Happy Hours com RSVP.
* 🏷️ **Promoções & Cupons**: Descontos exclusivos para clientes no bar com validação instantânea pela equipe.
* 🛡️ **Central de Moderação & Denúncias**: Bloqueio bilateral, moderação proativa e Modo Invisível para privacidade total.
* 📊 **Painel Gerencial do Restaurante**: Métricas de ocupação em tempo real, permanência média e validação de cupons.

---

## 🏗️ Arquitetura do Projeto

Monorepo estruturado com **pnpm workspaces**:

```text
ToNoPiramba/
├── backend/          # NestJS 11+, Prisma ORM, PostgreSQL, JWT, Argon2, Swagger
├── frontend/         # Next.js 15.2+, React 19, Tailwind CSS v4, Framer Motion
├── docs/             # Manuais técnicos (Arquitetura, Banco, API, Moderação, LGPD, Deploy)
├── docker-compose.yml# Orquestração do banco de dados PostgreSQL 16
├── resultadoFront.md # Relatório de auditoria do Frontend (18 rotas)
├── resultadoBack.md  # Relatório de auditoria do Backend
└── resultadoGeral.md # Relatório executivo consolidado (100% de conclusão)
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
* Node.js 20+ ou 22+ LTS
* pnpm (`npm install -g pnpm`)
* Docker ou PostgreSQL 16 local

### 2. Instalação
```bash
git clone https://github.com/tonopiramba/tonopiramba.git
cd ToNoPiramba
pnpm install
```

### 3. Banco de Dados (quando desejar iniciar o banco)
```bash
# Iniciar PostgreSQL via Docker
pnpm docker:up

# Ou apontar o DATABASE_URL no backend/.env para seu Postgres local e executar:
pnpm db:migrate
pnpm db:seed
```

### 4. Execução dos Serviços
```bash
# Executar backend (Porta 3001)
pnpm dev:backend

# Executar frontend (Porta 3000)
pnpm dev:frontend
```

Acesse no navegador:
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

---

## 📚 Documentação Técnica Completa

* [Arquitetura Geral](file:///docs/architecture.md)
* [Dicionário do Banco de Dados](file:///docs/database.md)
* [Contrato da API REST](file:///docs/api.md)
* [Diretrizes de Moderação e Segurança](file:///docs/moderation.md)
* [Privacidade & LGPD](file:///docs/privacy.md)
* [Guia de Deploy em Produção](file:///docs/deployment.md)

---

## 📄 Licença

Distribuído sob a licença MIT. Desenvolvido para o **Restaurante Pirambeira**.
