
function walletproBudgetCategories(expenses,budgets){
  var names=[];
  var source=document.getElementById('expCategory');
  if(source)Array.from(source.options).forEach(function(o){if(o.value)names.push(o.value)});
  (Array.isArray(expenses)?expenses:[]).forEach(function(x){if(x&&typeof x.category==='string')names.push(x.category)});
  Object.keys(budgets||{}).forEach(function(x){names.push(x)});
  return Array.from(new Set(names.filter(function(x){return typeof x==='string'&&x.trim()}))).sort(function(a,b){return a.localeCompare(b,'it')});
}
