
(function(){
 function init(){
  var modal=document.getElementById('addModal'),sheet=modal&&modal.querySelector('.modal-sheet');
  var cancel=document.getElementById('closeModalBtn');
  if(!sheet||!cancel)return;
  var dock=document.createElement('div');dock.className='wp-add-actions';
  var forms=['formNetto','formUscita','formEvento'];
  var saves=['btnSaveNetto','btnSaveUscita','btnSaveEvento'];
  saves.forEach(function(id){var b=document.getElementById(id);if(b)dock.appendChild(b)});
  dock.appendChild(cancel);modal.appendChild(dock);
  function update(){var active=forms.findIndex(function(id){var f=document.getElementById(id);return f&&getComputedStyle(f).display!=='none'});
   saves.forEach(function(id,i){var b=document.getElementById(id);if(b)b.style.display=i===active?'block':'none'});
  }
  var observer=new MutationObserver(update);
  forms.forEach(function(id){var f=document.getElementById(id);if(f)observer.observe(f,{attributes:true,attributeFilter:['style','class']})});
  update();
  var btn=document.getElementById('wpLannaVoiceStart');if(!btn)return;
  var svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>';
  var label=document.createElement('span');label.id='wpLannaVoiceMicLabel';
  function render(){var recording=btn.classList.contains('recording');label.textContent=recording?'Ferma registrazione':'Avvia registrazione';btn.replaceChildren();btn.insertAdjacentHTML('afterbegin',svg);btn.appendChild(label);btn.setAttribute('aria-pressed',recording?'true':'false')}
  // Avoid interfering with the original microphone event listeners.
  new MutationObserver(render).observe(btn,{attributes:true,attributeFilter:['class']});
  render();
  btn.addEventListener('contextmenu',function(e){e.preventDefault()});
  btn.addEventListener('selectstart',function(e){e.preventDefault()});
  btn.addEventListener('dragstart',function(e){e.preventDefault()});
  // Safari may not emit Pointer Events on older versions; original listeners remain active.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
