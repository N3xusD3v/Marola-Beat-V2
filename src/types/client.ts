import type { Client, Collection } from 'discord.js';
import type { Player } from 'discord-player';
import type { Command } from './command.js';

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  player: Player;
}
