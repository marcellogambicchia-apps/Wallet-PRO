
(function () {
  function syncWalletTabBarHeight() {
    var nav = document.querySelector('.tab-bar');
    if (nav) document.documentElement.style.setProperty('--wp-tabbar-height',
      Math.ceil(nav.getBoundingClientRect().height) + 'px');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncWalletTabBarHeight, {once:true});
  } else {
    syncWalletTabBarHeight();
  }
  window.addEventListener('resize', syncWalletTabBarHeight);
  // Il pannello Aggiungi ha uno stacking context superiore alla barra.
  // Non spostare la barra con visualViewport: iOS potrebbe farla risalire
  // sopra la tastiera durante la modifica dell'importo.
  function clearLegacyDockTransform() {
    var nav = document.querySelector('body > .tab-bar');
    if (nav) nav.style.removeProperty('transform');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearLegacyDockTransform, {once:true});
  } else clearLegacyDockTransform();

  if (typeof ResizeObserver !== 'undefined') {
    var start = function () {
      var nav = document.querySelector('.tab-bar');
      if (nav) new ResizeObserver(syncWalletTabBarHeight).observe(nav);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
    else start();
  }
})();
