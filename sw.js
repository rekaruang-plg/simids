const CACHE='simids-v6';
const ASSETS=['./','./index.html','./loader.js','./manifest.json','./chunks/body-1.txt','./chunks/body-2.txt','./chunks/body-3.txt','./chunks/css-1.txt','./chunks/css-2.txt','./chunks/css-3.txt','./chunks/css-4.txt','./chunks/js-1.txt','./chunks/js-2.txt','./chunks/js-3.txt','./chunks/js-4.txt','./chunks/js-5.txt','./chunks/js-6.txt'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
