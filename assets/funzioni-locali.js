
/* Wallet-PRO 2.0: funzionalità additive, senza conti multipli. Dati solo locali. */
(function(){'use strict';
var $=id=>document.getElementById(id), KEY='walletpro_simple_v2', DATA='lamiabp_pro_data_v1';
var empty=()=>({version:2,balance:null,budgets:{},reminders:[],goals:[],accent:'default'});
var cfg;try{var savedCfg=JSON.parse(localStorage.getItem(KEY)||'{}');cfg=Object.assign(empty(),savedCfg&&typeof savedCfg==='object'&&!Array.isArray(savedCfg)?savedCfg:{})}catch(e){cfg=empty()}
if(!cfg.budgets||typeof cfg.budgets!=='object'||Array.isArray(cfg.budgets))cfg.budgets={};if(!Array.isArray(cfg.reminders))cfg.reminders=[];if(!Array.isArray(cfg.goals))cfg.goals=[];cfg.reminders=cfg.reminders.filter(x=>x&&typeof x==='object'&&!Array.isArray(x));cfg.goals=cfg.goals.filter(x=>x&&typeof x==='object'&&!Array.isArray(x));
var read=()=>{try{return JSON.parse(localStorage.getItem(DATA)||'{}')}catch(e){return {}}};
var euro=c=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(c/100);
var parse=s=>{var n=window.walletProParseAmount(s, 'it');return Number.isFinite(n)&&Math.abs(n)<1e11?Math.round(n*100):null};
var escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
var validDate=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;var dt=new Date(d+'T12:00:00');return !Number.isNaN(dt.getTime())&&dt.getFullYear()===Number(d.slice(0,4))&&dt.getMonth()+1===Number(d.slice(5,7))&&dt.getDate()===Number(d.slice(8,10))};
var today=()=>{var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
var save=()=>{try{var fresh=JSON.parse(localStorage.getItem(KEY)||'{}');if(fresh&&fresh.budgets&&typeof fresh.budgets==='object')cfg.budgets=fresh.budgets}catch(e){}localStorage.setItem(KEY,JSON.stringify(cfg));render()};
function dated(){var d=read(),out=[];(d.expenses||[]).forEach(x=>{if(validDate(x.date)&&Number.isFinite(Number(x.amount)))out.push({date:x.date,cents:-Math.round(Number(x.amount)*100),category:x.category||'Altro'})});(d.bankIncomeEntries||[]).forEach(x=>{if(validDate(x.date)&&Number.isFinite(Number(x.amount)))out.push({date:x.date,cents:Math.round(Number(x.amount)*100),category:x.category||'Entrate'})});return out}
function sameDaySnapshot(date){var counts={};dated().filter(x=>x.date===date).forEach(x=>{var key=String(x.cents);counts[key]=(counts[key]||0)+1});return counts}
function balance(){if(!cfg.balance||!validDate(cfg.balance.date)||!Number.isInteger(cfg.balance.cents))return null;
var base=cfg.balance,delta=dated().filter(x=>x.date>base.date&&x.date<=today()).reduce((n,x)=>n+x.cents,0);
// I movimenti della giornata di riferimento già presenti al salvataggio sono inclusi nel saldo reale.
// Quelli inseriti successivamente si sommano/sottraggono, senza duplicare i movimenti preesistenti.
if(base.snapshot){var now=sameDaySnapshot(base.date),before=base.snapshot;Object.keys({...before,...now}).forEach(k=>{delta+=(Number(now[k]||0)-Number(before[k]||0))*Number(k)})}
return base.cents+delta}
function render(){var b=balance();$('wpBalanceValue').textContent=b===null?'Da impostare':euro(b);$('wpBalanceNote').textContent=b===null?'Configura il saldo nelle Impostazioni':'Saldo al '+today()+' · base '+cfg.balance.date+' · solo movimenti con data certa';
if(cfg.balance){$('wpOpeningDate').value=cfg.balance.date;$('wpOpeningAmount').value=(cfg.balance.cents/100).toFixed(2).replace('.',',')}
var d=read(),cats=walletproBudgetCategories(d.expenses,cfg.budgets);var sel=$('wpBudgetCategory'),old=sel.value;sel.innerHTML=cats.map(x=>'<option value="'+escape(x)+'">'+escape(x)+'</option>').join('');if(cats.includes(old))sel.value=old;
$('wpRecurringList').innerHTML=cfg.reminders.map(x=>'<div class="list-row"><div><strong>'+escape(x.name)+'</strong><div class="row-sub">'+(x.type==='once'?'Singola · '+escape(x.date||''):x.type==='yearly'?'Annuale · '+escape((x.date||'').slice(5)):x.type==='weekly'?'Settimanale · '+escape(x.date||''):'Mensile · giorno '+escape(x.day))+(x.count?' · '+escape(x.count)+' occorrenze':'')+' · '+euro(x.amount)+'</div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="mini-btn" data-calendar-reminder="'+escape(x.id)+'">Aggiungi al calendario</button><button type="button" class="mini-btn" data-del-reminder="'+escape(x.id)+'">Elimina</button></div></div>').join('')||'<div class="row-sub">Nessuna scadenza</div>';
$('wpGoalList').innerHTML=cfg.goals.map(x=>'<div class="list-row"><div><strong>'+escape(x.name)+'</strong><div class="row-sub">'+euro(x.saved)+' / '+euro(x.target)+' · '+(Number(x.target)>0?Math.round(Number(x.saved)/Number(x.target)*100):0)+'%</div></div><button type="button" class="mini-btn" data-del-goal="'+escape(x.id)+'">Elimina</button></div>').join('')||'<div class="row-sub">Nessun obiettivo</div>';
$('wpAccent').value=cfg.accent||'default';document.documentElement.setAttribute('data-wp-accent',cfg.accent||'default');
}
window.addEventListener('walletpro:data-changed',render);window.addEventListener('walletpro:legacy-restored',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
$('wpSaveBalance').onclick=()=>{var date=$('wpOpeningDate').value,amount=parse($('wpOpeningAmount').value);if(!validDate(date)||date>today()||amount===null)return alert('Inserisci una data valida non futura e un saldo numerico.');cfg.balance={date:date,cents:amount,snapshot:sameDaySnapshot(date)};try{save();$('wpBalanceFeedback').textContent='Saldo aggiornato. I movimenti fino a questa data sono già compresi nel saldo inserito.'}catch(e){alert('Salvataggio non riuscito: '+e.message)}};
/* Budget categoria gestito dal modulo di salvataggio validato sottostante. */
$('wpReminderType').onchange=()=>{var monthly=$('wpReminderType').value==='monthly';$('wpReminderDayWrap').style.display=monthly?'':'none';$('wpReminderDateWrap').style.display=monthly?'none':'';$('wpReminderCount').disabled=$('wpReminderType').value==='once'};
$('wpAddRecurring').onclick=()=>{var name=$('wpRecurringName').value.trim(),amount=parse($('wpRecurringAmount').value),day=Number($('wpRecurringDay').value),type=$('wpReminderType').value,date=$('wpReminderDate').value,countRaw=$('wpReminderCount').value.trim(),count=countRaw?Number(countRaw):null;if(countRaw&&(!Number.isInteger(count)||count<1||count>1200))return alert('Numero scadenze: inserisci un valore da 1 a 1200');if(!name||name.length>80||amount===null||amount<=0)return alert('Controlla descrizione e importo');if(type==='monthly'&&(!Number.isInteger(day)||day<1||day>31))return alert('Inserisci un giorno da 1 a 31');if(type!=='monthly'&&(!validDate(date)||(type==='once'&&date<today())))return alert('Inserisci una data valida, non passata per le scadenze singole');cfg.reminders.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:name,amount:amount,type:type,day:type==='monthly'?day:undefined,date:type!=='monthly'?date:undefined,count:type!=='once'?count:undefined});save();window.dispatchEvent(new Event('walletpro:reminders-changed'));$('wpRecurringName').value='';$('wpRecurringAmount').value=''};
$('wpAddGoal').onclick=()=>{var name=$('wpGoalName').value.trim(),target=parse($('wpGoalTarget').value),saved=parse($('wpGoalSaved').value);if(!name||name.length>80||target===null||target<=0||saved===null||saved<0)return alert('Controlla gli importi');cfg.goals.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:name,target:target,saved:saved});save()};
$('wpAccent').onchange=e=>{cfg.accent=e.target.value;save()};
// Calendar export: only generic title, date and recurrence leave the device in the .ics file.
function wpIcsDate(d){return d.replace(/-/g,'')}
function wpIcsEscape(v){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function wpFirstMonthly(day){var now=new Date(),y=now.getFullYear(),m=now.getMonth();for(var i=0;i<24;i++){var first=new Date(y,m+i,1),last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),candidate=new Date(first.getFullYear(),first.getMonth(),Math.min(day,last),12);if(candidate>=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0))return candidate.getFullYear()+'-'+String(candidate.getMonth()+1).padStart(2,'0')+'-'+String(candidate.getDate()).padStart(2,'0')}return today()}
function wpMonthlyDates(day,count){
 // Genera date di calendario reali: 29/30/31 vengono adattati all'ultimo giorno del mese.
 // Senza numero definito si esportano 120 mesi (10 anni), senza creare una ricorrenza infinita errata.
 var first=wpFirstMonthly(day),parts=first.split('-').map(Number),limit=count?Math.min(1200,Math.floor(count)):120;
 var dates=[];
 for(var i=0;i<limit;i++){
  var d=new Date(parts[0],parts[1]-1+i,1,12),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  var date=new Date(d.getFullYear(),d.getMonth(),Math.min(day,last),12);
  dates.push(date);
 }
 return dates;
}
function wpCalendarExport(r){
 var day=Number(r.day)||1,adjusted=r.type==='monthly'&&day>28;
 var start=r.type==='monthly'?wpFirstMonthly(day):r.date;
 if(!validDate(start)){alert('Data della scadenza non valida');return}
 var rule=r.type==='monthly'?'FREQ=MONTHLY;BYMONTHDAY='+Math.min(day,31):r.type==='yearly'?'FREQ=YEARLY':r.type==='weekly'?'FREQ=WEEKLY':'';
 if(rule&&r.count)rule+=';COUNT='+Math.floor(r.count);
 var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wallet-PRO//Scadenze//IT','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 var uid=String(r.id).replace(/[^a-zA-Z0-9-]/g,'')||'scadenza';
 var stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'').replace(/Z$/,'Z');
 function event(date,index,recurrence){
  var endDate=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1,12);
  var iso=d=>d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  lines.push('BEGIN:VEVENT','UID:'+uid+(adjusted?'-'+index:'')+'@wallet-pro.local','DTSTAMP:'+stamp,
   'DTSTART;VALUE=DATE:'+iso(date),'DTEND;VALUE=DATE:'+iso(endDate),'SUMMARY:'+wpIcsEscape('Promemoria Wallet-PRO'));
  if(recurrence)lines.push('RRULE:'+recurrence);
  lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Promemoria Wallet-PRO','TRIGGER:-P1D','END:VALARM','END:VEVENT');
 }
 if(adjusted){wpMonthlyDates(day,r.count).forEach(function(date,index){event(date,index,'')});}
 else event(new Date(start+'T12:00:00'),0,rule);
 lines.push('END:VCALENDAR','');
 var blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Wallet-PRO-scadenza.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 alert(adjusted?'Calendario pronto: per i giorni 29–31 sono stati creati eventi mensili distinti, adattati all’ultimo giorno del mese. '+(r.count?'Eventi esportati: '+Math.min(1200,Math.floor(r.count))+'.':'Sono esportati i prossimi 120 mesi (10 anni).')+' Le modifiche successive non si sincronizzano automaticamente.':'File calendario pronto. Aprilo o importalo nel calendario iPhone/Android e conferma l’aggiunta. Verifica l’avviso un giorno prima. Modifiche e cancellazioni successive non sono sincronizzate automaticamente.');
}
document.addEventListener('click',e=>{var b=e.target.closest('[data-calendar-reminder],[data-del-budget],[data-del-reminder],[data-del-goal]');if(!b)return;
 if(b.hasAttribute('data-calendar-reminder')){var item=cfg.reminders.find(x=>String(x.id)===b.getAttribute('data-calendar-reminder'));if(item)wpCalendarExport(item);return}
 if(b.hasAttribute('data-del-reminder')){var id=b.getAttribute('data-del-reminder'),r=cfg.reminders.find(x=>String(x.id)===id);if(!r)return;if(!confirm('Eliminare la scadenza da Wallet-PRO?\n\nSe l’hai aggiunta al calendario, dovrai eliminare anche l’evento o l’intera serie dal calendario del telefono.'))return;cfg.reminders=cfg.reminders.filter(x=>String(x.id)!==id);save();window.dispatchEvent(new Event('walletpro:reminders-changed'));alert('Scadenza eliminata da Wallet-PRO. Se era presente nel calendario, apri Calendario e cancella anche l’evento o tutta la serie ricorrente.');return}
 if(b.hasAttribute('data-del-goal'))cfg.goals=cfg.goals.filter(x=>x.id!==b.getAttribute('data-del-goal'));save()});
function collect(){var keys=window.walletProBackup22.snapshot();window.walletProBackup22.validateKeys(keys);return {format:'walletpro-encrypted-backup',version:1,createdAt:new Date().toISOString(),keys:keys}}
function bytes(a){return Array.from(a)}
function b64(a){var s='';a.forEach(function(x){s+=String.fromCharCode(x)});return btoa(s)}
function unb64(s){return Uint8Array.from(atob(s),function(x){return x.charCodeAt(0)})}
async function derive(pass,salt,iterations){var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:iterations,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function download(name,data){var u=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'}));var a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},60000)}
// iOS Safari/PWA may block a programmatic download after asynchronous PBKDF2 encryption.
// Keep the encrypted file in memory and require a second explicit tap to save/share it.
var walletEncryptedFile=null;
var walletEncryptedURL=null;
var encryptedSaveButton=$('wpEncryptedSave');
var encryptedSaveLink=$('wpEncryptedSaveLink');
var encryptedStatus=$('wpEncryptedStatus');
function encryptedMessage(message){encryptedStatus.style.display='block';encryptedStatus.textContent=message}
function clearEncryptedFile(){
 if(walletEncryptedURL){URL.revokeObjectURL(walletEncryptedURL);walletEncryptedURL=null;}
 walletEncryptedFile=null;
 encryptedSaveButton.style.display='none';
 encryptedSaveLink.style.display='none';
 encryptedSaveLink.removeAttribute('href');
}
encryptedSaveButton.addEventListener('click',async function(){
 if(!walletEncryptedFile)return;
 try{
  if(navigator.canShare && navigator.share && navigator.canShare({files:[walletEncryptedFile]})){
   await navigator.share({files:[walletEncryptedFile],title:'Backup cifrato Wallet-PRO'});
   encryptedMessage('Condivisione completata. Verifica la destinazione scelta. Puoi anche usare «Scarica backup cifrato».');
  }else{
   encryptedMessage('La condivisione non è supportata: premi «Scarica backup cifrato».');
  }
 }catch(err){
  encryptedMessage('Condivisione non completata: premi «Scarica backup cifrato» per salvare il file.');
 }
});
$('wpEncryptedExport').addEventListener('click',async function(){
 if(!window.crypto || !window.crypto.subtle){alert('La cifratura richiede una connessione sicura. Apri Wallet-PRO dal sito HTTPS di GitHub Pages, non dal file HTML aperto direttamente sul Mac. Nessun backup è stato creato.');return;}
 var pass=prompt('Password del backup (minimo 12 caratteri):');if(pass===null)return;if(pass.length<12)return alert('Usa almeno 12 caratteri');
 var check=prompt('Ripeti la password:');if(check!==pass)return alert('Le password non coincidono');
 var btn=this;btn.disabled=true;clearEncryptedFile();encryptedMessage('Cifratura in corso…');
 try{
  var salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=310000;
  var key=await derive(pass,salt,iterations),payload=new TextEncoder().encode(JSON.stringify(collect()));
  var encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,payload);
  var json=JSON.stringify({format:'walletpro-aes-gcm',version:1,kdf:'PBKDF2-SHA256',iterations:iterations,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))});
  var filename=window.walletProExportFilename('WalletPRO_backup.walletpro');
  walletEncryptedFile=new File([json],filename,{type:'application/octet-stream'});
  walletEncryptedURL=URL.createObjectURL(walletEncryptedFile);
  encryptedSaveLink.href=walletEncryptedURL;
  encryptedSaveLink.download=filename;
  encryptedSaveLink.style.display='block';
  if(navigator.share && navigator.canShare && navigator.canShare({files:[walletEncryptedFile]}))encryptedSaveButton.style.display='block';
  encryptedMessage('Backup cifrato pronto ('+Math.max(1,Math.ceil(walletEncryptedFile.size/1024))+' KB). Premi «Scarica backup cifrato» per salvarlo. Conserva la password separatamente: senza password non potrai ripristinare il backup.');
 }catch(err){encryptedMessage('Backup cifrato non riuscito. Controlla i dati salvati e lo spazio disponibile.');alert('Backup cifrato non riuscito. Verifica che il backup JSON completo funzioni e che la pagina sia aperta via HTTPS. Nessun file non cifrato è stato creato.')}
 finally{btn.disabled=false}
});
$('wpEncryptedImport').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('wpEncryptedFile').click()}});
$('wpEncryptedFile').addEventListener('change',async function(){
 var file=this.files[0];this.value='';if(!file)return;
 try{if(!window.crypto||!window.crypto.subtle)throw Error('Crittografia non disponibile: apri l’app tramite HTTPS o localhost.');if(file.size>30*1024*1024)throw Error('File troppo grande');var f=JSON.parse(await file.text());if(!f||f.format!=='walletpro-aes-gcm'||f.version!==1||f.kdf!=='PBKDF2-SHA256'||(!Number.isInteger(f.iterations)||f.iterations<100000||f.iterations>1000000)||typeof f.salt!=='string'||typeof f.iv!=='string'||typeof f.ciphertext!=='string'||f.salt.length!==24||f.iv.length!==16||f.ciphertext.length>42*1024*1024)throw Error('Formato non supportato');if(unb64(f.salt).length!==16||unb64(f.iv).length!==12)throw Error('Metadati crittografici non validi');
 var pass=prompt('Password del backup:');if(pass===null)return;var key=await derive(pass,unb64(f.salt),f.iterations);var decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(f.iv)},key,unb64(f.ciphertext));var data=JSON.parse(new TextDecoder().decode(decrypted));
 if(data.format!=='walletpro-encrypted-backup'||!data.keys||typeof data.keys!=='object'||!data.keys[DATA])throw Error('Contenuto non valido');
 window.walletProBackup22.validateKeys(data.keys);
 var allowed=Object.entries(data.keys).filter(function(x){return /^(lamiabp_|walletpro_)/.test(x[0])&&typeof x[1]==='string'});
 if(allowed.length>500 || allowed.some(function(x){return x[1].length>20*1024*1024}))throw Error('Dimensioni del backup non valide');
 if(!confirm('Backup verificato. Sostituire i dati attuali? Questa operazione non può essere annullata senza un backup precedente.'))return;
 window.walletProBackup22.restore(data.keys);
 alert('Backup ripristinato. L’app verrà ricaricata.');location.reload();
 }catch(e){alert('Ripristino non riuscito. Verifica la password, il file e lo spazio disponibile. '+(e&&(/^(ATTENZIONE:|Spazio insufficiente per verificare|Ripristino annullato:)/.test(e.message))?e.message:''))}
});

window.addEventListener('storage',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});document.addEventListener('click',function(e){if(e.target.closest('.nav-item,.tab-item'))setTimeout(render,80)});render();
})();
