---
name: adding-slash-commands
description: Adds a new Discord slash command to the Marola Beat bot following the project's existing command pattern (SlashCommandBuilder + execute + Command export, wired into commands/index.ts). Use when the user asks to add, create, or implement a new bot command or slash command in this repository.
---

# Adding a slash command

## Steps

1. Create `src/commands/<name>.ts`. Match this exact shape (see `src/commands/pause.ts` for the
   simplest example, `src/commands/play.ts` for one with options and embeds):

   ```ts
   import { SlashCommandBuilder } from 'discord.js';
   import type { ChatInputCommandInteraction } from 'discord.js';
   import type { BotClient } from '../types/client.js';
   import type { Command } from '../types/command.js';
   import { getQueue } from '../lib/queue.js';

   export const data = new SlashCommandBuilder().setName('nome').setDescription('Descrição em pt-BR');

   export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
     // lógica do comando
   }

   export const command = { data, execute } satisfies Command;
   ```

2. If the command needs the guild's queue, use `getQueue(interaction, client)` from
   `src/lib/queue.ts` instead of calling `client.player.nodes.get()` directly — it's already typed
   with `QueueMetadata`.
3. For embeds, reuse `BRAND_COLOR`/`trackEmbed` from `src/lib/embeds.ts` rather than duplicating
   colors/fields.
4. Register the command in `src/commands/index.ts`: add the import and include it in the
   `commands` array.
5. User-facing strings go in Portuguese, matching the tone of existing commands (short sentence +
   emoji prefix, e.g. `'❌ Nada está tocando no momento.'`).

## Verification (required — do not skip)

Run, in order, and fix everything before considering the command done:

```bash
npm run typecheck
npm run lint
npm run format
npm run build
```

Then register the command against a test guild and try it in Discord:

```bash
GUILD_ID=<test-guild-id> npm run register
npm run dev
```

`noUncheckedIndexedAccess` is on — any array index access (`arr[0]`) is `T | undefined`; handle it
explicitly instead of using `!`.
