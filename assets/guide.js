'use strict';
(() => {
  const player = document.getElementById('biography-audio');
  const stop = document.querySelector('[data-guide-stop]');
  const retry = document.querySelector('[data-guide-retry]');
  const status = document.querySelector('[data-guide-state]');
  if (!player || !stop || !retry || !status) return;

  function displayError() {
    status.textContent = 'تعذّر تشغيل التسجيل. يمكنك قراءة نصّه أدناه.';
    retry.hidden = false;
  }
  stop.hidden = false;
  stop.addEventListener('click', () => {
    player.pause();
    if (player.readyState >= HTMLMediaElement.HAVE_METADATA) player.currentTime = 0;
    if (!player.error) status.textContent = 'توقّف التسجيل وعاد إلى البداية.';
  });
  retry.addEventListener('click', async () => {
    retry.hidden = true;
    player.load();
    try {
      await player.play();
    } catch (error) {
      if (error.name !== 'AbortError') displayError();
    }
  });
  player.addEventListener('playing', () => {
    status.textContent = '';
    retry.hidden = true;
  });
  player.addEventListener('ended', () => { status.textContent = 'اكتملت قراءة السيرة.'; });
  player.addEventListener('error', displayError);
})();
