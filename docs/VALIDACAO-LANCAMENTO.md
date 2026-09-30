# Validação para lançamento — 29/09/2026

## Resultado e alcance

Revisão local do aplicativo Next.js/NestJS, com persistência Prisma/Supabase. A publicação na VPS e o domínio ficaram para uma próxima etapa, conforme orientação do responsável. Este relatório não certifica todos os botões em todos os dispositivos.

## Verificações executadas

- Backend: compilação aprovada e 38 testes automatizados aprovados. Outros 19 testes legados exigem `TEST_DATABASE_URL` e foram ignorados; não são contabilizados como aprovados.
- API/banco: 51 verificações HTTP aprovadas, com dados temporários removidos ao concluir. Cobrem permissões administrativas, isolamento entre restaurantes, upload e recuperação de imagens, publicações e botões oficiais, privacidade, bloqueios, check-ins simultâneos, preferências de paquera, encontros, promoções, estoque e validação concorrente de cupons, banners, eventos, configurações, De Agora, denúncias e RLS.
- Galeria: 12 verificações de integração aprovadas na etapa anterior desta revisão.
- Frontend: build de produção aprovado. Lint sem erros, com 184 avisos de manutenção na versão verificada (tipagem, imagens, variáveis e hooks).
- Navegador: cardápio, filtros por categoria, detalhes do produto, galeria, espaçamento móvel, três colunas em telas maiores, menu “Mais”, recuperação da página de promoções após indisponibilidade da API, bloqueio anônimo do painel administrativo, redirecionamento do primeiro acesso sem sessão e página 404 de `/chat`.
- Última correção da tela de publicação: exige login e mostra o estado real do check-in. Não utiliza mais coordenadas fictícias no check-in do restaurante.

## Correções desta revisão

- Bloqueios entre usuários passam a valer também para seguir, curtir, comentar, recados, matches e encontros.
- Contas inativas e perfis privados não aparecem indevidamente nos fluxos sociais públicos.
- Resposta a comentário valida a publicação original; preferências de recebimento de paquera são respeitadas.
- Check-ins simultâneos mantêm uma única presença ativa; encontros no passado são recusados.
- Entrada inválida de reação/tipo de feed retorna erro de validação. Cardápios e horários malformados são recusados antes de salvar.
- Telas de carregamento exibem erro e opção de tentar novamente. Páginas de erro e endereço inexistente têm saída para o aplicativo.
- Endpoint `/api/health` verifica a conexão com o banco sem expor informações internas.
- Metadados, sitemap e robots deixam de usar domínio fixo. Zoom do navegador permitido.
- Build de conferência usa `.next-check` para evitar conflito com o servidor de desenvolvimento. O script de lint funciona com a configuração atual do projeto.

## Conteúdo pendente no painel

A auditoria encontrou 7 produtos, todos sem fotos; galeria vazia; telefone, descrição e horários ainda não preenchidos. O administrador pode editar esses itens em Configurações e Cardápio. Usar fotos e informações reais, sem inventar conteúdo para preencher a página.

## Antes da publicação pública

1. Configurar VPS, domínio, HTTPS, variáveis de produção do frontend/backend e origens permitidas. As URLs de mídia devem apontar para a API pública antes dos uploads definitivos.
2. Definir rotina de backup, reinício dos processos e monitoramento de `/api/health`.
3. Preencher conteúdo real e conferir preço, fotos, horários e contatos no painel.
4. Fazer homologação final no domínio público com celular físico (Android/iOS), câmera, permissões, upload e navegação. Responsividade em navegador não substitui esse teste.
5. Confirmar procedimento de recuperação de conta: não há envio automático de recuperação por e-mail implementado nesta revisão.

O primeiro acesso pessoal de Ramon não foi concluído pelos testes. Os testes de troca obrigatória utilizam contas temporárias.

## Repetir as verificações

Na raiz: `node frontend/scripts/build-check.cjs` e `pnpm --filter frontend lint`.

No backend: `pnpm build`, `pnpm test`, `node scripts/api-smoke.cjs` (API local em execução) e `node scripts/release-audit.cjs`. O smoke cria registros temporários no banco configurado e os remove ao final; o audit é somente leitura. Não executar testes de carga no banco público com usuários ativos.
