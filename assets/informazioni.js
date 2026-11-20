
(function () {
  var button = document.getElementById('btnAboutWallet');
  var modal = document.getElementById('aboutWalletModal');
  var close = document.getElementById('closeAboutWallet');
  if (!button || !modal || !close) return;
  function hide() { modal.classList.remove('open'); button.focus(); }
  button.addEventListener('click', function () { if (typeof translatePage === 'function') translatePage(); modal.classList.add('open'); close.focus(); });
  close.addEventListener('click', hide);
  modal.addEventListener('click', function (event) { if (event.target === modal) hide(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && modal.classList.contains('open')) hide(); });
})();
