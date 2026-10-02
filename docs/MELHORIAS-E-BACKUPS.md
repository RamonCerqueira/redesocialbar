# Operação do aplicativo

As novidades do bar são editadas em **Admin → Novidades do bar e anúncios**. Use o tipo “Novidade no carrossel inicial”. A prévia mostra o cartão compacto. Início e término usam o horário de Salvador; campos vazios deixam o item disponível enquanto ativo. A menor ordem aparece primeiro, com desempate por data mais recente. O aplicativo atualiza a lista a cada 30 segundos.

O painel mostra cliques e visualizações acumulados por anúncio e cupons emitidos/utilizados por oferta. As visualizações começaram nesta atualização, são estimativas de exibição e não representam pessoas únicas. Um cartão precisa ficar pelo menos metade visível durante um segundo. Cliques anteriores foram preservados. As chegadas são check-ins do dia no horário de Salvador.

Mensagens abertas atualizam a cada quatro segundos; a lista, a cada cinco segundos. Contadores mostram mensagens recebidas ainda não lidas. A atualização pausa com a página oculta. O guia de primeiro uso pode ser dispensado; fica disponível em Mais → Como usar.

Na Central de privacidade, o SUPERADMIN pode analisar e responder protocolos. A resposta gera histórico de auditoria e uma notificação ao solicitante. Marcar um protocolo como concluído não executa exclusão de conta: o responsável deve efetuar e conferir as providências descritas. A exportação automática permanece parcial, com o escopo informado na tela. Os documentos continuam em DEMONSTRAÇÃO até o cliente fornecer identidade e contato reais. Não há aceites fabricados.

## Backup na VPS

Banco da aplicação (schema public) e uploads são empacotados e criptografados. A retenção é de 14 cópias bem-sucedidas. A chave fica em `/opt/pirambeira/shared/backup.key`, com acesso restrito ao root, fora do Git. Guarde uma cópia da chave em local seguro separado: sem ela o arquivo não pode ser restaurado. Esta rotina não inclui schemas internos do Supabase.

```bash
ssh root@153.75.244.238
systemctl status pirambeira-backup.timer
systemctl list-timers pirambeira-backup.timer
systemctl start pirambeira-backup.service
journalctl -u pirambeira-backup.service -n 50 --no-pager
cat /opt/pirambeira/backups/latest.json
/opt/pirambeira/runtime/bin/node /opt/pirambeira/current/deploy/test-restore-vps.cjs
cat /opt/pirambeira/backups/restore-test.json
```

O timer roda às 03h de São Paulo, com pequeno atraso aleatório. O teste verifica o checksum, descriptografa, restaura em um PostgreSQL descartável sem portas ou rede e confere o banco e os arquivos. Não restaura sobre produção. A primeira verificação restaurou 29 tabelas e conferiu 15 arquivos. Cópia externa depende de um destino a definir; guardar somente na VPS não protege contra perda do servidor.

## Atualizar

```bash
ssh root@153.75.244.238
pirambeira-update
systemctl status pirambeira-api pirambeira-web
curl -fsS https://pirambeira.genioplay.com.br/api/health
```

O comando faz `git pull --ff-only`, instala, compila, testa e reinicia os serviços systemd. Consulte `ATUALIZACAO-VPS.md` para caminhos e rollback. A VPS usa systemd; reiniciar PM2 não atualiza estes processos.

Alterações de schema continuam bloqueadas até migração e backup verificados. Nesta versão a migração aditiva está em `backend/supabase/migrations/20261002012505_schedule_bar_news.sql`, gerada com Supabase CLI. A aprovação é vinculada ao commit e checksum do schema e consumida depois da implantação; atualizações futuras não recebem aprovação automática.
