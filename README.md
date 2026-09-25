# Tô no Piramba

Aplicativo social do Pirambeira, com Next.js/React no frontend e NestJS/Prisma no backend. PostgreSQL hospedado no Supabase. Autenticação própria com JWT e bcrypt.

## Executar

1. Instale as dependências com `pnpm install`.
2. Configure `backend/.env` e `frontend/.env.local` usando `.env.example` como referência. O ambiente local deste projeto já possui a conexão Supabase configurada.
3. Aplique migrações: `pnpm --filter backend db:deploy`.
4. Gere o cliente: `pnpm --filter backend prisma:generate`.
5. Execute `pnpm dev:backend` e `pnpm dev:frontend`, em terminais separados.

Aplicativo: http://localhost:3000. Painel: http://localhost:3000/admin. API: http://localhost:3001/api.

## Administração

O painel independente contém publicações oficiais, promoções, cupons emitidos e validação, banners, agenda, ajustes e moderação. Upload de imagens e textos/endereços dos botões são configuráveis. A conta de `ramon@pirambeira.com` está vinculada como proprietária do Pirambeira. A credencial inicial local fica em `.admin-access.local`, ignorado pelo Git. A senha pode ser alterada em **Ajustes**.

Para preparar outro ambiente vazio: `pnpm --filter backend db:bootstrap email@exemplo.com`. Esse comando preserva a senha de contas existentes e cria uma senha aleatória somente para contas novas. Não execute o seed de demonstração em produção.

## Aplicativo

Página inicial orientada pela referência `frontend/public/REFERENCE.png`, com dados reais de presença, stories, promoções e publicações. Navegação mobile com **Mais** para os destinos adicionais. Splash breve, com opção de pular e suporte a movimento reduzido. O chat foi removido das rotas e do menu; interesses e matches continuam disponíveis sem criar conversas.

## Verificação

- `pnpm --filter backend test`: regressões isoladas. A suíte antiga de integração só roda com `TEST_DATABASE_URL` separado do banco da aplicação.
- `pnpm --filter backend test:smoke`: API deve estar ligada; usa o banco configurado, cria fixtures identificadas e remove exclusivamente os registros criados pela execução. Verifica acesso, imagens, publicações, promoções, concorrência, moderação e RLS.
- `pnpm --filter backend build` e `pnpm --filter frontend build`: compilação, tipos e lint do frontend.

Consulte [docs/ADMINISTRACAO.md](docs/ADMINISTRACAO.md) para configuração e limites. Relatórios `resultado*.md` são históricos, anteriores a esta revisão; não representam certificação de conclusão ou segurança.
