window.makeCarousel = (root, one, many) => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = (tag, cls) => {
    const n = document.createElement(tag);
    n.className = cls;
    return n;
  };
    const arrow = (label, d) => {
      const b = el('button', 'uarrow');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
      return b;
    };

  const prev = arrow('Previous', 'M15 5l-7 7 7 7');
  const next = arrow('Next', 'M9 5l7 7-7 7');
  const view = el('div', 'uview');
  const track = el('div', 'utrack');
  const count = el('div', 'ucount');
  const row = el('div', 'urow');
  view.append(track);
  row.append(prev, view, next);
  root.append(row, count);

  const reals = [];
  let pos = 0;
  let lead = 0;
  let busy = false;
  let dirty = false;
  let timer = 0;

  const per = () => parseInt(getComputedStyle(root).getPropertyValue('--per'), 10) || 1;
  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
  const step = () => reals[0].getBoundingClientRect().width + gap();
  const wrap = i => ((i % reals.length) + reals.length) % reals.length;
  const scrolls = () => reals.length > per();

  function copyOf(i) {
    const c = reals[wrap(i)].cloneNode(true);
    c.dataset.clone = '';
    c.setAttribute('aria-hidden', 'true');
    c.inert = true;
    c.querySelectorAll('video').forEach(v => v.remove());
    return c;
  }

  function build() {
    dirty = false;
    track.querySelectorAll('[data-clone]').forEach(c => c.remove());
    lead = 0;
    if (scrolls()) {
      lead = per() * 2;
      const n = reals.length;
      const before = [], after = [];
      for (let i = 0; i < lead; i++) {
        before.push(copyOf(i - lead));
        after.push(copyOf(n + i));
      }
      track.prepend(...before);
      track.append(...after);
    }
    place(false);
    sync();
  }
  const watcher = new MutationObserver(() => {
    if (busy) { dirty = true; return; }
    cancelAnimationFrame(timer);
    timer = requestAnimationFrame(build);
  });

  function place(animate) {
    if (!reals.length) return;
    track.style.transition = animate && !reduce ? '' : 'none';
    track.style.transform = `translateX(${-(lead + pos) * step()}px)`;
  }

  function sync() {
    const n = reals.length, p = per();
    prev.hidden = next.hidden = !scrolls();
    if (!n) { count.textContent = ''; return; }
    if (!scrolls()) { count.textContent = `${n} ${n === 1 ? one : many}`; return; }
    count.textContent = `${wrap(pos) + 1}–${wrap(pos + p - 1) + 1} of ${n}`;
  }
  function settle() {
    if (!busy) return;
    busy = false;
    pos = wrap(pos);
    place(false);
    if (dirty) build();
  }

  function go(dir) {
    if (!scrolls() || busy) return;
    pos += dir * per();
    busy = true;
    place(true);
    sync();
    if (reduce) settle();
    else setTimeout(settle, 700);
  }
  track.addEventListener('transitionend', e => {
    if (e.target === track && e.propertyName === 'transform') settle();
  });

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  let sx = null;
  view.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  view.addEventListener('touchend', e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  addEventListener('resize', () => {
    if (!reals.length) return;
    busy = false;
    pos = wrap(pos);
    build();
  });

  return {
    add(card) {
      reals.push(card);
      track.querySelectorAll('[data-clone]').forEach(c => c.remove());
      lead = 0;
      track.append(card);
      watcher.observe(card, { subtree: true, childList: true, attributes: true, characterData: true });
      cancelAnimationFrame(timer);
      timer = requestAnimationFrame(build);
    }
  };
};
