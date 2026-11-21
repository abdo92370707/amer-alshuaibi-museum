(() => {
  const room = document.querySelector('.atlas-room');
  if (!room) return;
  const dialog = room.querySelector('.atlas-dialog');
  const getEntry = id => document.getElementById('place-' + id);
  const openFromHash = () => {
    const entry = document.getElementById(location.hash.slice(1));
    if (entry && entry.matches('.atlas-directory details')) entry.open = true;
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const close = dialog.querySelector('.atlas-close');
  let trigger;
  const present = (place, from) => {
    const entry = getEntry(place);
    if (!entry) return;
    const summary = entry.querySelector('summary');
    dialog.querySelector('.atlas-classification').textContent = summary.querySelector('small').textContent;
    dialog.querySelector('h2').textContent = summary.querySelector('span').textContent;
    const panel = dialog.querySelector('.atlas-dialog-content');
    panel.textContent = '';
    panel.appendChild(entry.querySelector('.atlas-entry').cloneNode(true));
    trigger = from;
    dialog.showModal();
    close.focus();
  };
  room.querySelectorAll('[data-place]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      present(link.dataset.place, link);
    });
  });
  room.querySelectorAll('.atlas-directory summary').forEach(summary => {
    summary.addEventListener('click', event => {
      event.preventDefault();
      present(summary.parentNode.id.slice(6), summary);
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if (trigger) trigger.focus(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
})();
