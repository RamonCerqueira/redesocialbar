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
| Equipe e acessos | Exclusivo de Ramon: criar contas institucionais, escolher acesso ao app ou administração do restaurante, consultar pendência de primeiro acesso e redefinir senha de membros |
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

Os itens solicitados de conteúdo, cupons, promoções, ajustes, imagens e cadastro da equipe estão implementados. Não há ainda envio de convites ou recuperação de senha por e-mail, agendamento de publicações, relatórios exportáveis ou integração com vendas/pagamentos. Não foi realizado deploy nesta revisão.

Rate limiting de autenticação é local ao processo; uma implantação com múltiplas instâncias requer armazenamento compartilhado. JWT normal expira em um dia; sessão de primeiro acesso expira em 15 minutos. Troca ou redefinição de senha incrementa a versão da sessão, invalidando os tokens anteriores. Stories expiram da listagem em 24 horas; limpeza física de mídias expiradas deve ser agendada conforme a política de retenção do estabelecimento.

## Primeiro acesso institucional

Ramon (`ramon@pirambeira.com`) é o superadministrador autorizado a criar contas `@pirambeira.com`. Além do papel, a API verifica sua identidade no banco; outros administradores ou superadministradores não podem cadastrar essas contas. As contas podem receber acesso de usuário ou de administrador vinculado ao restaurante selecionado. O cadastro não permite criar outros superadministradores.

Novas contas institucionais usam `Acesso@123` e ficam com `mustChangePassword=true`. O primeiro login leva à criação de uma senha pessoal. Enquanto a troca estiver pendente, o token só acessa `/auth/me` e `/auth/first-access-password`; recursos públicos continuam disponíveis sem privilégios de sessão. A senha inicial não pode ser escolhida como definitiva. Após a troca, a flag é removida e uma nova sessão é emitida. O login seguinte não pede outra troca.

Em **Equipe e acessos**, Ramon pode redefinir a senha de um membro para a senha inicial, obrigando nova troca e revogando sessões existentes. A redefinição não desbloqueia contas suspensas. A própria senha do Ramon deve ser alterada em **Ajustes**. Para uma recuperação operacional autorizada de Ramon, `node scripts/reset-superadmin.cjs --reset` (na pasta backend) redefine explicitamente sua senha e exige primeiro acesso novamente; não execute esse comando em cada inicialização/deploy.

Validação: `pnpm --filter backend test` cobre as regras isoladas. `node scripts/first-access-smoke.cjs`, executado na pasta backend com a API ligada, testa o fluxo HTTP/banco com contas temporárias e as remove ao terminar. Essa verificação pressupõe Ramon já configurado como SUPERADMIN e sem troca pendente; nunca conclui o primeiro acesso real dele.

Chat desativado: não há páginas `/chat` nem módulo HTTP de chat carregado. As tabelas históricas são preservadas, sem apagar mensagens existentes. Matches direcionam ao perfil e ao mural.

## Dados e referência visual

Fotos e números da referência são direção visual, não dados operacionais. Sem conteúdo publicado ou check-ins, o app apresenta estados vazios. Para exibir o banner de promoção na home, crie uma promoção ativa com saldo e validade futura; banners publicitários são gerenciados separadamente em Banners e anúncios.
# Cardápio e galeria do restaurante

As categorias cadastradas em **Cardápio digital** alimentam o menu horizontal do aplicativo. Os produtos usam cards de altura uniforme, duas colunas no celular e três em telas a partir de 640px. A foto ocupa o fundo com degradê escuro; o toque abre imagem e informações completas.

Na página pública, contas autorizadas veem **Editar página do restaurante**, que abre **Ajustes** no estabelecimento correto. Essa área reúne atalhos para categorias/produtos, eventos, promoções e prévia pública. Nome, frase de apresentação, descrição, endereço, telefone, Instagram, horários, capa e logotipo podem ser editados ali. A seção pública **Sobre o restaurante e horários** mostra os dados completos. As fotos dos produtos são enviadas pelo serviço de mídia antes de salvar o cardápio.

As etiquetas **2X** e **HOJE** podem ser combinadas. 2X significa dobrado; HOJE deve ser retirada pelo administrador ao encerrar a oferta. As duas têm prioridade no card compacto, e os demais selos continuam disponíveis nos detalhes.

Em **Ajustes → Galeria de fotos do restaurante**, envie, ordene ou remova até 20 fotos e clique em **Salvar galeria**. As fotos aparecem sem legendas na faixa acima do cardápio. Somente superadministradores e gestores autorizados do estabelecimento podem alterar a galeria. As imagens usam o upload existente (JPEG, PNG ou WebP, até 5 MB); os endereços e a ordem são persistidos no Supabase.

DE AGORA não tem botão “Ver todos”. Carrega todas as páginas de momentos ativos, respeitando privacidade e bloqueios. Momentos vistos ficam no fim da faixa; o histórico é local a este navegador e separado por conta.
