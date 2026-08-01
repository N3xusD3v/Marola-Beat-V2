import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Desconecta o bot do canal de voz');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player) {
    return interaction.reply({ content: '❌ O bot não está em um canal de voz.', ephemeral: true });
  }

  await player.destroy();
  return interaction.reply('👋 Saí do canal de voz.');
}

export const command = { data, execute } satisfies Command;
