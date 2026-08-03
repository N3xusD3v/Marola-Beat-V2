const app = document.getElementById('app');
const userBox = document.getElementById('user-box');

// Ícones Lucide (https://lucide.dev, licença ISC), mesmos paths de app.js — subconjunto usado
// nesta página.
const ICON_PATHS = {
  'log-out':
    '<path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />',
  'trash-2':
    '<path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
  search: '<path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(name, extraClass) {
  const wrapper = document.createElementNS(SVG_NS, 'svg');
  wrapper.setAttribute('viewBox', '0 0 24 24');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.setAttribute('class', extraClass ? `icon ${extraClass}` : 'icon');
  wrapper.setAttribute('fill', 'none');
  wrapper.setAttribute('stroke', 'currentColor');
  wrapper.setAttribute('stroke-width', '2');
  wrapper.setAttribute('stroke-linecap', 'round');
  wrapper.setAttribute('stroke-linejoin', 'round');
  wrapper.innerHTML = ICON_PATHS[name] ?? '';
  return wrapper;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function api(path, options) {
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function avatarUrl(user) {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
}

function renderTopbarUser(user) {
  userBox.textContent = '';
  const img = document.createElement('img');
  img.src = avatarUrl(user);
  img.alt = '';
  img.className = 'avatar';
  userBox.appendChild(img);
  userBox.appendChild(el('span', 'username', user.displayName ?? user.username));

  const logout = el('button', 'icon-btn icon-btn-ghost');
  logout.type = 'button';
  logout.title = 'Sair da conta';
  logout.setAttribute('aria-label', 'Sair da conta');
  logout.appendChild(icon('log-out'));
  logout.addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
  userBox.appendChild(logout);
}

function renderMessage(text, linkHref, linkText) {
  app.textContent = '';
  const box = el('div', 'card blocked-card');
  box.appendChild(el('p', null, text));
  if (linkHref) {
    const link = el('a', 'btn btn-secondary', linkText);
    link.href = linkHref;
    box.appendChild(link);
  }
  app.appendChild(box);
}

let allGuilds = [];
let allUsers = [];

function renderStats(stats) {
  const card = el('section', 'card admin-stats-card');
  const grid = el('div', 'admin-stats-grid');
  const entries = [
    ['Servidores', stats.guildCount],
    ['Membros alcançados', stats.totalMembers],
    ['Usuários já logados', stats.userCount],
    ['Ativos (7 dias)', stats.activeUsersLast7Days],
  ];
  for (const [label, value] of entries) {
    const stat = el('div', 'admin-stat');
    stat.appendChild(el('strong', null, String(value)));
    stat.appendChild(el('span', null, label));
    grid.appendChild(stat);
  }
  card.appendChild(grid);
  return card;
}

function matchesFilter(text, query) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function renderGuildsSection() {
  const card = el('section', 'card');
  const header = el('div', 'card-header');
  header.appendChild(el('h2', null, `Servidores (${allGuilds.length})`));
  card.appendChild(header);

  const searchBox = el('div', 'admin-search');
  searchBox.appendChild(icon('search'));
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Buscar servidor…';
  searchBox.appendChild(searchInput);
  card.appendChild(searchBox);

  const list = el('ul', 'admin-list');
  card.appendChild(list);

  function renderList() {
    list.textContent = '';
    const query = searchInput.value.trim();
    const filtered = query ? allGuilds.filter((guild) => matchesFilter(guild.name, query)) : allGuilds;

    if (filtered.length === 0) {
      list.appendChild(el('li', 'empty', 'Nenhum servidor encontrado.'));
      return;
    }

    for (const guild of filtered) {
      const item = el('li', 'admin-row');

      if (guild.icon) {
        const img = document.createElement('img');
        img.src = guild.icon;
        img.alt = '';
        img.className = 'admin-row-icon';
        item.appendChild(img);
      } else {
        item.appendChild(el('div', 'admin-row-icon admin-row-icon-fallback', guild.name.charAt(0)));
      }

      const info = el('div', 'admin-row-info');
      info.appendChild(el('span', 'admin-row-title', guild.name));
      const meta = el('span', 'admin-row-meta');
      meta.textContent = `${guild.memberCount} membro(s) · entrou em ${formatDateTime(guild.joinedAt)} · última atividade: ${formatDateTime(guild.lastActiveAt)}${guild.lastActiveUser ? ` (${guild.lastActiveUser})` : ''}`;
      info.appendChild(meta);
      item.appendChild(info);

      const leaveBtn = el('button', 'btn btn-danger admin-row-action');
      leaveBtn.type = 'button';
      leaveBtn.appendChild(icon('trash-2'));
      leaveBtn.appendChild(el('span', null, 'Remover'));
      leaveBtn.addEventListener('click', () => {
        void handleLeaveGuild(guild, leaveBtn);
      });
      item.appendChild(leaveBtn);

      list.appendChild(item);
    }
  }

  searchInput.addEventListener('input', renderList);
  renderList();
  return card;
}

async function handleLeaveGuild(guild, button) {
  const confirmed = window.confirm(
    `Remover o bot do servidor "${guild.name}"? Ele só volta se alguém convidá-lo de novo.`,
  );
  if (!confirmed) return;

  button.disabled = true;
  const res = await api(`/api/admin/guilds/${guild.id}/leave`, { method: 'POST' });
  if (res.ok) {
    await loadAll();
  } else {
    button.disabled = false;
    window.alert('Não foi possível remover o bot desse servidor. Tente novamente.');
  }
}

function renderUsersSection() {
  const card = el('section', 'card');
  const header = el('div', 'card-header');
  header.appendChild(el('h2', null, `Usuários (${allUsers.length})`));
  card.appendChild(header);

  const searchBox = el('div', 'admin-search');
  searchBox.appendChild(icon('search'));
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Buscar usuário…';
  searchBox.appendChild(searchInput);
  card.appendChild(searchBox);

  const list = el('ul', 'admin-list');
  card.appendChild(list);

  function renderList() {
    list.textContent = '';
    const query = searchInput.value.trim();
    // user.displayName pode não existir em registros gravados antes desse campo existir — cai
    // pro username nesse caso.
    const filtered = query
      ? allUsers.filter((user) => matchesFilter(user.displayName ?? user.username, query))
      : allUsers;

    if (filtered.length === 0) {
      list.appendChild(el('li', 'empty', 'Nenhum usuário encontrado.'));
      return;
    }

    for (const user of filtered) {
      const item = el('li', 'admin-row');

      const img = document.createElement('img');
      img.src = avatarUrl(user);
      img.alt = '';
      img.className = 'admin-row-icon admin-row-avatar';
      item.appendChild(img);

      const info = el('div', 'admin-row-info');
      info.appendChild(el('span', 'admin-row-title', user.displayName ?? user.username));
      const meta = el('span', 'admin-row-meta');
      meta.textContent = `${user.loginCount} login(s) · primeiro em ${formatDateTime(user.firstLoginAt)} · último em ${formatDateTime(user.lastLoginAt)}`;
      info.appendChild(meta);
      item.appendChild(info);

      list.appendChild(item);
    }
  }

  searchInput.addEventListener('input', renderList);
  renderList();
  return card;
}

function renderToolbar() {
  const bar = el('div', 'admin-toolbar');
  bar.appendChild(el('p', 'admin-subtitle', 'Visão geral do bot — só você tem acesso a esta página.'));
  const refreshBtn = el('button', 'btn btn-secondary', 'Atualizar');
  refreshBtn.type = 'button';
  refreshBtn.addEventListener('click', () => {
    void loadAll();
  });
  bar.appendChild(refreshBtn);
  return bar;
}

async function loadAll() {
  app.textContent = '';
  app.appendChild(el('p', 'loading', 'Carregando…'));

  const [statsRes, guildsRes, usersRes] = await Promise.all([
    api('/api/admin/stats'),
    api('/api/admin/guilds'),
    api('/api/admin/users'),
  ]);

  if (!statsRes.ok || !guildsRes.ok || !usersRes.ok) {
    renderMessage('Não foi possível carregar os dados do painel. Tente novamente.', '/', 'Voltar ao painel');
    return;
  }

  const stats = await statsRes.json();
  allGuilds = (await guildsRes.json()).guilds;
  allUsers = (await usersRes.json()).users;

  app.textContent = '';
  app.appendChild(renderToolbar());
  app.appendChild(renderStats(stats));
  app.appendChild(renderGuildsSection());
  app.appendChild(renderUsersSection());
}

async function init() {
  const meRes = await api('/api/me');
  if (!meRes.ok) {
    window.location.href = '/auth/login';
    return;
  }

  const user = await meRes.json();
  renderTopbarUser(user);

  if (!user.isAdmin) {
    renderMessage('Acesso restrito ao administrador do bot.', '/', 'Voltar ao painel');
    return;
  }

  await loadAll();
}

void init();
