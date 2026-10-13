(() => {
  const root = document.getElementById('projectCards');
  if (!root) return;

  const PROJECTS = window.PROJECTS || [];

  const STATES = { working: 'Working on', finished: 'Finished', planned: 'Planned' };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  async function getJson(url) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  const avatars = {};
  function avatarOf(id) {
    if (!avatars[id]) avatars[id] = (async () => {
      try {
        const j = await getJson(`https://api.lanyard.rest/v1/users/${id}`);
        const u = j && j.success && j.data && j.data.discord_user;
        if (u && u.avatar) return `https://cdn.discordapp.com/avatars/${id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=64`;
      } catch (e) {}
      try {
        const u = await getJson(`https://api.discordlookup.com/v1/user/${id}`);
        if (u && u.avatar && u.avatar.link) return u.avatar.link;
      } catch (e) {}
      return null;
    })();
    return avatars[id];
  }

  const car = makeCarousel(root, 'project', 'projects');

  function makeCard(p) {
    const card = el('article', 'card pcard');
    const body = el('div', 'pcard-body');
    const state = STATES[p.state] ? p.state : 'planned';
    body.append(el('span', 'ptag ' + state, p.label || STATES[state]), el('h4', null, p.title || ''));
    if (p.info) body.append(el('p', null, p.info));

    const link = String(p.anchor || '').trim();
    if (link && link !== '#') {
      const go = el('a', 'ubtn panchor');
      go.append(window.iconize ? window.iconize(p.button || 'Open project') : document.createTextNode(p.button || 'Open project'));
      const tail = p.buttonIcon === undefined ? 'tab' : p.buttonIcon;
      const tailIcon = tail && window.makeIcon ? window.makeIcon(tail) : null;
      if (tailIcon) go.append(tailIcon);
      go.href = link;
      go.target = '_blank';
      go.rel = 'noopener noreferrer';
      body.append(go);
    }

    const a = p.author || {};
    const profile = a.page || a.url || '';
    const foot = el(profile ? 'a' : 'div', 'pcard-author');
    if (profile) {
      foot.href = profile;
      if (!a.page) {
        foot.target = '_blank';
        foot.rel = 'noopener noreferrer';
      }
      foot.title = 'About ' + (a.name || 'this dev');
    }
    const av = el('span', 'pav', String(a.name || '?').trim().charAt(0).toUpperCase());
    const who = el('div', 'pwho');
    who.append(el('div', 'pwho-label', 'Written by'), el('div', 'pwho-name', a.name || 'Unknown'));
    foot.append(av, who);
    const setAvatar = url => {
      const img = el('img');
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => { av.textContent = ''; av.append(img); };
      img.src = url;
    };
    if (a.avatar) setAvatar(a.avatar);
    else if (a.id) avatarOf(a.id).then(url => { if (url) setAvatar(url); });

    const head = window.makeMedia({
      src: p.icon,
      video: p.video,
      poster: p.poster,
      placeholder: 'assets/projects/placeholder.png',
      showEmpty: true
    });
    card.append(head, body, foot);
    car.add(card);
  }
  PROJECTS.forEach(makeCard);
})();
