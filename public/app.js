const app = document.getElementById('app');
const userBox = document.getElementById('user-box');

const ERROR_MESSAGES = {
  not_authenticated: null, // tratado separadamente (mostra tela de login)
  bot_not_ready: 'O bot ainda está inicializando. Tente novamente em instantes.',
  not_in_voice_channel: 'Entre em um canal de voz do servidor para gerenciar a fila.',
  wrong_voice_channel: 'Você precisa estar no mesmo canal de voz que o bot está tocando.',
};

const ADD_TRACK_ERROR_MESSAGES = {
  invalid_query: 'Digite o nome ou link de uma música.',
  voice_channel_unavailable: 'O canal de voz não está mais disponível.',
  no_results: 'Nenhum resultado encontrado para essa busca.',
  add_failed: 'Não foi possível adicionar a música. Tente novamente.',
};

const POLL_INTERVAL_MS = 4000;

// Paths do Lucide (https://lucide.dev, licença ISC) — sem outer <svg>, ver icon().
const ICON_PATHS = {
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
  pause:
    '<rect x="14" y="3" width="5" height="18" rx="1" /><rect x="5" y="3" width="5" height="18" rx="1" />',
  'skip-back':
    '<path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" /><path d="M3 20V4" />',
  'skip-forward':
    '<path d="M21 4v16" /><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />',
  'log-out':
    '<path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />',
  'volume-2':
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />',
  'volume-x':
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" />',
  plus: '<path d="M5 12h14" /><path d="M12 5v14" />',
  x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  'chevron-up': '<path d="m18 15-6-6-6 6" />',
  'chevron-down': '<path d="m6 9 6 6 6-6" />',
  'trash-2':
    '<path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
  'disc-3':
    '<circle cx="12" cy="12" r="10" /><path d="M6 12c0-1.7.7-3.2 1.8-4.2" /><circle cx="12" cy="12" r="2" /><path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />',
  'list-start':
    '<path d="M3 5h6" /><path d="M3 12h13" /><path d="M3 19h13" /><path d="m16 8-3-3 3-3" /><path d="M21 19V7a2 2 0 0 0-2-2h-6" />',
  search: '<path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />',
  'list-music':
    '<path d="M16 5H3" /><path d="M11 12H3" /><path d="M11 19H3" /><path d="M21 16V5" /><circle cx="18" cy="16" r="3" />',
  'shield-check':
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />',
  repeat:
    '<path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />',
};

// Marca oficial do Discord (https://github.com/simple-icons/simple-icons, CC0) — path único
// preenchido (fill), não contorno como os ícones Lucide acima; tratado como caso especial
// dentro de icon() (nome 'discord').
const DISCORD_MARK_PATH =
  '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />';

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(name, extraClass) {
  const wrapper = document.createElementNS(SVG_NS, 'svg');
  wrapper.setAttribute('viewBox', '0 0 24 24');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.setAttribute('class', extraClass ? `icon ${extraClass}` : 'icon');
  if (name === 'discord') {
    wrapper.setAttribute('fill', 'currentColor');
    wrapper.innerHTML = DISCORD_MARK_PATH;
    return wrapper;
  }
  wrapper.setAttribute('fill', 'none');
  wrapper.setAttribute('stroke', 'currentColor');
  wrapper.setAttribute('stroke-width', '2');
  wrapper.setAttribute('stroke-linecap', 'round');
  wrapper.setAttribute('stroke-linejoin', 'round');
  wrapper.innerHTML = ICON_PATHS[name] ?? '';
  return wrapper;
}

let pollTimer = null;
let tickTimer = null;
let lastData = null;
let localPositionMs = 0;
// Servidores em comum entre o usuário e o bot (ver GET /api/guilds) — guardado só pra saber se
// vale mostrar o botão "trocar servidor" no topbar, sem precisar rebuscar a cada clique.
let cachedGuilds = [];
// renderQueue() reconstrói o DOM inteiro a cada poll (ver loadQueue()), então sem isso o popover
// de volume fecharia sozinho a cada 4s mesmo com o usuário ainda mexendo nele.
let volumePopoverOpen = false;
let removeVolumeOutsideListener = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function api(path, options) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  return res;
}

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const LOGIN_FEATURES = [
  { icon: 'search', text: 'Busque e adicione músicas do YouTube, SoundCloud e mais' },
  { icon: 'list-music', text: 'Veja a fila em tempo real, reordene e pule faixas' },
  { icon: 'shield-check', text: 'Acesso restrito a quem está no canal de voz do bot' },
];

function renderLogin() {
  document.body.classList.add('login-active');
  userBox.textContent = '';
  app.textContent = '';
  const box = el('div', 'card login-card');
  const mark = document.createElement('img');
  mark.src = '/logo-mark.png';
  mark.alt = '';
  mark.className = 'login-mark';
  box.appendChild(mark);
  box.appendChild(el('div', 'login-eyebrow', 'Painel Web'));
  box.appendChild(el('h2', null, 'Marola Beat'));
  box.appendChild(el('p', null, 'Entre com sua conta do Discord para gerenciar a fila.'));

  const features = el('ul', 'login-features');
  for (const feature of LOGIN_FEATURES) {
    const item = el('li');
    item.appendChild(icon(feature.icon));
    item.appendChild(el('span', null, feature.text));
    features.appendChild(item);
  }
  box.appendChild(features);

  const link = el('a', 'btn btn-primary');
  link.href = '/auth/login';
  link.appendChild(icon('discord'));
  link.appendChild(el('span', null, 'Entrar com Discord'));
  box.appendChild(link);

  const legal = el('p', 'login-legal');
  const privacyLink = el('a', null, 'Política de Privacidade');
  privacyLink.href = '/privacy';
  const termsLink = el('a', null, 'Termos de Uso');
  termsLink.href = '/terms';
  legal.appendChild(privacyLink);
  legal.append(' · ');
  legal.appendChild(termsLink);
  box.appendChild(legal);

  app.appendChild(box);
}

function renderBlocked(message) {
  document.body.classList.remove('login-active');
  app.textContent = '';
  const box = el('div', 'card blocked-card');
  box.appendChild(el('p', null, message));
  app.appendChild(box);
}

function renderUser(user) {
  document.body.classList.remove('login-active');
  userBox.textContent = '';
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const img = document.createElement('img');
  img.src = avatarUrl;
  img.alt = '';
  img.className = 'avatar';
  userBox.appendChild(img);
  userBox.appendChild(el('span', 'username', user.displayName ?? user.username));
  if (user.isAdmin) {
    const adminLink = el('a', 'icon-btn icon-btn-ghost');
    adminLink.href = '/admin';
    adminLink.title = 'Painel administrativo';
    adminLink.setAttribute('aria-label', 'Painel administrativo');
    adminLink.appendChild(icon('shield-check'));
    userBox.appendChild(adminLink);
  }
  const logout = el('button', 'icon-btn icon-btn-ghost');
  logout.type = 'button';
  logout.title = 'Sair da conta';
  logout.setAttribute('aria-label', 'Sair da conta');
  logout.appendChild(icon('log-out'));
  logout.addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    stopPolling();
    renderLogin();
  });
  userBox.appendChild(logout);
}

function updateGuildSwitcher() {
  const existing = userBox.querySelector('.guild-switch-btn');
  if (existing) existing.remove();
  if (cachedGuilds.length < 2) return;

  const btn = el('button', 'icon-btn icon-btn-ghost guild-switch-btn');
  btn.type = 'button';
  btn.title = 'Trocar servidor';
  btn.setAttribute('aria-label', 'Trocar servidor');
  btn.appendChild(icon('repeat'));
  btn.addEventListener('click', () => {
    stopPolling();
    renderGuildPicker(cachedGuilds);
  });

  // Insere antes do botão de sair (sempre o último .icon-btn-ghost do userBox nesse ponto).
  const logoutBtn = userBox.querySelector('.icon-btn-ghost');
  if (logoutBtn) userBox.insertBefore(btn, logoutBtn);
  else userBox.appendChild(btn);
}

function renderGuildPicker(guilds) {
  app.textContent = '';
  const box = el('div', 'card guild-picker-card');
  box.appendChild(el('div', 'login-eyebrow', 'Escolha um servidor'));
  box.appendChild(el('h2', null, 'Marola Beat'));
  box.appendChild(el('p', null, 'O bot está em mais de um servidor seu — escolha qual gerenciar.'));

  const list = el('ul', 'guild-list');
  for (const guild of guilds) {
    const item = el('li');
    const option = el('button', 'guild-option');
    option.type = 'button';
    if (guild.icon) {
      const img = document.createElement('img');
      img.src = guild.icon;
      img.alt = '';
      img.className = 'guild-icon';
      option.appendChild(img);
    } else {
      const placeholder = el(
        'div',
        'guild-icon guild-icon-placeholder',
        guild.name.slice(0, 2).toUpperCase(),
      );
      option.appendChild(placeholder);
    }
    option.appendChild(el('span', null, guild.name));
    option.addEventListener('click', () => void chooseGuildAndStart(guild.id));
    item.appendChild(option);
    list.appendChild(item);
  }
  box.appendChild(list);
  app.appendChild(box);
}

async function selectGuild(guildId) {
  const res = await api('/api/guilds/select', {
    method: 'POST',
    body: JSON.stringify({ guildId }),
  });
  if (!res.ok) {
    renderBlocked('Não foi possível selecionar esse servidor. Tente novamente.');
    return false;
  }
  // O apelido/nome de exibição no topbar depende do servidor selecionado (ver /api/me) — sem
  // isso, o topbar ficava com o @username até o próximo reload da página inteira. renderUser()
  // reconstrói o userBox do zero, então o botão "trocar servidor" precisa ser reinserido.
  const meRes = await api('/api/me');
  if (meRes.ok) {
    renderUser(await meRes.json());
    updateGuildSwitcher();
  }
  return true;
}

async function chooseGuildAndStart(guildId) {
  const ok = await selectGuild(guildId);
  if (!ok) return;
  await startQueueLoop();
}

// Garante que a sessão tem um servidor selecionado antes de carregar a fila — auto-seleciona se
// só há um servidor em comum, mostra um seletor se há mais de um, ou uma mensagem de erro se
// nenhum. Retorna `true` só quando já dá pra seguir direto pra startQueueLoop(); nos outros casos
// já deixou a tela certa renderizada (login, seletor ou erro) e quem chamou deve parar por ali.
async function ensureGuildSelected() {
  const res = await api('/api/guilds');

  if (res.status === 409) {
    // Sessão de antes do escopo OAuth `guilds` existir — não temos os servidores do usuário
    // guardados, só um login novo resolve.
    await api('/auth/logout', { method: 'POST' });
    renderLogin();
    return false;
  }
  if (!res.ok) {
    renderBlocked('Não foi possível carregar seus servidores. Tente novamente.');
    return false;
  }

  const data = await res.json();
  cachedGuilds = data.guilds;
  updateGuildSwitcher();

  if (data.selectedGuildId) return true;

  if (data.guilds.length === 0) {
    renderBlocked(
      'O bot não está em nenhum servidor seu. Peça pra alguém adicionar o bot a um servidor primeiro.',
    );
    return false;
  }

  if (data.guilds.length === 1) {
    return selectGuild(data.guilds[0].id);
  }

  renderGuildPicker(data.guilds);
  return false;
}

function actionButton(iconName, title, onClick, disabled) {
  const btn = el('button', 'icon-btn');
  btn.type = 'button';
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.appendChild(icon(iconName));
  btn.disabled = Boolean(disabled);
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return btn;
}

function trackRow(track, index, { onMoveToTop, onUp, onDown, onRemove, isFirst, isLast } = {}) {
  const row = el('li', isFirst ? 'track-row track-row-next' : 'track-row');

  if (track.thumbnail) {
    const thumb = document.createElement('img');
    thumb.src = track.thumbnail;
    thumb.alt = '';
    thumb.className = 'thumb';
    row.appendChild(thumb);
  }

  const info = el('div', 'track-info');
  if (isFirst) info.appendChild(el('div', 'track-next-label', 'A seguir'));
  const title = el('div', 'track-title', track.title);
  title.title = track.title;
  info.appendChild(title);
  const meta = el(
    'div',
    'track-meta',
    `${track.author} • ${track.duration} • pedido por ${track.requestedBy}`,
  );
  meta.title = meta.textContent;
  info.appendChild(meta);
  row.appendChild(info);

  if (onMoveToTop || onUp || onDown || onRemove) {
    const actions = el('div', 'track-actions');
    if (onMoveToTop) {
      actions.appendChild(actionButton('list-start', 'Mover para o topo da fila', onMoveToTop, isFirst));
    }
    if (onUp) actions.appendChild(actionButton('chevron-up', 'Mover para cima', onUp, isFirst));
    if (onDown) actions.appendChild(actionButton('chevron-down', 'Mover para baixo', onDown, isLast));
    if (onRemove) actions.appendChild(actionButton('x', 'Remover da fila', onRemove));
    row.appendChild(actions);
  }

  return row;
}

async function moveTrack(index, direction) {
  await api('/api/queue/move', { method: 'POST', body: JSON.stringify({ index, direction }) });
  await loadQueue();
}

async function moveTrackToTop(index) {
  await api('/api/queue/move-to-top', { method: 'POST', body: JSON.stringify({ index }) });
  await loadQueue();
}

async function removeTrack(index) {
  await api('/api/queue/remove', { method: 'POST', body: JSON.stringify({ index }) });
  await loadQueue();
}

async function togglePause() {
  await api('/api/queue/pause', { method: 'POST' });
  await loadQueue();
}

async function skipTrack() {
  await api('/api/queue/skip', { method: 'POST' });
  await loadQueue();
}

async function previousTrack() {
  await api('/api/queue/previous', { method: 'POST' });
  await loadQueue();
}

async function clearQueue() {
  await api('/api/queue/clear', { method: 'POST' });
  await loadQueue();
}

async function leaveChannel() {
  await api('/api/queue/leave', { method: 'POST' });
  await loadQueue();
}

async function seekTo(positionMs) {
  localPositionMs = positionMs;
  await api('/api/queue/seek', { method: 'POST', body: JSON.stringify({ positionMs }) });
  await loadQueue();
}

let volumeDebounce = null;
function setVolume(volume) {
  clearTimeout(volumeDebounce);
  volumeDebounce = setTimeout(() => {
    void api('/api/queue/volume', { method: 'POST', body: JSON.stringify({ volume }) });
  }, 300);
}

function renderPlayer(data) {
  const card = el('section', 'card now-playing');

  if (!data.current) {
    volumePopoverOpen = false;
    if (removeVolumeOutsideListener) {
      removeVolumeOutsideListener();
      removeVolumeOutsideListener = null;
    }
    const header = el('div', 'card-header');
    header.appendChild(el('h2', null, 'Tocando agora'));
    card.appendChild(header);
    const empty = el('div', 'empty-state');
    empty.appendChild(icon('disc-3', 'empty-icon'));
    empty.appendChild(el('p', 'empty', 'Nada tocando no momento.'));
    card.appendChild(empty);
    return card;
  }

  const track = data.current;
  card.classList.add('has-cover');

  const coverBg = el('div', 'cover-bg');
  if (track.thumbnail) coverBg.style.backgroundImage = `url("${track.thumbnail}")`;
  card.appendChild(coverBg);
  card.appendChild(el('div', 'cover-scrim'));

  const eyebrow = el('div', 'now-playing-eyebrow', 'Tocando agora');
  card.appendChild(eyebrow);

  const info = el('div', 'track-info');
  const title = el('div', 'track-title', track.title);
  title.title = track.title;
  info.appendChild(title);
  const meta = el('div', 'track-meta', `${track.author} • pedido por ${track.requestedBy}`);
  meta.title = meta.textContent;
  info.appendChild(meta);

  if (!track.isStream) {
    const progress = el('div', 'progress');
    const bar = el('div', 'progress-bar');
    const pct = track.durationMs > 0 ? Math.min(100, (localPositionMs / track.durationMs) * 100) : 0;
    bar.style.width = `${pct}%`;
    progress.appendChild(bar);
    progress.title = 'Clique para pular para essa posição';
    progress.addEventListener('click', (event) => {
      const rect = progress.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      void seekTo(Math.round(ratio * track.durationMs));
    });
    info.appendChild(progress);

    const times = el('div', 'progress-times');
    times.appendChild(el('span', null, formatMs(localPositionMs)));
    times.appendChild(el('span', null, track.duration));
    info.appendChild(times);
  } else {
    const live = el('div', 'progress-times');
    live.appendChild(el('span', 'live-badge', 'AO VIVO'));
    info.appendChild(live);
  }

  card.appendChild(info);

  const controls = el('div', 'player-controls');

  const prevBtn = el('button', 'btn-transport');
  prevBtn.type = 'button';
  prevBtn.disabled = !data.hasPrevious;
  prevBtn.title = 'Faixa anterior';
  prevBtn.setAttribute('aria-label', 'Faixa anterior');
  prevBtn.appendChild(icon('skip-back'));
  prevBtn.addEventListener('click', () => void previousTrack());
  controls.appendChild(prevBtn);

  const pauseBtn = el('button', 'btn-play');
  pauseBtn.type = 'button';
  const pauseLabel = data.paused ? 'Retomar' : 'Pausar';
  pauseBtn.title = pauseLabel;
  pauseBtn.setAttribute('aria-label', pauseLabel);
  pauseBtn.appendChild(icon(data.paused ? 'play' : 'pause'));
  pauseBtn.addEventListener('click', () => void togglePause());
  controls.appendChild(pauseBtn);

  const skipBtn = el('button', 'btn-transport');
  skipBtn.type = 'button';
  skipBtn.title = 'Pular faixa';
  skipBtn.setAttribute('aria-label', 'Pular faixa');
  skipBtn.appendChild(icon('skip-forward'));
  skipBtn.addEventListener('click', () => void skipTrack());
  controls.appendChild(skipBtn);

  card.appendChild(controls);

  const volumeRow = el('div', 'volume-row');

  const volumeControl = el('div', 'volume-control');
  const volumeToggle = el('button', 'volume-toggle');
  volumeToggle.type = 'button';
  volumeToggle.title = 'Volume';
  volumeToggle.setAttribute('aria-label', 'Volume');
  volumeToggle.appendChild(icon(Number(data.volume ?? 100) === 0 ? 'volume-x' : 'volume-2'));

  const volumePopover = el('div', 'volume-popover');
  const volumeInput = document.createElement('input');
  volumeInput.type = 'range';
  volumeInput.min = '0';
  volumeInput.max = '100';
  volumeInput.value = String(data.volume ?? 100);
  volumeInput.className = 'volume-slider';
  volumeInput.setAttribute('aria-label', 'Volume');
  const volumeValue = el('span', 'volume-label', `${data.volume ?? 100}%`);
  volumeInput.addEventListener('input', () => {
    volumeValue.textContent = `${volumeInput.value}%`;
    volumeToggle.replaceChildren(icon(Number(volumeInput.value) === 0 ? 'volume-x' : 'volume-2'));
    setVolume(Number(volumeInput.value));
  });
  volumePopover.appendChild(volumeInput);
  volumePopover.appendChild(volumeValue);

  function closeVolumePopover() {
    volumePopoverOpen = false;
    volumeControl.classList.remove('is-open');
    if (removeVolumeOutsideListener) {
      removeVolumeOutsideListener();
      removeVolumeOutsideListener = null;
    }
  }
  function openVolumePopover() {
    volumePopoverOpen = true;
    volumeControl.classList.add('is-open');
    // Reanexa os listeners a cada chamada (inclusive ao restaurar o estado após um poll), já que
    // o node antigo de volumeControl foi descartado no rebuild do DOM.
    if (removeVolumeOutsideListener) removeVolumeOutsideListener();
    const handleOutsideClick = (event) => {
      if (!volumeControl.contains(event.target)) closeVolumePopover();
    };
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeVolumePopover();
        volumeToggle.focus();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);
    removeVolumeOutsideListener = () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }
  volumeToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (volumeControl.classList.contains('is-open')) closeVolumePopover();
    else openVolumePopover();
  });
  // Preserva o popover aberto entre polls (renderQueue() recria esse DOM a cada 4s).
  if (volumePopoverOpen) openVolumePopover();

  volumeControl.appendChild(volumeToggle);
  volumeControl.appendChild(volumePopover);
  volumeRow.appendChild(volumeControl);

  const leaveBtn = el('button', 'btn-leave');
  leaveBtn.type = 'button';
  leaveBtn.title = 'Sair do canal';
  leaveBtn.setAttribute('aria-label', 'Sair do canal');
  leaveBtn.appendChild(icon('log-out'));
  leaveBtn.addEventListener('click', () => void leaveChannel());
  volumeRow.appendChild(leaveBtn);

  card.appendChild(volumeRow);

  return card;
}

async function loadQueue() {
  const res = await api('/api/queue');
  if (res.status === 401) {
    stopPolling();
    renderLogin();
    return;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    stopTicking();
    if (body.error === 'no_guild_selected') {
      // Sessão perdeu a seleção de servidor no meio do caminho (raro) — volta pro seletor em
      // vez de deixar o usuário travado numa mensagem de erro sem saída.
      stopPolling();
      const ready = await ensureGuildSelected();
      if (ready) await startQueueLoop();
      return;
    }
    renderBlocked(ERROR_MESSAGES[body.error] ?? 'Não foi possível carregar a fila.');
    return;
  }

  const data = await res.json();
  lastData = data;
  localPositionMs = data.positionMs ?? 0;

  // renderQueue() reconstrói o DOM inteiro a cada poll, o que recriaria o <input> do
  // formulário de adicionar música (perdendo o que o usuário estava digitando e o foco)
  // a cada 4s. Preserva o valor/seleção/foco do input se ele estava em uso.
  const activeInput = document.querySelector('.add-track input');
  const preservedInput =
    activeInput instanceof HTMLInputElement && document.activeElement === activeInput
      ? {
          value: activeInput.value,
          selectionStart: activeInput.selectionStart,
          selectionEnd: activeInput.selectionEnd,
        }
      : null;

  renderQueue(data);

  if (preservedInput) {
    const newInput = document.querySelector('.add-track input');
    if (newInput instanceof HTMLInputElement) {
      newInput.value = preservedInput.value;
      newInput.focus();
      newInput.setSelectionRange(preservedInput.selectionStart, preservedInput.selectionEnd);
    }
  }

  startTicking();
}

function renderQueue(data) {
  app.textContent = '';
  app.appendChild(renderPlayer(data));

  const addSection = el('section', 'card add-track');
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Nome ou link da música';
  input.required = true;
  input.maxLength = 300;

  const submit = el('button', 'btn btn-primary btn-icon-only');
  submit.type = 'submit';
  submit.title = 'Adicionar à fila';
  submit.setAttribute('aria-label', 'Adicionar à fila');
  submit.appendChild(icon('plus'));

  const playNextBtn = el('button', 'btn btn-secondary btn-icon-only');
  playNextBtn.type = 'button';
  playNextBtn.title = 'Tocar a seguir (topo da fila)';
  playNextBtn.setAttribute('aria-label', 'Tocar a seguir (topo da fila)');
  playNextBtn.appendChild(icon('list-start'));

  const formError = el('p', 'form-error');
  formError.setAttribute('role', 'alert');

  const submitTrack = async (playNext) => {
    if (!input.reportValidity()) return;
    formError.textContent = '';
    submit.disabled = true;
    playNextBtn.disabled = true;
    (playNext ? playNextBtn : submit).classList.add('is-loading');
    const res = await api('/api/queue/add', {
      method: 'POST',
      body: JSON.stringify({ query: input.value, playNext }),
    });
    submit.disabled = false;
    playNextBtn.disabled = false;
    submit.classList.remove('is-loading');
    playNextBtn.classList.remove('is-loading');
    if (res.ok) {
      input.value = '';
      await loadQueue();
    } else {
      const body = await res.json().catch(() => ({}));
      formError.textContent =
        ADD_TRACK_ERROR_MESSAGES[body.error] ?? 'Não foi possível adicionar a música. Tente novamente.';
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitTrack(false);
  });
  playNextBtn.addEventListener('click', () => void submitTrack(true));

  form.appendChild(input);
  form.appendChild(submit);
  form.appendChild(playNextBtn);
  addSection.appendChild(form);
  addSection.appendChild(formError);
  app.appendChild(addSection);

  const queueSection = el('section', 'card queue-list');
  const queueHeader = el('div', 'queue-header');
  queueHeader.appendChild(el('h2', null, 'Fila'));
  queueHeader.appendChild(el('span', 'queue-count', String(data.tracks.length)));
  if (data.tracks.length > 0) {
    const clearBtn = el('button', 'btn btn-link');
    clearBtn.type = 'button';
    clearBtn.appendChild(icon('trash-2'));
    clearBtn.appendChild(el('span', null, 'Limpar'));
    clearBtn.addEventListener('click', () => void clearQueue());
    queueHeader.appendChild(clearBtn);
  }
  queueSection.appendChild(queueHeader);
  if (data.tracks.length === 0) {
    queueSection.appendChild(el('p', 'empty', 'Fila vazia — adicione uma música acima.'));
  } else {
    const list = document.createElement('ul');
    data.tracks.forEach((track, index) => {
      list.appendChild(
        trackRow(track, index, {
          onMoveToTop: () => void moveTrackToTop(index),
          onUp: () => void moveTrack(index, 'up'),
          onDown: () => void moveTrack(index, 'down'),
          onRemove: () => void removeTrack(index),
          isFirst: index === 0,
          isLast: index === data.tracks.length - 1,
        }),
      );
    });
    queueSection.appendChild(list);
  }
  app.appendChild(queueSection);
}

function startTicking() {
  stopTicking();
  if (!lastData?.current || lastData.current.isStream || !lastData.playing || lastData.paused) return;
  tickTimer = setInterval(() => {
    localPositionMs += 250;
    const bar = document.querySelector('.progress-bar');
    if (bar && lastData?.current?.durationMs) {
      bar.style.width = `${Math.min(100, (localPositionMs / lastData.current.durationMs) * 100)}%`;
    }
    const times = document.querySelector('.progress-times');
    if (times?.firstChild) times.firstChild.textContent = formatMs(localPositionMs);
  }, 250);
}

function stopTicking() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  stopTicking();
}

async function startQueueLoop() {
  await loadQueue();
  pollTimer = setInterval(loadQueue, POLL_INTERVAL_MS);
}

async function init() {
  const res = await api('/api/me');
  if (res.status === 401) {
    renderLogin();
    return;
  }
  const user = await res.json();
  renderUser(user);

  const ready = await ensureGuildSelected();
  if (!ready) return; // login/seletor/erro já renderizado; o seletor chama startQueueLoop() no clique

  await startQueueLoop();
}

void init();
