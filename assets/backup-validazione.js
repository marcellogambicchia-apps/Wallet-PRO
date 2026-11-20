
/* Wallet-PRO 2.2: validazione e ripristino comune, senza servizi esterni. */
(function(){'use strict';
const MAIN='lamiabp_pro_data_v1', EXTRA='walletpro_simple_v2';
function obj(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
function validMain(p){
 if(!obj(p)||!obj(p.monthly)||!Array.isArray(p.expenses))return false;
 if(Object.keys(p.monthly).length>250)return false;
 for(const [year,months] of Object.entries(p.monthly)){
  if(!/^\d{4}$/.test(year)||!Array.isArray(months)||months.length!==12||months.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e11))return false;
 }
 for(const k of ['events','expenses','recurring','incomeRecurring','bankImportKeys','bankIncomeEntries','incomeCategories','payslips','paySalaryKeys']){
  if(p[k]!==undefined&&!Array.isArray(p[k]))return false;
 }
 if(p.monthlyIncomeCategories!==undefined&&!obj(p.monthlyIncomeCategories))return false;
 if(p.expenses.some(x=>!obj(x)||!Number.isFinite(Number(x.amount))||Math.abs(Number(x.amount))>1e11))return false;
 if(p.bankIncomeEntries&&p.bankIncomeEntries.some(x=>!obj(x)||!Number.isFinite(Number(x.amount))||Math.abs(Number(x.amount))>1e11))return false;
 return true;
}
function validExtra(p){
 if(!obj(p))return false;
 if(p.budgets!==undefined&&(!obj(p.budgets)||Object.values(p.budgets).some(v=>!Number.isFinite(Number(v))||Math.abs(Number(v))>1e13)))return false;
 if(p.reminders!==undefined&&(!Array.isArray(p.reminders)||p.reminders.some(x=>!obj(x))))return false;
 if(p.goals!==undefined&&(!Array.isArray(p.goals)||p.goals.some(x=>!obj(x)||!Number.isFinite(Number(x.target))||!Number.isFinite(Number(x.saved))||Number(x.target)<0||Number(x.saved)<0)))return false;
 if(p.balance!==undefined&&p.balance!==null&&(!obj(p.balance)||!Number.isFinite(p.balance.cents)))return false;
 return true;
}
function validateKeys(keys){
 if(!obj(keys)||typeof keys[MAIN]!=='string'||Object.keys(keys).length>500)throw Error('Backup incompleto');
 for(const [k,v] of Object.entries(keys)){
  if(!/^(lamiabp_|walletpro_)/.test(k)||typeof v!=='string'||v.length>20*1024*1024)throw Error('Chiave o dimensione non valida');
 }
 let main;try{main=JSON.parse(keys[MAIN])}catch(e){throw Error('Dati finanziari non validi')}
 if(!validMain(main))throw Error('Struttura finanziaria non valida');
 if(keys[EXTRA]!==undefined){let extra;try{extra=JSON.parse(keys[EXTRA])}catch(e){throw Error('Dati aggiuntivi non validi')};if(!validExtra(extra))throw Error('Budget e obiettivi non validi')}
 return true;
}
function snapshot(){const keys={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&/^(lamiabp_|walletpro_)/.test(k))keys[k]=localStorage.getItem(k)}return keys}
function restore(keys){validateKeys(keys);const old=snapshot();const names=Array.from(new Set([...Object.keys(old),...Object.keys(keys)]));
 // Controllo quota prima di cambiare qualsiasi dato; non garantisce atomicità in caso di guasto fisico.
 const staged=[];try{for(let i=0;i<Object.keys(keys).length;i++){const k='__wp22_stage_'+i;localStorage.setItem(k,Object.values(keys)[i]);staged.push(k)}}catch(e){throw Error('Spazio insufficiente: dati non modificati')}finally{staged.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}
 try{for(const k of names){if(Object.prototype.hasOwnProperty.call(keys,k))localStorage.setItem(k,keys[k]);else localStorage.removeItem(k)}}
 catch(e){let failed=false;for(const k of names){try{if(Object.prototype.hasOwnProperty.call(old,k))localStorage.setItem(k,old[k]);else localStorage.removeItem(k)}catch(x){failed=true}}
 throw Error(failed?'ATTENZIONE: recupero incompleto. Conserva il backup originale.':'Ripristino annullato; dati precedenti recuperati')}
 return true;
}
window.walletProBackup22={validMain,validateKeys,snapshot,restore};
})();
