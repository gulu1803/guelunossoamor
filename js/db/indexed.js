
const DB_NAME = 'na-db';
const DB_VER = 3;
const STORES = ['photos','letters','achievements','timeline','countries','prefs'];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      for(const s of STORES){ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, {keyPath:'id', autoIncrement:true}); }
      const tx = req.transaction;
      const p = tx.objectStore('photos'); if(!p.indexNames.contains('byDate')) p.createIndex('byDate','date');
      const l = tx.objectStore('letters'); if(!l.indexNames.contains('byWhen')) l.createIndex('byWhen','when');
      const t = tx.objectStore('timeline'); if(!t.indexNames.contains('byDate')) t.createIndex('byDate','date');
      const a = tx.objectStore('achievements'); if(!a.indexNames.contains('byUnlocked')) a.createIndex('byUnlocked','unlockedAt');
      const c = tx.objectStore('countries'); if(!c.indexNames.contains('byName')) c.createIndex('byName','std');
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
export async function dbPut(store, obj){
  const db = await openDB();
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readwrite'); tx.objectStore(store).put(obj);
    tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error);
  });
}
export async function dbGetAll(store, index=null, dir='next'){
  const db = await openDB();
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readonly');
    const os = tx.objectStore(store);
    let req;
    try{
      if(index && os.indexNames && os.indexNames.contains(index)){
        req = os.index(index).openCursor(null, dir);
      }else{
        req = os.openCursor();
      }
    }catch{ req = os.openCursor(); }
    const out=[]; req.onsuccess = (e)=>{ const cur=e.target.result; if(cur){ out.push(cur.value); cur.continue(); } else res(out); };
    req.onerror=()=>rej(req.error);
  });
}
export async function dbDelete(store, id){
  const db = await openDB();
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readwrite'); tx.objectStore(store).delete(id);
    tx.oncomplete=()=>res(true); tx.onerror=()=>rej(tx.error);
  });
}
export async function dbGetByKey(store, key){
  const db = await openDB();
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readonly'); const req = tx.objectStore(store).get(key);
    req.onsuccess=()=>res(req.result||null); req.onerror=()=>rej(req.error);
  });
}
