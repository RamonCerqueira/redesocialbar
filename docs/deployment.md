# Guia de Implantação e Deploy em Produção - Tô no Piramba

Este guia detalha o processo completo de implantação em produção do ecossistema **Tô no Piramba**, cobrindo infraestrutura, banco de dados, backend NestJS, frontend Next.js, proxy reverso Nginx com SSL e rotinas de backup.

---

## 1. Requisitos de Infraestrutura

* **Servidor VPS / Cloud**:
  * Sistema Operacional: Ubuntu 22.04 LTS ou 24.04 LTS (ou servidor equivalente).
  * Mínimo: 2 vCPUs, 4 GB de RAM, 40 GB SSD.
  * Recomendado: 4 vCPUs, 8 GB de RAM, 80 GB SSD NVMe.
* **Softwares Base**:
  * Node.js 20.x ou 22.x LTS.
  * pnpm 9.x+ instalado globalmente (`npm i -g pnpm`).
  * Docker Engine e Docker Compose Plugin (v2.x+).
  * Nginx e Certbot (Let's Encrypt).

---

## 2. Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do monorepo e nas pastas `backend/` e `frontend/`:

### 2.1 Backend (`backend/.env`)
```bash
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://postgres:SENHA_FORTE_AQUI@localhost:5432/tonopiramba?schema=public"
JWT_SECRET="GERAR_STRING_HEX_ALEATORIA_64_CHARS"
JWT_EXPIRES_IN="7d"
DEFAULT_RESTAURANT_SLUG="pirambeira"
FRONTEND_URL="https://tonopiramba.com.br"
```

### 2.2 Frontend (`frontend/.env.production`)
```bash
NEXT_PUBLIC_API_URL="https://api.tonopiramba.com.br/api"
NEXT_PUBLIC_APP_URL="https://tonopiramba.com.br"
```

---

## 3. Banco de Dados PostgreSQL (Docker ou Nativo)

### 3.1 Inicialização via Docker Compose
Na raiz do monorepo:
```bash
docker compose up -d
```

### 3.2 Execução de Migrações e Carga Inicial (Seed)
```bash
pnpm --filter backend prisma migrate deploy
pnpm --filter backend prisma db seed
```

---

## 4. Build e Execução dos Serviços

### 4.1 Instalação de Dependências e Compilação
```bash
pnpm install --frozen-lockfile
pnpm build
```

### 4.2 Gerenciamento de Processos via PM2
Crie o arquivo `ecosystem.config.js` na raiz:
```javascript
module.exports = {
  apps: [
    {
      name: 'tonopiramba-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'tonopiramba-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Inicie com PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 5. Configuração do Nginx e SSL (Certbot)

Arquivo `/etc/nginx/sites-available/tonopiramba.conf`:

```nginx
# Frontend Next.js (App Principal)
server {
    server_name tonopiramba.com.br www.tonopiramba.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend NestJS (API RESTful)
server {
    server_name api.tonopiramba.com.br;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativação do certificado SSL gratuito:
```bash
sudo certbot --nginx -d tonopiramba.com.br -d www.tonopiramba.com.br -d api.tonopiramba.com.br
```

---

## 6. Rotina Automatizada de Backup

Agende no cron (`crontab -e`) o backup diário compactado do banco de dados:

```bash
0 3 * * * docker exec -t tonopiramba_postgres pg_dumpall -c -U postgres | gzip > /var/backups/tonopiramba_$(date +\%Y\%m\%d).sql.gz
```
