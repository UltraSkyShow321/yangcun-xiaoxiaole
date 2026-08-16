/* 羊村消消乐 - 入口 */
window.YXXL = window.YXXL || {};
(function (N) {
  window.addEventListener('DOMContentLoaded', function () {
    N.Store.load();
    const s = N.Store.get().settings;
    N.Audio.setVolumes(s.music, s.sfx);
    N.Game.init();
    N.UI.init();
    N.Assets.preload().then(function () {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hide');
    });
    const boot = function () {
      N.Audio.ensure();
      N.Audio.resume();
      N.Audio.startMusic('menu');
      window.removeEventListener('pointerdown', boot);
      window.removeEventListener('keydown', boot);
    };
    window.addEventListener('pointerdown', boot);
    window.addEventListener('keydown', boot);
  });
})(window.YXXL);
