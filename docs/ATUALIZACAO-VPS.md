# Atualização do Tô no Piramba na VPS

Servidor: `153.75.244.238`  
Site: https://pirambeira.genioplay.com.br  
Repositório: https://github.com/RamonCerqueira/redesocialbar  
Branch: `main`

## Atualizar depois de subir alterações no GitHub

Conecte-se à VPS:

```bash
ssh root@153.75.244.238
```

Na VPS, execute:

```bash
cd /opt/pirambeira/repository
runuser -u pirambeira -- git pull --ff-only origin main
bash deploy/update-vps.sh
```

O script também executa git pull. Ele cria uma nova versão, instala as dependências pelo lockfile, compila backend, executa os testes isolados e compila frontend. Só depois troca o link current e reinicia os dois serviços. Verifica o site e a API, incluindo a conexão do banco pelo endpoint de saúde. Se a verificação falhar depois da ativação, restaura a versão anterior automaticamente.

Alternativa em um único comando, já instalada nesta VPS:

```bash
pirambeira-update
```

Execute como root. A atualização pode levar alguns minutos; aguarde a mensagem ATUALIZACAO CONCLUIDA. Um erro antes da ativação mantém a versão atual. Não rode duas atualizações ao mesmo tempo.

## Caminhos

| Item | Caminho |
| --- | --- |
| Checkout Git para git pull | /opt/pirambeira/repository |
| Versão em execução (link simbólico) | /opt/pirambeira/current |
| Versões compiladas | /opt/pirambeira/releases |
| Variáveis do backend | /opt/pirambeira/shared/backend.env |
| Variáveis do frontend | /opt/pirambeira/shared/frontend.env |
| Uploads persistentes | /opt/pirambeira/shared/uploads |
| Node.js utilizado | /opt/pirambeira/runtime/bin/node |
| Atalho de atualização | /usr/local/sbin/pirambeira-update |
| Configuração Nginx ativa | /etc/nginx/sites-enabled/pirambeira.conf |
| Serviços | /etc/systemd/system/pirambeira-api.service e pirambeira-web.service |

Cada versão recebe links para os arquivos de ambiente compartilhados. As variáveis NEXT_PUBLIC são incorporadas durante o build; depois de alterar frontend.env, execute a atualização novamente. Não coloque senhas, tokens ou arquivos .env no Git.

## Por que não usar PM2 aqui?

Este aplicativo é gerenciado por systemd. O PM2 não gerencia o Tô no Piramba. Não inicie outra cópia pelo PM2, pois ela pode disputar as mesmas portas. O equivalente ao restart do PM2 é:

```bash
systemctl restart pirambeira-api pirambeira-web
systemctl status pirambeira-api pirambeira-web --no-pager
```

Backend escuta localmente na porta 3211 e frontend na porta 3210. Nginx entrega HTTPS e encaminha /api para o backend.

## Build manual e reinício

Prefira o script, que compila em outra pasta e permite restaurar a versão anterior. Para diagnóstico ou uma manutenção controlada na versão ativa:

```bash
export PATH="/opt/pirambeira/runtime/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/bin"
cd /opt/pirambeira/current
runuser -u pirambeira -- env PATH="$PATH" pnpm install --frozen-lockfile
runuser -u pirambeira -- env PATH="$PATH" NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter backend build
runuser -u pirambeira -- env PATH="$PATH" pnpm --filter backend test
runuser -u pirambeira -- env PATH="$PATH" NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter frontend build
systemctl restart pirambeira-api pirambeira-web
```

Esses comandos não trazem código do Git para a versão ativa. O git pull deve ser feito em repository e o script cria a próxima versão. Compilar diretamente em current pode afetar temporariamente o site; por isso o fluxo normal deve usar deploy/update-vps.sh.

## Verificações e logs

```bash
readlink -f /opt/pirambeira/current
cat /opt/pirambeira/current/REVISION
systemctl is-active pirambeira-api pirambeira-web
curl -fsS https://pirambeira.genioplay.com.br/api/health
curl -I https://pirambeira.genioplay.com.br/
journalctl -u pirambeira-api -n 100 --no-pager
journalctl -u pirambeira-web -n 100 --no-pager
nginx -t
```

REVISION existe nas versões criadas pelo novo script. O retorno esperado de saúde é {"status":"ok"}.

Para executar em segundo plano e guardar um log:

```bash
systemd-run --unit="pirambeira-update-$(date +%Y%m%d%H%M%S)" /bin/bash -c 'pirambeira-update > /opt/pirambeira/shared/update.log 2>&1'
tail -f /opt/pirambeira/shared/update.log
```

Ctrl+C interrompe apenas a leitura de tail. Leia o log até ATUALIZACAO CONCLUIDA ou consulte a unidade criada com systemctl status.

## Voltar para a versão anterior

Depois de uma atualização concluída:

```bash
previous=$(cat /opt/pirambeira/shared/previous-release)
test -d "$previous/backend" && test -d "$previous/frontend" || exit 1
ln -sfn "$previous" /opt/pirambeira/current.rollback
mv -Tf /opt/pirambeira/current.rollback /opt/pirambeira/current
systemctl restart pirambeira-api pirambeira-web
curl -fsS https://pirambeira.genioplay.com.br/api/health
curl -I https://pirambeira.genioplay.com.br/
```

As versões anteriores ficam em releases. Não apague a versão apontada por current nem shared.

## Banco de dados e limites

O script compara schema.prisma e migrations com a versão ativa. Se houver mudanças, para antes da ativação: elas precisam de revisão e plano de migração/backup. A atualização feita em 30/09/2026 não alterou o banco.

Não execute db:seed, prisma db push, migrate reset ou o smoke test no banco de produção como parte de uma atualização rotineira. O smoke test cria registros temporários. Os testes de integração permanecem desativados sem TEST_DATABASE_URL separado.

## Instalação anterior

As primeiras versões foram enviadas por arquivos tar.gz, sem .git. Por isso git pull não funcionava em current. Agora o checkout Git fica em repository e os builds ficam em releases. Esse formato preserva ambientes, uploads e a versão anterior.
