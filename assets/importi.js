
/* Wallet-PRO: lettura rigorosa e condivisa degli importi.
   Formati misti: l'ultimo separatore è decimale; un singolo
   separatore con tre cifre finali è interpretato come migliaia. */
window.walletProAmountLocale = function(values) {
  var it=0,us=0;
  (values||[]).forEach(function(value){
    if(typeof value!=='string')return;
    var v=value.trim().replace(/[\s\u00a0\u202f€$£¥]/g,'').replace(/^[+\-]|[\-]$/g,'');
    if(/\d\.\d{3},\d{1,2}$/.test(v)||/\d,\d{1,2}$/.test(v))it++;
    if(/\d,\d{3}\.\d{1,2}$/.test(v)||/\d\.\d{1,2}$/.test(v))us++;
  });
  return it>0&&us===0?'it':us>0&&it===0?'us':null;
};
window.walletProParseAmount = function(value, locale) {
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  if(value==null)return NaN;
  var s=String(value).trim().replace(/[\s\u00a0\u202f]/g,'');
  if(!s)return NaN;
  var negative=false;
  if(/^\(.*\)$/.test(s)){negative=true;s=s.slice(1,-1);}
  if(s[0]==='-'||s[0]==='+'){negative=negative||s[0]==='-';s=s.slice(1);}
  if(s.endsWith('-')){negative=true;s=s.slice(0,-1);}
  s=s.replace(/^[€$£¥]/,'').replace(/[€$£¥]$/,'');
  if(!/^\d[\d.,']*$/.test(s))return NaN;
  if(s.includes("'")){
    if(!/^\d{1,3}(?:'\d{3})+(?:[.,]\d{1,2})?$/.test(s))return NaN;
    s=s.replace(/'/g,'');
  }
  var comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
  if(comma>=0&&dot>=0){
    var decimal=comma>dot?',':'.',group=decimal===','?'.':',';
    var parts=s.split(decimal);
    if(parts.length!==2||!/^\d{1,2}$/.test(parts[1]))return NaN;
    if(!new RegExp('^\\d{1,3}(?:\\'+group+'\\d{3})+$').test(parts[0]))return NaN;
    s=parts[0].split(group).join('')+'.'+parts[1];
  }else if(comma>=0||dot>=0){
    var sep=comma>=0?',':'.',parts=s.split(sep);
    if(parts.length>2){
      if(!parts[0]||parts[0].length>3||!parts.slice(1).every(function(x){return /^\d{3}$/.test(x)}))return NaN;
      s=parts.join('');
    }else{
      if(!parts[0]||!parts[1])return NaN;
      if(parts[1].length===3&&parts[0].length<=3){
        if(locale==='it'&&sep==='.')s=parts.join('');
        else if(locale==='us'&&sep===',')s=parts.join('');
        else if(locale==='it'&&sep===',')s=parts.join('.');
        else if(locale==='us'&&sep==='.')s=parts.join('.');
        else return NaN; // Ambiguo: non indovinare mai
      }else if(parts[1].length<=2){s=parts.join('.');}
      else return NaN;
    }
  }
  if(!/^\d+(?:\.\d+)?$/.test(s))return NaN;
  var n=Number(s);return Number.isFinite(n)?(negative?-n:n):NaN;
};
