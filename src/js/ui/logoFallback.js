(() => {
  const img = document.querySelector('img.logo');
  if (!img) return;
  function swap() {
    if (!img.isConnected) return;
    const f = document.createElement('span');
    f.className = 'logo logo-fallback';
    f.setAttribute('role', 'img');
    f.setAttribute('aria-label', img.alt || 'logo');
    f.textContent = '\u21AF';
    img.replaceWith(f);
  }
  img.addEventListener('error', swap);
  if (img.complete && img.naturalWidth === 0) swap();
})();
