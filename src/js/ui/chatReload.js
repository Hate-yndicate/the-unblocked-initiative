(() => {
  const link = document.getElementById('reloadChat');
  if (!link) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    const old = document.querySelector('widgetbot');
    if (!old) return;
    const fresh = document.createElement('widgetbot');
    for (const a of old.attributes) fresh.setAttribute(a.name, a.value);
    old.replaceWith(fresh);
  });
})();
