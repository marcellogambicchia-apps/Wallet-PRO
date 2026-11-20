/* Wallet-PRO 3.1.0: replica locale protetta. localStorage resta l’archivio principale. */
(function(){'use strict';
const DB='walletpro_local_archive_v1',STORE='snapshots',prefix=/^(lamiabp_|walletpro_)/;
let timer=null,queue=Promise.resolve(),lastSaved=null,lastError=null,lastWarning=null;
const enabled=!!window.indexedDB;
function snapshot(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&prefix.test(k))o[k]=localStorage.getItem(k)}return o}
function size(o){return JSON.stringify(o).length}
function meaningful(o){return !!(o.lamiabp_pro_data_v1||o.walletpro_simple_v2)}
function open(){return new Promise((resolve,reject)=>{if(!enabled)return reject(Error('IndexedDB non disponibile'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('Apertura IndexedDB fallita'));r.onblocked=()=>reject(Error('Database bloccato da un’altra scheda'))})}
function run(mode,fn){return open().then(db=>new Promise((resolve,reject)=>{let tx,result;try{tx=db.transaction(STORE,mode);fn(tx.objectStore(STORE),v=>{result=v})}catch(e){db.close();reject(e);return}tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error||Error('Transazione fallita'))};tx.onabort=()=>{db.close();reject(tx.error||Error('Transazione annullata'))}}))}
function get(key){return run('readonly',(s,set)=>{const r=s.get(key);r.onsuccess=()=>set(r.result||null)})}
async function persist(){const keys=snapshot(),n=size(keys);if(!meaningful(keys)){lastWarning='Replica sospesa: archivio corrente vuoto o incompleto';return {skipped:true,reason:lastWarning}}const latest=await get('latest');const old=latest&&latest.keys||{};if(latest&&JSON.stringify(keys)===JSON.stringify(old))return {skipped:true,reason:'Nessuna modifica'};if(latest&&meaningful(old)&&n<size(old)*0.6){lastWarning='Replica sospesa: riduzione anomala dei dati ('+n+' / '+size(old)+' caratteri)';return {skipped:true,reason:lastWarning}}const stamp=Date.now(),entry={keys,savedAt:stamp,format:1};await run('readwrite',(s)=>{if(latest&&meaningful(old))s.put(latest,'previous');s.put(entry,'latest')});lastSaved=stamp;lastError=null;lastWarning=null;return {savedAt:stamp,count:Object.keys(keys).length}}
function sync(){if(!enabled)return Promise.resolve({available:false});queue=queue.catch(()=>{}).then(persist);queue.catch(e=>{lastError=String(e&&e.message||e);console.warn('Wallet-PRO IndexedDB:',e)});return queue}
function schedule(){if(timer!==null)clearTimeout(timer);timer=setTimeout(()=>{timer=null;sync()},750)}
const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
Storage.prototype.setItem=function(k,v){const r=set.apply(this,arguments);if(this===localStorage&&prefix.test(String(k)))schedule();return r};
Storage.prototype.removeItem=function(k){const r=remove.apply(this,arguments);if(this===localStorage&&prefix.test(String(k)))schedule();return r};
Storage.prototype.clear=function(){const r=clear.apply(this,arguments);if(this===localStorage)schedule();return r};
async function verify(){await queue.catch(()=>{});const copy=await get('latest'),curr=snapshot(),saved=copy&&copy.keys||{},all=new Set([...Object.keys(curr),...Object.keys(saved)]);const diff=[...all].filter(k=>curr[k]!==saved[k]);return {available:true,matching:diff.length===0,differentKeys:diff,localKeys:Object.keys(curr).length,indexedKeys:Object.keys(saved).length,savedAt:copy&&copy.savedAt||null,previousAvailable:!!(await get('previous'))}}
async function storageInfo(){const estimate=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate():{};let persisted=null;if(navigator.storage&&navigator.storage.persisted)persisted=await navigator.storage.persisted();return {usage:estimate.usage??null,quota:estimate.quota??null,persisted}}
async function requestPersistence(){if(!navigator.storage||!navigator.storage.persist)return false;return navigator.storage.persist()}
// Recupero intenzionalmente solo manuale: mai scrivere in localStorage da una copia in automatico.
window.walletProIndexedDB={status:()=>({available:enabled,lastSaved,lastError,lastWarning,mode:'replica protetta; localStorage principale'}),sync:()=>{if(timer!==null){clearTimeout(timer);timer=null}return sync()},verify,readCopy:()=>get('latest'),readPrevious:()=>get('previous'),storageInfo,requestPersistence};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')schedule()});window.addEventListener('storage',e=>{if(e.key===null||prefix.test(e.key))schedule()});
})();
