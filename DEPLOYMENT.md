# Deploy no Coolify

O bot mantém uma conexão WebSocket com o Discord **e** serve um painel web (fila de
reprodução, login com Discord) na porta interna `3000`. O painel só é acessível para quem
está no momento no mesmo canal de voz que o bot — veja [README.md](README.md#painel-web).

## Domínio e OAuth2 (fazer antes do deploy)

O painel usa login OAuth2 do Discord, então a aplicação do bot precisa saber a URL pública
antes de funcionar:

1. No [Discord Developer Portal](https://discord.com/developers/applications), abra a
   aplicação do bot → **OAuth2 → General**.
2. Em **Redirects**, adicione: `https://beat.n3xus.dev/auth/discord/callback`
3. Copie o **Client Secret** (gere um novo se necessário) — vai virar a variável
   `DISCORD_CLIENT_SECRET`. Trate como senha: nunca commite no repositório.

## Opção recomendada: integração nativa do Coolify com o GitHub

Mais simples de manter — o próprio Coolify clona o repositório e builda a imagem a partir do
`Dockerfile`/`docker-compose.yml` a cada push.

1. No Coolify: **New Resource → Application → Docker Compose**.
2. Conecte a **GitHub App** do Coolify ao repositório `N3xusD3v/Marola-Beat-V2` (repo privado —
   a GitHub App do Coolify precisa de acesso concedido pela organização).
3. Build pack: **Docker Compose**, arquivo `docker-compose.yml`, branch `main`.
4. Em **Environment Variables**, adicione:
   - `DISCORD_TOKEN`
   - `DISCORD_APP_ID`
   - `DISCORD_CLIENT_SECRET`
   - `GUILD_ID` (deixe vazio em produção para comandos globais — não confundir com `WEB_GUILD_ID`)
   - `WEB_GUILD_ID` (ID do servidor cuja fila o painel gerencia)
   - `PUBLIC_URL` = `https://beat.n3xus.dev`
   - `SESSION_SECRET` (string aleatória — `openssl rand -hex 32`)
   - `LOG_LEVEL` (opcional, padrão `info`)
5. Em **Domains**, atribua ao serviço `bot`: `https://beat.n3xus.dev:3000` — o `:3000` diz ao
   Coolify para rotear para a porta interna do container; **não** adicione `ports:` no
   `docker-compose.yml` para isso (veja a nota no próprio arquivo).
6. Ative **"Auto Deploy"** (deploy automático a cada push na branch `main`).
7. Clique em **Deploy**. Acompanhe os logs de build/runtime pelo próprio Coolify.

Depois do primeiro deploy, rode o registro de comandos uma vez (veja "Registrando comandos de
barra" abaixo).

## DNS no Cloudflare

1. Crie um registro **A** (ou CNAME) para `beat.n3xus.dev` apontando para o IP do servidor onde
   o Coolify roda.
2. Deixe como **"DNS only"** (nuvem cinza, sem proxy) — com o proxy laranja ativado, o desafio
   HTTP-01 do Let's Encrypt que o Coolify/Traefik usa para emitir o certificado falha. Depois que
   o certificado estiver ativo, dá pra reativar o proxy usando desafio DNS-01, mas isso exige
   configuração extra no Coolify — não é o padrão.

## Opção alternativa: GitHub Actions + Webhook

Use esta opção se precisar de um pipeline com testes/lint bloqueando o deploy, ou publicar a
imagem num registry privado. O workflow [`deploy.yml`](.github/workflows/deploy.yml) já está
pronto; para ativá-lo:

1. No Coolify, crie o recurso como **Dockerfile** (não Compose) e gere um **Deploy Webhook** em
   _Settings → Webhooks_.
2. Gere um **API Token** com permissão de deploy em _Keys & Tokens_.
3. No GitHub, em _Settings → Secrets and variables → Actions_, adicione:
   - `COOLIFY_WEBHOOK` — a URL do webhook de deploy
   - `COOLIFY_TOKEN` — o token de API
4. Todo push em `main` builda a imagem, publica no GHCR e chama o webhook do Coolify para
   redeployar com a imagem mais recente.

## Registrando comandos de barra

Comandos de barra são registrados via API do Discord, não fazem parte do runtime do container.
Rode localmente (ou num shell temporário) apontando para as mesmas credenciais de produção:

```bash
DISCORD_TOKEN=... DISCORD_APP_ID=... npm run register
```

- Com `GUILD_ID` definido: comandos aparecem instantaneamente, só naquele servidor (bom para
  testes).
- Sem `GUILD_ID`: comandos são registrados globalmente — podem levar até 1h para propagar, mas
  funcionam em qualquer servidor onde o bot estiver.

Rode `npm run register` novamente sempre que adicionar, remover ou alterar um comando.

## Checklist de produção

- [ ] `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_CLIENT_SECRET`, `WEB_GUILD_ID`, `PUBLIC_URL` e
      `SESSION_SECRET` configurados como variáveis de ambiente no Coolify (nunca commitados no
      repositório)
- [ ] `GUILD_ID` vazio em produção (comandos globais) ou definido para um servidor de staging
- [ ] Redirect URI `https://beat.n3xus.dev/auth/discord/callback` cadastrado no Developer Portal
- [ ] Domínio `https://beat.n3xus.dev:3000` atribuído ao serviço no Coolify (sem `ports:` no compose)
- [ ] DNS de `beat.n3xus.dev` no Cloudflare em modo "DNS only" até o certificado ser emitido
- [ ] `npm run register` executado após qualquer mudança nos comandos
- [ ] Restart policy `unless-stopped` (já definida no `docker-compose.yml`)
- [ ] Logs monitorados pelo painel do Coolify após o primeiro deploy
