'use strict';

document.documentElement.classList.add('js-enabled');

const header = document.querySelector('.site-header');
const progress = document.getElementById('reading-progress');
const nav = document.getElementById('site-nav');
const menuButton = document.querySelector('.nav-toggle');
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const chapters = navLinks.map(link => ({
  link,
  section: document.getElementById(decodeURIComponent(link.hash.slice(1)))
})).filter(chapter => chapter.section);

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل');
  nav.classList.toggle('open', open);
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('pointerdown', event => {
  if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) {
    setMenu(false);
  }
});
document.addEventListener('focusin', event => {
  if (nav.classList.contains('open') && !nav.contains(event.target) && event.target !== menuButton) {
    setMenu(false);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menuButton.focus();
  }
});
window.addEventListener('resize', () => {
  if (!menuButton.getClientRects().length) setMenu(false);
  queueScrollUpdate();
});

let pendingScroll = false;
let currentChapter;
function updateScroll() {
  pendingScroll = false;
  header.classList.toggle('scrolled', window.scrollY > 25);
  const remaining = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const percent = remaining > 0 ? Math.min(100, Math.max(0, window.scrollY / remaining * 100)) : 0;
  progress.style.width = percent + '%';
  const line = header.getBoundingClientRect().bottom + Math.min(120, window.innerHeight * .14);
  let active;
  let nearest = -Infinity;
  for (const entry of chapters) {
    const top = entry.section.getBoundingClientRect().top;
    if (top <= line && top > nearest) {
      active = entry.link;
      nearest = top;
    }
  }
  if (active === currentChapter) return;
  currentChapter?.classList.remove('active');
  currentChapter?.removeAttribute('aria-current');
  active?.classList.add('active');
  active?.setAttribute('aria-current', 'location');
  currentChapter = active;
}
function queueScrollUpdate() {
  if (!pendingScroll) {
    pendingScroll = true;
    requestAnimationFrame(updateScroll);
  }
}
window.addEventListener('scroll', queueScrollUpdate, {passive: true});
updateScroll();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }, {threshold: 0});
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('visible'));
}

const poems = [
  {
    lines: ['سمّو وأنا مثلكم سمّيتْ', 'بتنزل بركة الرحماني', 'وعلى النبي محمد صلّيتْ', 'صلاة تكعم العدواني'],
    attribution: 'من أبياته المنشورة في أثير'
  },
  {
    lines: ['يا الكوس هبّي من الأشخرة وجاي', 'ورثمين بين الحجر رثم طلّة', 'إلى لقيتي المحبّين غفاي', 'زقري لهم زقرة مستذلّة'],
    attribution: 'من «نشيد المحبين» · ورد في دراسة مجلة نزوى'
  }
];
const tabs = [...document.querySelectorAll('[data-poem]')];
const poemPanel = document.getElementById('poetry-panel');
const poemLines = document.getElementById('poem-lines');
const attribution = document.getElementById('poem-attribution');

function switchPoem(tab) {
  const poem = poems[Number(tab.dataset.poem)];
  for (const item of tabs) {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  poemPanel.setAttribute('aria-labelledby', tab.id);
  const content = document.createDocumentFragment();
  poem.lines.forEach((line, index) => {
    if (index) content.append(document.createElement('br'));
    content.append(line);
  });
  poemLines.textContent = '';
  poemLines.append(content);
  attribution.textContent = poem.attribution;
}
tabs.forEach((tab, index) => {
  if (!tab.id) tab.id = 'poem-tab-' + index;
  tab.addEventListener('click', () => switchPoem(tab));
  tab.addEventListener('keydown', event => {
    const destinations = {
      ArrowLeft: (index + 1) % tabs.length,
      ArrowRight: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    };
    if (!Object.prototype.hasOwnProperty.call(destinations, event.key)) return;
    event.preventDefault();
    const next = tabs[destinations[event.key]];
    next.focus();
    switchPoem(next);
  });
});
if (tabs.length) switchPoem(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);

// Native dialogs trap focus and handle Escape. Restore the exact invoking control on close.
const openers = new WeakMap();
function openDialog(dialog, opener) {
  if (dialog.open) return;
  openers.set(dialog, opener);
  dialog.showModal();
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => openers.get(dialog)?.focus({preventScroll: true}));
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-dialog-close], #lightbox-close')) {
      dialog.close();
      return;
    }
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
      dialog.close();
    }
  });
});
document.querySelectorAll('[data-dialog]').forEach(opener => {
  opener.addEventListener('click', event => {
    const dialog = document.getElementById(opener.dataset.dialog);
    if (!dialog?.showModal) return;
    event.preventDefault();
    openDialog(dialog, opener);
  });
});

const photoDialog = document.getElementById('photo-lightbox');
const largeImage = document.getElementById('lightbox-image');
const photoTitle = document.getElementById('lightbox-title');
const photoCredit = document.getElementById('lightbox-credit');
const photos = [...document.querySelectorAll('.photo-open')];
let currentPhoto = 0;
function displayPhoto(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const item = photos[currentPhoto];
  const thumb = item.querySelector('img');
  largeImage.alt = thumb.alt;
  largeImage.src = item.dataset.photoSrc || item.getAttribute('href') || thumb.currentSrc || thumb.src;
  photoTitle.textContent = item.dataset.photoTitle || 'وادي بني خالد';
  photoCredit.textContent = item.dataset.photoCredit || '';
}
photos.forEach((item, index) => item.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !photoDialog.showModal) return;
  event.preventDefault();
  displayPhoto(index);
  openDialog(photoDialog, item);
}));
photoDialog.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  displayPhoto(currentPhoto + (event.key === 'ArrowLeft' ? 1 : -1));
});
photoDialog.querySelectorAll('[data-photo-step]').forEach(button => {
  button.addEventListener('click', () => displayPhoto(currentPhoto + Number(button.dataset.photoStep)));
});

const music = document.getElementById('museum-audio');
const playButton = document.getElementById('audio-toggle');
const volumeSlider = document.getElementById('audio-volume');
const audioState = document.getElementById('audio-state');
const listenAndEnter = document.getElementById('enter-with-sound');
const volumeKey = 'amer_museum_volume';
let volume = 16;
try {
  const stored = localStorage.getItem(volumeKey);
  if (stored !== null && /^\d{1,2}$/.test(stored)) volume = Math.min(40, Number(stored));
} catch {
  // Browser privacy settings may prevent storing listening preferences.
}
volumeSlider.value = String(volume);
let volumeContext;
let volumeGain;
let wantMusic = false;
let playRequest = 0;
let playbackNotice = '';

function applyVolume() {
  if (volumeGain) volumeGain.gain.setTargetAtTime(volume / 100, volumeContext.currentTime, .018);
  else music.volume = volume / 100;
  volumeSlider.setAttribute('aria-valuetext', volume.toLocaleString('ar-OM') + ' بالمئة');
}
applyVolume();

function updateSoundControls() {
  const playing = !music.paused && !music.ended;
  playButton.setAttribute('aria-pressed', String(playing));
  playButton.setAttribute('aria-label', playing ? 'إيقاف موسيقى المتحف' : 'تشغيل موسيقى المتحف');
  audioState.textContent = playbackNotice || (playing ? (volume ? 'تعمل' : 'صامتة') : 'متوقفة');
  document.body.classList.toggle('sound-playing', playing);
}
function stopMusic() {
  ++playRequest;
  wantMusic = false;
  playbackNotice = '';
  music.pause();
  updateSoundControls();
}
async function startMusic() {
  const otherPlaying = [...document.querySelectorAll('audio, video')].some(
    player => player !== music && !player.paused && !player.ended
  );
  if (otherPlaying) {
    playbackNotice = 'أوقف التسجيل أولًا';
    updateSoundControls();
    return;
  }
  playbackNotice = '';
  wantMusic = true;
  const request = ++playRequest;
  try {
    // Some mobile browsers leave element.volume at 1. Supply an adjustable web-audio gain there.
    if (!volumeGain && Math.abs(music.volume - volume / 100) > .005 && window.AudioContext) {
      volumeContext = new AudioContext();
      const source = volumeContext.createMediaElementSource(music);
      volumeGain = volumeContext.createGain();
      volumeGain.gain.value = volume / 100;
      source.connect(volumeGain).connect(volumeContext.destination);
    }
    const resume = volumeContext?.state === 'suspended' ? volumeContext.resume() : undefined;
    await Promise.all([music.play(), resume]);
  } catch {
    if (request !== playRequest) return;
    wantMusic = false;
    music.pause();
    playbackNotice = music.error ? 'ملف غير متاح' : 'تعذر التشغيل';
  }
  if (request === playRequest) updateSoundControls();
}
playButton.addEventListener('click', () => {
  if (wantMusic || !music.paused) stopMusic();
  else void startMusic();
});
listenAndEnter.addEventListener('click', () => {
  void startMusic();
  const story = document.getElementById('story');
  story.focus({preventScroll: true});
  story.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
});
volumeSlider.addEventListener('input', () => {
  volume = Math.min(40, Math.max(0, Number(volumeSlider.value)));
  applyVolume();
  updateSoundControls();
  try { localStorage.setItem(volumeKey, String(volume)); } catch { /* Optional preference only. */ }
});
music.addEventListener('playing', updateSoundControls);
music.addEventListener('pause', updateSoundControls);
music.addEventListener('error', () => {
  wantMusic = false;
  playbackNotice = 'ملف غير متاح';
  updateSoundControls();
});

document.addEventListener('play', event => {
  if (event.target instanceof HTMLMediaElement && event.target !== music) stopMusic();
}, true);
function stopForExternalRecording(event) {
  if (event.target.closest('a[href*="youtube.com/"], a[href*="youtu.be/"]')) stopMusic();
}
document.addEventListener('click', stopForExternalRecording);
document.addEventListener('auxclick', stopForExternalRecording);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });
window.addEventListener('pagehide', stopMusic);
updateSoundControls();
