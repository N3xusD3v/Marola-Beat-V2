# Deploy no Coolify

O bot mantém uma conexão WebSocket com o Discord **e** serve um painel web (fila de
reprodução, login com Discord) na porta interna `3000`. O painel funciona em qualquer servidor
onde o bot estiver — se o usuário logado tiver o bot em mais de um servidor em comum, escolhe
qual gerenciar numa tela depois do login. O acesso a cada servidor selecionado só é liberado pra
quem está no momento no mesmo canal de voz que o bot lá — veja [README.md](README.md#painel-web).
Não precisa de nenhuma configuração extra pra adicionar o bot a um novo servidor: basta convidar o
bot, que ele já aparece como opção pra quem tiver acesso a ambos.

O `docker-compose.yml` sobe três serviços: `bot` (o que acabou de ser descrito, recebe o domínio
no Coolify), `lavalink` (áudio + conexão de voz com o Discord) e `redis` (store da sessão do
painel web) — os dois últimos só acessíveis pela rede interna do compose, nunca exponha
porta/domínio pra eles. O primeiro deploy demora um pouco mais porque o Lavalink baixa o plugin
de YouTube na inicialização.

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
   - `GUILD_ID` (deixe vazio em produção para comandos globais — ver "Registrando comandos de
     barra" abaixo)
   - `PUBLIC_URL` = `https://beat.n3xus.dev`
   - `SESSION_SECRET` (string aleatória — `openssl rand -hex 32`)
   - `REDIS_PASSWORD` (string aleatória — `openssl rand -hex 32`; usada pelos serviços `bot` e
     `redis` automaticamente pelo `docker-compose.yml` — o `bot` monta a `REDIS_URL` completa a
     partir dela, não cadastre `REDIS_URL` diretamente)
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

**Se buscas do YouTube voltarem a falhar em produção** (`AllClientsFailedException` / "All clients
failed to load the item" nos logs do `lavalink`, com os clients não-OAuth tentando e falhando um a
um): o refresh token guardado expirou ou foi invalidado pelo Google. Não é um problema de código —
a config e a variável de ambiente continuam corretas. A correção é repetir o processo acima do
zero: limpe o valor de `YOUTUBE_OAUTH_REFRESH_TOKEN`, redeploy, pegue a nova URL/código do
device-code flow nos logs e cadastre o novo token.

## Escalando para múltiplos nós Lavalink (quando o volume exigir)

Hoje só existe um node Lavalink — se ele cair, a reprodução para em **todos** os servidores ao
mesmo tempo. Um Lavalink com 2GB de RAM aguenta ~200-300 streams simultâneos confortavelmente, então
isso só costuma virar um problema real com uso em escala. O bot já loga a capacidade do node atual
a cada 5 minutos (`Capacidade do node Lavalink "main": X/Y players tocando, CPU sistema Z%, CPU
Lavalink W%` — veja `src/lib/lavalink.ts`); use esses números pra decidir quando vale a pena.

Quando chegar a hora, **não precisa reescrever nada** — o `lavalink-client` (a lib já usada aqui)
tem suporte nativo a múltiplos nodes com seleção automática do menos ocupado, então só precisa
adicionar mais entradas:

1. Em `docker-compose.yml`, duplique o serviço `lavalink` com um nome diferente (ex: `lavalink2`),
   reaproveitando a mesma imagem, o mesmo volume de `application.yml` (ou um novo, se quiser configs
   de fontes diferentes por node) e a mesma `LAVALINK_SERVER_PASSWORD`. Mantenha sem `ports:`/domínio
   exposto, igual ao node atual.
2. Em `src/lib/lavalink.ts`, adicione uma nova entrada no array `nodes` do `LavalinkManager` com um
   `id` diferente (ex: `'secondary'`) e `host` apontando pro nome do novo serviço (ex: `'lavalink2'`
   — nome do serviço do compose, resolvido pela rede interna do Docker).
3. Redeploy. O `lavalink-client` distribui novos players entre os nodes conectados automaticamente
   (via `leastUsedNodes()` internamente) — nenhuma outra mudança de código é necessária.

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

- [ ] `DISCORD_TOKEN`, `DISCORD_APP_ID`, `DISCORD_CLIENT_SECRET`, `PUBLIC_URL`, `SESSION_SECRET`,
      `REDIS_PASSWORD` e `LAVALINK_PASSWORD` configurados como variáveis de ambiente no Coolify
      (nunca commitados no repositório)
- [ ] Serviço `redis` sem porta/domínio exposto no Coolify (só o `bot` recebe domínio) — sessão
      do painel persiste entre redeploys (antes usava `MemoryStore` em memória, perdia tudo)
- [ ] `YOUTUBE_OAUTH_REFRESH_TOKEN` configurada após completar o device-code flow (veja
      "Autenticação OAuth do YouTube" acima) — sem ela, buscas do YouTube falham em produção
- [ ] Serviço `lavalink` sem porta/domínio exposto no Coolify (só o `bot` recebe domínio)
- [ ] `GUILD_ID` vazio em produção (comandos globais) ou definido para um servidor de staging
- [ ] Redirect URI `https://beat.n3xus.dev/auth/discord/callback` cadastrado no Developer Portal
- [ ] Se o bot for chegar perto de 100 servidores: `https://beat.n3xus.dev/privacy` e `/terms`
      cadastrados nos campos "Privacy Policy URL"/"Terms of Service URL" da aplicação no Developer
      Portal (**Verification** exige a Privacy Policy publicada — veja o rodapé da tela de login)
- [ ] Domínio `https://beat.n3xus.dev:3000` atribuído ao serviço no Coolify (sem `ports:` no compose)
- [ ] DNS de `beat.n3xus.dev` no Cloudflare em modo "DNS only" até o certificado ser emitido
- [ ] `npm run register` executado após qualquer mudança nos comandos
- [ ] Restart policy `unless-stopped` (já definida no `docker-compose.yml`)
- [ ] Logs monitorados pelo painel do Coolify após o primeiro deploy
