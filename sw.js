// Service worker Nightlex: офлайн-доступ. Сторінка — «спершу мережа» з обходом HTTP-кешу браузера (cache:'no-cache' → звірка з сервером),
// щоб нова версія приходила одразу; картинки, звук і дані з хешем у назві (data/core.<хеш>.js, data/more.<хеш>.js — незмінні) — з кешу.
// Встановлення (14.11.2026): не качає заново те, що сторінка щойно завантажила — index.html лише звіряється (304), файли з хешем беруться з HTTP-кешу.
// 15.11.2026: dev, preprod і main — на одному домені, кеші спільні; назва кешу містить шлях сайту, і кожен SW видаляє лише свої старі кеші
const PFX='lingvo-'+new URL(self.registration.scope).pathname.replace(/[^a-z0-9-]/gi,'')+'~';  // «~» — щоб «lingvo-nightlex~» не був початком «lingvo-nightlex-main~»
const CACHE=PFX+'8cc3587112';
const HASHED=["data/core.858fc3adc4.js", "data/more.8321a49a4f.js", "fonts/golos-text-cyrillic.woff2", "fonts/golos-text-latin-ext.woff2", "fonts/golos-text-latin.woff2", "fonts/unbounded-cyrillic.woff2", "fonts/unbounded-latin-ext.woff2", "fonts/unbounded-latin.woff2", "fonts/literata-latin-700-normal.woff2"];
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','data/sent_A1.json','data/sent_A2.json','data/sent_B1.json','data/sent_B2.json','data/sent_C1.json','data/sent_C2.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all([
  c.addAll(CORE.map(u=>new Request(u,{cache:'no-cache'}))),c.addAll(HASHED)])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&(k.startsWith(PFX)||/^lingvo-[0-9a-f]+$/.test(k))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.includes('/img/')||u.pathname.includes('/aipic/')||u.pathname.includes('/audio/')||u.pathname.includes('/fonts/')||/\/data\/(core|more)\.[0-9a-f]+\.js$/.test(u.pathname)){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return res})));return}
  e.respondWith(fetch(u.href,{cache:'no-cache',credentials:'same-origin'}).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return res}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
});
