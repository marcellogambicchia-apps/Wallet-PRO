
/* Correzione isolata budget: convalida, salvataggio e riscontro visibile. */
(function(){'use strict';
var KEY='walletpro_simple_v2',DATA='lamiabp_pro_data_v1';
var get=function(id){return document.getElementById(id)};
var esc=function(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var money=function(c){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(c/100)};
function readCfg(){var c;try{c=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){c={}}if(!c||typeof c!=='object'||Array.isArray(c))c={};if(!c.budgets||typeof c.budgets!=='object'||Array.isArray(c.budgets))c.budgets={};return c}
function readData(){try{return JSON.parse(localStorage.getItem(DATA)||'{}')}catch(e){return {}}}
function cents(value){var n=window.walletProParseAmount(value,'it');return Number.isFinite(n)&&n>0&&n<1e9&&Math.round(n*100)===n*100?Math.round(n*100):null}
function feedback(msg,error){var el=get('wpBudgetFeedback');if(el){el.textContent=msg;el.style.color=error?'#c23b3b':'#16835d'}}
function refresh(){var cfg=readCfg(),d=readData(),expenses=Array.isArray(d.expenses)?d.expenses:[];var select=get('wpBudgetCategory'),previous=select.value;
var cats=walletproBudgetCategories(expenses,cfg.budgets);
select.replaceChildren();cats.forEach(function(cat){var option=document.createElement('option');option.value=cat;option.textContent=cat;select.appendChild(option)});if(cats.includes(previous))select.value=previous;
var month=new Date(),prefix=month.getFullYear()+'-'+String(month.getMonth()+1).padStart(2,'0'),spent={};expenses.forEach(function(x){if(String(x.date||'').slice(0,7)===prefix){var cat=x.category||'Altro',n=Number(x.amount);if(Number.isFinite(n))spent[cat]=(spent[cat]||0)+Math.round(n*100)}});
var list=get('wpBudgetList');list.replaceChildren();var entries=Object.entries(cfg.budgets);if(!entries.length){var empty=document.createElement('div');empty.className='row-sub';empty.textContent='Nessun budget configurato';list.appendChild(empty)}
entries.forEach(function(entry){var cat=entry[0],limit=Number(entry[1]),used=spent[cat]||0,pct=limit>0?Math.round(used/limit*100):0;var row=document.createElement('div');row.className='list-row';var detail=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('div');name.textContent=cat;sub.className='row-sub';sub.textContent=money(used)+' / '+money(limit)+' · '+pct+'%'+(pct>=100?' · Limite superato':pct>=80?' · Vicino al limite':'');detail.append(name,sub);var del=document.createElement('button');del.type='button';del.className='mini-btn';del.textContent='Elimina';del.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var next=readCfg();delete next.budgets[cat];try{localStorage.setItem(KEY,JSON.stringify(next));refresh();feedback('Budget eliminato.')}catch(e){feedback('Impossibile eliminare il budget: '+e.message,true)}});row.append(detail,del);list.appendChild(row)})}
function init(){var btn=get('wpAddBudget');if(!btn)return;btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();var cat=get('wpBudgetCategory').value,amount=cents(get('wpBudgetAmount').value);if(!cat){feedback('Seleziona una categoria.',true);return}if(amount===null){feedback('Inserisci un importo positivo, ad esempio 300,00.',true);return}try{var cfg=readCfg();cfg.budgets[cat]=amount;localStorage.setItem(KEY,JSON.stringify(cfg));refresh();window.dispatchEvent(new Event('walletpro:budget-changed'));feedback('Budget salvato: '+cat+' — '+money(amount));}catch(e){feedback('Salvataggio non riuscito: '+e.message,true)}},true);try{refresh()}catch(e){feedback('Impossibile caricare i budget: '+e.message,true)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
