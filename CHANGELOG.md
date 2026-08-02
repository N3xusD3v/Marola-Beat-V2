# Changelog

Este projeto segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
