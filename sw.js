/* Wallet-PRO 3.1.0: precache verificata, navigazione protetta, offline. */
const CACHE_NAME = 'wallet-pro-v310-add-overlay-20261120';
const ESSENTIAL = ['./index.html','./assets/walletpro.css','./assets/backup-reminder.js','./assets/importi.js','./assets/backup-validazione.js','./assets/onesignal-config.js','./assets/indexeddb-sicuro.js','./assets/indexeddb-opzioni.js','./assets/walletpro-core.js','./assets/dashboard-trascinamento.js','./assets/informazioni.js','./assets/budget-categorie.js','./assets/funzioni-locali.js','./assets/budget-salvataggio.js','./assets/avvisi-dashboard.js','./assets/notifiche-locali.js','./assets/abbonamenti-analisi.js','./assets/banner-aggiornamenti.js','./assets/guida.js','./assets/barra-navigazione.js','./assets/importazione-pdf.js','./assets/pannello-aggiungi.js','./vendor/pdf.mjs','./vendor/pdf.worker.mjs',
 './vendor/xlsx.full.min.js','./vendor/tesseract.min.js','./vendor/worker.min.js',
 './vendor/tesseract-core.wasm.js','./vendor/tesseract-core.wasm',
 './vendor/lang/ita.traineddata.gz','./vendor/lang/eng.traineddata.gz'];
const OPTIONAL = ['./','./manifest.json','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const ROOT = new URL('./', self.registration.scope);
const HOME = new URL('index.html', ROOT).pathname;
function isHome(path){ return path === ROOT.pathname || path === HOME; }
async function cacheOne(cache,path){
 const req = new Request(new URL(path,ROOT),{cache:'reload'});
 const response = await fetch(req);
 if(!response.ok || response.type === 'opaque') throw new Error('Risorsa offline non disponibile: '+path+' HTTP '+response.status);
 await cache.put(req,response);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 try {
  await Promise.all(ESSENTIAL.map(path=>cacheOne(cache,path)));
  await Promise.allSettled(OPTIONAL.map(path=>cacheOne(cache,path)));
  await self.skipWaiting();
 } catch(e) { console.error('Wallet-PRO: installazione cache offline non riuscita', e); await caches.delete(CACHE_NAME); throw e; }
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>(k.startsWith('wallet-pro-test-')||k.startsWith('wallet-pro-v'))&&k!==CACHE_NAME).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin || !url.pathname.startsWith(ROOT.pathname))return;
 if(req.mode==='navigate'){
  if(!isHome(url.pathname))return;
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   try {
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),5000);
    let res;
    try { res=await fetch(new Request(req,{cache:'no-store',signal:controller.signal})); }
    finally { clearTimeout(timeout); }
    if(res.ok&&res.type==='basic') await cache.put(new URL('index.html',ROOT),res.clone());
    return res;
   }catch(e){return (await cache.match(new URL('index.html',ROOT)))||Response.error();}
  })());return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const match=await cache.match(req,{ignoreSearch:true});
  if(match)return match;
  const response=await fetch(req);
  if(response.ok&&response.type==='basic') {
   try { await cache.put(req,response.clone()); }
   catch(e) { console.error('Wallet-PRO: impossibile memorizzare una risorsa statica',e); }
  }
  return response;
 })());
});
