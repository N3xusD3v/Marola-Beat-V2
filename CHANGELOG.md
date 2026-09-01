# Changelog

Este projeto segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado

- Fallback pro Tidal (busca, via plugin LavaSrc) quando o SoundCloud não acha a faixa —
  `searchWithFallback` em `src/lib/search.ts`, usado por `/play` e `POST /api/queue/add`. O Tidal
  não toca áudio diretamente no Lavalink (só metadado); a reprodução é espelhada pro Deezer.
  Requer as env vars opcionais `TIDAL_TOKEN`, `DEEZER_ARL` e `DEEZER_MASTER_DECRYPTION_KEY` —
  `plugins.lavasrc.sources.tidal`/`.deezer` começam desativados em
  `lavalink/application.yml` até essas três serem cadastradas, ver "Fallback pro Tidal via Deezer"
  em [DEPLOYMENT.md](DEPLOYMENT.md).
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
- Política de Privacidade (`/privacy`) e Termos de Uso (`/terms`) — páginas estáticas do painel
  web, linkadas no rodapé da tela de login. Pré-requisito pra verificação do bot em 100+
  servidores no Discord Developer Portal. `express.static` ganhou `extensions: ['html']` pra
  servir essas URLs sem o sufixo `.html`.
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
- Testes automatizados com [Vitest](https://vitest.dev): `npm test` cobre as funções puras de
  `src/lib/format.ts` (`formatDuration`, `parseTimeToMs`), `src/lib/embeds.ts` (`requesterName`) e
  o novo `src/web/body-fields.ts` (`stringField`/`numberField`/`booleanField`, extraídos de
  `queue-routes.ts` pra poder ser testados sem depender de `config/env.ts`). CI passa a rodar
  `npm test` em todo PR.
- Painel administrativo (`/admin`), restrito a um único usuário Discord (`ADMIN_DISCORD_ID`, novo
  em `config/env.ts` — vem com um padrão embutido pra não travar o boot antes de a env var existir
  no Coolify): lista todos os servidores onde o bot está (nome, ícone, nº de membros, data de
  entrada e última atividade), com um botão pra removê-lo de um servidor (`guild.leave()`), e
  lista quem já logou/usou o painel (nº de logins, primeiro/último login) — sessões abertas antes
  desta feature existir também aparecem, já que o middleware de fila (`queue-routes.ts`) atualiza
  o registro do usuário (sem contar como login novo) em toda requisição autenticada, não só no
  callback OAuth2. Novo `src/lib/admin-store.ts` guarda esse histórico em hashes no mesmo Redis da
  sessão — sem banco de dados novo. `GET /api/me` passa a expor `isAdmin` pro frontend mostrar o
  link no topbar (`public/admin.html`/`admin.js`/`admin.css`) só pra quem tem acesso. Lista de
  usuários e "última atividade" de cada servidor mostram o apelido/nome de exibição do servidor
  (`GuildMember.displayName`, resolvido do cache pra não bater na API REST do Discord a cada poll
  de 4s) em vez do @username da conta — mesmo motivo do requester da fila e do topbar principal.

### Alterado

- Arte de fundo da tela de login (`public/login-hero.jpg`) trocada por uma nova ilustração —
  convertida de PNG (2,7MB) pra JPEG qualidade 85 (~380KB) pra manter o tempo de carregamento,
  já que a imagem é pré-carregada com `fetchpriority="high"`.
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
- `npm run build` passa a usar `tsconfig.build.json` (que estende `tsconfig.json` excluindo
  `*.test.ts`) em vez de `tsconfig.json` direto — sem isso os arquivos de teste seriam compilados
  pra `dist/` junto com o resto; `npm run typecheck` continua na `tsconfig.json` original e cobre
  os testes normalmente.

### Corrigido

- Painel web: o nome/apelido no topbar não atualizava depois de selecionar ou trocar de
  servidor (só depois de recarregar a página inteira) — `/api/me` já resolvia o apelido certo
  pro servidor selecionado, mas o topbar continuava mostrando o @username porque só era
  renderizado uma vez, no carregamento inicial, antes de qualquer servidor ser escolhido.
  `selectGuild()` agora rebusca `/api/me` e re-renderiza o topbar depois de toda seleção.
- Reprodução do YouTube voltando a falhar em produção (`AllClientsFailedException` / "This video
  requires login" pra todo mundo) mesmo com um `YOUTUBE_OAUTH_REFRESH_TOKEN` válido e renovando
  com sucesso (`YouTube access token refreshed successfully` no log do `lavalink`) — o log também
  mostrava `OAuth has been enabled without registering any OAuth-compatible clients`: nenhum dos
  clients configurados em `plugins.youtube.clients` (`lavalink/application.yml`) de fato usa OAuth
  pra tocar nessa versão do plugin (`youtube-plugin:1.18.2`) além do client `TV`, que não estava na
  lista. Token válido, mas nunca usado numa tentativa real de tocar. Corrigido adicionando `TV` à
  lista de clients — ver [DEPLOYMENT.md](DEPLOYMENT.md) pra esse failure mode específico.
- Reprodução do YouTube continuando a falhar mesmo depois do `TV` acima corrigir o OAuth — dessa
  vez com `Must find sig function from script: ...` no log (o client `TV`/OAuth passava a ser
  tentado normalmente, mas falhava num passo diferente: extrair a função de assinatura do player
  script do YouTube, que muda de formato com frequência e quebra a extração local do plugin —
  problema conhecido e rastreado em
  [lavalink-devs/youtube-source#225](https://github.com/lavalink-devs/youtube-source/issues/225)).
  Corrigido configurando `plugins.youtube.remoteCipher` em `lavalink/application.yml` pra delegar
  essa extração pro servidor remoto público [yt-cipher](https://github.com/kikkia/yt-cipher)
  (`cipher.kikkia.dev`, mantido ativamente pelo autor do plugin), em vez de depender da lib local.
- **Importante pra quem for mexer em `lavalink/application.yml` de novo**: o Coolify não
  re-sincroniza esse arquivo do repositório a cada deploy — ele vira um recurso de "Persistent
  Storage" próprio do Coolify na primeira detecção, e passa a ignorar mudanças via git a partir
  daí. As duas correções acima só passaram a valer depois de colar o conteúdo novo manualmente em
  **Configuration → Persistent Storage → Files** no Coolify. Ver [DEPLOYMENT.md](DEPLOYMENT.md)
  pro passo a passo — essa é provavelmente a causa de qualquer mudança "sumida" nesse arquivo no
  futuro.
- Reprodução do YouTube voltando a falhar em produção mesmo com `TV` na lista de clients e
  `remoteCipher` configurado (as duas correções acima) — dessa vez com `AllClientsFailedException`
  em **todos** os clients configurados ao mesmo tempo (`TV`: "The page needs to be reloaded";
  `WEB`: "No supported audio streams available"), bug aberto sem correção upstream
  ([lavalink-devs/youtube-source#226](https://github.com/lavalink-devs/youtube-source/issues/226)).
  Não é problema de credencial — o OAuth renovava o token normalmente. Corrigido desativando
  `plugins.youtube.enabled`/`youtubeSearchEnabled` em `lavalink/application.yml` e trocando
  `defaultSearchPlatform` pra `'scsearch'` em `src/lib/lavalink.ts` (sem essa segunda mudança,
  toda busca sem prefixo/URL lançava `Lavalink Node has not 'youtube' enabled` antes mesmo de
  chegar no Lavalink, quebrando `/play` e o painel web). Reative os dois junto quando confirmar
  que uma versão nova do plugin corrigiu a #226.
- Painel admin não mostrava o apelido/nome de exibição do servidor em Usuários (sempre caía pro
  @username) — a atividade de fila resolvia o apelido só via `guild.members.cache`, que fica quase
  sempre vazio porque o bot não tem o intent `GuildMembers` (ver `src/index.ts`). Corrigido usando
  `guild.members.fetch()` como fallback quando não está em cache, mesmo padrão já usado em
  `POST /api/queue/add` e `GET /api/me`.

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
