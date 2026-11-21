(() => {
  const hall = document.querySelector('.photo-hall');
  if (!hall) return;
  const dialog = hall.querySelector('.photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const links = Array.from(hall.querySelectorAll('.photo-open'));
  const close = dialog.querySelector('[data-close]');
  const img = dialog.querySelector('.lightbox-media img');
  const title = dialog.querySelector('#photo-title');
  const description = dialog.querySelector('#photo-description');
  const author = dialog.querySelector('[data-author]');
  const original = dialog.querySelector('[data-original]');
  const license = dialog.querySelector('[data-license]');
  const counter = dialog.querySelector('[data-counter]');
  const digits = new Intl.NumberFormat('ar-OM-u-nu-arab');
  let selected = 0;
  let opener;

  function show(index) {
    selected = (index + links.length) % links.length;
    const link = links[selected];
    const figure = link.closest('figure');
    img.src = link.href;
    img.alt = link.querySelector('img').alt;
    title.textContent = figure.querySelector('h2').textContent;
    description.textContent = figure.querySelector('figcaption p').textContent;
    author.textContent = figure.dataset.author;
    original.href = figure.dataset.source;
    license.textContent = figure.dataset.license;
    license.href = figure.dataset.licenseUrl;
    counter.textContent = 'الصورة ' + digits.format(selected + 1) + ' من ' + digits.format(links.length);
  }

  links.forEach((link, i) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(i);
      dialog.showModal();
      close.focus();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-previous]').addEventListener('click', () => show(selected - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => show(selected + 1));
  dialog.addEventListener('close', () => {
    if (opener) opener.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(selected + (event.key === 'ArrowLeft' ? 1 : -1));
    } else if (event.key === 'Tab') {
      const focusable = Array.from(dialog.querySelectorAll('button,a[href]'));
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
