(() => {
  const FOLDER = 'assets/cursor';
  const FILES = {
    normal: 'normal.png', click: 'click.png', grab: 'grab.png', deny: 'deny.png', point: 'point.png',
    central: 'central.png', up: 'uphelm.png', down: 'downhelm.png'
  };
  const OFFSET = {
    normal:  [30, 22],
    click:   [30, 22],
    grab:    [30, 22],
    deny:    [30, 22],
    point:   [30, 22],
    central: [50, 22],
    up:      [50, 22],
    down:    [50, 44]
  };
  const FALLBACK = {
    normal: 'default', click: 'default', grab: 'grab', deny: 'not-allowed', point: 'pointer',
    central: 'all-scroll', up: 'n-resize', down: 's-resize'
  };
  const AUTO_DEAD = 14;
  const AUTO_SPEED = 14;
  const AUTO_ANCHOR = false;
  if (!matchMedia('(any-hover: hover) and (any-pointer: fine)').matches) return;

  const base = document.baseURI;
  const cursorFor = {};
  const urls = {};
  const off = {};
  const size = {};
  function build(k, w, h) {
    if (w && h) size[k] = [w, h];
    const ox = w ? Math.min(Math.max(OFFSET[k][0], 0), w - 1) : Math.max(OFFSET[k][0], 0);
    const oy = h ? Math.min(Math.max(OFFSET[k][1], 0), h - 1) : Math.max(OFFSET[k][1], 0);
    off[k] = [Math.round(ox), Math.round(oy)];
    cursorFor[k] = `url("${urls[k]}") ${off[k][0]} ${off[k][1]}, ${FALLBACK[k]}`;
  }
  for (const k in FILES) {
    urls[k] = new URL(FOLDER + '/' + FILES[k], base).href;
    build(k);
    const img = new Image();
    img.onload = () => {
      build(k, img.naturalWidth, img.naturalHeight);
      if (shown === k) paint();
      if (k === 'central' && auto.on && anchor) placeAnchor();
    };
    img.src = urls[k];
  }
  const root = document.documentElement;
  const style = document.createElement('style');
  style.textContent = 'html.cc-on, html.cc-on * { cursor: var(--cc-cursor) !important; }' +
    'html.cc-on *::-webkit-slider-thumb, html.cc-on *::-webkit-slider-runnable-track { cursor: var(--cc-cursor) !important; }' +
    'html.cc-on *::-moz-range-thumb, html.cc-on *::-moz-range-track { cursor: var(--cc-cursor) !important; }';
  document.head.appendChild(style);
  root.style.setProperty('--cc-cursor', cursorFor.normal);
  root.classList.add('cc-on');

  const POINT = 'a[href], button, summary, label[for], select, [role="button"], [role="link"], [role="tab"], [onclick], ' +
                'input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], ' +
                'input[type="radio"], input[type="range"]';
  const DENY = '[disabled], [aria-disabled="true"]';
  const FORCEABLE = ['normal', 'point', 'grab', 'deny'];

  function readHover(el) {
    if (!el || !el.closest) return 'normal';

    const tagged = el.closest('[data-cursor]');
    if (tagged) {
      const v = tagged.getAttribute('data-cursor');
      if (FORCEABLE.includes(v)) return v;
    }
    if (el.closest(DENY)) return 'deny';

    root.classList.remove('cc-on');
    const c = getComputedStyle(el).cursor;
    root.classList.add('cc-on');
    if (/not-allowed|no-drop/.test(c)) return 'deny';
    if (/grab|move|all-scroll/.test(c)) return 'grab';
    if (/pointer/.test(c)) return 'point';

    if (el.closest('[draggable="true"]')) return 'grab';
    if (el.closest(POINT)) return 'point';
    return 'normal';
  }

  let hover = 'normal';
  let held = false;
  let shown = 'normal';
  let lx = -1, ly = -1;
  let lastEl = null;
  let queued = false;

  const auto = { on: false, ax: 0, ay: 0, t0: 0, moved: false, rem: 0, last: 0, raf: 0, dir: 'central' };

  let fake = null, faking = false;
  function overflows() {
    const sz = size[shown], o = off[shown];
    if (!sz || !o || lx < 0 || (sz[0] <= 32 && sz[1] <= 32)) return false;
    const x = lx - o[0], y = ly - o[1];
    return x < 0 || y < 0 || x + sz[0] > document.documentElement.clientWidth || y + sz[1] > document.documentElement.clientHeight;
  }
  function paint() {
    const out = overflows();
    if (out) {
      if (!fake) {
        fake = new Image();
        fake.alt = '';
        fake.draggable = false;
        fake.setAttribute('aria-hidden', 'true');
        fake.style.cssText = 'position:fixed;left:0;top:0;display:none;z-index:2147483001;pointer-events:none;user-select:none;-webkit-user-select:none;will-change:transform;';
        document.body.appendChild(fake);
      }
      if (fake.dataset.k !== shown) { fake.dataset.k = shown; fake.src = urls[shown]; }
      fake.style.transform = `translate(${lx - off[shown][0]}px, ${ly - off[shown][1]}px)`;
      fake.style.display = 'block';
    } else if (fake && faking) {
      fake.style.display = 'none';
    }
    if (out !== faking || (out && root.style.getPropertyValue('--cc-cursor') !== 'none')) {
      faking = out;
      root.style.setProperty('--cc-cursor', out ? 'none' : cursorFor[shown]);
    } else if (!out && root.style.getPropertyValue('--cc-cursor') !== cursorFor[shown]) {
      root.style.setProperty('--cc-cursor', cursorFor[shown]);
    }
  }

  function apply() {
    let s;
    if (auto.on) s = auto.dir;
    else {
      s = hover;
      if (s !== 'deny' && s !== 'grab') s = held ? 'click' : (s === 'point' ? 'point' : 'normal');
    }
    if (s === shown) return;
    shown = s;
    paint();
  }
  function look() {
    queued = false;
    if (lx < 0) return;
    const el = document.elementFromPoint(lx, ly);
    if (el !== lastEl) { lastEl = el; hover = readHover(el); }
    apply();
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(look);
  }

  const anchor = AUTO_ANCHOR ? new Image() : null;
    if (anchor) {
      anchor.src = urls.central;
      anchor.alt = '';
      anchor.setAttribute('aria-hidden', 'true');
      anchor.draggable = false;
      anchor.style.cssText = 'position:fixed;display:none;z-index:2147483000;pointer-events:none;user-select:none;-webkit-user-select:none;';
      document.body.appendChild(anchor);
    }
  function placeAnchor() {
    anchor.style.left = (auto.ax - off.central[0]) + 'px';
    anchor.style.top = (auto.ay - off.central[1]) + 'px';
  }

  function autoStart(x, y) {
    auto.on = true;
    auto.ax = x; auto.ay = y;
    auto.t0 = auto.last = performance.now();
    auto.moved = false; auto.rem = 0; auto.dir = 'central';
    if (anchor) { placeAnchor(); anchor.style.display = 'block'; }
    auto.raf = requestAnimationFrame(autoTick);
    apply();
  }

  function autoStop() {
    auto.on = false;
    cancelAnimationFrame(auto.raf);
    if (anchor) anchor.style.display = 'none';
    lastEl = null;
    apply();
    queue();
  }
  function autoTick(now) {
    if (!auto.on) return;
    const dt = Math.min((now - auto.last) / 1000, 0.05);
    auto.last = now;
    const dy = ly - auto.ay;
    const mag = Math.abs(dy);
    let dir = 'central';
    if (mag > AUTO_DEAD) {
      dir = dy < 0 ? 'up' : 'down';
      auto.moved = true;
      auto.rem += Math.sign(dy) * (mag - AUTO_DEAD) * AUTO_SPEED * dt;
      const step = Math.trunc(auto.rem);
      if (step) {
        auto.rem -= step;
        window.scrollBy({ top: step, left: 0, behavior: 'instant' });
      }
    }
    if (dir !== auto.dir) { auto.dir = dir; apply(); }
    auto.raf = requestAnimationFrame(autoTick);
  }

  let swallow = false;
  function swallowNextClick() { swallow = true; setTimeout(() => { swallow = false; }, 350); }
  for (const ev of ['click', 'auxclick']) {
    addEventListener(ev, e => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  addEventListener('mousedown', e => {
    if (auto.on) {
      e.preventDefault(); e.stopPropagation();
      autoStop();
      swallowNextClick();
      return;
    }
    if (e.button !== 1) return;
    if (e.target.closest && e.target.closest('a[href], video, input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    if (root.scrollHeight - innerHeight < 2) return;
    e.preventDefault();
    lx = e.clientX; ly = e.clientY;
    autoStart(e.clientX, e.clientY);
  }, true);

  addEventListener('mouseup', e => {
    if (e.button !== 1 || !auto.on) return;
    if (auto.moved || performance.now() - auto.t0 > 300) autoStop();
  }, true);

  addEventListener('keydown', e => { if (auto.on && e.key === 'Escape') autoStop(); });
  addEventListener('wheel', () => { if (auto.on) autoStop(); }, { passive: true });

  addEventListener('pointermove', e => { lx = e.clientX; ly = e.clientY; paint(); queue(); }, { passive: true });

  addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    lx = e.clientX; ly = e.clientY;
    held = true;
    apply();
    queue();
  }, { passive: true });

  const release = () => { held = false; lastEl = null; apply(); queue(); };
  for (const ev of ['pointerup', 'pointercancel', 'dragend']) addEventListener(ev, release);
  addEventListener('blur', () => { if (auto.on) autoStop(); release(); });
  document.documentElement.addEventListener('pointerleave', () => { lx = ly = -1; if (fake) fake.style.display = 'none'; faking = false; root.style.setProperty('--cc-cursor', cursorFor[shown]); });

  addEventListener('scroll', queue, { passive: true });
})();
