(() => {
  const root = document.getElementById('roadSteps');
  if (!root) return;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const vids = [];

  (window.ROADMAP || []).forEach(s => {
    const step = el('div', 'rstep');
    const card = el('div', 'card rcard');
    const head = window.makeMedia({
      src: s.headerImage || s.headerImageUrl || s.image,
      video: s.video,
      poster: s.poster,
      placeholder: 'assets/roadmap/placeholder.png',
      alt: s.imageAlt || s.title || 'Roadmap image'
    });
    if (head) {
      head.classList.add('rmedia');
      card.append(head);
      if (head.querySelector('.pplay')) vids.push(head);
    }
    const body = el('div', 'rcard-body');
    body.append(el('h4', null, s.title || ''), el('p', null, s.text || ''));
    card.append(body);
    step.append(card);
    root.append(step);
  });
  let busy = false;
  function holes() {
    busy = false;
    const W = document.documentElement.clientWidth, H = innerHeight;
      const nav = document.querySelector('ul');
      const top = nav ? nav.getBoundingClientRect().bottom : 0;
    let d = '';
    for (const b of vids) {
      const r = b.getBoundingClientRect();
      const x1 = Math.max(0, r.left), x2 = Math.min(W, r.right);
      const y1 = Math.max(top, r.top), y2 = Math.min(H, r.bottom);
      if (x2 > x1 && y2 > y1) d += `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
    }
    document.documentElement.style.setProperty('--crt-clip', d ? `path(evenodd, "M0 0H${W}V${H}H0Z${d}")` : 'none');
  }
  function queue() {
    if (busy) return;
    busy = true;
    requestAnimationFrame(holes);
  }

  if (vids.length) {
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    addEventListener('load', queue);
    if (window.ResizeObserver) new ResizeObserver(queue).observe(document.body);
    queue();
  }
})();
