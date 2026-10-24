/* PROJECT 100X offline cache v0.9.3: network-first app shell, no stale HTML on successful fetch. */
const CACHE='project100x-v093-20261024';
const ASSETS=['./','./index.html','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./portfolio-core.js','./p0-integration.js','./p1-holdings.js','./v09-market-data.js','./p0-regression.js','./p2-backtest-core.js','./p2-backtest-lab.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(ASSETS.map(p=>cache.add(p)));}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('project100x-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(e.request,{cache:'no-store'});
   if(response.ok)await cache.put(e.request,response.clone());
   return response;
  }catch(err){const cached=await caches.match(e.request,{ignoreSearch:true});if(cached)return cached;throw err;}
 })());
});
