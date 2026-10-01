# Mensagens, cupons e aceite

As novas respostas ao De Agora são mensagens de uma conversa privada entre quem respondeu e o autor. A notificação abre `/chat/<id>`, com a imagem de origem e o histórico completo. O menu Mais → Mensagens permite voltar às conversas. Respostas antigas ficam legíveis em Mensagens; o sistema anterior só guardava o corpo da notificação e não registrava o identificador do story, por isso não é possível reconstruir esse vínculo com segurança.

As conversas continuam acessíveis aos participantes depois das 24 horas de exibição pública do De Agora. O acesso à conversa exige autenticação e participação; bloqueios impedem novas mensagens. Nenhuma resposta é um comentário público.

Promoções → Meus cupons lista os resgatados, utilizados e expirados da conta autenticada, incluindo ofertas encerradas. A equipe confirma o uso no painel administrativo. O usuário não pode marcar um cupom como utilizado por conta própria.

As três ofertas iniciais estão explicitamente identificadas como DEMONSTRAÇÃO, sem valor comercial. Devem ser substituídas por ofertas aprovadas pelo estabelecimento antes de uso comercial. Não foram inventados resgates nem utilizações para usuários reais.

O aceite é solicitado no cadastro. A entrada no aplicativo não apresenta mais o diálogo automático. Os registros de aceite anteriores são preservados e não são fabricados para contas antigas. Termos, privacidade e solicitações continuam disponíveis na central de privacidade. Os documentos ainda usam responsável fictício e são minutas de demonstração.

Estas mudanças reutilizam Conversation, Message, Notification e Coupon, sem alteração de schema nem migração. Atualização na VPS: `sudo /usr/local/sbin/pirambeira-update`. Os caminhos e procedimentos completos estão em `docs/ATUALIZACAO-VPS.md`.
