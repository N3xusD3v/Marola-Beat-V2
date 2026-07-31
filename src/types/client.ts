import type { Client, Collection } from 'discord.js';
import type { LavalinkManager } from 'lavalink-client';
import type { Command } from './command.js';

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  lavalink: LavalinkManager;
}
