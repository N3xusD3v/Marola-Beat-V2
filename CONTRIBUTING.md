# Contribuindo com o Marola Beat V2

Obrigado por querer contribuir! Este projeto segue um fluxo padrão de GitHub.

## Fluxo de trabalho

1. Abra ou pegue uma [issue](../../issues) existente antes de começar (evita trabalho duplicado).
2. Crie um branch a partir de `main`:
   - `feat/nome-curto` para funcionalidades novas
   - `fix/nome-curto` para correções de bug
   - `chore/nome-curto` para manutenção (deps, CI, docs)
3. Faça commits seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: adiciona comando /volume`, `fix: corrige crash ao pular fila vazia`.
4. Antes de abrir o PR, rode localmente:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run build
   ```
5. Abra o Pull Request para `main` usando o template do repositório. O CI precisa passar antes do
   merge.

## Estilo de código

- TypeScript estrito — evite `any`; o ESLint reclama de `unsafe-*` no CI.
- Um comando de barra por arquivo em `src/commands/`, seguindo o padrão dos comandos existentes
  (veja [.claude/skills/adding-slash-commands](.claude/skills/adding-slash-commands/SKILL.md)).
- Mensagens visíveis ao usuário do bot em português, consistentes com os comandos existentes.
- Prettier cuida da formatação — não discuta estilo em review, rode `npm run format`.

## Reportando bugs

Use o template de [bug report](.github/ISSUE_TEMPLATE/bug_report.yml). Inclua passos para
reproduzir, comportamento esperado vs. observado, e logs relevantes (sem o `DISCORD_TOKEN`!).

## Código de conduta

Seja respeitoso. Discussões técnicas são bem-vindas; ataques pessoais não.
