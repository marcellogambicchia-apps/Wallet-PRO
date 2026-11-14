# Wallet-PRO — GitHub Pages

Caricare **tutti** i file e la cartella `vendor/` nella radice del repository GitHub Pages.

## Novità
- Impostazioni: sezioni separate **Importa dati** ed **Esporta dati e backup**.
- Rimosso il pulsante + nell'intestazione; resta **Aggiungi** nella barra inferiore.
- Anti-doppioni: uscite e entrate ordinarie coincidono per data completa, tipo e importo; stipendio/busta paga coincide per mese, anno e importo.
- PDF, Excel e OCR fanno riferimento a librerie locali in `vendor/`.
- Il service worker include gli asset delle librerie per l'utilizzo offline dopo il primo caricamento e l'attivazione della cache.

## Attenzione ai dati già esistenti
Prima di aggiornare effettuare un backup JSON. I dati precedenti non sempre conservano l'origine e la data giornaliera delle entrate mensili: in questi casi non è possibile dimostrare automaticamente che una busta paga e un accredito siano lo stesso movimento. Per gli stipendi importati dalla nuova versione viene conservata una chiave di controllo. Due acquisti autentici dello stesso importo nello stesso giorno verranno considerati duplicati, secondo la regola richiesta.

I file non vengono inviati a servizi di OCR esterni. I tassi di cambio sono locali e non in tempo reale.

Verifiche effettuate: integrità ZIP, sintassi JavaScript, presenza librerie e controlli statici. Il funzionamento end-to-end su Safari con file reali deve ancora essere verificato.


Aggiornamento impostazioni: Importa dati, Esporta dati, BackUp dati. Aggiunta esportazione CSV unificata; invariati gli altri comandi.


Aggiornamento layout: pulsanti Esporta dati dentro la scheda; sezione Gestione dati eliminata e pulsante Azzera Tutti i Dati mantenuto in BackUp dati.


## Correzione OCR
Worker Tesseract con URL assoluti e workerBlobURL:false per GitHub Pages e Safari. Dopo aggiornamento, chiudere e riaprire l'app per aggiornare la cache.
