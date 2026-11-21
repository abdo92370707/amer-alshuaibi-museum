'use strict';

function searchWords(value) {
  return value.normalize('NFKC')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u063a\u0641-\u064a\d\u0660-\u0669a-z ]/gi, ' ')
    .trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function enablePoetry(hall) {
  const choices = [...hall.querySelectorAll('.col-poem-choice')].map(link => {
    const article = document.getElementById(link.hash.slice(1));
    const lines = [...article.querySelector('.col-poem-lines').childNodes].map(node => node.textContent);
    const heading = article.querySelector('h2').textContent;
    const source = article.querySelector('.col-poem-citation').textContent;
    return {
      link, article, row: link.closest('li'),
      text: searchWords([heading, ...lines, source].join(' ')).join(' ')
    };
  });
  const form = hall.querySelector('.col-search');
  const field = form.querySelector('input');
  const clear = hall.querySelector('.col-reset');
  const empty = hall.querySelector('.col-empty');
  const status = hall.querySelector('#poem-search-status');
  let selected;
  let visible = choices;

  function display(choice) {
    selected = choice;
    choices.forEach(item => {
      item.article.hidden = item !== choice;
      if (item === choice) item.link.setAttribute('aria-current', 'true');
      else item.link.removeAttribute('aria-current');
    });
    hall.querySelector('.col-poem-reader').hidden = !choice;
  }

  function filter() {
    const terms = searchWords(field.value);
    visible = choices.filter(item => terms.every(term => item.text.includes(term)));
    choices.forEach(item => { item.row.hidden = !visible.includes(item); });
    clear.hidden = !field.value;
    empty.hidden = Boolean(visible.length);
    status.textContent = !terms.length ? '' : (
      visible.length === 2 ? 'عُثر على مقتطفين.' : visible.length ? 'عُثر على مقتطف واحد.' : empty.textContent
    );
    if (!visible.includes(selected)) {
      const next = visible.find(item => item.link.hash === location.hash) || visible[0];
      display(next);
      if (choices.some(item => item.link.hash === location.hash)) {
        history.replaceState(null, '', next ? next.link.hash : '#poetry-index');
      }
    }
  }

  function activate(item, focus) {
    display(item);
    if (location.hash !== item.link.hash) history.pushState(null, '', item.link.hash);
    if (focus) item.article.focus();
  }

  function fromAddress() {
    const deepLink = choices.find(item => item.link.hash === location.hash);
    if (deepLink && !visible.includes(deepLink)) {
      field.value = '';
      filter();
    }
    display(deepLink || visible[0]);
  }
  choices.forEach(item => item.link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activate(item, true);
  }));
  clear.addEventListener('click', () => {
    field.value = '';
    filter();
    field.focus();
  });
  field.addEventListener('input', filter);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (visible.length) activate(visible.includes(selected) ? selected : visible[0], true);
  });
  window.addEventListener('popstate', fromAddress);
  window.addEventListener('hashchange', fromAddress);
  form.hidden = false;
  fromAddress();
}

function enableGenealogy(hall) {
  const text = document.getElementById('lineage-text');
  const copy = hall.querySelector('.col-copy');
  const status = hall.querySelector('.col-copy-status');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text.textContent);
      status.textContent = 'نُسخ نص النسب كاملًا.';
    } catch {
      // Keep the original visible and selected when direct clipboard access is unavailable.
      text.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Selection remains available. */ }
      status.textContent = copied ? 'نُسخ نص النسب كاملًا.' : 'حُدّد نص النسب. اختر «نسخ» من قائمة الجهاز أو استخدم اختصار النسخ.';
    }
  });
  hall.querySelectorAll('.col-lineage-branch').forEach(branch => {
    const rows = [...branch.querySelectorAll('li')];
    const controls = branch.querySelector('.col-tree-actions');
    const more = controls.querySelector('.col-more');
    const all = controls.querySelector('.col-expand');
    const live = branch.querySelector('.col-branch-status');
    const step = 3;
    let shown = step;
    function render(announce) {
      rows.forEach((row, index) => { row.hidden = index >= shown; });
      const complete = shown >= rows.length;
      const moveFocus = complete && document.activeElement === more;
      more.hidden = complete;
      all.textContent = complete ? 'اختصار السلسلة' : 'عرض السلسلة كاملة';
      if (moveFocus) all.focus();
      if (announce) {
        live.textContent = 'الأسماء الظاهرة ' + shown.toLocaleString('ar-OM') + ' من ' + rows.length.toLocaleString('ar-OM') + '.';
      }
    }
    more.addEventListener('click', () => { shown = Math.min(rows.length, shown + step); render(true); });
    all.addEventListener('click', () => { shown = shown === rows.length ? step : rows.length; render(true); });
    controls.hidden = false;
    render(false);
  });
}

const poetryHall = document.querySelector('.col-poetry');
if (poetryHall) enablePoetry(poetryHall);
const genealogyHall = document.querySelector('.col-genealogy');
if (genealogyHall) enableGenealogy(genealogyHall);
