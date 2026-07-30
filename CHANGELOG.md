# Changelog

Este projeto segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
[Semantic Versioning](https://semver.org/lang/pt-BR/).

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
