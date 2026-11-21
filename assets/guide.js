/* Optional on-device reading. Only locally installed Arabic voices are offered. */
(() => {
  'use strict';
  const panel = document.querySelector('[data-guide]');
  const synth = window.speechSynthesis;
  if (!panel || !synth || !window.SpeechSynthesisUtterance) return;
  const button = panel.querySelector('[data-guide-toggle]');
  const status = panel.querySelector('[data-guide-state]');
  const passages = Array.from(document.querySelectorAll('[data-guide-text]'), n => n.textContent.trim()).filter(Boolean);
  if (!button || !status || !passages.length) return;
  let voice = null;
  let session = 0;
  let utterance = null;
  let active = false;

  function refreshVoices() {
    voice = synth.getVoices().find(v => v.localService && /^ar(?:[-_]|$)/i.test(v.lang)) || null;
    panel.hidden = !voice && !active;
  }
  function stopReading(message = '') {
    session++;
    if (active) synth.cancel();
    active = false;
    utterance = null;
    button.setAttribute('aria-pressed','false');
    button.textContent = 'استمع إلى السيرة';
    status.textContent = message;
  }
  function speakParagraph(index, id) {
    if (id !== session) return;
    if (index >= passages.length) { stopReading('اكتملت القراءة.'); return; }
    utterance = new SpeechSynthesisUtterance(passages[index]);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = .93;
    utterance.onend = () => speakParagraph(index + 1, id);
    utterance.onerror = () => { if(id === session) stopReading('تعذّرت القراءة بصوت الجهاز.'); };
    try { synth.speak(utterance); }
    catch { stopReading('تعذّرت القراءة بصوت الجهاز.'); }
  }
  button.addEventListener('click', () => {
    if (active) { stopReading('توقفت القراءة.'); return; }
    refreshVoices();
    if (!voice) return;
    document.dispatchEvent(new Event('museum:guide-start'));
    active = true;
    button.setAttribute('aria-pressed','true');
    button.textContent = 'إيقاف القراءة';
    status.textContent = 'قراءة عربية بصوت الجهاز';
    speakParagraph(0, ++session);
  });
  document.addEventListener('museum:music-start', () => { if (active) stopReading(); });
  document.addEventListener('play', e => { if(active && e.target instanceof HTMLMediaElement) stopReading(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) stopReading(); });
  window.addEventListener('pagehide', () => { if (active) stopReading(); });
  synth.addEventListener('voiceschanged', refreshVoices);
  refreshVoices();
})();
