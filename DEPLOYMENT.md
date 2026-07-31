# Deploy no Coolify

O bot mantém uma conexão WebSocket com o Discord **e** serve um painel web (fila de
reprodução, login com Discord) na porta interna `3000`. O painel só é acessível para quem
está no momento no mesmo canal de voz que o bot — veja [README.md](README.md#painel-web).

O `docker-compose.yml` sobe dois serviços: `bot` (o que acabou de ser descrito, recebe o domínio
no Coolify) e `lavalink` (áudio + conexão de voz com o Discord — só acessível pela rede interna do
compose, nunca exponha porta/domínio pra ele). O primeiro deploy demora um pouco mais porque o
Lavalink baixa o plugin de YouTube na inicialização.

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
   - `LAVALINK_PASSWORD` (string aleatória — `openssl rand -hex 32`; compartilhada entre os
     serviços `bot` e `lavalink` automaticamente pelo `docker-compose.yml`, só precisa cadastrar
     uma vez)
   - `LOG_LEVEL` (opcional, padrão `info`)
   - `YOUTUBE_OAUTH_REFRESH_TOKEN` — só depois do primeiro deploy, veja a seção
     "Autenticação OAuth do YouTube" abaixo. Pode deixar vazia no cadastro inicial.
5. Em **Domains**, atribua ao serviço `bot`: `https://beat.n3xus.dev:3000` — o `:3000` diz ao
   Coolify para rotear para a porta interna do container; **não** adicione `ports:` no
   `docker-compose.yml` para isso (veja a nota no próprio arquivo).
6. Ative **"Auto Deploy"** (deploy automático a cada push na branch `main`).
7. Clique em **Deploy**. Acompanhe os logs de build/runtime pelo próprio Coolify.

Depois do primeiro deploy, rode o registro de comandos uma vez (veja "Registrando comandos de
barra" abaixo).

## Autenticação OAuth do YouTube (fazer depois do primeiro deploy)

Buscas de música do YouTube feitas a partir de IPs de datacenter (Hetzner incluído — citado
nominalmente pela documentação do plugin) são bloqueadas pelo YouTube (`Invalid status code for
search response: 400` / "sign in to confirm you're not a bot"). O plugin `youtube-source`
contorna isso autenticando com uma conta Google via OAuth (device-code flow, tipo "Smart TV"):

1. Depois do primeiro deploy bem-sucedido do serviço `lavalink`, veja os logs dele no Coolify
   (aba **Logs**) e procure por uma linha `OAUTH INTEGRATION: To give youtube-source access to
your account, go to https://www.google.com/device and enter code XXX-XXX-XXX`.
2. Acesse essa URL e digite o código, autenticando com uma conta Google **descartável — nunca a
   sua principal** (aviso do próprio plugin: o uso de OAuth pode, em tese, levar ao banimento da
   conta usada).
3. Depois de autenticar, o log do Lavalink imprime uma linha `Token retrieved successfully. Store
your refresh token as this can be reused. (...)` — copie o token entre parênteses.
4. Cadastre esse valor como a variável de ambiente `YOUTUBE_OAUTH_REFRESH_TOKEN` no Coolify e
   redeploy. A partir daí o login persiste entre deploys — o device-code flow só roda de novo se
   essa variável ficar vazia/expirar.

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

- [ ] `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_CLIENT_SECRET`, `WEB_GUILD_ID`, `PUBLIC_URL`,
      `SESSION_SECRET` e `LAVALINK_PASSWORD` configurados como variáveis de ambiente no Coolify
      (nunca commitados no repositório)
- [ ] `YOUTUBE_OAUTH_REFRESH_TOKEN` configurada após completar o device-code flow (veja
      "Autenticação OAuth do YouTube" acima) — sem ela, buscas do YouTube falham em produção
- [ ] Serviço `lavalink` sem porta/domínio exposto no Coolify (só o `bot` recebe domínio)
- [ ] `GUILD_ID` vazio em produção (comandos globais) ou definido para um servidor de staging
- [ ] Redirect URI `https://beat.n3xus.dev/auth/discord/callback` cadastrado no Developer Portal
- [ ] Domínio `https://beat.n3xus.dev:3000` atribuído ao serviço no Coolify (sem `ports:` no compose)
- [ ] DNS de `beat.n3xus.dev` no Cloudflare em modo "DNS only" até o certificado ser emitido
- [ ] `npm run register` executado após qualquer mudança nos comandos
- [ ] Restart policy `unless-stopped` (já definida no `docker-compose.yml`)
- [ ] Logs monitorados pelo painel do Coolify após o primeiro deploy
