(() => {
  const cfg = window.ICONS || { names: {} };
  const names = cfg.names || {};
  let sheet = null;
  let failed = false;

  function plain(i) {
    i.className = 'uicon';
    i.textContent = i.dataset.fb || '';
  }

  function load() {
    if (sheet || !cfg.stylesheet) return;
    sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = cfg.stylesheet;
    sheet.onerror = () => {
      failed = true;
      document.querySelectorAll('.uicon[data-fb]').forEach(plain);
    };
    document.head.appendChild(sheet);
  }

    function find(name) {
      return names[name] || names[String(name).replace(/^_+/, '')] || null;
    }


  window.makeIcon = name => {
    const d = find(name);
    if (!d) return null;
    const i = document.createElement('i');
    i.className = 'uicon';
    i.setAttribute('aria-hidden', 'true');
    if (d.src) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = d.src;
      i.append(img);
      return i;
    }
    i.dataset.fb = d.text || '';
    if (failed || !d.class) {
      plain(i);
    } else {
      i.className = 'uicon ' + d.class;
      load();
    }
    return i;
  };

  window.iconize = text => {
    const str = String(text == null ? '' : text);
    const out = document.createDocumentFragment();
    const re = /:([\w-]+):/g;
    let last = 0, m;
    while ((m = re.exec(str))) {
      const icon = window.makeIcon(m[1]);
      if (!icon) continue;
      if (m.index > last) out.append(str.slice(last, m.index));
      out.append(icon);
      last = m.index + m[0].length;
    }
    if (last < str.length) out.append(str.slice(last));
    return out;
  };
})();
