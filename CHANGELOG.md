# Changelog

Este projeto segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- Sessão do painel web agora persiste em Redis (`connect-redis`) em vez do `MemoryStore` padrão
  do `express-session` — sobrevive a redeploys e deixa de ser um bloqueador pra rodar mais de uma
  réplica do bot. Novo serviço `redis` no `docker-compose.yml` e nova env var `REDIS_PASSWORD`
  (o `bot` monta a `REDIS_URL` completa a partir dela).
- `helmet` (headers de segurança — CSP, `X-Content-Type-Options`, remove `X-Powered-By`, etc.) e
  `express-rate-limit` (`/auth/login` e `/api/queue/*`) no painel web — nenhum dos dois existia
  antes. `img-src` da CSP libera qualquer `https:` de propósito, já que capas de faixa e avatares
  do Discord vêm de vários CDNs externos diferentes.
- Endpoint `GET /healthz` (fora de sessão/autenticação) reportando se o bot está conectado ao
  Discord, e healthcheck correspondente no serviço `bot` do `docker-compose.yml` (só o `lavalink`
  tinha um até agora).
- Log de capacidade do node Lavalink a cada 5 minutos (players tocando, CPU do sistema e do
  Lavalink) — sinal pra saber quando vale a pena escalar pra múltiplos nodes; passo a passo
  documentado em [DEPLOYMENT.md](DEPLOYMENT.md).
- Painel web: botão "mover para o topo da fila" em cada faixa, pra pular direto pra posição 0 sem
  precisar de vários cliques em "mover para cima" — via novo endpoint
  `POST /api/queue/move-to-top`.
- Painel web: tela de login redesenhada com arte de fundo (`public/login-hero.jpg`) em vidro
  fosco — cor original preservada (só escurecida via scrim), não o tratamento grayscale usado no
  resto do painel. Botão "Entrar com Discord" no azul oficial da marca (#5865F2, "blurple").
- Painel web: fundo ambiente colorido (`public/app-background.jpg`) na tela pós-login, bem
  escurecido atrás dos cards de vidro — única parte do painel que foge do preto-e-branco de
  propósito.
- Logo oficial do projeto (emblema de onda + wordmark) aplicado em todo o projeto: favicon
  completo (`favicon.ico`, PNGs 16/32, `apple-touch-icon.png`, ícones 192/512 +
  `site.webmanifest` pra "adicionar à tela inicial"), marca no topbar e no card de login do
  painel web, meta tags Open Graph/Twitter Card (`og:image`/`twitter:image`) pra preview ao
  compartilhar o link, e banner no topo do README.
- Fonte [Audiowide](https://fonts.google.com/specimen/Audiowide) (SIL OFL) auto-hospedada
  (`public/fonts/audiowide.woff2`, sem CDN de terceiro) aplicada só no wordmark "Marola Beat"
  (topbar e card de login) — combina com o estilo futurista/eletrônico do logo novo.
- Fonte [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (SIL OFL, variável,
  também auto-hospedada) em todo o resto do texto de UI do painel, no lugar da fonte de sistema —
  mantém o caráter técnico do wordmark sem sacrificar legibilidade em texto corrido.
- Painel web: feedback de erro inline ao falhar em adicionar uma música (sem resultados, canal
  indisponível, etc.) — antes o spinner só parava sem dizer o motivo.
- Painel web: ícone de volume muda pra "mudo" quando o volume está em 0%.
- Painel web: popover de volume agora fecha com `Esc` (devolvendo o foco pro botão), além de
  clique fora.
- Painel web: suporte a múltiplos servidores — quem tiver o bot em mais de um servidor em comum
  escolhe qual gerenciar numa tela logo depois do login (`GET /api/guilds` lista a interseção
  entre os servidores do usuário e os do bot, `POST /api/guilds/select` define o servidor ativo na
  sessão), com um botão "trocar servidor" no topbar pra voltar à seleção a qualquer momento.

### Alterado

- "Pedido por" (no `/play`, `/nowplaying`, `/queue` e no painel web) agora mostra o apelido do
  servidor/nome de exibição (`GuildMember.displayName`) em vez do @username da conta Discord —
  passamos a guardar o `GuildMember` como requester da faixa em vez do `User` global.
- Painel web: o nome no topbar também mostra o apelido do servidor/nome de exibição em vez do
  @username — `auth.ts` virou uma factory (`createAuthRouter(client)`, como o `queue-routes.ts`)
  pra poder resolver o `GuildMember` no `/api/me`.
- Painel web: a capa da faixa em "Tocando agora" e a thumbnail da faixa "a seguir" na fila voltam
  a mostrar a cor original (a "a seguir" escurecida) — as demais thumbnails da fila continuam em
  preto-e-branco.
- Painel web: título e metadados da faixa (autor/duração/quem pediu) ganham `title=""` — passar o
  mouse mostra o texto completo quando fica truncado.
- `Dockerfile`: imagem base `node:22-alpine` → `node:24-alpine` (LTS atual); CI também atualizado
  para rodar em Node 24.
- Login OAuth2 do painel web passou a pedir o escopo `guilds` além de `identify`, necessário pra
  listar os servidores em comum do usuário (suporte a múltiplos servidores); a variável de
  ambiente `WEB_GUILD_ID` (servidor único fixo) foi removida — o servidor ativo agora vem da
  sessão (`selectedGuildId`), escolhido na tela de seleção ou o único disponível quando há só um.

### Removido

- Dois ícones do painel web que nunca chegaram a ser usados (`log-in`, `loader-circle`).

## [3.0.0] - 2026-08-02

### Adicionado

- Comandos `/volume`, `/remove`, `/clear`, `/previous`, `/seek` e `/leave`, fechando a paridade de
  controles com o painel web.
- Painel web: barra de progresso clicável (pula pra posição), slider de volume, botões de faixa
  anterior e sair do canal, e "Limpar fila" — via novos endpoints
  `POST /api/queue/{previous,clear,volume,seek,leave}`.
- Painel web: gerenciamento completo da fila (pausar/retomar, pular, remover, reordenar) com
  player ao vivo mostrando a faixa atual e progresso.
- Autenticação OAuth do YouTube (`youtube-source` plugin) para contornar bloqueios de busca do
  YouTube em IPs de datacenter — veja "Autenticação OAuth do YouTube" em
  [DEPLOYMENT.md](DEPLOYMENT.md).
- `SECURITY.md` (política de disclosure de vulnerabilidades) e `CODE_OF_CONDUCT.md` (Contributor
  Covenant).
- `public/favicon.svg` para o painel web (não existia nenhum antes).
- Opção `topo` no `/play` e botão "tocar a seguir" no painel web, pra inserir uma música no topo
  da fila (toca em seguida) em vez do final.
- Painel web: tela de login ganhou uma lista dos recursos disponíveis (busca, fila em tempo real,
  acesso restrito ao canal de voz) e o botão "Entrar com Discord" passou a usar a marca oficial do
  Discord em vez de um ícone genérico.
- Painel web: a próxima faixa da fila (a que toca depois da atual) tem destaque visual — selo "A
  seguir", thumbnail maior e borda.

### Alterado

- Painel web: redesign visual completo — ícones SVG inline do [Lucide](https://lucide.dev) no
  lugar de emojis, micro-interações e suporte a `prefers-reduced-motion`. Sem mudança de
  comportamento ou de endpoints, e sem build step novo.
- Painel web: paleta final em preto e branco estilo pôster (capa da faixa em full-bleed
  dessaturada, botão de play/pause circular, título grande uppercase), substituindo a versão
  intermediária com accent violeta→ciano.
- Painel web: volume vira um ícone que abre um popover só ao clicar (nada acontece no hover), em
  vez de um slider sempre visível ocupando espaço — segue o padrão usado por players como Spotify e
  Apple Music.
- Volume máximo agora é 100% (era 200%) no `/volume` e no painel — acima disso o Lavalink amplifica
  o áudio digitalmente e distorce.
- Badges do README (Conventional Commits, Prettier, versão do discord.js, PRs Welcome).
- **Breaking:** migração de `discord-player` (engine de voz própria via `discord-voip`) para
  [Lavalink](https://lavalink.dev) v4 (via `lavalink-client`), depois de conexões de voz feitas
  direto do processo do bot se mostrarem pouco confiáveis em produção. A conexão UDP com o Discord
  e a transcodificação de áudio agora acontecem no serviço `lavalink` (novo, em
  `docker-compose.yml`), não no processo do bot.
- **Breaking (config):** nova variável de ambiente obrigatória — `LAVALINK_PASSWORD`. Veja
  `.env.example` e [DEPLOYMENT.md](DEPLOYMENT.md).
- Removidas as dependências `discord-player`, `@discord-player/extractor`,
  `discord-player-youtubei` e `youtube-dl-exec`; adicionada `lavalink-client`.
- `Dockerfile` não instala mais `ffmpeg` (o Lavalink cuida da transcodificação em seu próprio
  container).

### Corrigido

- Painel web: card "Tocando agora" não pisca mais a cada atualização de 4s — era uma animação de
  entrada nos cards que replay a cada poll, já que `renderQueue()` reconstrói o DOM inteiro.
- Painel web: popover de volume não fecha mais sozinho enquanto o usuário está mexendo nele (mesma
  causa: estado perdido a cada poll).
- Painel web: faltava o ícone `plus` no mapa de ícones do Lucide — o botão "Adicionar" ficava com
  um quadrado vazio, sem ícone.

## [2.1.0] - 2026-07-30

### Adicionado

- Painel web (`src/web/`) para gerenciar a fila de reprodução: login via Discord OAuth2, listar
  fila, adicionar música e reordenar arrastando (só troca com a posição vizinha).
- Acesso ao painel restrito a quem está no momento no mesmo canal de voz que o bot
  (`requireVoiceMember`, checado a cada requisição via `guild.voiceStates.cache`).
- Frontend estático em `public/` (HTML/CSS/JS puro, sem build step).

### Alterado

- **Breaking (config):** novas variáveis de ambiente obrigatórias — `DISCORD_CLIENT_SECRET`,
  `WEB_GUILD_ID`, `PUBLIC_URL`, `SESSION_SECRET`. Veja `.env.example` e [DEPLOYMENT.md](DEPLOYMENT.md).
- O container agora expõe a porta `3000` (painel web); o deploy no Coolify precisa de um domínio
  atribuído (antes era um worker sem porta nenhuma).

## [2.0.0] - 2026-07-30

### Alterado

- Reescrita completa do bot (antes [Marola-Beat V1](https://github.com/Samurai33/Marola-Beat)):
  estrutura modular (`config/`, `lib/`, `types/`, `commands/`), tipagem forte de ponta a ponta e
  remoção de dependências não utilizadas.
- Atualização para `discord-player` v7.2 (extractors via `loadMulti`, `mediaplex` embutido no
  lugar de `@discordjs/opus`/`opusscript`).
- Mensagens do bot padronizadas em português.

### Adicionado

- Validação de variáveis de ambiente na inicialização (`src/config/env.ts`).
- Logger com níveis (`debug`/`info`/`warn`/`error`).
- Encerramento gracioso em `SIGINT`/`SIGTERM`.
- Registro de comandos global ou por guild (`GUILD_ID` opcional).
- Dockerfile multi-stage e `docker-compose.yml` prontos para deploy no Coolify.
- CI (lint, typecheck, build) e templates de issue/PR no GitHub.
- `.claude/skills` para tarefas recorrentes do projeto.

## [1.0.0] - 2025-09-17

Versão inicial (V1): comandos básicos de música com discord.js v14 e discord-player v7.1.
