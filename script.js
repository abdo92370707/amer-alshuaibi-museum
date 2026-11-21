'use strict';
(() => {
  document.documentElement.classList.add('js', 'js-enabled');
  const menu = document.getElementById('museum-menu');
  const mixer = document.querySelector('.mixer');
  const disclosures = [menu, mixer];
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const panel of disclosures) {
      if (!panel.open) continue;
      panel.open = false;
      panel.querySelector('summary').focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    disclosures.forEach(panel => { if (!panel.contains(event.target)) panel.open = false; });
  });
  document.addEventListener('focusin', event => {
    disclosures.forEach(panel => { if (!panel.contains(event.target)) panel.open = false; });
  });
  if (document.body.classList.contains('page-index')) {
    const oldRooms = {
      '#story':'biography.html', '#journey':'biography.html#timeline', '#origin':'atlas.html',
      '#photography':'gallery.html', '#works':'jurisprudence.html', '#poetry':'poetry.html',
      '#heritage':'genealogy.html', '#genealogy-dialog':'genealogy.html', '#references':'archive.html'
    };
    const redirect = () => {
      const target = oldRooms[location.hash];
      if (target) location.replace(target);
    };
    redirect();
    window.addEventListener('hashchange', redirect);
  }

  const audio = document.getElementById('museum-audio');
  const guide = document.getElementById('biography-audio');
  const toggle = document.getElementById('audio-toggle');
  const state = document.getElementById('audio-state');
  const slider = document.getElementById('audio-volume');
  const volumeKey = 'amer_museum_volume';
  const passageKey = 'amer_museum_hall_passage';
  const fadeTime = 230;
  const narrationGain = 0.18;
  let level = 16;
  let active = false;
  let fadingFrame = 0;
  let stopTimer = 0;
  let request = 0;
  let context, gain;
  try {
    const stored = localStorage.getItem(volumeKey);
    if (stored !== null && /^\d{1,2}$/.test(stored)) level = Math.min(40,Number(stored));
  } catch { /* Preference storage is optional. */ }
  slider.value = level;
  function isNarrating() {
    return guide && !guide.paused && !guide.ended && !guide.error;
  }
  function targetGain() {
    return level / 100 * (isNarrating() ? narrationGain : 1);
  }
  function paint(notice) {
    const playing = active && !audio.paused;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'إيقاف موسيقى المتحف' : 'تشغيل موسيقى المتحف');
    const playingState = !level ? 'صامتة' : isNarrating() ? 'مخفّضة' : 'تعمل';
    state.textContent = notice || (playing ? playingState : 'متوقفة');
    document.body.classList.toggle('sound-playing',playing);
  }
  function setGain(value) {
    const safeValue = Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : 0;
    if (gain) gain.gain.value = safeValue;
    else audio.volume = safeValue;
  }
  function ramp(to, duration) {
    cancelAnimationFrame(fadingFrame);
    const from = gain ? gain.gain.value : audio.volume;
    if (!duration) { setGain(to); return; }
    const began = performance.now();
    function step(now) {
      const part = Math.min(1, Math.max(0, (now-began)/duration));
      setGain(from+(to-from)*part);
      if (part < 1) fadingFrame = requestAnimationFrame(step);
    }
    fadingFrame = requestAnimationFrame(step);
  }
  function silence(smooth) {
    active = false;
    request++;
    clearTimeout(stopTimer);
    if (smooth && !audio.paused) {
      ramp(0, fadeTime);
      stopTimer = setTimeout(() => audio.pause(),fadeTime);
    } else {
      ramp(0,0);
      audio.pause();
    }
    paint();
  }
  function updateSlider() {
    slider.setAttribute('aria-valuetext',level.toLocaleString('ar-OM')+' بالمئة');
  }
  function hasOtherMedia() {
    return [...document.querySelectorAll('audio,video')].some(el => el !== audio && el !== guide && !el.paused && !el.ended);
  }
  async function play(position) {
    if (hasOtherMedia()) { paint('أوقف التسجيل أولًا'); return; }
    const id = ++request;
    active = true;
    clearTimeout(stopTimer);
    cancelAnimationFrame(fadingFrame);
    try {
      audio.volume = 0;
      // iOS may expose a read-only media volume. Route through Web Audio in that case.
      const WebAudio = window.AudioContext || window.webkitAudioContext;
      if (audio.volume > .01 && WebAudio && !gain) {
        context = new WebAudio();
        const source = context.createMediaElementSource(audio);
        gain = context.createGain();
        source.connect(gain).connect(context.destination);
      }
      setGain(0);
      if (Number.isFinite(position) && position > 0) {
        const seek = () => { if (Number.isFinite(audio.duration)) audio.currentTime = position % audio.duration; };
        if (audio.readyState >= 1) seek();
        else audio.addEventListener('loadedmetadata',seek,{once:true});
      }
      const resume = context && context.state === 'suspended' ? context.resume() : undefined;
      await Promise.all([audio.play(),resume]);
      if (id !== request) return;
      ramp(targetGain(),fadeTime);
      paint();
    } catch {
      if (id !== request) return;
      silence(false);
      paint(audio.error ? 'ملف غير متاح' : 'اضغط للتشغيل');
    }
  }
  updateSlider();
  setGain(level/100);
  paint();
  toggle.addEventListener('click', () => { if(active) silence(true); else void play(); });
  slider.addEventListener('input', () => {
    level=Math.min(40,Math.max(0,Number(slider.value)));
    updateSlider();
    if (active) ramp(targetGain(),0);
    paint();
    try { localStorage.setItem(volumeKey,String(level)); } catch { /* Continue in memory. */ }
  });
  audio.addEventListener('playing', () => paint());
  audio.addEventListener('pause', () => paint());
  audio.addEventListener('error', () => { silence(false); paint('ملف غير متاح'); });
  function mixNarration() {
    // Only change the gain of music the visitor has already enabled. Never restart a paused track.
    if (!active || document.hidden) return;
    ramp(targetGain(), fadeTime);
    paint();
  }
  if (guide) {
    for (const change of ['pause','ended','error','emptied']) guide.addEventListener(change, mixNarration);
  }
  document.addEventListener('play', event => {
    const media = event.target;
    if (!(media instanceof HTMLMediaElement) || media === audio) return;
    if (media === guide) {
      if (hasOtherMedia() || document.hidden) guide.pause();
      else mixNarration();
      return;
    }
    silence(false);
    if (guide && !guide.paused) guide.pause();
  },true);
  const recording = event => {
    if (event.target.closest('a[href*="youtube.com/"],a[href*="youtu.be/"]')) {
      silence(false);
      if (guide && !guide.paused) guide.pause();
    }
  };
  document.addEventListener('click',recording);
  document.addEventListener('auxclick',recording);
  function pausePageMedia() {
    silence(false);
    if (guide && !guide.paused) guide.pause();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausePageMedia(); });
  window.addEventListener('pagehide', pausePageMedia);
  // Carry a visitor's explicit play choice only into the exact room they just selected.
  // Direct entry, refresh, tabs opened in the background and unrelated return visits start silent.
  document.addEventListener('click',event => {
    const link = event.target.closest('a[href]');
    if (!link || !active || audio.paused || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || link.target || link.hasAttribute('download')) return;
    const target = new URL(link.href);
    if (target.origin !== location.origin || target.pathname===location.pathname || !/\/(index|biography|atlas|jurisprudence|poetry|genealogy|gallery|archive|credits)\.html$/.test(target.pathname)) return;
    try {
      sessionStorage.setItem(passageKey,JSON.stringify({path:target.pathname,position:audio.currentTime,time:Date.now()}));
    } catch { return; }
    event.preventDefault();
    silence(true);
    if (guide && !guide.paused) guide.pause();
    setTimeout(() => location.assign(target.href),fadeTime);
  });
  try {
    const passage = JSON.parse(sessionStorage.getItem(passageKey));
    sessionStorage.removeItem(passageKey);
    const nav = performance.getEntriesByType('navigation')[0];
    if (passage && passage.path===location.pathname && Date.now()-passage.time<10000 &&
        !document.hidden && nav && nav.type==='navigate') void play(passage.position);
  } catch { /* No valid carry-over. */ }
})();
