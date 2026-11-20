
/* Notifiche locali Wallet-PRO: nessun dato inviato a servizi esterni. */
(function(){'use strict';
 var KEY='walletpro_notify_settings_v1', REM='walletpro_simple_v2';
 var $=function(id){return document.getElementById(id)};
 var defaults={onOpen:true,onDevice:false};
 var prefs;try{prefs=Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){prefs=Object.assign({},defaults)}
 function store(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch(e){status('Impossibile salvare le preferenze')}}
 function status(t){$('wpNotifyStatus').textContent=t}
 function dateAt(y,m,d){return new Date(y,m,d,12,0,0,0)}
 function dueTomorrow(){
  var now=new Date(),tomorrow=dateAt(now.getFullYear(),now.getMonth(),now.getDate()+1);
  var year=tomorrow.getFullYear(),month=tomorrow.getMonth(),last=new Date(year,month+1,0).getDate(),target=tomorrow.getDate();
  var cfg;try{cfg=JSON.parse(localStorage.getItem(REM)||'{}')}catch(e){cfg={}}
  return (Array.isArray(cfg.reminders)?cfg.reminders:[]).filter(function(x){if(x.type==='once')return x.date===year+'-'+String(month+1).padStart(2,'0')+'-'+String(target).padStart(2,'0');if(x.type==='yearly'){var bits=String(x.date||'').split('-'),m=Number(bits[1]),d=Number(bits[2]);if(m!==month+1||!Number.isInteger(d)||d<1)return false;return Math.min(d,last)===target;}var day=Number(x.day);return Number.isInteger(day)&&day>=1&&day<=31&&Math.min(day,last)===target});
 }
 function draw(){
  var due=dueTomorrow(),el=$('wpNotifyDue');el.textContent='';
  if(!prefs.onOpen||!due.length)return;
  var box=document.createElement('div');box.className='wp-notify-due';
  var title=document.createElement('strong');title.textContent=due.length===1?'Hai una scadenza domani':'Hai '+due.length+' scadenze domani';box.appendChild(title);
  due.forEach(function(x){var row=document.createElement('div');row.textContent=String(x.name||'Scadenza');row.style.marginTop='6px';box.appendChild(row)});
  el.appendChild(box);
 }
 async function getPush(){
  if(!window.isSecureContext)throw new Error('Apri Wallet-PRO dal sito HTTPS.');
  if(!('serviceWorker' in navigator)||!('Notification' in window))throw new Error('Notifiche non supportate in questo browser. Su iPhone installa Wallet-PRO nella schermata Home.');
  if(!window.walletProOneSignalReady)throw new Error('OneSignal non è stato caricato.');
  return await window.walletProOneSignalReady;
 }
 $('wpNotifyOpen').checked=!!prefs.onOpen;
 $('wpNotifyDevice').checked=false;
 $('wpNotifyOpen').addEventListener('change',function(){prefs.onOpen=this.checked;store();draw()});
 $('wpNotifyDevice').addEventListener('change',async function(){
  var toggle=this;
  toggle.disabled=true;
  try{
   var os=await getPush();
   if(toggle.checked){
    await os.Notifications.requestPermission();
    if(Notification.permission!=='granted')throw new Error('Autorizzazione non concessa nelle impostazioni del dispositivo.');
    await os.User.PushSubscription.optIn();
    prefs.onDevice=!!os.User.PushSubscription.optedIn;
    if(!prefs.onDevice)throw new Error('Iscrizione push non ancora attiva. Riprova tra qualche secondo.');
    status('Notifiche push abilitate su questo dispositivo. Per gli avvisi automatici sulle scadenze serve ancora il servizio di pianificazione.');
   }else{
    await os.User.PushSubscription.optOut();prefs.onDevice=false;
    status('Notifiche push disattivate su questo dispositivo.');
   }
   toggle.checked=prefs.onDevice;store();
  }catch(e){toggle.checked=!!prefs.onDevice;status('OneSignal: '+(e&&e.message?e.message:String(e)));}
  finally{toggle.disabled=false;}
 });
 $('wpNotifyTest').addEventListener('click',async function(){
  try{
   var os=await getPush();
   if(os.User.PushSubscription.optedIn&&os.User.PushSubscription.id){
    status('Dispositivo iscritto a OneSignal. Per verificare una vera notifica push, invia un messaggio di prova dalla dashboard OneSignal.');
   }else{status('Dispositivo non ancora iscritto alle notifiche push. Attiva prima “Notifiche sul dispositivo”.');}
  }catch(e){status('Prova push non disponibile: '+(e&&e.message?e.message:String(e)));}
  var box=document.createElement('div');box.className='wp-notify-due';box.textContent='Wallet-PRO — Avviso interno di prova';$('wpNotifyDue').prepend(box);
 });
 if(window.isSecureContext&&'serviceWorker' in navigator){
  getPush().then(function(os){
   prefs.onDevice=!!os.User.PushSubscription.optedIn;
   $('wpNotifyDevice').checked=prefs.onDevice;store();
  }).catch(function(e){status('Configurazione push: '+(e&&e.message?e.message:String(e)))});
 }
 draw();document.addEventListener('visibilitychange',function(){if(!document.hidden)draw()});window.addEventListener('focus',draw);window.addEventListener('walletpro:reminders-changed',draw);
 // Gli aggiornamenti delle scadenze vengono riflessi all'apertura o al ritorno in app.
})();
