# Política de segurança

## Reportando uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto (ex: bypass do
`requireVoiceMember`, vazamento de sessão, injeção via parâmetros da API do painel web),
**não abra uma issue pública**. Reporte de forma privada:

- Use a aba [Security → Report a vulnerability](../../security/advisories/new) do GitHub, ou
- Envie um e-mail para o mantenedor ([@Samurai33](https://github.com/Samurai33)) com detalhes e
  passos para reproduzir.

Inclua o máximo de contexto possível: endpoint/comando afetado, passos para reproduzir, e o
impacto esperado. Você deve receber uma resposta em até 7 dias.

## Escopo

Áreas sensíveis deste projeto:

- `src/web/auth.ts` / `discord-oauth.ts` — fluxo OAuth2 e criação de sessão.
- `src/web/middleware.ts` (`requireVoiceMember`) — controle de acesso do painel web (exige estar
  no mesmo canal de voz que o bot).
- `src/config/env.ts` e o manuseio de `DISCORD_TOKEN` / `DISCORD_CLIENT_SECRET` /
  `LAVALINK_PASSWORD` / `SESSION_SECRET`.

## Segredos e credenciais

- Nunca commite `.env`, tokens ou secrets no repositório — `.gitignore`/`.dockerignore` já
  excluem `.env*` (exceto `.env.example`).
- Nunca digite tokens/secrets em campos de UI do Coolify ou do Discord Developer Portal por
  conta própria — peça para quem tem a credencial fazer isso pessoalmente (ver [CLAUDE.md](CLAUDE.md)).
- Se um secret vazar (commit acidental, log, etc.), revogue/regenere-o imediatamente no Discord
  Developer Portal (bot token, client secret) ou gerando um novo valor aleatório
  (`SESSION_SECRET`, `LAVALINK_PASSWORD`) e atualizando no Coolify.

## Dependências

Atualizações de dependências são monitoradas automaticamente via
[Dependabot](.github/dependabot.yml) (npm, GitHub Actions e Docker, semanalmente).
