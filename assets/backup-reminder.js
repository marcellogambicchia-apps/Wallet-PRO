(function(){'use strict';
 const KEY='walletpro_backup_reminder_v1', DAYS=30;
 function maybe(){try{
  if(!localStorage.getItem('lamiabp_pro_data_v1'))return;
  const last=Number(localStorage.getItem(KEY)||0), now=Date.now();
  if(last && now-last < DAYS*86400000)return;
  const el=document.createElement('div');el.id='wpBackupReminder';el.setAttribute('role','status');
  el.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));max-width:510px;margin:auto;z-index:185;background:var(--card,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:16px;padding:13px;box-shadow:0 6px 22px #0002;font:14px system-ui';
  const msg=document.createElement('div');msg.textContent='Promemoria: salva periodicamente un backup JSON completo dei tuoi dati. Il backup resta sul dispositivo finché non scegli dove salvarlo.';
  const btn=document.createElement('button');btn.textContent='Ho capito';btn.type='button';btn.style.cssText='margin-top:10px;border:0;background:var(--blue,#007aff);color:white;padding:9px 14px;border-radius:10px';
  btn.addEventListener('click',()=>{localStorage.setItem(KEY,String(Date.now()));el.remove()});el.append(msg,btn);document.body.appendChild(el);
 }catch(e){/* storage unavailable: do not block app */}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(maybe,3000),{once:true});else setTimeout(maybe,3000);
})();