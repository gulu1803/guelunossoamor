import { notify } from '../util.js';
import { dbGetAll, dbPut } from '../db/indexed.js';
import { getSupabase, isSupabaseConfigured, SPACE_OWNER } from '../db/supabase.js';

const STORES=['letters','photos','timeline','achievements','countries'];
let lastSyncAt=0;
let syncing=false;

function ensureUUID(rec){
  if(!rec.uuid){ rec.uuid=(crypto?.randomUUID?.()||Math.random().toString(36).slice(2))+'-'+Date.now(); }
  if(!rec.updatedAt){ rec.updatedAt=Date.now(); }
  return rec;
}

async function pushStore(sb, s, owner){
  const rows=(await dbGetAll(s)).map(r=>ensureUUID({...r}));
  const payloads = rows.map(r => ({ uuid: r.uuid, owner, payload: r, updated_at: r.updatedAt }));
  if(payloads.length){
    const { error } = await sb.from(s).upsert(payloads, { onConflict:'uuid' }).select('uuid');
    if(error) throw new Error(`push ${s}: `+error.message);
  }
}

async function pullStore(sb, s, owner){
  const { data, error } = await sb.from(s).select('uuid,payload,updated_at').eq('owner', owner).order('updated_at',{ascending:true});
  if(error) throw new Error(`pull ${s}: `+error.message);
  const rows = data||[];
  for(const row of rows){
    const rec = row.payload || {};
    rec.uuid = row.uuid;
    rec.updatedAt = row.updated_at || Date.now();
    await dbPut(s, rec);
  }
}

async function syncNow(){
  if(syncing || !navigator.onLine || !isSupabaseConfigured()) return;
  const sb = getSupabase();
  try{
    syncing=true;
    const user = window.Auth?.getSessionUser?.();
    if(!user){ return; }
    const u = await sb.auth.getUser();
    const email = u?.data?.user?.email || null;
    const owner = SPACE_OWNER || email || user.id;
    for(const s of STORES){
      await pushStore(sb, s, owner);
      await pullStore(sb, s, owner);
    }
    lastSyncAt = Date.now();
    console.log('[sync] ok', new Date(lastSyncAt).toLocaleString());
  }catch(e){
    console.warn('[sync] falhou:', e?.message||e);
  }finally{
    syncing=false;
  }
}

// Auto-sync
function autoLoop(){
  if(document.visibilityState==='visible' && navigator.onLine){
    if(Date.now()-lastSyncAt>15000) syncNow();
  }
  setTimeout(autoLoop, 5000);
}
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') syncNow(); });
window.addEventListener('online', ()=>syncNow());
setTimeout(autoLoop, 5000);

window.SYNC = Object.freeze({ syncNow });
