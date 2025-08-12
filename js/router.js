
export function router(routes, requireLogin){
  const hash = location.hash;
  const path = (hash && hash.replace('#','')) || '/';
  const fn = routes[path] || routes['/'];
  (async ()=>{
    const ok = await requireLogin();
    if(!ok) return;
    const root = document.getElementById('app');
    if(!root) return;
    root.innerHTML = '';
    try{
      await fn(root);
    }catch(e){
      console.error('Router render error:', e);
      root.innerHTML = `<div class="card"><h3>Ops...</h3><div class="muted">Erro ao renderizar <code>${path}</code>: ${e?.message||e}</div></div>`;
    }
    window.scrollTo(0,0);
  })();
}
