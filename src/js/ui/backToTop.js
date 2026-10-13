(() => {
  const btn = document.getElementById('toTop');
  const FAR = 1.8;
  const IDLE = 1700;
  const KEEP = 700;
  const GAP = 180;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = false, scrolling = false, runStart = 0, idleTimer = 0, endTimer = 0, hovering = false;
  const far = () => window.scrollY > window.innerHeight * FAR;
  function setShown(v) { shown = v; btn.classList.toggle('show', v); }

      function onScroll() {
        const now = performance.now();
        clearTimeout(idleTimer);
        clearTimeout(endTimer);
        if (!far()) { scrolling = false; setShown(false); return; }
        if (!scrolling) { scrolling = true; runStart = now; }
        if (shown && !hovering && now - runStart > KEEP) setShown(false);
        endTimer = setTimeout(() => { scrolling = false; }, GAP);
        idleTimer = setTimeout(() => { if (far()) setShown(true); }, IDLE);
      }

  btn.addEventListener('pointerenter', () => { hovering = true; });
  btn.addEventListener('pointerleave', () => { hovering = false; });
  btn.addEventListener('click', () => {
    setShown(false);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  addEventListener('scroll', onScroll, { passive: true });
})();
