# Administração e operação

## Funções implementadas

| Área | Operações |
| --- | --- |
| Visão geral | Indicadores do restaurante e entradas por horário obtidos do banco |
| Publicações | Criar, editar, remover, fixar, carregar imagem, configurar texto e URL do botão |
| Promoções | Benefício, regras, imagem, validade, quantidade de cupons, etiqueta, botão de resgate, ativação |
| Cupons | Histórico paginado, código único por cliente/promoção, validação de uso único, estoque protegido contra resgates simultâneos |
| Banners | Imagem, título, descrição, anunciante, texto/URL do botão, posicionamento, ativação |
| Agenda | Criar, editar, cancelar eventos com capa, data, horário e categoria |
| Ajustes | Dados do estabelecimento, horários, contatos, logo, capa e alteração de senha da própria conta |
| Moderação | Denúncias por estabelecimento, remoção de conteúdo, arquivamento; banimento global reservado a SUPERADMIN |

O backend exige vínculo OWNER/MANAGER com o restaurante, além do papel administrativo. Alterar o frontend ou o papel presente em um token não substitui essa verificação. RLS habilitado nas tabelas da aplicação impede acesso direto pelo cliente Supabase anônimo/autenticado. As consultas Prisma são exclusivamente do servidor.

## Banco e arquivos

- `DATABASE_URL`: pooler transacional do Supabase, porta 6543, `pgbouncer=true`, SSL.
- `DIRECT_URL`: pooler de sessão, porta 5432, para migrações.
- Aplicar `prisma migrate deploy`; não usar reset ou seed de demonstração no banco real.
- Upload aceita JPEG, PNG e WebP de até 5 MB. Os bytes são persistidos no PostgreSQL em `MediaAsset` e servidos pela API. Supabase Storage e upload de vídeo não estão configurados.
- Definir `PUBLIC_API_URL` com o endereço público da API antes de carregar imagens no ambiente publicado. Imagens já salvas possuem URLs absolutas: imagens locais precisam ser migradas ou recarregadas se o domínio da API mudar.
- `FRONTEND_URL` configura CORS; `NEXT_PUBLIC_API_URL` deve estar definido antes do build do frontend.
- Credenciais reais ficam fora do Git. O sistema de login é próprio da aplicação; não utiliza Supabase Auth.

## Limites e próximos incrementos opcionais

Os itens solicitados de conteúdo, cupons, promoções, ajustes e imagens estão implementados. Não há ainda gestão de equipe/convites no painel, recuperação de senha por e-mail, agendamento de publicações, relatórios exportáveis ou integração com vendas/pagamentos. Não foi realizado deploy nesta revisão.

Rate limiting de autenticação é local ao processo; uma implantação com múltiplas instâncias requer armazenamento compartilhado. JWT expira em um dia; troca de senha não revoga automaticamente tokens já emitidos. Stories expiram da listagem em 24 horas; limpeza física de mídias expiradas deve ser agendada conforme a política de retenção do estabelecimento.

Chat desativado: não há páginas `/chat` nem módulo HTTP de chat carregado. As tabelas históricas são preservadas, sem apagar mensagens existentes. Matches direcionam ao perfil e ao mural.

## Dados e referência visual

Fotos e números da referência são direção visual, não dados operacionais. Sem conteúdo publicado ou check-ins, o app apresenta estados vazios. Para exibir o banner de promoção na home, crie uma promoção ativa com saldo e validade futura; banners publicitários são gerenciados separadamente em Banners e anúncios.
