# Marola Beat V2

Bot de música para Discord (TypeScript, ESM, Node 22+). Baseado em `discord.js` v14 e
`discord-player` v7. Roda em produção como container Docker no Coolify (worker sem porta HTTP).

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
- `src/lib/queue.ts` — `getQueue()`, helper único para pegar a fila da guild atual; use-o em vez de
  chamar `client.player.nodes.get()` diretamente.
- `src/lib/embeds.ts` — cor da marca (`BRAND_COLOR`) e builder de embed de faixa (`trackEmbed`).
- `src/lib/player.ts` — cria e configura a instância do `Player` (extractors, eventos).
- `src/config/env.ts` — única fonte de variáveis de ambiente; nunca leia `process.env` fora daqui.
- `src/types/` — `Command`, `BotClient` (Client com `.commands`/`.player` tipados) e
  `QueueMetadata` (tipo do `metadata` da fila — sempre use os genéricos `nodes.create<QueueMetadata>`
  / `nodes.get<QueueMetadata>` para evitar `any` implícito, já que o `discord-player` não é
  genérico por padrão).

## Convenções

- Mensagens visíveis ao usuário do bot: **português**, no estilo dos comandos existentes (emoji +
  frase curta).
- Sem `any` — o ESLint (`typescript-eslint` com type-checking) falha o CI em `unsafe-*`.
- `noUncheckedIndexedAccess` está ativo no `tsconfig.json`: acesso por índice (`array[0]`) é
  `T | undefined`, sempre trate o caso `undefined` explicitamente.
- TypeScript fixado em `^5.9` (não `^7.x`) porque `typescript-eslint` ainda não suporta TS 7 —
  não faça upgrade sem checar a compatibilidade de `typescript-eslint` primeiro.
- Dependências de voz/áudio (`mediaplex`, `discord-voip`, `libsodium-wrappers`) vêm embutidas no
  `discord-player` v7.2 — não adicione `@discordjs/voice`, `@discordjs/opus` ou `opusscript` como
  dependência direta.
- `youtube-dl-exec` está como dependência direta porque `discord-player-youtubei@2.0.0` faz
  `require`/`import` dele incondicionalmente mas não o declara em seu próprio `package.json` (bug
  upstream) — sem isso o processo crasha ao importar o módulo. O preinstall dele checa Python; use
  `YOUTUBE_DL_SKIP_PYTHON_CHECK=1` ao instalar em ambientes sem Python (já configurado no
  `Dockerfile` e no CI). Não remova essa dependência sem antes confirmar que uma versão nova de
  `discord-player-youtubei` corrigiu o problema.

## Deploy

Veja [DEPLOYMENT.md](DEPLOYMENT.md). Resumo: Coolify builda o `docker-compose.yml`/`Dockerfile`
direto do GitHub a cada push em `main`; o serviço não expõe porta nem domínio. Depois de mudar
comandos, rode `npm run register` manualmente (não faz parte do runtime do container).

## Skills do projeto

- [.claude/skills/adding-slash-commands](.claude/skills/adding-slash-commands/SKILL.md) — como
  adicionar um novo comando seguindo o padrão do projeto.
- [.claude/skills/deploying-to-coolify](.claude/skills/deploying-to-coolify/SKILL.md) — passo a
  passo de deploy/redeploy no Coolify.
- [.claude/skills/releasing-a-version](.claude/skills/releasing-a-version/SKILL.md) — checklist de
  release (versão, CHANGELOG, tag, GitHub Release).
