
/* Wallet-PRO: abbonamenti e analisi locali, nessuna chiamata di rete. */
(function(){'use strict';
const KEY='walletpro_subscriptions_v1', DATA='lamiabp_pro_data_v1';
const el=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{let a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function save(a){localStorage.setItem(KEY,JSON.stringify(a))}
function amount(v){v=String(v).trim().replace(/\s/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');let n=Number(v);return v&&Number.isFinite(n)&&n>0&&n<10000000?Math.round(n*100)/100:null}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(v+'T12:00:00').getTime())&&new Date(v+'T12:00:00').toISOString().slice(0,10)===v}
function renderSubs(){let a=load(),monthly=a.reduce((n,x)=>n+(x.cycle==='yearly'?x.amount/12:x.amount),0),annual=monthly*12;
el('wpsTotals').textContent='Totale stimato: '+money(monthly)+'/mese · '+money(annual)+'/anno';
el('wpsList').innerHTML=a.length?a.map(x=>'<div class="list-row"><div style="min-width:0"><strong>'+esc(x.name)+'</strong><div class="row-sub">'+money(x.amount)+' / '+(x.cycle==='yearly'?'anno':'mese')+' · rinnovo '+esc(x.next)+'</div></div><button class="mini-btn" type="button" data-wps-delete="'+esc(x.id)+'">Elimina</button></div>').join(''):'<div class="row-sub">Nessun abbonamento inserito.</div>';
}
function readExpenses(){try{let d=JSON.parse(localStorage.getItem(DATA)||'{}');return Array.isArray(d.expenses)?d.expenses:[]}catch(e){return []}}
function monthSum(ex,prefix){return ex.filter(x=>String(x.date||'').slice(0,7)===prefix).reduce((a,x)=>a+(Number(x.amount)||0),0)}
function renderInsights(){let ex=readExpenses().filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x.date||''))&&Number.isFinite(Number(x.amount))&&Number(x.amount)>0),now=new Date(),y=now.getFullYear(),m=now.getMonth(),current=y+'-'+String(m+1).padStart(2,'0'),prev=new Date(y,m-1,1),previous=prev.getFullYear()+'-'+String(prev.getMonth()+1).padStart(2,'0'),cur=monthSum(ex,current),old=monthSum(ex,previous),cats={};
ex.filter(x=>String(x.date).slice(0,7)===current).forEach(x=>{let c=String(x.category||'Altro');cats[c]=(cats[c]||0)+Number(x.amount)});
let ordered=Object.entries(cats).sort((a,b)=>b[1]-a[1]),out=[];
out.push('<div class="list-row"><div><strong>Questo mese</strong><div class="row-sub">'+esc(current)+'</div></div><strong>'+money(cur)+'</strong></div>');
out.push('<div class="list-row"><div><strong>Mese precedente</strong><div class="row-sub">'+esc(previous)+'</div></div><strong>'+money(old)+'</strong></div>');
if(old>0){let delta=(cur-old)/old*100;out.push('<div class="list-row"><div><strong>Variazione</strong><div class="row-sub">Confronto fra mesi interi o parziali, non una previsione</div></div><strong>'+ (delta>=0?'+':'')+delta.toFixed(1)+'%</strong></div>')}
if(ordered.length)out.push('<div class="list-row"><div><strong>Categoria principale del mese</strong><div class="row-sub">'+esc(ordered[0][0])+'</div></div><strong>'+money(ordered[0][1])+'</strong></div>');
const grouped={};ex.forEach(x=>{let key=String(x.desc||x.description||'').trim().toLocaleLowerCase('it');if(key.length<4)return;(grouped[key]??=[]).push(x)});
let recurring=Object.entries(grouped).filter(([k,v])=>new Set(v.map(x=>String(x.date).slice(0,7))).size>=2).sort((a,b)=>b[1].length-a[1].length).slice(0,5);
if(recurring.length)out.push('<div style="padding:12px 0"><strong>Possibili spese ricorrenti</strong><div class="row-sub">Stessa descrizione rilevata in almeno due mesi (da verificare)</div>'+recurring.map(([k,v])=>'<div class="row-sub" style="padding:5px 0">'+esc(k)+' · '+v.length+' movimenti</div>').join('')+'</div>');
if(!ex.length)out=['<div class="row-sub">Non ci sono ancora spese da analizzare.</div>'];el('wpsInsights').innerHTML=out.join('')}
function init(){if(!el('wpsAdd'))return;el('wpsNext').value=new Date().toLocaleDateString('en-CA');
el('wpsAdd').addEventListener('click',()=>{let name=el('wpsName').value.trim(),cost=amount(el('wpsAmount').value),next=el('wpsNext').value,cycle=el('wpsCycle').value;if(!name||name.length>80||cost===null||!validDate(next)||!['monthly','yearly'].includes(cycle)){alert('Controlla nome, costo, frequenza e data del rinnovo.');return}let a=load();a.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,amount:cost,cycle,next});try{save(a);el('wpsName').value='';el('wpsAmount').value='';renderSubs()}catch(e){alert('Salvataggio locale non riuscito.')}});
el('wpsList').addEventListener('click',ev=>{let btn=ev.target.closest('[data-wps-delete]');if(!btn)return;let a=load().filter(x=>x.id!==btn.dataset.wpsDelete);save(a);renderSubs()});
el('wpsRefresh').addEventListener('click',renderInsights);document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderSubs();renderInsights()}});renderSubs();renderInsights()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
