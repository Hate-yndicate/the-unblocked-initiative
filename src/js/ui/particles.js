(() => {
  const GLYPHS = ['0', '1', '01', '10', '0x', 'FF', '::', '//', '>_', '+', 'UBG', 'EMBER', 'S', 'M', 'I', 'L', 'E', 'D', 'E', 'M', 'I', 'C'];
  const GREEN = '43,255,126';
  const FONT = '"Chakra Petch", ui-monospace, "Courier New", monospace';
  const DIR = { x: -0.2, y: 1 };
  const PARALLAX = 1;
  const MAX_PARTICLES = 400;
  const PLAY_SPEED = 650;
  const PLAY_HOLD = 1400;

  const LAYERS = [
    { tw: 260, th: 200, count: 9, size: [11, 15], alpha: 0.10, speed: 14, depth: 8,  seed: 11 },
    { tw: 380, th: 300, count: 6, size: [16, 24], alpha: 0.14, speed: 32, depth: 20, seed: 23 },
    { tw: 560, th: 440, count: 4, size: [30, 52], alpha: 0.10, speed: 64, depth: 40, seed: 37 }
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg = document.getElementById('bg'), fx = document.getElementById('fx');
  const bctx = bg.getContext('2d'), fctx = fx.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  const rng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const mod = (v, m) => ((v % m) + m) % m;

  function buildTile(L) {
    const c = document.createElement('canvas');
    c.width = Math.round(L.tw * dpr);
    c.height = Math.round(L.th * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = `rgba(${GREEN},${L.alpha})`;
    const r = rng(L.seed);
    for (let i = 0; i < L.count; i++) {
      const px = ((i * 0.618034 + r() * 0.12) % 1) * L.tw;
      const py = ((i + 0.5) / L.count) * L.th + (r() - 0.5) * (L.th / L.count) * 0.5;
      const size = L.size[0] + r() * (L.size[1] - L.size[0]);
      const g = GLYPHS[Math.floor(r() * GLYPHS.length)];
      x.font = `500 ${size}px ${FONT}`;
      for (const dx of [-L.tw, 0, L.tw]) for (const dy of [-L.th, 0, L.th]) {
        x.fillText(g, px + dx, py + dy);
      }
    }
    const p = bctx.createPattern(c, 'repeat');
    p.setTransform(new DOMMatrix().scale(1 / dpr));
    L.pattern = p;
    L.par = L.par || { x: 0, y: 0 };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const cv of [bg, fx]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    LAYERS.forEach(buildTile);
    if (reduce) drawBg(0, 0);
  }

  let mx = 0.5, my = 0.5;
  let px = -1, py = -1, lastMove = -1e9, inside = false;
  let down = false;
  const DOWN_SIZE = 2.2;

  const NO_TRAIL = 'a, button, [role="button"], input, select, textarea, summary, label, iframe, widgetbot, .frame, .card, .ucard, .umini, .site-footer';
  let selecting = false;
  let held = false;
  let onEmbed = false;
  let speed = 0, spDist = 0, spStart = 0, playUntil = 0;
  let level = 1, target = 1, lastCheck = 0;

  function trailTarget(x, y, now) {
    if (window.trailOn === false) return 0;
    if (onEmbed || selecting) return 0;
    const el = document.elementFromPoint(x, y);
    if (el && el.closest && el.closest(NO_TRAIL)) return 0;
    if (window.onText && window.onText(x, y)) return (held || now < playUntil) ? 1 : 0;
    return 1;
  }

  addEventListener('pointermove', e => {
    const now = performance.now();
    const gap = now - lastMove;
    const dist = px < 0 ? 0 : Math.hypot(e.clientX - px, e.clientY - py);
    const vx = px < 0 ? 0 : e.clientX - px, vy = px < 0 ? 0 : e.clientY - py;
    if (px < 0 || gap > 200) { spDist = 0; spStart = now; speed = 0; }
    else {
      spDist += dist;
      if (now - spStart >= 60) {
        speed += (spDist / (now - spStart) * 1000 - speed) * 0.5;
        spDist = 0; spStart = now;
        if (speed > PLAY_SPEED) playUntil = now + PLAY_HOLD;
      }
    }
    px = e.clientX; py = e.clientY;
    mx = px / W; my = py / H;
    inside = true;
    lastMove = now;
    target = trailTarget(px, py, now);
    lastCheck = now;
    if (!reduce && !onEmbed && level > 0.03) {
      const want = Math.min(6, 1 + Math.floor(dist / 8)) * level;
      const n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
      for (let i = 0; i < n; i++) emit(px, py, vx * 60, vy * 60);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { inside = false; px = py = -1; });

  addEventListener('pointerdown', e => {
    down = true;
    const blocked = !!(e.target.closest && e.target.closest(NO_TRAIL));
    const hitText = !blocked && !!(window.onText && window.onText(e.clientX, e.clientY));
    selecting = e.button === 0 && hitText;
    held = e.button === 0 && !blocked && !hitText;
    px = e.clientX; py = e.clientY;
    mx = px / W; my = py / H;
    inside = true;
    lastMove = performance.now();
    target = trailTarget(px, py, lastMove);
    lastCheck = lastMove;
  }, { passive: true });
  const release = () => { down = false; selecting = false; held = false; };
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, release);
  addEventListener('blur', release);
  const P = [];

for (const area of document.querySelectorAll('.frame, .site-footer')) {
  area.addEventListener('pointerenter', () => {
    onEmbed = true;
    inside = false;
    px = py = -1;
    acc = 0;
    target = 0;
  });
  area.addEventListener('pointerleave', () => {
    onEmbed = false;
  });
}

  function emit(x, y, vx, vy) {
    if (P.length >= MAX_PARTICLES) P.shift();
    const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 40;
    const glyph = level > 0.75 && Math.random() < 0.22;
    P.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(a) * s + vx * 0.14,
      vy: Math.sin(a) * s + vy * 0.14,
      life: 0,
      max: 0.9 + Math.random() * 1.1,
      size: (glyph ? 10 + Math.random() * 6 : 1.5 + Math.random() * 3) * (down ? DOWN_SIZE : 1) * (0.45 + 0.55 * level),
      glyph,
      g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      ph: Math.random() * 6.28
    });
  }
  function stepParticles(dt) {
    const k = 1 - Math.exp(-dt * 1.5);
    const driftX = DIR.x * 46, driftY = DIR.y * 46;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life += dt;
      if (p.life >= p.max) { P.splice(i, 1); continue; }
      p.vx += (driftX - p.vx) * k;
      p.vy += (driftY - p.vy) * k;
      p.x += (p.vx + Math.sin(p.life * 6 + p.ph) * 8) * dt;
      p.y += p.vy * dt;
    }
  }

  function drawParticles() {
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'lighter';
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    for (const p of P) {
      const a = Math.pow(1 - p.life / p.max, 1.5) * (0.2 + 0.8 * level);
      if (p.glyph) {
        fctx.fillStyle = `rgba(${GREEN},${a * 0.9})`;
        fctx.font = `600 ${p.size}px ${FONT}`;
        fctx.fillText(p.g, p.x, p.y);
      } else {
        fctx.fillStyle = `rgba(${GREEN},${a * 0.25})`;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size * 2.4, 0, 6.2832); fctx.fill();
        fctx.fillStyle = `rgba(160,255,200,${a})`;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, 6.2832); fctx.fill();
      }
    }
    fctx.globalCompositeOperation = 'source-over';
  }

    function drawBg(t, dt) {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.clearRect(0, 0, W, H);
      const e = 1 - Math.exp(-dt * 3);
      for (const L of LAYERS) {
        if (!L.pattern) continue;
        const tx = reduce ? 0 : -(mx - 0.5) * 2 * L.depth * PARALLAX;
        const ty = reduce ? 0 : -(my - 0.5) * 2 * L.depth * PARALLAX;
        L.par.x += (tx - L.par.x) * e;
        L.par.y += (ty - L.par.y) * e;
        const ox = mod(DIR.x * L.speed * t + L.par.x, L.tw);
        const oy = mod(DIR.y * L.speed * t + L.par.y, L.th);
        bctx.save();
        bctx.translate(ox, oy);
        bctx.fillStyle = L.pattern;
        bctx.fillRect(-L.tw, -L.th, W + L.tw * 2, H + L.th * 2);
        bctx.restore();
      }
    }
  let last = performance.now(), t = 0, acc = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;
    if (inside && now - lastCheck > 100) { target = trailTarget(px, py, now); lastCheck = now; }
    level += (target - level) * (1 - Math.exp(-dt * (target > level ? 5 : 8)));
    if (inside && !onEmbed && (down || now - lastMove < 2500)) {
      acc += dt * 40 * level;
      while (acc >= 1) { emit(px, py, 0, 0); acc -= 1; }
    }
    drawBg(t, dt);
    stepParticles(dt);
    drawParticles();
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize);
  resize();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { LAYERS.forEach(buildTile); if (reduce) drawBg(0, 0); });
  }
  if (!reduce) requestAnimationFrame(frame);
})();
