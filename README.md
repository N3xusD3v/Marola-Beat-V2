<div align="center">

# 🎵 Marola Beat V2

**Bot de música open source para Discord**
Construído com [discord.js](https://discord.js.org), [discord-player](https://discord-player.js.org) e TypeScript.

[![CI](https://github.com/N3xusD3v/Marola-Beat-V2/actions/workflows/ci.yml/badge.svg)](https://github.com/N3xusD3v/Marola-Beat-V2/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](package.json)

</div>

---

Reescrita completa do [Marola Beat V1](https://github.com/Samurai33/Marola-Beat), com estrutura modular,
tipagem forte de ponta a ponta, CI/CD e deploy em produção via [Coolify](https://coolify.io).

## ✨ Funcionalidades

- 🎶 Toca música do YouTube, SoundCloud e outras fontes suportadas pelo `discord-player`
- 📝 Comandos de barra (`/`) para todas as ações
- 🔁 Loop, shuffle, fila, pause, resume, now playing
- 🗑️ Sai automaticamente do canal quando fica vazio ou a fila termina
- 🧩 Fácil de estender com novos comandos (veja [.claude/skills/adding-slash-commands](.claude/skills/adding-slash-commands/SKILL.md))

## 🛠️ Comandos disponíveis

| Comando       | Descrição                                    |
| ------------- | --------------------------------------------- |
| `/play`       | Toca uma música por busca ou URL              |
| `/skip`       | Pula a faixa atual                            |
| `/stop`       | Para a reprodução e limpa a fila              |
| `/queue`      | Mostra a fila de reprodução                   |
| `/pause`      | Pausa a música atual                          |
| `/resume`     | Retoma a música pausada                       |
| `/nowplaying` | Mostra a faixa tocando no momento             |
| `/shuffle`    | Embaralha as músicas da fila                  |
| `/loop`       | Define o modo de repetição (off/track/queue)  |

## 🚀 Começando

Pré-requisitos: [Node.js 22+](https://nodejs.org) e uma aplicação criada no
[Discord Developer Portal](https://discord.com/developers/applications).

```bash
# 1. Clone o repositório
git clone https://github.com/N3xusD3v/Marola-Beat-V2.git
cd Marola-Beat-V2

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Preencha DISCORD_TOKEN, DISCORD_APP_ID e GUILD_ID (dev) no .env

# 3. Instale as dependências
# (se o `npm install` reclamar de não achar Python, rode com
#  YOUTUBE_DL_SKIP_PYTHON_CHECK=1 npm install — veja CLAUDE.md)
npm install

# 4. Registre os comandos de barra
npm run register

# 5. Rode em modo desenvolvimento
npm run dev
```

## 📦 Scripts

| Script                | O que faz                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`           | Roda o bot com reload automático (tsx watch)            |
| `npm run register`      | Registra/atualiza os comandos de barra no Discord        |
| `npm run build`         | Compila TypeScript para `dist/`                         |
| `npm start`             | Roda a build de produção (`dist/index.js`)               |
| `npm run typecheck`     | Verifica tipos sem gerar arquivos                        |
| `npm run lint`          | Roda o ESLint                                            |
| `npm run format`        | Formata o código com Prettier                            |

## 🏗️ Estrutura do projeto

```
src/
├── commands/     # Um arquivo por comando de barra
├── config/       # Carregamento e validação de variáveis de ambiente
├── lib/          # Player, logger, embeds, helpers de fila
├── types/        # Tipos compartilhados (Command, BotClient, QueueMetadata)
├── index.ts      # Bootstrap do bot
└── register-commands.ts
```

## 🐳 Deploy em produção (Coolify)

O projeto já vem com `Dockerfile` e `docker-compose.yml` prontos para deploy como
**Application (Docker Compose)** no Coolify — veja o guia completo em
[DEPLOYMENT.md](DEPLOYMENT.md).

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de branches,
commits e Pull Requests. Abra uma [issue](../../issues/new/choose) para bugs ou sugestões.

## 📚 Recursos úteis

- [Documentação do discord-player](https://discord-player.js.org/)
- [Documentação do discord.js](https://discord.js.org/#/docs)
- [Discord Developer Docs](https://discord.com/developers/docs/intro)
- [Documentação do Coolify](https://coolify.io/docs)

## 📝 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
