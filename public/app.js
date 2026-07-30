const app = document.getElementById('app');
const userBox = document.getElementById('user-box');

const ERROR_MESSAGES = {
  not_authenticated: null, // tratado separadamente (mostra tela de login)
  bot_not_ready: 'O bot ainda está inicializando. Tente novamente em instantes.',
  not_in_voice_channel: 'Entre em um canal de voz do servidor para gerenciar a fila.',
  wrong_voice_channel: 'Você precisa estar no mesmo canal de voz que o bot está tocando.',
};

let pollTimer = null;
let dragIndex = null;

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

function trackRow(track, index, isDraggable) {
  const row = el('li', 'track-row');
  row.draggable = isDraggable;
  row.dataset.index = String(index);

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

  if (isDraggable) {
    row.appendChild(el('span', 'drag-handle', '⠿'));
  }

  return row;
}

async function moveTrack(index, direction) {
  await api('/api/queue/move', { method: 'POST', body: JSON.stringify({ index, direction }) });
  await loadQueue();
}

function attachDragHandlers(list) {
  list.querySelectorAll('.track-row').forEach((row) => {
    row.addEventListener('dragstart', () => {
      dragIndex = Number(row.dataset.index);
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      dragIndex = null;
    });
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      const targetIndex = Number(row.dataset.index);
      if (dragIndex === null || targetIndex === dragIndex) return;
      // Só é permitido soltar em cima do vizinho imediato (troca de posição única).
      if (Math.abs(targetIndex - dragIndex) !== 1) return;
      const direction = targetIndex < dragIndex ? 'up' : 'down';
      void moveTrack(dragIndex, direction);
    });
  });
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
    renderBlocked(ERROR_MESSAGES[body.error] ?? 'Não foi possível carregar a fila.');
    return;
  }

  const data = await res.json();
  renderQueue(data);
}

function renderQueue(data) {
  app.textContent = '';

  const nowPlaying = el('section', 'card now-playing');
  nowPlaying.appendChild(el('h2', null, 'Tocando agora'));
  if (data.current) {
    nowPlaying.appendChild(trackRow(data.current, -1, false));
  } else {
    nowPlaying.appendChild(el('p', 'empty', 'Nada tocando no momento.'));
  }
  app.appendChild(nowPlaying);

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
      list.appendChild(trackRow(track, index, data.tracks.length > 1));
    });
    queueSection.appendChild(list);
    queueSection.appendChild(el('p', 'hint', 'Arraste uma música para trocar de posição com a vizinha.'));
    attachDragHandlers(list);
  }
  app.appendChild(queueSection);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
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
  pollTimer = setInterval(loadQueue, 4000);
}

void init();
