# Termos e privacidade — demonstração

Esta entrega usa identidade empresarial fictícia por solicitação do responsável. Não é declaração de adequação à LGPD nem garantia contra responsabilidade. Antes de documentos definitivos, identificar o controlador real, contato funcional, provedores/regiões, retenção, bases legais e procedimento de resposta com revisão jurídica.

## Páginas

- `/termos`: regras de uso e licença limitada às funcionalidades.
- `/privacidade`: dados tratados, visibilidade, câmera, direitos e limitações.
- `/central-de-privacidade`: exportação parcial e solicitações autenticadas com protocolo; o superadministrador vê a fila nesta página.

Cadastro exige três caixas inicialmente desmarcadas: termos DEMO, ciência da política DEMO e autodeclaração de maioridade. O registro é criado na mesma transação do usuário. Não existe preenchimento retroativo de aceite: contas anteriores podem revisar ou adiar. Nenhum registro DEMO vale como aceite definitivo.

Os documentos idênticos ficam em `backend/src/legal/legal-documents.json` e `frontend/src/lib/legal-documents.json`. A versão atual é `demo-2026-09-30-v1`. O backend registra versão, SHA-256 do conteúdo, data, conta e origem em AuditLog com ação `LEGAL_ACCEPTANCE_DEMO`. Não há migração de banco nesta entrega. Mudança no conteúdo invalida a correspondência do registro anterior pelo hash.

Solicitações usam `PRIVACY_REQUEST` com estado PENDING. O formulário **não exclui dados**, não envia e-mail e não conclui o pedido. Administração deve acompanhar os protocolos e implementar um processo real de verificação, resposta, execução e retenção antes de produção jurídica definitiva. A exportação não cobre todo o histórico; outros dados exigem pedido de acesso.

## API e proteção

Documentos públicos: `GET /api/legal/documents`. Status, aceite, exportação e solicitações exigem JWT. IDs de usuário vêm da sessão autenticada; não do formulário. Fila global requer SUPERADMIN. Exportação não seleciona senha/hash. Escritas limitadas por AuthRateGuard. Não colocar e-mail, conteúdo de solicitação ou registros de aceite em endpoints públicos.

Na verificação da VPS, AuditLog tinha RLS habilitada e nenhum grant para anon/authenticated/PUBLIC. Manter essa proteção; clientes devem acessar essas funções pelo backend autenticado. Credenciais de banco nunca devem estar no frontend.

## Subir a atualização

Usar o procedimento completo em [ATUALIZACAO-VPS.md](ATUALIZACAO-VPS.md). Na VPS:

```bash
ssh root@153.75.244.238
/usr/local/sbin/pirambeira-update
systemctl status pirambeira-api pirambeira-web --no-pager
curl -fsS https://pirambeira.genioplay.com.br/api/legal/documents
```

A instalação atual usa systemd. O script executa git pull, builds e restart com rollback; não usar PM2 para esses mesmos serviços.

## Validação

Conferir cadastro sem caixas/versão inválida rejeitado, aceite de demonstração apenas após ação, contas antigas sem backfill, exportação própria sem credenciais, solicitações pendentes e fila vedada a usuário comum. Configurar dados reais e uma nova versão/fluxo antes de substituir a DEMO; nunca reaproveitar o aceite de teste como definitivo.

Referências oficiais: [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), [ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes).
