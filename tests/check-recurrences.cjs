const fs=require('fs'),assert=require('assert'),vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'../assets/funzioni-locali.js'),'utf8');
const fn=src.match(/function wpMonthlyDates\(day,count\)\{[\s\S]*?\n\}/);
assert(fn,'Funzione date mensili non trovata');
const ctx={wpFirstMonthly:()=> '2027-01-31',Date};vm.createContext(ctx);vm.runInContext(fn[0],ctx);
function dates(day,n){return Array.from(ctx.wpMonthlyDates(day,n),d=>d.toISOString().slice(0,10))}
assert.deepStrictEqual(dates(31,4),['2027-01-31','2027-02-28','2027-03-31','2027-04-30']);
assert.deepStrictEqual(dates(30,3),['2027-01-30','2027-02-28','2027-03-30']);
assert.deepStrictEqual(dates(29,3),['2027-01-29','2027-02-28','2027-03-29']);
ctx.wpFirstMonthly=()=> '2028-01-31';
assert.deepStrictEqual(dates(31,3),['2028-01-31','2028-02-29','2028-03-31']);
assert.strictEqual(dates(31,null).length,120);
console.log('OK: ricorrenze 29, 30, 31, febbraio bisestile, limite 10 anni.');
