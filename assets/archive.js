(() => {
  'use strict';
  const records = Array.from(document.querySelectorAll('.ar-record'));
  const form = document.querySelector('[data-catalogue-filter]');
  const count = document.querySelector('[data-catalogue-count]');
  const empty = document.querySelector('[data-catalogue-empty]');
  const params = ['q', 'type', 'topic', 'year'];
  const fold = text => text.normalize('NFKC').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase().trim();
  const search = new Map(records.map(r => [r, fold(r.textContent)]));

  function showTarget() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const element = document.getElementById(id);
    if (element && element.matches('details.ar-record, details.ar-leaf') && !element.hidden) element.open = true;
  }

  function filter(writeURL) {
    const query = fold(form.elements.q.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const record of records) {
      const match = (!form.elements.type.value || record.dataset.kind === form.elements.type.value)
        && (!form.elements.topic.value || record.dataset.topic.split(' ').includes(form.elements.topic.value))
        && (!form.elements.year.value || record.dataset.year === form.elements.year.value)
        && query.every(word => search.get(record).includes(word));
      record.hidden = !match;
      if (match) visible += 1;
    }
    empty.hidden = visible !== 0;
    count.textContent = 'المواد المعروضة ' + visible.toLocaleString('ar-OM') + ' من ' + records.length.toLocaleString('ar-OM');
    if (writeURL) {
      const url = new URL(location.href);
      for (const key of params) {
        const value = form.elements[key].value.trim();
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      const anchor = document.getElementById(url.hash.slice(1));
      if (anchor && anchor.hidden) url.hash = '';
      history.replaceState(history.state, '', url);
    }
  }

  function restore() {
    if (form) {
      const values = new URLSearchParams(location.search);
      for (const k of params) {
        const field = form.elements[k];
        const v = values.get(k) || '';
        field.value = field.tagName === 'INPUT' ? v.slice(0,100) : Array.from(field.options).some(o => o.value === v) ? v : '';
      }
      filter(false);
    }
    showTarget();
  }

  if (form) {
    form.hidden = false;
    count.hidden = false;
    form.addEventListener('input', () => filter(true));
    form.addEventListener('change', () => filter(true));
    form.addEventListener('submit', ev => { ev.preventDefault(); filter(true); });
    form.addEventListener('reset', () => requestAnimationFrame(() => filter(true)));
  }
  window.addEventListener('hashchange', showTarget);
  window.addEventListener('popstate', restore);
  restore();
})();
