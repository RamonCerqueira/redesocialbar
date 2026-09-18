# Política de Privacidade e Proteção de Dados (LGPD) - Tô no Piramba

## 1. Compromisso de Privacidade por Padrão (*Privacy by Design*)

A arquitetura do **Tô no Piramba** foi concebida desde o primeiro rascunho em estrita conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)** do Brasil.

Reconhecemos a sensibilidade de dados que envolvem vida noturna, hábitos de consumo e dinâmicas afetivas. Por essa razão, a plataforma aplica proteções automáticas superiores às de redes sociais generalistas.

---

## 2. Tratamento de Localização e Presença Física

### 2.1 Não Rastreamento Contínuo
* O Tô no Piramba **NUNCA** rastreia o usuário em segundo plano (*background tracking*).
* A localização geográfica do usuário é consultada **única e exclusivamente no instante em que o usuário clica no botão "Fazer Check-in"**.
* O aplicativo apenas valida se o usuário está dentro do raio aproximado do estabelecimento (ex: 200 metros do Restaurante Pirambeira na Pituba).

### 2.2 Anonimização de Coordenadas
* As coordenadas GPS exatas (latitude e longitude decimais) **NUNCA** são exibidas a outros usuários ou expostas em payloads de API pública.
* A API calcula internamente a distância aproximada ou apenas atesta a condição booleana de presença no estabelecimento.

### 2.3 Expiração Automática de Presença
* O status de presença no bar possui expiração automática configurada para 4 horas a contar do check-in.
* Após esse período, o status transita para `EXPIRED` e o perfil do usuário é removido imediatamente da lista pública *"Quem está aqui agora?"*.
* O usuário pode clicar em `Encerrar Presença` a qualquer momento para sair da lista imediatamente.

---

## 3. Mural da Paquera e Discrição Afetiva

* **Double Opt-in Silencioso**: Demonstrar interesse em um frequentador no bar (`Interesse`) é um ato 100% confidencial. O perfil de destino **NUNCA** recebe uma notificação dizendo *"Fulano teve interesse em você"*.
* Apenas se ambas as partes manifestarem interesse mútuo no mesmo período de presença física no estabelecimento é que o sistema declara o evento **"✨ Deu Match!"** e abre o canal de conversa privativo.
* Qualquer usuário pode desativar permanentemente sua visibilidade no radar da paquera através da opção `Participar do Radar da Paquera: Desativado` nas preferências do perfil.

---

## 4. Direitos dos Titulares de Dados (Art. 18 da LGPD)

Os usuários do Tô no Piramba gozam de total controle sobre suas informações:

1. **Acesso e Confirmação**: O usuário visualiza diretamente em seu perfil todos os dados cadastrados, histórico de check-ins e publicações.
2. **Correção de Dados Incompletos ou Inexatos**: Edição livre de nome social, biografia, fotos de capa e avatar.
3. **Portabilidade de Dados**: Possibilidade de solicitar a exportação de todas as publicações, conversas e mídias em formato JSON estruturado.
4. **Eliminação Definitiva (Direito ao Esquecimento)**: A qualquer momento o usuário pode solicitar a exclusão de sua conta. Todos os dados pessoais, tokens e hashes de senha são permanentemente apagados do banco relacional via deleção em cascata (`CASCADE`).

---

## 5. Medidas Técnicas de Segurança da Informação

* **Criptografia em Repouso**: Senhas armazenadas com hash irreversível de alto custo computacional (`bcryptjs` com sal individualizado).
* **Criptografia em Trânsito**: Todas as requisições web trafegam sob protocolo HTTPS/TLS 1.3 obrigatório com cabeçalhos HSTS ativos.
* **Isolamento de Tenant**: Mecanismos de guarda no backend garantem que dados gerenciais de um estabelecimento não possam ser acessados por outros estabelecimentos.
* **Logs de Auditoria**: Ações de moderação administrativa registram carimbo de tempo e identificador de auditoria para fins de conformidade legal.
