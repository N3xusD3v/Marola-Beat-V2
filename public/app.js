const app = document.getElementById('app');
const userBox = document.getElementById('user-box');

const ERROR_MESSAGES = {
  not_authenticated: null, // tratado separadamente (mostra tela de login)
  bot_not_ready: 'O bot ainda está inicializando. Tente novamente em instantes.',
  not_in_voice_channel: 'Entre em um canal de voz do servidor para gerenciar a fila.',
  wrong_voice_channel: 'Você precisa estar no mesmo canal de voz que o bot está tocando.',
};

const POLL_INTERVAL_MS = 4000;

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
  box.appendChild(el('p', null, 'Entre com sua conta do Discord para gerenciar a fila.'));
  const link = el('a', 'btn btn-primary', 'Entrar com Discord');
  link.href = '/auth/login';
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
  userBox.appendChild(el('span', null, user.username));
  const logout = el('button', 'btn btn-link', 'Sair');
  logout.addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    stopPolling();
    renderLogin();
  });
  userBox.appendChild(logout);
}

function actionButton(label, title, onClick, disabled) {
  const btn = el('button', 'icon-btn', label);
  btn.type = 'button';
  btn.title = title;
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
    if (onUp) actions.appendChild(actionButton('▲', 'Mover para cima', onUp, isFirst));
    if (onDown) actions.appendChild(actionButton('▼', 'Mover para baixo', onDown, isLast));
    if (onRemove) actions.appendChild(actionButton('✕', 'Remover da fila', onRemove));
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

function renderPlayer(data) {
  const card = el('section', 'card now-playing');
  card.appendChild(el('h2', null, 'Tocando agora'));

  if (!data.current) {
    card.appendChild(el('p', 'empty', 'Nada tocando no momento.'));
    return card;
  }

  const track = data.current;
  const body = el('div', 'player-body');

  if (track.thumbnail) {
    const thumb = document.createElement('img');
    thumb.src = track.thumbnail;
    thumb.alt = '';
    thumb.className = 'thumb thumb-large';
    body.appendChild(thumb);
  }

  const info = el('div', 'track-info');
  info.appendChild(el('div', 'track-title', track.title));
  info.appendChild(el('div', 'track-meta', `${track.author} • pedido por ${track.requestedBy}`));

  if (!track.isStream) {
    const progress = el('div', 'progress');
    const bar = el('div', 'progress-bar');
    const pct = track.durationMs > 0 ? Math.min(100, (localPositionMs / track.durationMs) * 100) : 0;
    bar.style.width = `${pct}%`;
    progress.appendChild(bar);
    info.appendChild(progress);

    const times = el('div', 'progress-times');
    times.appendChild(el('span', null, formatMs(localPositionMs)));
    times.appendChild(el('span', null, track.duration));
    info.appendChild(times);
  } else {
    info.appendChild(el('div', 'progress-times', 'AO VIVO'));
  }

  body.appendChild(info);
  card.appendChild(body);

  const controls = el('div', 'player-controls');
  const pauseBtn = el('button', 'btn btn-primary', data.paused ? '▶ Retomar' : '⏸ Pausar');
  pauseBtn.type = 'button';
  pauseBtn.addEventListener('click', () => void togglePause());
  controls.appendChild(pauseBtn);

  const skipBtn = el('button', 'btn btn-secondary', '⏭ Pular');
  skipBtn.type = 'button';
  skipBtn.addEventListener('click', () => void skipTrack());
  controls.appendChild(skipBtn);

  card.appendChild(controls);
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
  renderQueue(data);
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
  const submit = el('button', 'btn btn-primary', 'Adicionar');
  submit.type = 'submit';
  form.appendChild(input);
  form.appendChild(submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void (async () => {
      submit.disabled = true;
      const res = await api('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({ query: input.value }),
      });
      submit.disabled = false;
      if (res.ok) {
        input.value = '';
        await loadQueue();
      }
    })();
  });
  addSection.appendChild(form);
  app.appendChild(addSection);

  const queueSection = el('section', 'card queue-list');
  queueSection.appendChild(el('h2', null, `Fila (${data.tracks.length})`));
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
