(() => {
  function onText(x, y) {
    let node;
    if (document.caretPositionFromPoint) {
      const c = document.caretPositionFromPoint(x, y);
      node = c && c.offsetNode;
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      node = r && r.startContainer;
    } else {
      return true;
    }
    if (!node || node.nodeType !== 3) return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (x >= rect.left && x <= rect.right && y >= rect.top - 4 && y <= rect.bottom + 4) return true;
    }
    return false;
  }
  window.onText = onText;
    document.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest('a, button, input, iframe, widgetbot, video')) return;
      if (onText(e.clientX, e.clientY)) return;
      e.preventDefault();
      const sel = getSelection();
      if (sel) sel.removeAllRanges();
    });
})();
