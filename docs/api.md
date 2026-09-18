# Especificação da API RESTful - Tô no Piramba

A API do **Tô no Piramba** é construída com o framework **NestJS 11+**, seguindo padrões RESTful rigorosos, tipagem estrita com DTOs validados via `class-validator`, autenticação via **JWT Bearer Token** e controle de acesso baseado em papéis (**RBAC**).

URL Base de Desenvolvimento: `http://localhost:3001/api`

---

## 1. Módulo de Autenticação (`/auth`)

### `POST /auth/register`
Cadastra um novo frequentador.
* **Acesso**: Público
* **Payload**:
  ```json
  {
    "name": "Mariana Souza",
    "email": "mariana@exemplo.com",
    "username": "mariana_ssa",
    "password": "Password@123",
    "city": "Salvador, BA",
    "bio": "Amante de chopp artesanal e samba de roda",
    "interests": ["Samba", "Gastronomia", "Cerveja"]
  }
  ```
* **Resposta (201 Created)**: Retorna os dados cadastrais e o token JWT.

### `POST /auth/login`
Autentica o usuário e gera o token de sessão.
* **Acesso**: Público
* **Payload**:
  ```json
  {
    "email": "mariana@exemplo.com",
    "password": "Password@123"
  }
  ```
* **Resposta (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "name": "Mariana Souza",
      "email": "mariana@exemplo.com",
      "role": "USER",
      "profile": {
        "username": "mariana_ssa",
        "avatarUrl": "https://images.unsplash.com/..."
      }
    }
  }
  ```

---

## 2. Módulo de Check-in & Presença (`/check-ins`)

### `POST /check-ins`
Realiza check-in no estabelecimento (duração padrão de 4h).
* **Acesso**: Autenticado (`USER`)
* **Payload**:
  ```json
  {
    "restaurantSlug": "pirambeira",
    "approxLatitude": -13.0031,
    "approxLongitude": -38.4554
  }
  ```
* **Resposta (201 Created)**: Dados do check-in ativo com timestamp de expiração.

### `GET /check-ins/here/:restaurantSlug`
Retorna a listagem de frequentadores presentes no momento (*"Quem está aqui agora?"*).
* **Acesso**: Autenticado
* **Filtros (Query Params)**:
  * `filter`: `all` | `friends` | `flirt` | `new`
* **Resposta (200 OK)**: Lista de perfis ativos, excluindo usuários em modo invisível ou bloqueados.

### `POST /check-ins/checkout`
Encerra a presença ativa no bar antes do tempo de expiração.
* **Acesso**: Autenticado

---

## 3. Módulo Social e Feed (`/posts`)

### `GET /posts`
Lista publicações do feed ordenadas cronologicamente.
* **Acesso**: Autenticado
* **Query Params**: `restaurantSlug=pirambeira&page=1&limit=15&type=FEED`
* **Resposta (200 OK)**: Lista de posts com autor, fotos, contagem de curtidas, reações do usuário logado e comentários recentes.

### `POST /posts`
Cria uma nova publicação no feed.
* **Acesso**: Autenticado
* **Payload**:
  ```json
  {
    "restaurantSlug": "pirambeira",
    "caption": "Mesa cheia e chopp trincando no Piramba! 🍻",
    "type": "FEED",
    "mediaUrls": [
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34"
    ]
  }
  ```

### `POST /posts/:id/react`
Envia ou altera uma reação em uma publicação.
* **Payload**: `{ "type": "CHEERS" }` (opções: `LIKE`, `HEART`, `CHEERS`, `FIRE`).

### `POST /posts/:id/comments`
Adiciona um comentário no post.
* **Payload**: `{ "content": "Que delícia! Qual o petisco?" }`

---

## 4. Mural da Paquera & Radar Discreto (`/flirt`)

### `GET /flirt/notes/:restaurantSlug`
Retorna as notas bem-humoradas e descontraídas afixadas no mural físico do bar.
* **Acesso**: Autenticado

### `POST /flirt/notes`
Publica um bilhete anônimo ou assinado no mural da paquera.
* **Payload**:
  ```json
  {
    "restaurantSlug": "pirambeira",
    "content": "Para a pessoa de camisa listrada na mesa 14: seu sorriso iluminou o samba de hoje!",
    "tableNumber": "14",
    "isAnonymous": false
  }
  ```

### `POST /flirt/interest`
Demonstra interesse discreto em outro frequentador presente.
* **Payload**: `{ "toUserId": "uuid-v4", "restaurantSlug": "pirambeira" }`
* **Mecânica**:
  * Se a outra pessoa **não** demonstrou interesse: armazena silenciosamente (`status: PENDING`). O alvo não é notificado da identidade.
  * Se a outra pessoa **já demonstrou** interesse: dispara o evento **"✨ Deu Match!"**, cria a conversa privada no chat e notifica ambos.

---

## 5. Mesas & Encontros Comunitários (`/meetups`)

### `GET /meetups/:restaurantSlug`
Lista os encontros e mesas abertas do dia.
* **Resposta (200 OK)**: Mesas com título, anfitrião, hora de início, número de participantes confirmados e limite de vagas.

### `POST /meetups`
Cria uma mesa aberta.
* **Payload**:
  ```json
  {
    "restaurantSlug": "pirambeira",
    "title": "Mesa Tech & Cerveja Artesanal",
    "description": "Bater papo sobre startups e tecnologia tomando um chopp gelado.",
    "time": "19:30",
    "maxParticipants": 8
  }
  ```

### `POST /meetups/:id/join`
Confirma presença na mesa.

---

## 6. Eventos Oficiais da Casa (`/events`)

### `GET /events/:restaurantSlug`
Consulta a programação musical, esportiva e cultural oficial do restaurante.

### `POST /events/:id/rsvp`
Confirma interesse ou presença (`GOING` ou `INTERESTED`).

---

## 7. Promoções & Cupons de Happy Hour (`/promotions`)

### `GET /promotions/:restaurantSlug`
Lista as ofertas ativas configuradas pelo estabelecimento.

### `POST /promotions/:id/claim`
Resgata um cupom de desconto exclusivo (gera o código único `PIRAMBA-XXXX-YYYY`).

### `POST /promotions/validate`
Validação de cupom pelo garçom ou recepcionista do restaurante.
* **Acesso**: Exclusivo equipe (`RESTAURANT_ADMIN`, `STAFF`)
* **Payload**: `{ "code": "PIRAMBA-HAPPY-7892", "restaurantSlug": "pirambeira" }`

---

## 8. Chat Seguro 1-on-1 (`/chat`)

### `GET /chat/conversations`
Retorna as conversas ativas do usuário logado (geradas por Match mútuo ou Encontros).

### `GET /chat/conversations/:id/messages`
Histórico de mensagens de uma conversa específica.

### `POST /chat/conversations/:id/messages`
Envia mensagem de texto com confirmação de entrega em tempo real.

---

## 9. Moderação & Segurança Comunitária (`/moderation`)

### `POST /moderation/reports`
Registra uma denúncia contra postagem, comentário ou comportamento inadequado de frequentador.
* **Payload**:
  ```json
  {
    "targetType": "POST",
    "targetId": "uuid-v4",
    "reason": "Comportamento ofensivo / assédio",
    "details": "Mensagem desrespeitosa enviada no mural."
  }
  ```

### `POST /moderation/blocks`
Bloqueia um usuário permanentemente, impedindo qualquer visualização recíproca na plataforma.

### `GET /moderation/admin/reports`
Painel de auditoria e resolução de denúncias para moderadores e gestores.

---

## 10. Painel Administrativo do Bar (`/admin`)

### `GET /admin/:restaurantSlug/dashboard`
Retorna os indicadores em tempo real:
* Total de pessoas presentes no momento.
* Média de tempo de permanência por cliente.
* Cupons resgatados vs. utilizados hoje.
* Publicações mais engajadas do feed da casa.
* Histórico de picos de presença por horário.