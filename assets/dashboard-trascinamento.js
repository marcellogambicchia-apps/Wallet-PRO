
/* Dashboard widget drag: long press anywhere, iOS-style preview. */
(function(){
 'use strict';
 var view=document.getElementById('view-dashboard');if(!view)return;
 var grid=document.createElement('div');grid.id='dashboardWidgetGrid';
 var cards=Array.from(view.querySelectorAll('.card[id^="card-"]'));
 var first=view.querySelector('.kpi-grid');if(!first||!first.parentNode)return;
 first.parentNode.insertBefore(grid,first);
 cards.forEach(function(card){
   card.classList.add(['card-netto','card-uscite','card-media','card-totale'].includes(card.id)?'widget-half':'widget-wide');
   grid.appendChild(card);
 });
 view.querySelectorAll('.kpi-grid').forEach(function(el){el.remove()});
 var help=document.createElement('div');help.id='widgetHelp';help.textContent='Tieni premuto un riquadro e trascinalo per riordinarlo';view.appendChild(help);
 var key='walletpro_dashboard_widget_order_v1';
 try{var order=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(order))order.forEach(function(id){var el=document.getElementById(id);if(el&&el.parentNode===grid)grid.appendChild(el)})}catch(e){}
 var pending=null,drag=null,timer=null,ghost=null,slot=null,suppressClickUntil=0;
 function save(){try{localStorage.setItem(key,JSON.stringify(Array.from(grid.children).map(function(el){return el.id}).filter(Boolean)))}catch(e){}}
 function cleanup(){clearTimeout(timer);timer=null;if(ghost)ghost.remove();if(slot)slot.remove();if(drag)drag.card.style.visibility='';document.body.classList.remove('widget-moving');pending=drag=ghost=slot=null;}
 function activate(){
   if(!pending||drag)return;
   var card=pending.card,rect=card.getBoundingClientRect();
   slot=document.createElement('div');slot.className='widget-placeholder '+(card.classList.contains('widget-half')?'widget-half':'widget-wide');slot.style.height=rect.height+'px';
   grid.insertBefore(slot,card);
   ghost=card.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id')});
   ghost.classList.add('widget-drag-preview');
   Object.assign(ghost.style,{position:'fixed',zIndex:'99999',pointerEvents:'none',margin:'0',width:rect.width+'px',height:rect.height+'px',left:rect.left+'px',top:rect.top+'px',transform:'scale(.88)',transformOrigin:'center center'});
   document.body.appendChild(ghost);
   drag={card:card,dx:pending.x-rect.left,dy:pending.y-rect.top};card.style.visibility='hidden';document.body.classList.add('widget-moving');
   if(typeof navigator.vibrate==='function')try{navigator.vibrate(20)}catch(e){}
 }
 function start(id,x,y,target){
   if(pending||drag)return;
   var card=target.closest&&target.closest('#dashboardWidgetGrid > .card');if(!card)return;
   pending={id:id,card:card,x:x,y:y};timer=setTimeout(activate,420);
 }
 function move(id,x,y){
   if(!pending||pending.id!==id)return false;
   if(!drag){if(Math.hypot(x-pending.x,y-pending.y)>11)cleanup();return false;}
   ghost.style.left=(x-drag.dx)+'px';ghost.style.top=(y-drag.dy)+'px';
   var hit=document.elementFromPoint(x,y),card=hit&&hit.closest('#dashboardWidgetGrid > .card');
   if(card&&card!==drag.card){var r=card.getBoundingClientRect();grid.insertBefore(slot,y<r.top+r.height/2?card:card.nextSibling);}
   if(y<70)window.scrollBy(0,-9);else if(y>innerHeight-85)window.scrollBy(0,9);
   return true;
 }
 function finish(id){if(!pending||pending.id!==id)return;if(drag&&slot){grid.insertBefore(drag.card,slot);save();suppressClickUntil=Date.now()+650;}cleanup();}
 grid.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;var t=e.changedTouches[0];start('t'+t.identifier,t.clientX,t.clientY,e.target);},{passive:true});
 window.addEventListener('touchmove',function(e){if(!pending||String(pending.id).charAt(0)!=='t')return;for(var t of e.changedTouches){if(pending.id==='t'+t.identifier){if(move(pending.id,t.clientX,t.clientY))e.preventDefault();break;}}},{passive:false});
 window.addEventListener('touchend',function(e){for(var t of e.changedTouches)finish('t'+t.identifier);},{passive:true});
 window.addEventListener('touchcancel',function(){if(pending&&String(pending.id).charAt(0)==='t')cleanup()});
 grid.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'||e.button!==0)return;start('p'+e.pointerId,e.clientX,e.clientY,e.target)});
 window.addEventListener('pointermove',function(e){if(e.pointerType!=='touch'&&move('p'+e.pointerId,e.clientX,e.clientY))e.preventDefault()},{passive:false});
 window.addEventListener('pointerup',function(e){if(e.pointerType!=='touch')finish('p'+e.pointerId)});
 window.addEventListener('pointercancel',function(e){if(pending&&pending.id==='p'+e.pointerId)cleanup()});
 grid.addEventListener('click',function(e){if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
 grid.addEventListener('contextmenu',function(e){if(pending||drag)e.preventDefault()});
 window.addEventListener('blur',cleanup);
})();
