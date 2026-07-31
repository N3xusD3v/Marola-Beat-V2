# Marola Beat V2

Bot de música para Discord (TypeScript, ESM, Node 22+). Baseado em `discord.js` v14 e
[Lavalink](https://lavalink.dev) v4 (via `lavalink-client`), com um painel web (Express) para
gerenciar a fila via login Discord OAuth2. Roda em produção como dois containers Docker no
Coolify (`bot` + `lavalink`) — o `bot` serve HTTP na porta 3000, o `lavalink` só é acessível pela
rede interna do compose.

A conexão de voz (UDP) com o Discord e a transcodificação de áudio acontecem **no processo do
Lavalink**, não no processo do bot — isso foi uma migração deliberada de `discord-player`
(engine de voz própria, via `discord-voip`) porque conexões de voz feitas direto do processo
Node.js se mostraram pouco confiáveis nesse ambiente de produção. Veja `lavalink/application.yml`
para a config do node e o serviço `lavalink` em `docker-compose.yml`.

## Comandos

```bash
npm run dev         # bot em modo dev com reload (tsx watch)
npm run register     # registra os slash commands no Discord
npm run typecheck    # tsc --noEmit
npm run lint          # eslint .
npm run format         # prettier --write .
npm run build           # compila para dist/
```

Sempre rode `typecheck`, `lint` e `build` antes de considerar uma mudança pronta — o CI roda os
três em todo PR e falha o merge se algum quebrar.

## Estrutura

- `src/commands/*.ts` — um slash command por arquivo, exporta `data` (SlashCommandBuilder),
  `execute` e `command = { data, execute } satisfies Command`. Novos comandos precisam ser
  adicionados em `src/commands/index.ts`.
- `src/lib/queue.ts` — `getPlayer()`, helper único para pegar o `Player` (lavalink-client) da
  guild atual; use-o em vez de chamar `client.lavalink.getPlayer()` diretamente.
- `src/lib/embeds.ts` — cor da marca (`BRAND_COLOR`) e builder de embed de faixa (`trackEmbed`).
- `src/lib/format.ts` — `formatDuration(ms)`, já que `track.info.duration` do lavalink-client vem
  em milissegundos (número), não como string formatada.
- `src/lib/lavalink.ts` — cria e configura o `LavalinkManager` (nodes, listeners de eventos).
  `src/index.ts` conecta o resto da fiação: encaminha o evento legado `raw` do `Client` do
  discord.js pro `sendRawData()` do manager (obrigatório — sem isso o Lavalink nunca recebe
  `VOICE_SERVER_UPDATE`/`VOICE_STATE_UPDATE`) e chama `.init()` no `clientReady`.
- `src/types/lavalink.d.ts` — module augmentation de `TrackRequester` (interface vazia que o
  lavalink-client expõe de propósito pra extensão). **Precisa** de um `export {}` no topo do
  arquivo — sem isso o `declare module 'lavalink-client'` vira uma redeclaração de módulo global
  em vez de um merge, e quebra silenciosamente TODO import de tipos do pacote (erro genérico "has
  no exported member" em arquivos completamente não relacionados).
- `src/config/env.ts` — única fonte de variáveis de ambiente; nunca leia `process.env` fora daqui.
  Inclui `lavalinkHost`/`lavalinkPort`/`lavalinkPassword` (o node aponta pro serviço `lavalink` do
  compose por padrão).
- `src/types/` — `Command` e `BotClient` (Client com `.commands`/`.lavalink` tipados).
- `src/web/` — painel web: `server.ts` monta o app Express (sessão, estáticos de `public/`),
  `discord-oauth.ts` fala com a API OAuth2 do Discord, `auth.ts` são as rotas de login/callback/
  logout, `middleware.ts` (`requireVoiceMember`) exige sessão válida **e** estar no momento no
  mesmo canal de voz que o bot (via `guild.voiceStates.cache`, não a API REST — é mais rápido e
  não precisa de escopo `guilds`/`guilds.members.read`), `queue-routes.ts` expõe
  `GET/POST /api/queue*`. Reordenar só troca posições adjacentes: `player.queue` não tem um método
  `swap`, então isso é feito com `player.queue.splice(i, 2, [trackAtI+1, trackAtI])`.
- `public/` — frontend do painel, JS puro sem build step (fora do projeto TypeScript,
  ignorado pelo ESLint/tsconfig de propósito). Se adicionar algo aqui, não assuma tipos do `src/`.
- `lavalink/application.yml` — config do node Lavalink: fontes de áudio habilitadas
  (`soundcloud`/`bandcamp`/`twitch`/`vimeo` nativos; `youtube` via plugin
  `dev.lavalink.youtube:youtube-plugin`, já que o Lavalink 4 removeu a fonte nativa do YouTube por
  causa de bloqueios de assinatura do próprio YouTube). A senha vem de `${LAVALINK_SERVER_PASSWORD}`
  (env var do container, ver `docker-compose.yml`), nunca hardcode aqui.

## Convenções

- Mensagens visíveis ao usuário do bot: **português**, no estilo dos comandos existentes (emoji +
  frase curta).
- Sem `any` — o ESLint (`typescript-eslint` com type-checking) falha o CI em `unsafe-*`.
- `noUncheckedIndexedAccess` está ativo no `tsconfig.json`: acesso por índice (`array[0]`) é
  `T | undefined`, sempre trate o caso `undefined` explicitamente.
- TypeScript fixado em `^5.9` (não `^7.x`) porque `typescript-eslint` ainda não suporta TS 7 —
  não faça upgrade sem checar a compatibilidade de `typescript-eslint` primeiro.
- Não adicione `discord-player`, `@discordjs/voice`, `@discordjs/opus` ou `opusscript` de volta —
  o projeto migrou de `discord-player` pro Lavalink de propósito (ver a nota no topo deste arquivo)
  e essas dependências de engine de voz própria não são mais usadas.
- `player.search()` do lavalink-client retorna `SearchResult | UnresolvedSearchResult` no tipo,
  mas como `useUnresolvedData` nunca é habilitado no `LavalinkManager` (`src/lib/lavalink.ts`), o
  resultado real em runtime é sempre `SearchResult` — faça `as SearchResult` explícito depois do
  `await` em vez de tratar o caso `UnresolvedSearchResult` (ver `src/commands/play.ts`).

## Deploy

Veja [DEPLOYMENT.md](DEPLOYMENT.md). Resumo: Coolify builda o `docker-compose.yml`/`Dockerfile`
direto do GitHub a cada push em `main` (serviços `bot` + `lavalink`); o domínio é atribuído pela UI
do Coolify apontando pra porta 3000 do serviço `bot` (`https://beat.n3xus.dev:3000`) — não
adicione `ports:` ao compose para isso, e nunca exponha porta/domínio pro serviço `lavalink`.
Depois de mudar comandos, rode `npm run register` manualmente (não faz parte do runtime do
container).

**Nunca digite tokens/secrets (bot token, `DISCORD_CLIENT_SECRET`, etc.) em campos de UI por
conta própria** — nem no Coolify, nem no Discord Developer Portal. Peça para o usuário colar/digitar
essas credenciais pessoalmente.

## Skills do projeto

- [.claude/skills/adding-slash-commands](.claude/skills/adding-slash-commands/SKILL.md) — como
  adicionar um novo comando seguindo o padrão do projeto.
- [.claude/skills/deploying-to-coolify](.claude/skills/deploying-to-coolify/SKILL.md) — passo a
  passo de deploy/redeploy no Coolify.
- [.claude/skills/releasing-a-version](.claude/skills/releasing-a-version/SKILL.md) — checklist de
  release (versão, CHANGELOG, tag, GitHub Release).
