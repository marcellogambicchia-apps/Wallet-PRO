/* Wallet-PRO 3.1.0: controlli archivio con conferma visibile su iPhone. */
(function () {
  'use strict';
  const box = document.getElementById('wpIdbStorageInfo');
  const refresh = document.getElementById('wpIdbRefresh');
  const persistButton = document.getElementById('wpIdbPersist');
  const api = window.walletProIndexedDB;
  if (!box || !refresh || !persistButton) return;

  const fmt = n => typeof n === 'number' && Number.isFinite(n) ? (n / 1048576).toFixed(1) + ' MB' : 'non disponibile';
  const date = n => n ? new Date(n).toLocaleString('it-IT') : 'non disponibile';
  const err = e => e && e.message ? e.message : String(e);
  let busy = false;

  async function show(details) {
    if (!api) throw new Error('Modulo IndexedDB non disponibile');
    const [v, s] = await Promise.all([api.verify(), api.storageInfo()]);
    const st = api.status();
    const state = v.matching ? 'allineata' : 'da verificare';
    const previous = v.previousAvailable ? 'presente' : 'assente';
    const persistent = s.persisted === null ? 'non disponibile' : s.persisted ? 'concessa' : 'non concessa';
    box.textContent = 'Copia: ' + state + ' · Copia precedente: ' + previous + ' · Spazio usato: ' + fmt(s.usage) + ' / ' + fmt(s.quota) + ' · Persistenza: ' + persistent + (st.lastWarning ? ' · ' + st.lastWarning : '') + (st.lastError ? ' · Errore: ' + st.lastError : '');
    // La persistenza è già stata concessa: una seconda richiesta non serve.
    persistButton.disabled = false; // Rimane cliccabile per mostrare la conferma anche quando già concessa.
    if (s.persisted === true) persistButton.title = 'Archiviazione persistente già concessa';
    if (details) {
      window.alert('Verifica archivio IndexedDB\n\n' +
        'Copia attuale: ' + state + '\n' +
        'Copia precedente: ' + previous + '\n' +
        'Ultimo salvataggio: ' + date(v.savedAt) + '\n' +
        'Chiavi locali: ' + v.localKeys + '\n' +
        'Chiavi nella copia: ' + v.indexedKeys + '\n' +
        'Spazio utilizzato: ' + fmt(s.usage) + '\n' +
        'Quota stimata: ' + fmt(s.quota) + '\n' +
        'Persistenza: ' + persistent +
        (v.differentKeys.length ? '\nChiavi differenti: ' + v.differentKeys.length : '') +
        (st.lastWarning ? '\nAvviso: ' + st.lastWarning : '') +
        (st.lastError ? '\nErrore: ' + st.lastError : '') +
        '\n\nLe copie locali non sostituiscono il backup JSON.');
    }
    return s;
  }

  refresh.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    refresh.disabled = true;
    try { await show(true); }
    catch (e) { box.textContent = 'Verifica non disponibile: ' + err(e); window.alert(box.textContent); }
    finally { refresh.disabled = false; busy = false; }
  });

  persistButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (!api) throw new Error('Modulo IndexedDB non disponibile');
      const before = await api.storageInfo();
      if (before.persisted === true) {
        window.alert('Archiviazione persistente già concessa su questo dispositivo.\n\nContinua comunque a eseguire i backup JSON.');
      } else {
        const granted = await api.requestPersistence();
        window.alert(granted ? 'Archiviazione persistente concessa.\n\nI backup JSON restano necessari.' : 'Safari non ha concesso l’archiviazione persistente oppure non supporta questa richiesta.\n\nI dati rimangono locali, ma conserva regolarmente i backup JSON.');
      }
      await show(false);
    } catch (e) {
      box.textContent = 'Richiesta non disponibile: ' + err(e);
      window.alert(box.textContent);
    } finally { busy = false; }
  });

  setTimeout(() => show(false).catch(e => { box.textContent = 'Verifica non disponibile: ' + err(e); }), 1500);
})();
