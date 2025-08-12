// Login silencioso no Supabase após login local
import { getSupabase, isSupabaseConfigured, SUPABASE_EMAILS } from '../db/supabase.js';

window.addEventListener('app:login', async (ev)=>{
  try{
    if(!isSupabaseConfigured()) return;
    const { id, name, password } = ev.detail || {};
    const email = SUPABASE_EMAILS[name] || SUPABASE_EMAILS[id];
    if(!email || !password) return;
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if(!error){ console.log('[supabase] login ok como', email); }
    else { console.warn('[supabase] falha login:', error.message); }
  }catch(e){ console.warn('[supabase] erro login silencioso', e); }
});

window.addEventListener('app:logout', async ()=>{
  try{ const sb=getSupabase(); await sb?.auth?.signOut?.(); }catch{}
});
