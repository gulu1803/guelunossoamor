
const STATIC_CACHE='app-static-v10';
const REMOTE_CACHE='app-remote-v10';

self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{ self.clients.claim(); });

self.addEventListener('fetch', event=>{
  // Shim: mark JS requests under /pages/
  try{ const u=new URL(event.request.url); u.pathname.ends_with_js = u.pathname.endsWith('.js') && (u.pathname.includes('/pages/')); }catch(e){}

  const req = event.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);

  /* JS network-first */
  if(url.origin===location.origin && url.pathname.ends_with_js){
    event.respondWith((async ()=>{
      try{ return await fetch(req); }catch(e){ const cache = await caches.open(STATIC_CACHE); const cached = await cache.match(req); return cached || Response.error(); }
    })());
    return;
  }

  // Same-origin: cache-first
  if(url.origin===location.origin){
    event.respondWith(caches.open(STATIC_CACHE).then(async cache=>{
      const cached = await cache.match(req);
      if(cached) return cached;
      try{
        const resp = await fetch(req);
        if(resp && resp.status===200) cache.put(req, resp.clone());
        return resp;
      }catch(e){
        return cached || Response.error();
      }
    }));
    return;
  }

  // Remote datasets: network-first with cache fallback
  if(['raw.githubusercontent.com','cdn.jsdelivr.net','unpkg.com'].includes(url.hostname)){
    event.respondWith(caches.open(REMOTE_CACHE).then(async cache=>{
      try{
        const resp = await fetch(req);
        if(resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }catch(e){
        const cached = await cache.match(req);
        if(cached) return cached;
        return Response.error();
      }
    }));
  }
});
