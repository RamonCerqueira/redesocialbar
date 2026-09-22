---
name: pirambeira-design-system
description: Design system e biblioteca de componentes visuais do app Pirambeira (bar & encontros, tema escuro com dourado/laranja). Use sempre que o usuário pedir para criar, montar ou adaptar uma tela/layout/página do app Pirambeira, ou pedir "no padrão do Pirambeira", "mesmo estilo do app", "nova tela seguindo o layout", mesmo que não cite o nome explicitamente — qualquer pedido de UI dentro deste projeto deve seguir este padrão. Cobre apenas estrutura visual e componentes (cores, espaçamentos, cards, botões, navegação); não define textos/copy fixos — os textos são sempre conteúdo variável fornecido pelo usuário ou por dados reais.
---

# Pirambeira — Design System & Componentes

Este skill define o padrão visual do app Pirambeira para que toda nova tela mantenha consistência com a referência original. Ele especifica **estrutura, cores, espaçamentos e comportamento dos componentes** — nunca defina textos fixos como copy padrão; textos são sempre placeholders ou dados reais fornecidos na hora.

## Quando usar
- Pedido de nova tela, seção ou componente para o app Pirambeira.
- Pedido para "seguir o padrão", "manter consistência", "mesmo estilo".
- Ajuste ou extensão de uma tela existente do projeto.

Se o pedido for uma tela genérica sem relação com este app, não force o uso deste padrão.

## Princípio geral
Tema escuro, noturno, "vida de bar/balada", com acentos em dourado/laranja quente (calor, luz de palco) e toques de vermelho (logo, urgência/trending) e verde (status "ao vivo"). Cantos bem arredondados, cards com borda fina colorida, bastante uso de avatares circulares com anel gradiente indicando presença/status.

---

## 1. Paleta de cores (tokens)

```css
:root {
  /* Fundo */
  --bg-base: #0A0908;        /* fundo geral do app, quase preto com leve tom quente */
  --bg-surface: #17120F;     /* fundo de cards/seções */
  --bg-surface-alt: #1F1712; /* variação de card, levando mais pro marrom escuro */

  /* Marca / gradiente principal (botões, CTA, destaque) */
  --gradient-gold-start: #FFD060;
  --gradient-gold-end: #FF7A1A;
  --brand-gold: #F5A623;

  /* Logo / vermelho de marca */
  --brand-red: #E8432E;
  --brand-red-glow: #FF5A3C;

  /* Status "ao vivo" / online */
  --status-online: #2ED573;

  /* Destaque secundário (anel de story "mais", elementos raros) */
  --accent-purple: #B24BF3;

  /* Texto */
  --text-primary: #FFFFFF;
  --text-secondary: #B8B0AA;   /* cinza quente, subtítulos */
  --text-muted: #7A7168;

  /* Bordas */
  --border-warm: rgba(255, 122, 26, 0.35); /* borda fina laranja em cards */
  --border-subtle: rgba(255, 255, 255, 0.08);
}
```

Regra: **nunca usar cores frias puras** (azul saturado, cinza neutro puro) exceto no selo de verificado (azul pequeno, uso pontual) — tudo deriva da paleta quente acima.

---

## 2. Tipografia
- Fonte: geométrica/arredondada, peso bold para títulos e CTAs (ex.: Poppins, Montserrat ou similar).
- Hierarquia:
  - Título de boas-vindas / destaque: 24–28px, bold, branco ou gradiente dourado.
  - Nome de seção (ex. "STORIES", "O QUE ESTÁ ROLANDO"): 13–14px, bold, uppercase, letter-spacing leve.
  - Corpo/subtítulo: 14–15px, regular, `--text-secondary`.
  - Labels pequenos (nome sob avatar, tag): 12px, medium.
- Links/"ver todos" sempre em `--brand-gold`, sem sublinhado, com seta `→` ao lado.

---

## 3. Componentes

### 3.1 Topbar
- Logo circular (emblema) + nome do app em gradiente vermelho/dourado + subtítulo pequeno com ícone de localização.
- Lado direito: ícones de ação em círculos escuros com borda sutil (busca, notificações). Notificação com badge vermelho (dot) no canto superior direito quando houver pendência.

### 3.2 Banner de boas-vindas (hero card)
- Card grande, cantos arredondados (~20px), borda fina laranja (`--border-warm`), imagem de fundo com overlay escuro (gradiente preto → transparente da esquerda pra direita) para garantir legibilidade do texto à esquerda.
- Conteúdo: emoji/ícone de saudação + título em duas linhas (uma branca, uma em destaque `--brand-gold`) + linha de descrição curta + indicador de status ao vivo (dot verde pulsante + texto) + botão CTA pill no canto inferior direito.
- Botão CTA: gradiente dourado (`--gradient-gold-start` → `--gradient-gold-end`), texto preto bold, ícone à esquerda, formato pill (border-radius total).

### 3.3 Stories (linha horizontal de avatares)
- Scroll horizontal, cada item: avatar circular (~64px) com anel gradiente:
  - Anel dourado/laranja = usuário/bar com conteúdo novo.
  - Anel roxo (`--accent-purple`) = item "ver mais" (contador "+N").
  - Primeiro item = "Seu story" com ícone de "+" sobreposto no canto inferior direito, avatar do próprio usuário.
- Dot verde pequeno no avatar = pessoa online agora.
- Nome abaixo do avatar, centralizado, 12px.
- Cabeçalho da seção com título uppercase + "Ver todos →" alinhado à direita.

### 3.4 Card "Quem está aqui agora" (presença ao vivo)
- Card com borda `--border-warm`, cantos arredondados (~16px).
- Cabeçalho: ícone de grupo + dot verde + texto "NO [LUGAR] AGORA" (verde, bold) e subtítulo com contagem de pessoas + seta `>` à direita (expande/navega).
- Corpo: linha horizontal de avatares médios (~56px) com dot verde, nome abaixo.

### 3.5 Banner promocional (destaque temático, ex. happy hour/evento)
- Card grande com foto de fundo (produto/ambiente) à esquerda, conteúdo textual à direita sobre overlay escuro.
- Selo/tag no topo (ex. "HOJE • horário") em formato pill com borda dourada, fundo transparente.
- Título grande, estilo "impacto" (fonte condensada/brush), cor dourada com leve textura.
- Ícone decorativo (coroa, chama, etc.) posicionado sutilmente no canto.
- Botão CTA pill dourado, mesmo padrão do botão hero.

### 3.6 Linha de ações rápidas (quick actions)
- 3 cards lado a lado, largura igual, fundo `--bg-surface`, borda fina colorida (varia por card: dourado, roxo, vermelho — cada categoria tem sua cor de ícone/badge).
- Cada card: ícone em círculo colorido à esquerda, título bold + subtítulo pequeno cinza, chevron `>` à direita.

### 3.7 Feed / Post card
- Cabeçalho do post: avatar circular do autor + nome bold + selo de verificado (azul, único uso de cor fria) + badge pill opcional (ex. "Oficial", contorno dourado) + tempo + localização em cinza + menu "..." à direita.
- Corpo: texto do post (cor branca/secundária) + hashtags em `--brand-gold`.
- Mídia: imagem full-width, cantos arredondados, abaixo do texto.
- Rodapé: ícones de interação (curtir, comentar, compartilhar) à esquerda com contadores, ícone de salvar à direita. Ícones outline, finos.

### 3.8 Navegação inferior (bottom nav)
- Fundo escuro sólido, borda superior sutil.
- 4 itens fixos + 1 botão de ação flutuante central.
- Item ativo: ícone + label em `--brand-gold`. Itens inativos: ícone + label em `--text-muted`, outline.
- Botão central: círculo elevado (sobe acima da barra), gradiente dourado igual ao CTA, ícone "+" branco/preto, sombra leve para dar efeito de flutuação.

---

## 4. Regras de espaçamento e forma
- Padding externo padrão das seções: 16px.
- Espaço entre seções: 24px.
- Border-radius: cards grandes 20px, cards médios 16px, botões/pills 999px (full), avatares sempre circulares.
- Ícones: estilo outline (stroke), nunca preenchidos sólidos, exceto badges de status (dots).
- Sombras: leves, quentes (tons de preto com leve laranja em glows de destaque), nunca sombra fria/azulada.

---

## 5. Como aplicar este padrão a uma nova tela
1. Identifique quais componentes da seção 3 fazem sentido para o pedido (ex.: uma tela de "Eventos" provavelmente reaproveita o Banner promocional + Feed de posts + Bottom nav).
2. Monte a tela reaproveitando exatamente as specs de cor/forma/espaçamento acima — não invente nova paleta ou novo raio de borda.
3. Troque apenas o conteúdo (textos, imagens, dados) pelo que for relevante ao pedido — mantenha os textos como placeholders claros (`[Título]`, `[Nome do usuário]`) quando o usuário não fornecer o conteúdo real.
4. Gere o resultado como artifact/HTML (ou React, conforme o ambiente) usando os tokens CSS da seção 1 como variáveis reais no código, para que qualquer ajuste de cor futuro seja centralizado.
5. Sempre inclua bottom nav quando a tela for uma tela principal do app (não incluir em modais/telas de detalhe em fullscreen).
