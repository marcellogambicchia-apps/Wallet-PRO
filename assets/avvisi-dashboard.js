
/* Avvisi scadenze in Dashboard: solo dati locali, conferma OK per singola occorrenza. */
(function(){'use strict';
 var REM='walletpro_simple_v2', ACK='walletpro_dashboard_ack_v1', PREF='walletpro_notify_settings_v1';
 var root=document.getElementById('wpDashboardReminders');if(!root)return;
 function localDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function dateAt(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate(),12)}
 function nextDate(x,from){
  var type=x.type||'monthly';
  if(type==='once')return /^\d{4}-\d{2}-\d{2}$/.test(x.date||'')?x.date:null;
  if(type==='yearly'){
   var bits=String(x.date||'').split('-'),m=Number(bits[1]),day=Number(bits[2]);
   if(!Number.isInteger(m)||m<1||m>12||!Number.isInteger(day)||day<1||day>31)return null;
   for(var y=from.getFullYear();y<=from.getFullYear()+1;y++){
    var max=new Date(y,m,0).getDate(),date=localDay(dateAt(new Date(y,m-1,Math.min(day,max))));
    if(date>=localDay(from))return date;
   }return null;
  }
  var day=Number(x.day);if(!Number.isInteger(day)||day<1||day>31)return null;
  for(var i=0;i<2;i++){
   var y=from.getFullYear(),m=from.getMonth()+i,max=new Date(y,m+1,0).getDate();
   var date=localDay(dateAt(new Date(y,m,Math.min(day,max))));if(date>=localDay(from))return date;
  }return null;
 }
 function getJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(e){return fallback}}
 function render(){
  var prefs=getJson(PREF,{});root.replaceChildren();root.style.display='none';if(prefs.onOpen===false)return;
  var cfg=getJson(REM,{}),reminders=Array.isArray(cfg.reminders)?cfg.reminders:[];
  var now=dateAt(new Date()),today=localDay(now),tomorrow=dateAt(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)),tomorrowKey=localDay(tomorrow);
  var ack=getJson(ACK,{});if(typeof ack!=='object'||Array.isArray(ack))ack={};
  var active=[];
  reminders.forEach(function(x){
   var date=nextDate(x,now),label='domani';
   if(date!==tomorrowKey){date=nextDate(x,dateAt(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1)));label='oggi';if(date!==today)return;}
   var key=String(x.id||x.name||'scadenza')+'|'+date;
   if(ack[key])return;
   active.push({name:String(x.name||'Scadenza'),date:date,label:label,key:key});
  });
  if(!active.length)return;
  root.style.display='block';
  active.forEach(function(item){
   var card=document.createElement('div');card.className='wp-ios-alert';
   var header=document.createElement('div');header.className='wp-ios-alert-content';
   var bell=document.createElement('div');bell.className='wp-ios-alert-icon';bell.textContent='🔔';bell.setAttribute('aria-hidden','true');
   var content=document.createElement('div');
   var title=document.createElement('strong');title.className='wp-ios-alert-title';title.textContent='Scadenza '+item.label;
   var desc=document.createElement('div');desc.className='wp-ios-alert-desc';desc.textContent=item.name;
   var date=document.createElement('div');date.className='wp-ios-alert-date';date.textContent='Data: '+item.date.split('-').reverse().join('/');
   content.append(title,desc,date);
   var ok=document.createElement('button');ok.type='button';ok.textContent='OK';ok.setAttribute('aria-label','Chiudi avviso per '+item.name);
   ok.className='wp-ios-alert-ok';
   ok.addEventListener('click',function(){var current=getJson(ACK,{});if(!current||typeof current!=='object'||Array.isArray(current))current={};current[item.key]=true;
    try{localStorage.setItem(ACK,JSON.stringify(current))}catch(e){/* Se lo spazio non è disponibile, chiudi almeno l'avviso corrente. */}
    card.remove();if(!root.children.length)root.style.display='none';
   });
   header.appendChild(content);card.append(bell,header,ok);root.appendChild(card);
  });
 }
 render();window.addEventListener('focus',render);document.addEventListener('visibilitychange',function(){if(!document.hidden)render()});
 window.addEventListener('walletpro:reminders-changed',render);window.addEventListener('storage',render);
 var toggle=document.getElementById('wpNotifyOpen');if(toggle)toggle.addEventListener('change',render);
})();
