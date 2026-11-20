
(function(){
'use strict';
function e(id){return document.getElementById(id)}
function status(s){e('wpLannaVoiceStatus').textContent=s}
function normal(s){return String(s||'').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
const KEY='walletpro_voice_categories_v1';
let pending=null;
function memory(){try{let o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(_){return {}}}
function tab(){return e('segUscita').classList.contains('active')?'out':e('segEvento').classList.contains('active')?'event':'in'}
function selectCategory(type){return e(type==='in'?'monthlyIncomeCategory':'expCategory')}
function parse(text){
 let t=String(text||'').trim(),kind=tab();
 let m=t.match(/(?:€\s*|euro\s*)(\d[\d.,]*)|(?:^|\s)(\d[\d.,]*)\s*(?:€|euro|eur)(?=\s|$|[.,;:!?])/i);
 if(!m)return {error:'Indica un importo seguito da euro, ad esempio 35 euro.'};
 let s=m[1]||m[2];let decimal=s.lastIndexOf(',')>s.lastIndexOf('.')?',':'.';
 let parts=s.split(decimal),n;
 if(parts.length===2&&parts[1].length<=2)n=Number(parts[0].replace(/[.,]/g,'')+'.'+parts[1]);
 else n=Number(s.replace(/[.,]/g,''));
 if(!Number.isFinite(n)||n<=0)return {error:'Importo non valido.'};
 let d=new Date();d.setHours(12,0,0,0);
 if(/\b(avantieri|l.altro ieri)\b/i.test(t))d.setDate(d.getDate()-2);
 else if(/\bieri\b/i.test(t))d.setDate(d.getDate()-1);
 let dm=t.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
 if(dm){let y=dm[3]?Number(dm[3]):d.getFullYear();if(y<100)y+=2000;let x=new Date(y,Number(dm[2])-1,Number(dm[1]),12);if(x.getDate()!==Number(dm[1])||x.getMonth()!==Number(dm[2])-1)return {error:'Data non valida.'};d=x}
 let desc=t.replace(/(?:€\s*|euro\s*)\d[\d.,]*|\b\d[\d.,]*\s*(?:€|euro|eur)\b/gi,' ').replace(/\b(?:oggi|ieri|avantieri|ho|speso|pagato|ricevuto|comprato|per|di|da|al|alla|un|una)\b/gi,' ').replace(/\b\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?\b/g,' ').replace(/\s+/g,' ').trim();
 let key=normal(desc),cat='';
 if(kind!=='event'){
   let sel=selectCategory(kind),available=sel?Array.from(sel.options).map(o=>o.value).filter(Boolean):[];
   let mem=memory();cat=mem[kind+':'+key]||'';
   if(!available.includes(cat))cat='';
   if(!cat){let candidates=available.filter(c=>normal(t).includes(normal(c)));candidates.sort((a,b)=>b.length-a.length);cat=candidates[0]||''}
   if(!cat){let pairs=kind==='in'?[['stipendio','Stipendio'],['pensione','Pensione'],['rimborso','Rimborsi']]:[['benzina|gasolio|diesel|parcheggio','Auto & Trasporti'],['supermercato|alimentari|conad|coop|lidl','Alimentari'],['bolletta|affitto|enel','Casa & Utenze'],['farmacia|medico','Salute'],['ristorante|pizza|cinema','Tempo Libero']];for(let [rx,c] of pairs){if(new RegExp(rx,'i').test(t)&&available.includes(c)){cat=c;break}}}
 }
 return {amount:n.toFixed(2).replace('.',','),date:d,desc:desc||t,cat,key,kind};
}
function apply(){
 let p=parse(e('wpLannaVoiceText').value);if(p.error){status(p.error);return}
 if(p.kind==='in'){
   e('inpYear').value=p.date.getFullYear();e('inpMonth').value=p.date.getMonth();e('inpAmount').value=p.amount;
   if(e('inpDay'))e('inpDay').value=p.date.getDate();
   if(p.cat)e('monthlyIncomeCategory').value=p.cat;
 }else if(p.kind==='out'){
   if(e('expDate'))e('expDate').value=[p.date.getFullYear(),String(p.date.getMonth()+1).padStart(2,'0'),String(p.date.getDate()).padStart(2,'0')].join('-');
   if(e('expAmount'))e('expAmount').value=p.amount;
   if(e('expDesc'))e('expDesc').value=p.desc;
   if(typeof window.walletproSmartSuggest==='function')window.walletproSmartSuggest();
   if(p.cat && (!e('expCategory').value || e('expCategory').value==='Altro'))e('expCategory').value=p.cat;
 }else{
   if(e('evYear'))e('evYear').value=p.date.getFullYear();if(e('evTitle'))e('evTitle').value=p.desc;if(e('evVal'))e('evVal').value=p.amount;
 }
 pending=p;status('Campi compilati. Controlla categoria, importo e data prima di salvare.');
}
// Learning occurs only after successful save; watch data key change rather than assuming click success.
for(let [id,kind] of [['btnSaveNetto','in'],['btnSaveUscita','out']]){
 let b=e(id);if(!b)continue;
 b.addEventListener('click',function(){
   if(!pending||pending.kind!==kind||!pending.key)return;
   let p=pending,cat=selectCategory(kind)?.value||'',before=localStorage.getItem('lamiabp_pro_data_v1');
   setTimeout(function(){
     if(localStorage.getItem('lamiabp_pro_data_v1')===before)return;
     if(cat){let mem=memory();mem[kind+':'+p.key]=cat;try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(_){}}
     if(pending===p)pending=null;
   },150);
 });
}
const btn=e('wpLannaVoiceStart'),field=e('wpLannaVoiceText');
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,recording=false,starting=false,hasResult=false,finalText='',interimText='';
function buttonState(active){
 btn.classList.toggle('recording',active);
 btn.setAttribute('aria-pressed',active?'true':'false');
 const label=btn.querySelector('#wpLannaVoiceMicLabel');
 if(label)label.textContent=active?'Ferma registrazione':'Avvia registrazione';
 else btn.textContent=active?'Ferma registrazione':'Avvia registrazione';
}
if(SR){
 try{
  rec=new SR();rec.lang='it-IT';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
  rec.onstart=function(){starting=false;recording=true;buttonState(true);status('Ascolto in corso… parla chiaramente, poi tocca Ferma registrazione.');};
  rec.onresult=function(ev){
   let finals=[],partials=[];
   for(let i=0;i<ev.results.length;i++){
    const r=ev.results[i],txt=r[0]&&r[0].transcript||'';
    (r.isFinal?finals:partials).push(txt);
   }
   finalText=finals.join(' ').trim();interimText=partials.join(' ').trim();
   field.value=[finalText,interimText].filter(Boolean).join(' ').trim();
   if(field.value){hasResult=true;status('Trascrizione in corso. Tocca Ferma registrazione quando hai finito.');}
  };
  rec.onerror=function(ev){
   starting=false;recording=false;buttonState(false);
   const messages={
    'not-allowed':'Accesso al microfono negato. Consenti il microfono nelle impostazioni di Safari.',
    'service-not-allowed':'Il servizio di riconoscimento vocale non è disponibile o non è autorizzato.',
    'audio-capture':'Microfono non disponibile. Controlla i permessi e riprova.',
    'network':'Riconoscimento vocale non disponibile senza rete in questo browser.',
    'no-speech':'Non è stata rilevata alcuna voce. Tocca Avvia registrazione e riprova.',
    'language-not-supported':'La lingua italiana non è supportata dal riconoscimento del browser.'
   };
   status(messages[ev.error]||('Errore riconoscimento vocale: '+(ev.error||'sconosciuto')));
  };
  rec.onend=function(){
   const hadText=!!field.value.trim();starting=false;recording=false;buttonState(false);
   if(hadText)status('Testo trascritto. Premi Importa per compilare i campi.');
   else if(!hasResult)status('Nessun testo trascritto. Verifica il permesso microfono e riprova.');
  };
 }catch(_){rec=null}
}
function toggleRecording(ev){
 if(ev){ev.preventDefault();ev.stopPropagation();}
 if(!rec){status('Questo browser non offre il riconoscimento vocale. Puoi digitare il testo e premere Importa.');return;}
 if(recording||starting){
  starting=false;recording=false;buttonState(false);
  try{rec.stop()}catch(err){status('Impossibile fermare la registrazione: '+err.message)}
  return;
 }
 if(!window.isSecureContext){status('Il microfono richiede HTTPS (oppure localhost). Apri Wallet-PRO dal sito HTTPS.');return;}
 hasResult=false;finalText='';interimText='';field.value='';
 starting=true;buttonState(true);status('Attivazione microfono… consenti l’accesso quando richiesto.');
 try{rec.start()}catch(err){starting=false;recording=false;buttonState(false);status('Impossibile avviare il riconoscimento: '+err.message)}
}
btn.addEventListener('click',toggleRecording);
btn.addEventListener('contextmenu',function(ev){ev.preventDefault()});
buttonState(false);
e('wpLannaVoiceImport').addEventListener('click',apply);
for(let id of ['segNetto','segUscita','segEvento'])e(id).addEventListener('click',function(){pending=null});
})();
