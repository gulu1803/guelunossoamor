
// Collapsible section helper (shared in this file)
function toggleSection(h, body){
  let open = true;
  const ch = el('span',{class:'muted small', style:'margin-left:12px; padding-right:6px'}, `${body.__count||0}`);
  const chev = icon('chevronRight',18);
  chev.style.transition = 'transform .2s';
  const head = el('div',{class:'row between center clickable', style:'margin-bottom:8px'},[
    el('div',{class:'row center', style:'gap:8px'},[chev, h]),
    ch
  ]);
  head.addEventListener('click', ()=>{
    open = !open;
    body.style.display = open ? '' : 'none';
    chev.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
  });
  return { head, ch };
}


import { el, openModal, notify, confirmBox, formatDateBR } from '../js/util.js';
import { dbGetAll, dbPut, dbDelete } from '../js/db/indexed.js';
import { Auth } from '../js/auth/auth.js';
import { icon } from '../js/icons.js';

async function upsertAch(slug, payload){
  const all = await dbGetAll('achievements', null, 'next');
  const found = all.find(x=>x.slug===slug);
  const rec = Object.assign({}, found||{}, payload, { slug });
  await dbPut('achievements', rec);
}


async function flagTitleIfVisit(title){
  if (/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/.test(title)) return title;
  const m = title.match(/^Visitamos\s+(.+)/i);
  if(!m) return title;
  const country = m[1].trim();
  try{
    const countries = await dbGetAll('countries', null, 'next');
    const hit = countries.find(c => (c.name||'').toLowerCase() === country.toLowerCase());
    if(hit && hit.iso2) return `${countryToFlag(country)} ${title}`.trim();
  }catch{}
  return title;
}


export async function renderAchievements(root){
  // Carrega conquistas e organiza
  const saved = await dbGetAll('achievements', null, 'next') || [];
  const unlockedArr = [];
  const lockedArr   = [];
  let unlockedCount = 0;
  for(const a of saved){
    if(a && a.unlockedAt){ unlockedArr.push(a); unlockedCount++; }
    else { lockedArr.push(a); }
  }

  // Helpers locais
  function section(title){ return el('div',{class:'card'}, [ el('h4',{}, title) ]); }
  function grid(){ return el('div',{class:'grid'}); }
  function toggle(h, body){
    let open = true;
    const ch = el('span',{class:'muted small', style:'margin-left:12px; padding-right:6px'}, `${body.__count||0}`);
    const chev = icon('chevronRight',18); chev.style.transition='transform .2s';
    const head = el('div',{class:'row between center clickable', style:'margin-bottom:8px'},[ el('div',{class:'row center', style:'gap:8px'},[chev, h]), ch ]);
    head.addEventListener('click', ()=>{ open=!open; body.style.display=open?'':'none'; chev.style.transform=open?'rotate(90deg)':'rotate(0deg)'; });
    return {head, ch};
  }
  function buildRow(a){
    const unlocked = !!a.unlockedAt;
    const row = el('div',{class:'card'});
    const head = el('div',{class:'row', style:'justify-content:space-between; align-items:center'});
    const left = el('div',{class:'row', style:'gap:10px; align-items:center'});
    const iconWrap = el('div',{});
    if(!unlocked) iconWrap.append(icon('lock',22));
    else if(a.icon) iconWrap.append(el('img',{src:a.icon, style:'width:42px;height:42px;border-radius:10px;object-fit:cover'}));
    else iconWrap.append(el('div',{class:'muted small'}, '—'));
    left.append(iconWrap, el('div',{},[
      el('strong',{},[a.title||'—', (unlocked?el('span',{style:'margin-left:6px; opacity:.8'},[icon('checkCircle',14)]):null)]),
      el('div',{class:'muted'}, a.desc||'')
    ]));
    head.append(left, el('span',{class:'badge'}, unlocked ? ('Desbloqueada em '+ formatDateBR(new Date(a.unlockedAt))) : 'Bloqueada'));
    row.append(head);

    const actions = el('div',{class:'row', style:'justify-content:flex-end; gap:10px; margin-top:8px'});
    if(unlocked){
      const relock = el('button',{class:'btn'},[icon('lock'),'Bloquear novamente']);
      relock.onclick = async ()=>{
        await upsertAch(a.slug, { unlockedAt:null });
        notify('Conquista bloqueada novamente.','ok');
        location.reload();
      };
      actions.append(relock);
    }else{
      const unlockBtn = el('button',{class:'btn primary'},[icon('checkCircle'),'Marcar como concluída']);
      unlockBtn.onclick = ()=> openModal(unlockForm(a));
      actions.append(unlockBtn);
    }
    // Excluir para TODAS as conquistas
    const del = el('button',{class:'btn danger'},[icon('trash'),'Excluir']);
    del.onclick = async ()=>{
      if(!(await confirmBox('Excluir esta conquista?'))) return;
      const all = await dbGetAll('achievements', null, 'next');
      const found = all.find(x=>x.slug===a.slug);
      if(found){ await dbDelete('achievements', found.id); notify('Conquista excluída.','ok'); location.reload(); }
    };
    actions.append(del);
    row.append(actions);
    return row;
  }

  // Cabeçalho
  const card = el('div',{class:'card'});
  const header = el('div',{class:'header-row'},[
    el('h3',{},'Conquistas'),
    (()=>{ const b=el('button',{class:'btn primary'},[icon('plus'),'Adicionar conquista']); b.onclick=()=>openModal(achForm()); return b; })()
  ]);
  card.append(header);
  card.append(el('div',{class:'muted'}, `Desbloqueadas: ${unlockedCount} / ${saved.length}`));

  // Seção desbloqueadas
  const secUnlocked = section('Conquistas desbloqueadas');
  const gridUnlocked = grid(); gridUnlocked.__count = unlockedArr.length;
  unlockedArr.forEach(a=> gridUnlocked.append(buildRow(a)));
  const tU = toggle(el('h4',{},'Conquistas desbloqueadas'), gridUnlocked);
  secUnlocked.innerHTML=''; secUnlocked.append(tU.head, gridUnlocked);

  // Seção bloqueadas
  const secLocked = section('Conquistas bloqueadas');
  const gridLocked = grid(); gridLocked.__count = lockedArr.length;
  lockedArr.forEach(a=> gridLocked.append(buildRow(a)));
  const tL = toggle(el('h4',{},'Conquistas bloqueadas'), gridLocked);
  secLocked.innerHTML=''; secLocked.append(tL.head, gridLocked);

  // Render final
  root.innerHTML='';
  card.append(secUnlocked, secLocked);
  root.append(card);
}


function achForm(){
  const box = el('div',{});
  const head = el('div',{class:'modal-head'});
  head.append(el('h3',{},'Nova conquista'), (()=>{ const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b;})());
  const title = el('input',{class:'input', placeholder:'Título'});
  const desc = el('input',{class:'input', placeholder:'Descrição'});
  const iconFile = el('input',{type:'file', accept:'image/*', class:'input'});
  const save = el('button',{class:'btn primary'},'Salvar');

  save.onclick = async ()=>{
    if(!title.value.trim()) return notify('Dê um título para a conquista.','error');
    if(!desc.value.trim()) return notify('Informe a descrição da conquista.','error');
    save.disabled = true;
    let icon64 = '';
    if(iconFile.files[0]){
      icon64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(iconFile.files[0]); });
    }
    const slug = title.value.trim().toLowerCase().replace(/\s+/g,'_').slice(0,60);
    await upsertAch(slug, { title:title.value.trim(), desc:desc.value.trim(), icon:icon64, custom:true, unlockedAt:null });
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close();
    notify('Conquista adicionada! (bloqueada por padrão)','ok');
    location.hash='#/achievements'; location.reload();
  };

  box.append(head, title, desc, iconFile, save);
  return box;
}

function unlockForm(a){
  const box = el('div',{});
  const head = el('div',{class:'modal-head'});
  head.append(el('h3',{},`Desbloquear: ${a.title}`), (()=>{ const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b;})());
  const date = el('input',{type:'date', class:'input'});
  const save = el('button',{class:'btn primary'},'Confirmar');
  save.onclick = async ()=>{
    if(!date.value) return notify('Informe a data de desbloqueio.','error');
    const when = new Date(date.value);
    await upsertAch(a.slug, { unlockedAt: when.getTime(), title:a.title, desc:a.desc, icon:a.icon, custom: a.custom||false });
    try{ await dbPut('timeline', { date: date.value, title:`Conquista "${a.title}" desbloqueada`, by:'Sistema' }); }catch{}
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close();
    notify('Conquista desbloqueada!','ok');
    location.hash='#/achievements'; location.reload();
  };
  box.append(head, date, save);
  return box;
}
