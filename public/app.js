const app = document.getElementById('app');
const userBox = document.getElementById('user-box');

const ERROR_MESSAGES = {
  not_authenticated: null, // tratado separadamente (mostra tela de login)
  bot_not_ready: 'O bot ainda está inicializando. Tente novamente em instantes.',
  not_in_voice_channel: 'Entre em um canal de voz do servidor para gerenciar a fila.',
  wrong_voice_channel: 'Você precisa estar no mesmo canal de voz que o bot está tocando.',
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
  'log-in':
    '<path d="m10 17 5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />',
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
  'music-4':
    '<path d="M9 18V5l12-2v13" /><path d="m9 9 12-2" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />',
  'loader-circle': '<path d="M21 12a9 9 0 1 1-6.219-8.56" />',
  'disc-3':
    '<circle cx="12" cy="12" r="10" /><path d="M6 12c0-1.7.7-3.2 1.8-4.2" /><circle cx="12" cy="12" r="2" /><path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(name, extraClass) {
  const wrapper = document.createElementNS(SVG_NS, 'svg');
  wrapper.setAttribute('viewBox', '0 0 24 24');
  wrapper.setAttribute('fill', 'none');
  wrapper.setAttribute('stroke', 'currentColor');
  wrapper.setAttribute('stroke-width', '2');
  wrapper.setAttribute('stroke-linecap', 'round');
  wrapper.setAttribute('stroke-linejoin', 'round');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.setAttribute('class', extraClass ? `icon ${extraClass}` : 'icon');
  wrapper.innerHTML = ICON_PATHS[name] ?? '';
  return wrapper;
}

let pollTimer = null;
let tickTimer = null;
let lastData = null;
let localPositionMs = 0;

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

function renderLogin() {
  userBox.textContent = '';
  app.textContent = '';
  const box = el('div', 'card login-card');
  box.appendChild(icon('music-4', 'login-mark'));
  box.appendChild(el('h2', null, 'Marola Beat'));
  box.appendChild(el('p', null, 'Entre com sua conta do Discord para gerenciar a fila.'));
  const link = el('a', 'btn btn-primary');
  link.href = '/auth/login';
  link.appendChild(icon('log-in'));
  link.appendChild(el('span', null, 'Entrar com Discord'));
  box.appendChild(link);
  app.appendChild(box);
}

function renderBlocked(message) {
  app.textContent = '';
  const box = el('div', 'card blocked-card');
  box.appendChild(el('p', null, message));
  app.appendChild(box);
}

function renderUser(user) {
  userBox.textContent = '';
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const img = document.createElement('img');
  img.src = avatarUrl;
  img.alt = '';
  img.className = 'avatar';
  userBox.appendChild(img);
  userBox.appendChild(el('span', 'username', user.username));
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

function trackRow(track, index, { onUp, onDown, onRemove, isFirst, isLast } = {}) {
  const row = el('li', 'track-row');

  if (track.thumbnail) {
    const thumb = document.createElement('img');
    thumb.src = track.thumbnail;
    thumb.alt = '';
    thumb.className = 'thumb';
    row.appendChild(thumb);
  }

  const info = el('div', 'track-info');
  info.appendChild(el('div', 'track-title', track.title));
  info.appendChild(
    el('div', 'track-meta', `${track.author} • ${track.duration} • pedido por ${track.requestedBy}`),
  );
  row.appendChild(info);

  if (onUp || onDown || onRemove) {
    const actions = el('div', 'track-actions');
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
  info.appendChild(el('div', 'track-title', track.title));
  info.appendChild(el('div', 'track-meta', `${track.author} • pedido por ${track.requestedBy}`));

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
  volumeRow.appendChild(icon('volume-2', 'volume-icon'));
  const volumeInput = document.createElement('input');
  volumeInput.type = 'range';
  volumeInput.min = '0';
  volumeInput.max = '200';
  volumeInput.value = String(data.volume ?? 100);
  volumeInput.className = 'volume-slider';
  volumeInput.setAttribute('aria-label', 'Volume');
  const volumeValue = el('span', 'volume-label', `${data.volume ?? 100}%`);
  volumeInput.addEventListener('input', () => {
    volumeValue.textContent = `${volumeInput.value}%`;
    setVolume(Number(volumeInput.value));
  });
  volumeRow.appendChild(volumeInput);
  volumeRow.appendChild(volumeValue);

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
  input.placeholder = 'Nome da música ou link (YouTube, SoundCloud...)';
  input.required = true;
  input.maxLength = 300;
  const submit = el('button', 'btn btn-primary btn-icon-only');
  submit.type = 'submit';
  submit.title = 'Adicionar à fila';
  submit.setAttribute('aria-label', 'Adicionar à fila');
  submit.appendChild(icon('plus'));
  form.appendChild(input);
  form.appendChild(submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void (async () => {
      submit.disabled = true;
      submit.classList.add('is-loading');
      const res = await api('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({ query: input.value }),
      });
      submit.disabled = false;
      submit.classList.remove('is-loading');
      if (res.ok) {
        input.value = '';
        await loadQueue();
      }
    })();
  });
  addSection.appendChild(form);
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

async function init() {
  const res = await api('/api/me');
  if (res.status === 401) {
    renderLogin();
    return;
  }
  const user = await res.json();
  renderUser(user);
  await loadQueue();
  pollTimer = setInterval(loadQueue, POLL_INTERVAL_MS);
}

void init();
