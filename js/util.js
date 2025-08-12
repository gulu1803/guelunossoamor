
// ===== utils (single, clean definitions) =====

export function el(tag, attrs={}, children=null){
  const e = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==='class') e.className = v;
    else if(k==='style') e.setAttribute('style', v);
    else e.setAttribute(k,v);
  }
  const append = (c)=>{
    if(c==null) return;
    if(Array.isArray(c)) c.forEach(append);
    else if(c instanceof Node) e.appendChild(c);
    else e.appendChild(document.createTextNode(String(c)));
  };
  append(children);
  return e;
}

export function openModal(content){
  let dlg = document.getElementById('modal');
  if(!dlg){
    dlg = document.createElement('dialog'); dlg.id='modal';
    document.body.appendChild(dlg);
  }
  dlg.innerHTML = '';
  const box = el('div',{class:'content'});
  if(typeof content === 'string'){ box.innerHTML = content; } else { box.append(content); }
  dlg.append(box);
  try{ dlg.showModal(); }catch{ dlg.setAttribute('open',''); }
  return dlg;
}

export function ensureSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
}

// Dates
export function daysBetween(startISO, endISO){
  const a = new Date(startISO); const b = new Date(endISO);
  return Math.floor((b - a)/(1000*60*60*24));
}
export function formatDateISO(d=new Date()){
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export function formatDateBR(v){
  try{
    // If it's a pure date string 'YYYY-MM-DD', format without timezone shifts
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y,m,d] = v.split('-').map(n=>parseInt(n,10));
      const dd = String(d).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      return `${dd}/${mm}/${y}`;
    }
    // If it's epoch ms or a Date-like string, render in pt-BR pinned to São Paulo timezone
    const d = (typeof v==='number' || /^[0-9]+$/.test(String(v))) ? new Date(Number(v)) : new Date(v);
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }catch{
    return '';
  }
}


// Weather icon (emoji)
export function weatherIcon(code){
  const c = Number(code)||0;
  if([0].includes(c)) return '☀️';
  if([1,2].includes(c)) return '⛅';
  if([3].includes(c)) return '☁️';
  if([45,48].includes(c)) return '🌫️';
  if([51,53,55,56,57].includes(c)) return '🌦️';
  if([61,63,65,66,67,80,81,82].includes(c)) return '🌧️';
  if([71,73,75,77,85,86].includes(c)) return '❄️';
  if([95,96,99].includes(c)) return '⛈️';
  return '🌡️';
}

// Toast host (with close & clear-all), single definition
export function ensureToastHost(){
  let host = document.getElementById('toastHost');
  if(!host){
    host = document.createElement('div'); host.id='toastHost';
    const ctrls = document.createElement('div'); ctrls.className='controls'; ctrls.style.display='none';
    const clear = document.createElement('button'); clear.className='clearAll'; clear.textContent='Limpar avisos';
    clear.onclick = ()=>{ host.querySelectorAll('.toast').forEach(t=>t.remove()); ctrls.style.display='none'; };
    ctrls.appendChild(clear); host.appendChild(ctrls);
    document.body.appendChild(host);
  }
  return host;
}
export function notify(msg, type='ok', timeout=2500){
  const host = ensureToastHost();
  const ctrls = host.querySelector('.controls'); if(ctrls) ctrls.style.display='flex';
  const box = document.createElement('div'); box.className = 'toast '+type;
  const span = document.createElement('div'); span.textContent = msg;
  const x = document.createElement('button'); x.className='close'; x.textContent='×';
  x.onclick = ()=>{ box.remove(); if(!host.querySelector('.toast')) ctrls.style.display='none'; };
  box.append(span, x); host.appendChild(box);
  if(timeout>0){
    setTimeout(()=>{ if(box.isConnected){ box.style.opacity='0'; box.style.transform='translateY(6px)'; setTimeout(()=>{ box.remove(); if(!host.querySelector('.toast') && ctrls) ctrls.style.display='none'; }, 300); } }, timeout);
  }
}

// Small confirm box
export function confirmBox(message){
  return new Promise((resolve)=>{
    let ov = document.getElementById('confirmOverlay');
    if(ov) ov.remove();
    ov = document.createElement('div'); ov.id='confirmOverlay';
    const box = document.createElement('div'); box.className='confirm';
    const p = document.createElement('div'); p.textContent = message;
    const actions = document.createElement('div'); actions.className='actions';
    const yes = document.createElement('button'); yes.className='btn primary'; yes.textContent='Confirmar';
    const no = document.createElement('button'); no.className='btn'; no.textContent='Cancelar';
    actions.append(no, yes); box.append(p, actions); ov.append(box); document.body.append(ov);
    no.onclick = ()=>{ ov.remove(); resolve(false); };
    yes.onclick = ()=>{ ov.remove(); resolve(true); };
  });
}


// Convert ISO2 (e.g., 'BR') to flag emoji
export function iso2ToFlag(code){
  try{
    if(!code || typeof code!=='string' || code.length!=2) return '';
    const up=code.toUpperCase();
    const A=0x1F1E6;
    const c1=A + (up.charCodeAt(0)-65);
    const c2=A + (up.charCodeAt(1)-65);
    return String.fromCodePoint(c1) + String.fromCodePoint(c2);
  }catch{ return ''; }
}


// Heuristic mapping from country name (PT/EN variants) to ISO2
const NAME_TO_ISO2 = new Map(Object.entries({
  "brasil":"BR","brazil":"BR",
  "argentina":"AR",
  "estados unidos":"US","united states":"US","united states of america":"US","usa":"US",
  "reino unido":"GB","united kingdom":"GB","uk":"GB","inglaterra":"GB","england":"GB",
  "franca":"FR","france":"FR",
  "alemanha":"DE","germany":"DE",
  "italia":"IT","italy":"IT",
  "espanha":"ES","spain":"ES",
  "portugal":"PT",
  "mexico":"MX",
  "canada":"CA",
  "china":"CN",
  "japao":"JP","japan":"JP",
  "coreia do sul":"KR","south korea":"KR","republic of korea":"KR",
  "coreia do norte":"KP","north korea":"KP",
  "russia":"RU","federacao russa":"RU",
  "india":"IN",
  "australia":"AU",
  "nova zelandia":"NZ","new zealand":"NZ",
  "chile":"CL",
  "uruguai":"UY",
  "paraguai":"PY",
  "bolivia":"BO",
  "peru":"PE",
  "colombia":"CO",
  "venezuela":"VE",
  "equador":"EC","ecuador":"EC",
  "republica dominicana":"DO","dominican republic":"DO",
  "cuba":"CU",
  "haiti":"HT",
  "jamaica":"JM",
  "irlanda":"IE","ireland":"IE",
  "islandia":"IS","iceland":"IS",
  "noruega":"NO",
  "suecia":"SE","sweden":"SE",
  "finlandia":"FI","finland":"FI",
  "dinamarca":"DK","denmark":"DK",
  "holanda":"NL","paises baixos":"NL","netherlands":"NL",
  "belgica":"BE","belgium":"BE",
  "suica":"CH","switzerland":"CH",
  "austria":"AT",
  "polonia":"PL","poland":"PL",
  "hungria":"HU","hungary":"HU",
  "grecia":"GR","greece":"GR",
  "turquia":"TR","turkey":"TR","türkiye":"TR",
  "egito":"EG","egypt":"EG",
  "marrocos":"MA","morocco":"MA",
  "tunisia":"TN","tunisia":"TN",
  "africa do sul":"ZA","south africa":"ZA",
  "angola":"AO",
  "mocambique":"MZ","mozambique":"MZ",
  "nigeria":"NG",
  "etiopia":"ET","ethiopia":"ET",
  "emirados arabes unidos":"AE","united arab emirates":"AE","uae":"AE",
  "arabia saudita":"SA","saudi arabia":"SA",
  "israel":"IL",
  "palestina":"PS","state of palestine":"PS","palestinian territories":"PS",
  "jordania":"JO","jordan":"JO",
  "libano":"LB","lebanon":"LB",
  "iran":"IR",
  "iraque":"IQ","iraq":"IQ",
  "siria":"SY","syria":"SY",
  "tailandia":"TH","thailand":"TH",
  "vietna":"VN","viet nam":"VN","vietnam":"VN",
  "singapura":"SG","singapore":"SG",
  "malasia":"MY","malaysia":"MY",
  "indonesia":"ID",
  "filipinas":"PH","philippines":"PH",
  "camboja":"KH","cambodia":"KH",
  "laos":"LA",
  "myanmar":"MM","burma":"MM",
  "taiwan":"TW",
  "hong kong":"HK",
  "macao":"MO","macau":"MO",
  "groenlandia":"GL","greenland":"GL",
  "israel":"IL",
  "ucranIa":"UA","ukraine":"UA",
  "bielorrussia":"BY","belarus":"BY",
  "tchequia":"CZ","republica tcheca":"CZ","czechia":"CZ",
  "eslovaquia":"SK","slovakia":"SK",
  "eslovenia":"SI","slovenia":"SI",
  "croacia":"HR","croatia":"HR",
  "servia":"RS","serbia":"RS",
  "bosnia e herzegovina":"BA","bosnia and herzegovina":"BA",
  "montenegro":"ME",
  "macedonia do norte":"MK","north macedonia":"MK",
  "albania":"AL",
  "romenia":"RO","romania":"RO",
  "bulgaria":"BG",
  "georgia":"GE",
  "armenia":"AM",
  "azerbaijao":"AZ","azerbaijan":"AZ",
  "cazaquistao":"KZ","kazakhstan":"KZ",
  "quirguistao":"KG","kyrgyzstan":"KG",
  "uzbequistao":"UZ","uzbekistan":"UZ",
  "turcomenistao":"TM","turkmenistan":"TM"
}));
export function nameToISO2(name){
  try{
    if(!name) return '';
    const n = String(name).normalize('NFD').replace(/\\u0300-\u036f/gu,'').toLowerCase().trim();
    return NAME_TO_ISO2.get(n) || '';
  }catch{ return ''; }
}export function countryToFlag(nameOrIso2){
  const iso2 = (nameOrIso2||'').length===2 ? nameOrIso2 : nameToISO2(nameOrIso2);
  return iso2ToFlag(iso2);
}


// Parse 'dd/mm/yyyy' or 'yyyy-mm-dd' as a LOCAL day (no -1 day issues).
// We set time to 12:00 local to avoid DST edges.
export function parseLocalDay(input){
  if(!input) return null;
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12, 0, 0, 0);
  const s = String(input).trim();
  // dd/mm/yyyy
  let m = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if(m){
    const d = parseInt(m[1],10), mo = parseInt(m[2],10)-1, y = parseInt(m[3],10);
    return new Date(y, mo, d, 12, 0, 0, 0);
  }
  // yyyy-mm-dd (treat as local, not UTC)
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m){
    const y = parseInt(m[1],10), mo = parseInt(m[2],10)-1, d = parseInt(m[3],10);
    return new Date(y, mo, d, 12, 0, 0, 0);
  }
  // ISO string -> use local components
  try{
    const dt = new Date(s);
    if(!isNaN(dt)) return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12,0,0,0);
  }catch(e){}
  return null;
}

// expose to global for non-module scripts
try { window.parseLocalDay = parseLocalDay; } catch(e) {}
