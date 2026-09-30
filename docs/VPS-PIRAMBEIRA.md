# Instalação exclusiva do Pirambeira

Domínio: `https://pirambeira.genioplay.com.br`.

Implantação concluída em 30/09/2026. HTTP redireciona para HTTPS; aplicativo e domínio principal retornaram 200 e `/api/health` retornou `{"status":"ok"}`. Os processos PM2 anteriores mantiveram nomes, PIDs e estados. Serviços novos ativos, sem reinícios inesperados na conferência.

Validação na VPS: builds aprovados, 38 testes aprovados (19 legados ignorados), 51 verificações HTTP/banco aprovadas pela URL HTTPS e dados temporários removidos. Auditoria `pnpm audit --prod` sem vulnerabilidades conhecidas após atualizar dependências transitivas. Navegação da home, cardápio e proteção do painel conferidas em navegador.

## Estrutura

- Usuário Linux: `pirambeira`, sem login interativo.
- Runtime exclusivo: Node.js 22.23.3 em `/opt/pirambeira/runtime`, com SHA-256 verificado contra a distribuição oficial. Node global e PM2 existentes preservados.
- Código: `/opt/pirambeira/releases/20260930`.
- Release ativa: `/opt/pirambeira/current`.
- Segredos: `/opt/pirambeira/shared/backend.env`, modo 600. Não versionar nem imprimir.
- Uploads: `/opt/pirambeira/shared/uploads`, configurado por `MEDIA_ROOT`. A pasta não pertence a uma release e deve ser preservada nas atualizações e reversões.
- Backend: `127.0.0.1:3211`, serviço `pirambeira-api`.
- Frontend: `127.0.0.1:3210`, serviço `pirambeira-web`.
- Proxy: `/etc/nginx/sites-available/pirambeira.conf`.
- Banco existente: Supabase via Prisma. Não foi criado PostgreSQL local, executado seed ou apagado conteúdo.
- Backup anterior do Nginx e inventário de processos: `/opt/pirambeira/backups/`.

Os arquivos de referência estão em `deploy/`. O compose da raiz serve ao desenvolvimento e não deve ser usado nesta VPS compartilhada.

## Operação

```bash
systemctl status pirambeira-api pirambeira-web
journalctl -u pirambeira-api -n 50 --no-pager
journalctl -u pirambeira-web -n 50 --no-pager
curl --fail https://pirambeira.genioplay.com.br/api/health
```

Reiniciar somente os dois serviços do Pirambeira quando necessário. Nunca executar comandos globais como `pm2 restart all`, `docker compose down` em diretórios alheios ou substituir a configuração global do Nginx.

## Atualizações e reversão

Criar uma nova pasta em `releases`, copiar o código sem `.env` e `node_modules`, vincular o ambiente privado do backend e configurar as URLs públicas do frontend antes do build. Instalar com o lockfile. Gerar Prisma e compilar backend/frontend como usuário `pirambeira`, com limites de CPU e memória. Testar antes de alterar o link `current`.

Após ativar uma release, reiniciar exclusivamente `pirambeira-api` e `pirambeira-web`, conferir health e navegação. Para reverter, apontar `current` à release anterior e reiniciar somente esses serviços. Não executar migrações destrutivas; reversão de código não desfaz alterações no banco.

Certificados usam Certbot/webroot em `/opt/pirambeira/shared/acme`. A renovação precisa de reload do Nginx após sucesso. Preservar a rota ACME e o DNS.

Certificado inicial válido até 29/12/2026. `certbot.timer` habilitado; hook `/etc/letsencrypt/renewal-hooks/deploy/pirambeira-reload` recarrega Nginx somente quando o certificado deste subdomínio for renovado, após validar a configuração.

## Dependências

Antes desta implantação, o Next.js foi atualizado de 15.2.1 para 15.5.26 (backport disponível em 30/09/2026), React/React DOM para 19.2.8 e eslint-config-next para 15.5.26. O site oficial anunciava 15.5.27 para 30/09, mas ela ainda não constava no registro durante a preparação. Verificar disponibilidade antes de futuras atualizações: https://nextjs.org/blog.

O limite de CPU do build evita saturar os demais projetos. Os serviços têm limites separados de memória e escutam apenas em loopback.

Overrides versionados: PostCSS 8.5.23, Multer 2.4.0 e deepmerge-ts 8.0.0; geração Prisma, compilação, testes e upload HTTP foram validados com essas versões. Ao atualizar dependências novamente, reavaliar os overrides. Na máquina local, executar `pnpm install --frozen-lockfile` para sincronizar os pacotes instalados com o novo lockfile.

Uploads novos são arquivos no disco da VPS; o banco mantém identificador, proprietário e tipo. A rota `/api/media/:id` mantém as URLs estáveis. O script `backend/scripts/migrate-media-to-disk.cjs` copia arquivos antigos e verifica SHA-256 sem apagar o original do banco. Fazer backup conjunto do banco e da pasta de uploads. O disco da VPS persiste em recarregamentos, reinícios e deploys, mas não substitui backup externo.

Continuam pendentes os dados reais do estabelecimento: fotos dos 7 produtos, fotos da galeria, telefone, descrição e horários. Backup externo do banco e recuperação por e-mail não foram configurados nesta implantação.
