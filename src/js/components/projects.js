(() => {
  const root = document.getElementById('projectCards');
  if (!root) return;

  const PROJECTS = window.PROJECTS || [];

  const STATES = { working: 'Working on', finished: 'Finished', planned: 'Planned' };
  const VIDEO = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;
  const PLAY = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M26 20l20 12-20 12z"/></svg>';

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

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="line" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="line" d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="line" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>'
  };

  const clock = t => {
    t = Math.max(0, Math.floor(t || 0));
    return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  };

  function makePlayer(src, poster) {
    const root = el('div', 'pvid');
    const v = el('video');
    v.playsInline = true;
    v.preload = 'auto';
    if (poster) v.poster = poster;
    v.src = src;

    const bar = el('div', 'pctl');
      const btn = (label, html) => {
        const b = el('button', 'pbtn');
        b.type = 'button';
        b.setAttribute('aria-label', label);
        b.innerHTML = html;
        return b;
      };
    const toggle = btn('Pause', ICONS.pause);
    const time = el('span', 'ptime', '0:00 / 0:00');
    const seek = el('input', 'pseek');
    seek.type = 'range';
    seek.min = '0';
    seek.max = '1000';
    seek.value = '0';
    seek.setAttribute('aria-label', 'Seek');
    const mute = btn('Mute', ICONS.vol);
    const full = btn('Fullscreen', ICONS.full);
    bar.append(toggle, seek, time, mute, full);
    root.append(v, bar);


    const paint = () => {
      const d = v.duration || 0;
      const f = d ? v.currentTime / d : 0;
      seek.value = String(Math.round(f * 1000));
      seek.style.setProperty('--f', (f * 100) + '%');
      time.textContent = clock(v.currentTime) + ' / ' + clock(d);
    };
    const state = () => {
      const playing = !v.paused && !v.ended;
      toggle.innerHTML = playing ? ICONS.pause : ICONS.play;
      toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      root.classList.toggle('paused', !playing);
    };
    const flip = () => { if (v.paused || v.ended) v.play().catch(() => {}); else v.pause(); };
    v.addEventListener('timeupdate', paint);
    v.addEventListener('loadedmetadata', paint);
    v.addEventListener('durationchange', paint);
    for (const ev of ['play', 'pause', 'ended']) v.addEventListener(ev, state);
    v.addEventListener('waiting', () => root.classList.add('wait'));
    for (const ev of ['playing', 'canplay', 'pause']) v.addEventListener(ev, () => root.classList.remove('wait'));
    v.addEventListener('click', flip);
    toggle.addEventListener('click', flip);
    seek.addEventListener('input', () => {
      if (v.duration) v.currentTime = (seek.value / 1000) * v.duration;
      paint();
    });
  mute.addEventListener('click', () => {
    v.muted = !v.muted;
    mute.innerHTML = v.muted ? ICONS.mute : ICONS.vol;
    mute.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
  });
    full.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    root.addEventListener('keydown', e => {
      if (e.target === seek || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') v.currentTime += 5;
      else if (e.key === 'ArrowLeft') v.currentTime -= 5;
      else if (e.key.toLowerCase() === 'm') mute.click();
      else if (e.key.toLowerCase() === 'f') full.click();
    });
    state();
    return { root, video: v };
  }
  function makeHeader(p) {
    const box = el('div', 'pcard-img');
    const ph = el('span', 'pcard-ph', p.glyph || String(p.title || '?').trim().charAt(0).toUpperCase());
    box.append(ph);
    const video = p.video || (VIDEO.test(p.icon || '') ? p.icon : '');
    const still = video ? (p.poster || (p.video ? p.icon : '')) : p.icon;
    if (still) {
      const img = el('img');
      img.alt = '';
      img.hidden = true;
      img.onload = () => { img.hidden = false; ph.hidden = true; };
      img.onerror = () => img.remove();
      img.src = still;
      box.append(img);
    }

    if (video) {
      const play = el('button', 'pplay');
      play.type = 'button';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = PLAY;
      play.onclick = () => {
        const player = makePlayer(video, still);
        play.remove();
        box.append(player.root);
        player.video.load();
        player.video.play().catch(() => {});
        player.video.addEventListener('error', () => {
          player.root.remove();
          box.append(play);
        });
        new IntersectionObserver(([e]) => { if (!e.isIntersecting) player.video.pause(); }, { threshold: 0.2 }).observe(player.root);
      };
      box.append(play);
    }
    return box;
  }

  function makeCard(p) {
    const card = el('article', 'card pcard');

    const body = el('div', 'pcard-body');
    const state = STATES[p.state] ? p.state : 'planned';
    body.append(el('span', 'ptag ' + state, p.label || STATES[state]), el('h4', null, p.title || ''));
    if (p.info) body.append(el('p', null, p.info));
    const link = String(p.anchor || '').trim();
    if (link && link !== '#') {
      const go = el('a', 'ubtn panchor');
      go.append(window.iconize ? window.iconize(p.button || 'Open project') : (p.button || 'Open project'));
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
    card.append(makeHeader(p), body, foot);
    car.add(card);
  }

  PROJECTS.forEach(makeCard);
})();
