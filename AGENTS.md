# AGENTS.md

Guia de arquitetura, comandos e convenções do projeto: veja [CLAUDE.md](CLAUDE.md) (fonte
principal) e [README.md](README.md). Deploy: [DEPLOYMENT.md](DEPLOYMENT.md).

## Cursor Cloud specific instructions

Ambiente: Node 22+ e `npm` (há `package-lock.json`). O update script roda `npm ci` no boot, então
as dependências já estão instaladas quando o agente começa.

Verificações estáticas (não precisam de `.env` nem de serviços externos) e são o que o CI cobre —
comandos em `package.json`/[CLAUDE.md](CLAUDE.md): `npm run typecheck`, `npm run lint`,
`npm test` (Vitest) e `npm run build`. Todas passam num checkout limpo.

Rodar o bot de verdade (`npm run dev`) tem pré-requisitos que não são óbvios:

- `src/config/env.ts` lança erro **na importação** se faltar qualquer variável obrigatória
  (`DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_CLIENT_SECRET`, `PUBLIC_URL`, `SESSION_SECRET`,
  `REDIS_URL`, `LAVALINK_PASSWORD`). Logo, `npm run dev`/`npm start`/`npm run register` só sobem
  com um `.env` preenchido (copie de `.env.example`). Testes/lint/typecheck/build **não** importam
  esse módulo com validação, então rodam sem `.env`.
- O servidor HTTP/painel web (`startServer`) só é iniciado dentro de `client.once('clientReady')`
  em `src/index.ts` — ou seja, **só depois de um login válido no Discord**. Sem um `DISCORD_TOKEN`
  real não dá pra testar o painel web nem a porta 3000; com token inválido o processo morre em
  `client.login()` com `TokenInvalid`.
- O áudio depende de um node **Lavalink** (`localhost:2333`) e a sessão do painel de um **Redis**
  (`REDIS_URL`). Localmente sobem via `docker compose up lavalink redis` (ver README). O Docker
  **não** vem instalado na imagem base do Cloud Agent — instale-o antes se precisar rodar esses
  serviços.
- Testar reprodução ponta a ponta exige, além do acima, um servidor Discord de teste onde o bot
  esteja e um canal de voz — credenciais reais de uma aplicação do Discord Developer Portal.
