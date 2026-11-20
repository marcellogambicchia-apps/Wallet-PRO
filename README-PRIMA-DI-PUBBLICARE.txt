WALLET-PRO 3.1.0 — PACCHETTO UFFICIALE GITHUB COMPLETO

1. Prima di pubblicare, crea un backup JSON completo dalla versione attuale e conservalo.
2. Carica TUTTI i file e le cartelle nella radice del repository GitHub Wallet-PRO, inclusa la cartella nascosta .github e OneSignalSDKWorker.js.
3. Le notifiche di aggiornamento NON partono al push: avvia manualmente il workflow GitHub Actions, compilando i campi e confermando INVIA.
4. Per inviare un messaggio manuale: GitHub > Actions > Invia messaggio agli utenti Wallet-PRO > Run workflow; compila titolo e messaggio.
5. I workflow OneSignal richiedono i secrets GitHub ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY. Il workflow aggiornamenti richiede anche la variabile GitHub WALLET_PRO_URL impostata sul sito ufficiale HTTPS.
6. Per le scadenze, usa Aggiungi al calendario e importa il file .ics nel calendario del telefono. Conferma l'evento e verifica l'avviso un giorno prima. Per eliminazioni e modifiche, aggiorna il calendario manualmente.
7. Le scadenze finanziarie restano locali; il file .ics contiene solo titolo generico, data, ricorrenza e avviso. Non include importi o descrizioni.
8. Le scadenze mensili nei giorni 29–31 sono gestite con date valide anche nei mesi corti; verificare gli eventi esportati sul calendario del dispositivo.
9. Verifica su iPhone e Android l'importazione .ics e l'avviso. La consegna delle notifiche del calendario dipende dalle impostazioni del dispositivo.
10. Conserva uno ZIP del repository ufficiale precedente come versione di ripristino.

IndexedDB: replica locale latest/previous; nessun ripristino automatico. Le copie non proteggono dalla cancellazione dei dati Safari: eseguire regolarmente backup JSON.
