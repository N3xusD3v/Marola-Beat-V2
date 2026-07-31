import type { Command } from '../types/command.js';
import { command as clear } from './clear.js';
import { command as leave } from './leave.js';
import { command as loop } from './loop.js';
import { command as nowplaying } from './nowplaying.js';
import { command as pause } from './pause.js';
import { command as play } from './play.js';
import { command as previous } from './previous.js';
import { command as queue } from './queue.js';
import { command as remove } from './remove.js';
import { command as resume } from './resume.js';
import { command as seek } from './seek.js';
import { command as shuffle } from './shuffle.js';
import { command as skip } from './skip.js';
import { command as stop } from './stop.js';
import { command as volume } from './volume.js';

export const commands: Command[] = [
  play,
  skip,
  stop,
  queue,
  pause,
  resume,
  nowplaying,
  shuffle,
  loop,
  volume,
  remove,
  clear,
  previous,
  seek,
  leave,
];
