(() => {
  const KEY = 't';
  window.trailOn = window.trailOn !== false;

  const nav = document.querySelector('ul');
  let btn = null;
  if (nav) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trailbtn';
    btn.setAttribute('role', 'switch');
    btn.title = 'Cursor trail (T)';
    btn.innerHTML = '<span class="trailbtn-text">Trail</span><span class="trailbtn-track" aria-hidden="true"><span class="trailbtn-knob"></span></span>';
    btn.addEventListener('click', () => { flip(); btn.blur(); });
    nav.append(btn);
  }

  function show() {
    if (!btn) return;
    btn.setAttribute('aria-checked', String(window.trailOn));
    btn.setAttribute('aria-label', 'Cursor trail ' + (window.trailOn ? 'on' : 'off'));
  }
  function flip() {
    window.trailOn = !window.trailOn;
    show();
  }
  show();

  addEventListener('keydown', e => {
    if ((e.key || '').toLowerCase() !== KEY || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    flip();
  });
})();
