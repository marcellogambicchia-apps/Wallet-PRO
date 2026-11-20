const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'), sw=read('sw.js');
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(x=>x[1]);
const locals=scripts.filter(x=>!/^https?:\/\//.test(x));
assert(html.includes('Versione 3.1.0'),'Versione visibile modificata');
const build=(html.match(/<meta name="walletpro-build" content="([^"]+)"/)||[])[1];
const cache=(sw.match(/const CACHE_NAME\s*=\s*'([^']+)'/)||[])[1];
assert(build&&cache,'Identificativi build/cache assenti');
assert(build.includes('3.1.0')&&cache.includes('v310'),'Versione build/cache non coerente');
assert(build.split('-').slice(-2).join('-')===cache.split('-').slice(-2).join('-'),'Cache non aggiornata rispetto al meta build');
assert(html.includes('class="wp-lanna-refined"'),'Classe del body mancante');
assert(!html.includes('part-17.js'),'Script inutile ancora incluso');
for(const f of locals){ assert(fs.existsSync(path.join(root,f)),`Script mancante: ${f}`); }
for(const f of ['assets/walletpro.css','vendor/pdf.mjs','vendor/pdf.worker.mjs','OneSignalSDKWorker.js','manifest.json']){
 assert(fs.existsSync(path.join(root,f)),`Risorsa necessaria mancante: ${f}`);
}
for(const f of ['vendor/pdf.mjs','vendor/pdf.worker.mjs'])assert(sw.includes(`'./${f}'`),`PDF non in cache: ${f}`);
for(const f of locals)assert(sw.includes(`'./${f}'`),`Script non in cache: ${f}`);
assert(html.includes('https://cdn.onesignal.com/'),'OneSignal non trovato');
assert(html.includes('lamiabp_pro_data_v1')||locals.some(f=>read(f).includes('lamiabp_pro_data_v1')),'Storage principale non trovato');
assert(locals.some(f=>read(f).includes('walletpro_simple_v2')),'Storage aggiuntivo non trovato');
assert(!html.includes('user-scalable=no'),'Zoom bloccato');
console.log(`OK: ${locals.length} script locali, librerie PDF, cache, OneSignal, versione e storage.`);
