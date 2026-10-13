(() => {
  const { guild: GUILD, invite: INVITE, users: USERS, hidden: HIDDEN } = window.CONTACTS;

  const norm = t => String(t || '').toLowerCase().replace(/\s+/g, '');
  const hiddenList = HIDDEN.map(norm).filter(Boolean);
  const isHidden = m => {
    const hay = [norm(m.username), norm(m.nick)];
    return hiddenList.some(h => hay.some(x => x.includes(h)));
  };

  const root = document.getElementById('contactCards');
  if (!root) return;

  const COLORS = { online: '#3ba55d', idle: '#faa61a', dnd: '#ed4245', offline: '#747f8d' };
  const LABELS = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const defaultAvatar = id => {
    let i = 0;
    try { i = Number((BigInt(id) >> 22n) % 6n); } catch (e) {}
    return `https://cdn.discordapp.com/embed/avatars/${i}.png`;
  };
  const avatarUrl = (id, hash) =>
    hash ? `https://cdn.discordapp.com/avatars/${id}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256` : defaultAvatar(id);

async function getJson(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

  async function lookup(id) {
    try {
      const j = await getJson(`https://api.lanyard.rest/v1/users/${id}`);
      if (j && j.success && j.data && j.data.discord_user) {
        const u = j.data.discord_user;
        return { name: u.global_name || u.username, username: u.username, avatar: avatarUrl(id, u.avatar), real: !!u.avatar, status: j.data.discord_status };
      }
    } catch (e) {}
    try {
      const u = await getJson(`https://api.discordlookup.com/v1/user/${id}`);
    if (u && u.id) {
      const real = !!(u.avatar && u.avatar.id);
      return { name: u.global_name || u.username, username: u.username, avatar: real ? u.avatar.link : defaultAvatar(id), real, status: null };
    }
    } catch (e) {}
    return null;
  }

  function copy(text, btn) {
    const done = () => {
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {});
    } else {
      const ta = el('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }
  const car = makeCarousel(root, 'person', 'people');

  function makeCard(o) {
    const card = el('div', 'ucard');
    const top = el('div', 'ucard-top');

    const av = el('div', 'ucard-av');
    const img = el('img');
    img.alt = ''; img.width = 88; img.height = 88;
    img.referrerPolicy = 'no-referrer';
    const fallback = o.id ? defaultAvatar(o.id) : defaultAvatar('0');
    img.onerror = () => { img.onerror = null; img.src = fallback; };
    img.src = o.avatar || fallback;
    const dot = el('span', 'ucard-dot');
    dot.hidden = true;
    av.append(img, dot);

    const who = el('div', 'ucard-who');
    const name = el('div', 'ucard-name', o.name || o.username || 'Discord user');
    const handle = el('div', 'ucard-handle', o.username ? '@' + o.username : '');
    const st = el('div', 'ucard-status');
    who.append(name, handle, st);
    top.append(av, who);

    if (o.status) {
      const k = COLORS[o.status] ? o.status : 'offline';
      dot.hidden = false;
      dot.style.background = COLORS[k];
      st.textContent = LABELS[k];
      st.style.color = COLORS[k];
    }

    const row = el('div', 'ucard-actions');
    if (o.id) {
      const add = el('a', 'ubtn primary', 'Add friend');
      add.href = `https://discord.com/users/${o.id}`;
      add.target = '_blank'; add.rel = 'noopener noreferrer';
      const app = el('a', 'ubtn', 'Open app');
      app.href = `discord://-/users/${o.id}`;
      row.append(add, app);
    } else {
      const join = el('a', 'ubtn primary', 'Join server');
      join.href = o.invite || INVITE;
      join.target = '_blank'; join.rel = 'noopener noreferrer';
      row.append(join);
    }
    const cp = el('button', 'ubtn', 'Copy @name');
    cp.type = 'button';
    cp.onclick = () => copy(handle.textContent ? handle.textContent.slice(1) : (o.id || ''), cp);
    row.append(cp);

    card.append(top, row);
    car.add(card);
  }

  const note = el('p', 'embed-note', 'Checking who is online...');
  root.append(note);

  async function load() {
    const profiles = await Promise.all(USERS.map(u => lookup(u.id)));
    let members = null;
    try {
      const w = await getJson(`https://discord.com/api/guilds/${GUILD}/widget.json`);
      members = (w && w.members) || [];
    } catch (e) {}

    const used = new Set();
    let shown = 0;
    const show = o => {
      if (o.status === 'offline') return;
      makeCard(o);
      shown++;
    };

    USERS.forEach((u, i) => {
      const p = profiles[i];
      const username = (p && p.username) || u.username;
      let m = null;
      if (members) {
        const names = [u.username, username].filter(Boolean).map(n => n.toLowerCase());
        m = members.find(x => {
          const hay = ((x.username || '') + ' ' + (x.nick || '')).toLowerCase();
          return (u.match && u.match.test(hay)) || names.some(n => hay.includes(n));
        });
      }
      if (m) used.add(m);
      let avatar = p && p.avatar;
      if (m && !(p && p.real) && m.avatar_url) avatar = m.avatar_url;
      const status = m ? (m.status || 'online') : (p && p.status) || (members ? 'offline' : null);
      show({ id: u.id, username, name: u.name || (p && p.name), avatar, real: !!(p && p.real), status });
    });

    (members || []).filter(m => !used.has(m) && !isHidden(m)).forEach(m => {
      show({ username: m.username, name: m.nick || m.username, avatar: m.avatar_url, real: true, status: m.status || 'online', invite: INVITE });
    });
    if (shown) note.remove();
    else note.textContent = 'Nobody is online right now. Join the Discord and say hi!';
  }

  load();
})();
