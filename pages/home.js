
import { el, daysBetween, formatDateISO, formatDateBR, notify, confirmBox, iso2ToFlag, countryToFlag } from '../js/util.js';
import { icon } from '../js/icons.js';
import { dbGetByKey, dbPut, dbGetAll } from '../js/db/indexed.js';
import { Auth } from '../js/auth/auth.js';

const RELATIONSHIP_START = new Date(2025,2,18);
const BDAY_LU = { m:8, d:11 };
const BDAY_GU = { m:1, d:28 };

export async function renderHome(root){
  setTimeout(__bindResetFights,0);
  const hero = el('div',{class:'hero'});
  hero.append(fightCounterCard(), relationshipCard());
  const counters = birthdaysRow();
  const slide = slideshowSection();
  const countriesCard = await countriesCounterCard();
  const row = el('div',{style:'display:grid; grid-template-columns: 7fr 3fr; gap:16px; align-items:stretch'});
  row.append(slide, countriesCard);
  const spotify = spotifySection();
  root.append(hero, counters, row, spotify);
}
function relationshipCard(){
  const box = el('div',{class:'card counter-big center'});
  const days = daysBetween(RELATIONSHIP_START, new Date());
  box.append(el('div',{},[
    el('div',{class:'muted'},'Nosso relacionamento'),
    el('div',{class:'num'}, `${days} dias`),
    el('div',{class:'muted'}, `Desde ${formatDateBR(RELATIONSHIP_START)}`)
  ]));
  return box;
}
function fightCounterCard(){
  const box = el('div',{class:'card counter-big center'});
  const line = el('div',{});
  const n = el('span',{id:'daysNoFights', class:'num', style:'font-size:28px; margin:0 6px; display:inline-block'},'—');
  const suffix = el('span',{id:'daysNoFightsSuffix', class:'muted'},' dias sem brigas ❤️');
  line.append(el('span',{class:'muted'},'Estamos há '), n, suffix);
  const btn = el('button',{id:'resetFightBtn', class:'btn danger', style:'margin-left:12px'},[icon('refresh'), 'Resetar']);
  btn.addEventListener('click', async ()=>{
    const { dbPut, dbGetByKey } = await import('../js/db/indexed.js');
    const ok = await import('../js/util.js').then(m=>m.confirmBox('Quer mesmo resetar o contador de dias sem brigas?'));
    if(!ok) return;
    const rec = await dbGetByKey('prefs','fights') || { id:'fights' };
    rec.lastReset = new Date().toISOString();
    await dbPut('prefs', rec);
    document.getElementById('daysNoFights').textContent = '0';
    notify('Contador de brigas resetado.','ok'); if (typeof updateFightCounter==='function') updateFightCounter();
  });
    updateFightCounter();
  box.append(line, el('div',{class:'row gap', style:'margin-top:8px; margin-left:12px'},[btn]));
  updateFightCounter();
  return box;
}
async function updateFightCounter(){
  const rec = await dbGetByKey('prefs','fights');
  const since = rec?.lastReset ? new Date(rec.lastReset) : RELATIONSHIP_START;
  const days = daysBetween(since, new Date());
  document.getElementById('daysNoFights').textContent = String(days);
  const suf = document.getElementById('daysNoFightsSuffix'); if(suf){ suf.textContent = (days===1 ? ' dia' : ' dias') + ' sem brigas ❤️'; }
}
function birthdaysRow(){
  const box = el('div',{class:'grid grid-2'});
  box.append(
    bigCounter('Gustavo', BDAY_GU.m, BDAY_GU.d),
    bigCounter('Luiza',   BDAY_LU.m, BDAY_LU.d)
  );
  return el('div',{class:'card'},[ el('h3',{},'Próximos aniversários'), box ]);
}
function bigCounter(label, m, d){
  const c   = el('div',{class:'card center'});
  const head= el('div',{class:'muted'}, label);
  const n   = el('div',{class:'num', style:'font-size:36px; font-weight:900'}, '—');
  const msg = el('div',{class:'badge status-ok', style:'margin-top:8px; display:none'}, 'Feliz aniversário, amor da minha vida ❤️');
  c.append(head, n, msg);

  function nextBirthday(m,d){
    const now = new Date();
    let y = now.getFullYear();
    const targetThis = new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T00:00:00-03:00`);
    return (now >= targetThis)
      ? new Date(`${y+1}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T00:00:00-03:00`)
      : targetThis;
  }

  function tick(){
    // Se hoje é o aniversário (hora local de Brasília), mostra a mensagem e não conta 365
    try {
      const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const isToday = (nowLocal.getMonth()+1)===m && nowLocal.getDate()===d;
      if (isToday){
        n.style.display = 'none';
        msg.textContent = 'Feliz aniversário, amor da minha vida ❤️';
        msg.style.display = '';
        return;
      } else {
        n.style.display = '';
        msg.style.display = 'none';
      }
    } catch(e) {}
    
    const target = nextBirthday(m,d);
    const ms = target - new Date();
    if (ms <= 0){
      n.textContent = '00:00:00';
      msg.style.display = '';
      return;
    }
    if (ms < 86400000){
      const h  = Math.floor(ms / 3600000);
      const mm = Math.floor((ms % 3600000) / 60000);
      const s  = Math.floor((ms % 60000) / 1000);
      n.textContent = `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    } else {
      const days = Math.ceil(ms / 86400000);
      n.textContent = `${days} ${days===1 ? 'dia' : 'dias'}`;
    }
  }
  tick();
  const iv = setInterval(tick, 1000);
  return c;
}


async function countriesCounterCard(){
  const card = el('div',{class:'card'});
  

card.append(el('h3',{},'Número de países que visitamos'));
  const big = el('div',{style:'font-size:36px; font-weight:900; margin-bottom:8px'}, '—');
  const flagsWrap = el('div',{class:'flag-row'});
  card.append(big, flagsWrap);

  async function refresh(){
    try{
      const items = await dbGetAll('countries', null, 'next');
      // normalize and sort by ordem de visita (when asc)
      const norm = items.map(x=>({ iso2: (x.iso2||'').toUpperCase(), name: x.name||'', when: x.when||0, dateISO: x.date||'' }))
                        .sort((a,b)=> (a.when||0) - (b.when||0));
      big.textContent = String(norm.length);
      flagsWrap.innerHTML='';
      for(const it of norm){
        const flag = iso2ToFlag(it.iso2) || countryToFlag(it.name);
        const span = el('span',{class:'flag', title: it.name || it.iso2}, flag || '');
        flagsWrap.append(span);
      }
    }catch(e){
      big.textContent='0';
    }
  }
  refresh();
  return card;
}

function slideshowSection(){
  const card = el('div',{class:'card'});
  card.append(el('h3',{},'Nós! ❤️'));
  const wrap = el('div',{class:'slide-wrap'});
  const a = el('img',{alt:'Slideshow A'}); const b = el('img',{alt:'Slideshow B'});
  wrap.append(a,b); card.append(wrap);
  crossfadeSlideshow(a,b);
  return card;
}
async function cycleSlideshow(imgEl){
  const { dbGetAll } = await import('../js/db/indexed.js');
  const all = await dbGetAll('photos','byDate','prev');
  let idx = 0;
  function show(){
    if(!all.length){ imgEl.src = 'assets/images/image1.jpg'; return; }
    const it = all[idx % all.length];
    imgEl.src = it.dataUrl || 'assets/images/image1.jpg';
    idx++;
  }
  show(); setInterval(show, 5000);
}
function spotifySection(){
  const card = el('div',{class:'card'});
  card.append(el('h3',{},'Nossa playlist'));
  const container = el('div',{class:'embed-wrap'});
  container.innerHTML = `<iframe data-testid="embed-iframe" style="border-radius:12px" src="https://open.spotify.com/embed/playlist/4SzvugbacMllyxsmy2cPYP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  card.append(container.firstChild);
  return card;
}

async function crossfadeSlideshow(a,b){
  // Usa fotos da galeria (mais recentes primeiro); fallback para imagem placeholder
  let all = [];
  try {
    all = await dbGetAll('photos','byDate','prev');
  } catch(e){ all = []; }
  let idx = 0, cur = a, nxt = b;

  function setSrc(img, i){
    if(all.length>0){
      const it = all[i % all.length];
      img.src = it.dataUrl || 'assets/images/image1.jpg';
    } else {
      img.src = 'assets/images/image1.jpg';
    }
  }
  // primeiro frame
  setSrc(cur, 0);
  cur.classList.add('visible');
  idx = 1;

  function show(){
    setSrc(nxt, idx);
    nxt.classList.add('visible');
    cur.classList.remove('visible');
    const tmp = cur; cur = nxt; nxt = tmp;
    idx++;
  }
  setInterval(show, 5000);
}

function birthdayCounter(name, dobISO){
  const card = el('div',{class:'card', style:'min-width:0; flex:1'});
  const title = el('div',{class:'muted'}, name);
  const val = el('div',{style:'font-size:26px; font-weight:700'}, '—');
  const sub = el('div',{class:'muted'}, `Aniversário: ${formatDateBR(dobISO)}`);
  card.append(title, val, sub);
  function tick(){
    const now = brtNow();
    const target = brtMidnightNextBirthday(dobISO);
    const ms = target - now;
    const oneDay = 24*60*60*1000;
    if(ms <= oneDay){
      val.textContent = fmtHMS(ms); // hh:mm:ss
    } else {
      const days = Math.ceil(ms / oneDay);
      val.textContent = `${days} dias`;
    }
  }
  tick();
  setInterval(tick, 1000);
  return card;
}
function relationshipCounter(label, startISO){
  const card = el('div',{class:'card', style:'min-width:0; flex:1'});
  const title = el('div',{class:'muted'}, label);
  const val = el('div',{style:'font-size:26px; font-weight:700'}, '—');
  const sub = el('div',{class:'muted'}, `Desde ${formatDateBR(startISO)}`);
  card.append(title, val, sub);
  function upd(){
    const days = Math.abs(daysBetween(startISO, new Date()));
    val.textContent = `${days} dias`;
  }
  upd();
  setInterval(upd, 60*1000);
  return card;
}

// Safe bind for Reset fights button
function __bindResetFights(){
  const btn = document.getElementById('resetFightBtn');
  if(!btn || btn.__bound) return;
  btn.__bound = true;
  btn.addEventListener('click', async ()=>{
    try{
      if(typeof confirmBox==='function'){
        const ok = await confirmBox('Tem certeza que deseja resetar o contador de dias sem brigas?');
        if(!ok) return;
      }
    }catch(e){}
    const now = new Date();
    await dbPut('prefs', { id:'fights', lastReset: now.toISOString() });
    notify('Contador de brigas resetado.','ok');
    if(typeof updateFightCounter==='function') await updateFightCounter();
  });
}
document.addEventListener('DOMContentLoaded', ()=> setTimeout(__bindResetFights,0));


// Delegação global para resetar contador de brigas (funciona mesmo após re-render)
(function bindResetFightsDelegation(){
  if (document.__resetFightsBound) return;
  document.__resetFightsBound = true;

  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('#resetFightBtn, [data-action="reset-fights"]');
    if (!btn) return;

    ev.preventDefault();

    try{
      if (typeof confirmBox === 'function') {
        const ok = await confirmBox('Tem certeza que deseja resetar o contador de dias sem brigas?');
        if (!ok) return;
      }
    }catch(e){}

    const now = new Date();
    await dbPut('prefs', { id: 'fights', lastReset: now.toISOString() });

    const numEl = document.getElementById('daysNoFights');
    const sufEl = document.getElementById('daysNoFightsSuffix');
    if (numEl) numEl.textContent = '0';
    if (sufEl)  sufEl.textContent  = ' dias sem brigas ❤️';

    notify('Contador de brigas resetado.', 'ok');

    if (typeof updateFightCounter === 'function') {
      await updateFightCounter();
    }
  }, true);
})();
