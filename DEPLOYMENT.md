# Deploy no Coolify

O bot é um **worker sem porta HTTP** — ele só mantém uma conexão WebSocket com o Discord.
Isso muda algumas coisas em relação a uma aplicação web comum: **não** exponha porta e **não**
atribua domínio ao serviço no Coolify.

## Opção recomendada: integração nativa do Coolify com o GitHub

Mais simples de manter — o próprio Coolify clona o repositório e builda a imagem a partir do
`Dockerfile`/`docker-compose.yml` a cada push.

1. No Coolify: **New Resource → Application → Docker Compose** (ou **Dockerfile**, ambos funcionam
   já que o repo tem os dois).
2. Conecte a **GitHub App** do Coolify ao repositório `N3xusD3v/Marola-Beat-V2` (repo privado — a
   GitHub App do Coolify precisa de acesso concedido pela organização).
3. Build pack: **Docker Compose**, arquivo `docker-compose.yml`, branch `main`.
4. Em **Environment Variables**, adicione (marque como "Build Variable" = não, são só runtime):
   - `DISCORD_TOKEN`
   - `DISCORD_APP_ID`
   - `GUILD_ID` (deixe vazio em produção para comandos globais)
   - `LOG_LEVEL` (opcional, padrão `info`)
5. **Não** configure porta nem domínio — o serviço não expõe HTTP.
6. Ative **"Auto Deploy"** (deploy automático a cada push na branch `main`), disponível nas
   configurações do recurso.
7. Clique em **Deploy**. Acompanhe os logs de build/runtime pelo próprio Coolify.

Depois do primeiro deploy, rode o registro de comandos uma vez (veja "Registrando comandos de
barra" abaixo).

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

- [ ] `DISCORD_TOKEN` e `DISCORD_APP_ID` configurados como variáveis de ambiente no Coolify (nunca
      commitados no repositório)
- [ ] `GUILD_ID` vazio em produção (comandos globais) ou definido para um servidor de staging
- [ ] Nenhuma porta/domínio atribuído ao serviço
- [ ] `npm run register` executado após qualquer mudança nos comandos
- [ ] Restart policy `unless-stopped` (já definida no `docker-compose.yml`)
- [ ] Logs monitorados pelo painel do Coolify após o primeiro deploy
