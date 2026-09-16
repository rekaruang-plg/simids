// Retire prototype caches; never cache health data or API responses.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('simids-')).map(k=>caches.delete(k)));
  await self.clients.claim();
  await self.registration.unregister();
})()));
