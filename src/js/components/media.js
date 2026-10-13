(() => {
  const VIDEO = /(\.(mp4|webm|ogv|ogg|mov|m4v|mkv|3gp|3g2)([?#].*)?$)|^data:video\//i;
  const PLAY = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M26 20l20 12-20 12z"/></svg>';

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

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

  function makePlayer(src, poster, vid) {
    const root = el('div', 'pvid');
    const v = vid || el('video');
    v.playsInline = true;
    v.preload = 'auto';
    v.muted = false;
    v.classList.remove('pfirst');
    if (poster) v.poster = poster;
    if (!vid) v.src = src;

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
  window.makeMedia = function (o) {
    o = o || {};
    const src = String(o.src || '').trim();
    const video = String(o.video || '').trim() || (VIDEO.test(src) ? src : '');
    const cover = video ? (String(o.poster || '').trim() || (o.video ? src : '')) : src;

    if (!cover && !video && !o.showEmpty) return null;

    const box = el('div', 'pcard-img');
    let ph = null;
        if (o.placeholder) {
          ph = el('img', 'pph');
          ph.alt = '';
          ph.src = o.placeholder;
          box.append(ph);
        }

    if (cover) {
      const img = el('img');
      img.alt = o.alt || '';
      img.decoding = 'async';
      img.hidden = true;
      img.onload = () => { img.hidden = false; if (ph) ph.remove(); };
      img.onerror = () => {
        img.remove();
        if (!ph && !video) box.remove();
      };
      img.src = cover;
      box.append(img);
    }

    let first = null;
      if (video && !cover) {
        first = el('video', 'pfirst');
        first.muted = true;
        first.playsInline = true;
        first.preload = 'metadata';
        first.src = video.indexOf('#') < 0 ? video + '#t=0.001' : video;
        first.addEventListener('error', () => first.remove(), { once: true });
        box.append(first);
      }

    if (video) {
      const play = el('button', 'pplay');
      play.type = 'button';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = PLAY;
      play.onclick = () => {
        const reuse = first && first.parentNode ? first : null;
        const player = makePlayer(video, cover, reuse);
        play.remove();
        box.append(player.root);
        if (!reuse) player.video.load();
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
  };
})();
