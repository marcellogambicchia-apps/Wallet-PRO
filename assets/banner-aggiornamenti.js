
(function(){'use strict';
 var banner=document.getElementById('wpUpdateBanner');
 var lastCheck=0, latestHash=null, dismissedHash=null;
 function checksum(str){var table=checksum.table;if(!table){table=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}checksum.table=table}var bytes=new TextEncoder().encode(str),crc=-1;for(var i=0;i<bytes.length;i++)crc=table[(crc^bytes[i])&255]^(crc>>>8);return (crc^-1)>>>0}
 function sourceWithoutPatch(t){var start='<!-- WALLET-PRO UPDATE CHECK '+'START -->',end='<!-- WALLET-PRO UPDATE CHECK '+'END -->';var a=t.indexOf(start),b=t.indexOf(end,a);return a>=0&&b>a?t.slice(0,a)+t.slice(b+end.length):t}
 async function check(){if(!/^https?:$/.test(location.protocol)||!navigator.onLine)return;var now=Date.now();if(now-lastCheck<60000)return;lastCheck=now;
 try{var u=new URL('index.html',location.href);if(u.origin!==location.origin || u.pathname!==new URL('index.html',location.href).pathname)return;u.searchParams.set('walletpro_check',String(now));var r=await fetch(u.href,{cache:'no-store',credentials:'same-origin',referrerPolicy:'no-referrer'});if(!r.ok)return;var html=await r.text();if(!/<title>Wallet-PRO<\/title>/i.test(html))return;
 var remote=checksum(sourceWithoutPatch(html));latestHash=remote;var current=checksum(sourceWithoutPatch(document.documentElement.outerHTML));
 var currentBuild=(document.querySelector('meta[name="walletpro-build"]')||{}).content;var remoteBuild=(html.match(/<meta name="walletpro-build" content="([^"]+)"/)||[])[1];
 banner.style.display=remoteBuild&&currentBuild&&remoteBuild!==currentBuild&&remote!==dismissedHash?'flex':'none';
 }catch(e){/* offline: nessun messaggio invasivo */}}
 document.getElementById('wpUpdateDismiss').addEventListener('click',function(){dismissedHash=latestHash;banner.style.display='none'});
 document.getElementById('wpUpdateNow').addEventListener('click',async function(){
 try{if('serviceWorker' in navigator){var regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.filter(function(r){return r.scope===new URL('./',location.href).href}).map(function(r){return r.update().catch(function(){})}))}}catch(e){}
 var u=new URL('index.html',location.href);if(u.origin!==location.origin)return;u.searchParams.set('walletpro_refresh',String(Date.now()));location.replace(u.href);
 });
 setTimeout(check,2500);document.addEventListener('visibilitychange',function(){if(!document.hidden)check()});window.addEventListener('focus',check);
})();
