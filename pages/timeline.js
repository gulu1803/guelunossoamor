
// parseLocalDay shim (defensive)
if (typeof parseLocalDay !== 'function') {
  function parseLocalDay(input){
    if(!input) return null;
    if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12, 0, 0, 0);
    const s = String(input).trim();
    let m = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
    if(m){ const d=parseInt(m[1],10), mo=parseInt(m[2],10)-1, y=parseInt(m[3],10); return new Date(y,mo,d,12,0,0,0); }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(m){ const y=parseInt(m[1],10), mo=parseInt(m[2],10)-1, d=parseInt(m[3],10); return new Date(y,mo,d,12,0,0,0); }
    try{ const dt=new Date(s); if(!isNaN(dt)) return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12,0,0,0);}catch(e){}
    return null;
  }
}


import { el, openModal, notify, confirmBox, formatDateBR, iso2ToFlag, countryToFlag } from '../js/util.js';
import { dbGetAll, dbPut, dbDelete } from '../js/db/indexed.js';
import { icon } from '../js/icons.js';
import { Auth } from '../js/auth/auth.js';

// Garante bandeira em títulos "Visitamos X" (sem duplicar)
async function ensureFlagTitle(title){
  // já tem emoji? mantém
  if (/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/.test(title)) return title;
  const m = title.match(/^Visitamos\s+(.+)/i);
  if (!m) return title;
  const country = m[1].trim();
  const flag = countryToFlag(country); // usa ISO2 direto ou mapeia pelo nome
  return flag ? `${flag} ${title}` : title;
}

export async function renderTimeline(root){
  const me = Auth.getSessionUser();
  const wrap = el('div',{class:'card'});
  const header = el('div',{class:'header-row'},[ el('h3',{},'Linha do tempo'), el('button',{class:'btn primary', id:'addMomentBtn'},[icon('plus'),'Adicionar momento']) ]);
  wrap.append(header, el('div',{class:'muted'},'Arraste para os lados ou use as setas'));
  const track = el('div',{class:'timeline', tabindex:'0', style:'position:relative; scroll-behavior:smooth'});

  const navRow = el('div',{class:'row gap', style:'justify-content:space-between; margin-bottom:8px'},[
    el('button',{class:'btn icon-only', id:'tlLeft'}, [icon('chevronLeft')]),
    el('button',{class:'btn icon-only', id:'tlRight'}, [icon('chevronRight')])
  ]);

  wrap.append(navRow, track); root.append(wrap);

  const seeds = await fetch('data/timeline.json').then(r=>r.json()).catch(()=>[]);
  const derived = await dbGetAll('timeline','byDate','next');
  const all = [...seeds, ...derived].sort((a,b)=> new Date(a.date) - new Date(b.date));
  for(const ev of all){
    const card = el('div',{class:'event'});
    const head = el('div',{class:'row gap', style:'justify-content:space-between; align-items:center'});
    head.append(
      el('div',{class:'muted'}, parseLocalDay(ev.date).toLocaleDateString('pt-BR') + (ev.by? ` • por ${ev.by}`:'')),
      (ev.id? (()=>{ const b=el('button',{class:'btn danger'},[icon('trash'),'']); b.addEventListener('click', async ()=>{ if(await import('../js/util.js').then(m=>m.confirmBox('Apagar este momento?'))){ await dbDelete('timeline', ev.id); location.hash='#/timeline'; location.reload(); } }); return b; })() : el('span'))
    );
    card.append(
      head,
      el('strong',{}, ev.title),
      ev.image ? el('img',{src:ev.image, style:'width:100%; border-radius:8px; margin-top:6px'}) : el('span'),
      ev.text ? el('p',{}, ev.text) : el('span')
    );
    track.append(card);
  }

  const step = 260;
  document.getElementById('tlLeft').addEventListener('click', ()=>{ track.scrollLeft = Math.max(0, track.scrollLeft - step); });
  document.getElementById('tlRight').addEventListener('click', ()=>{ track.scrollLeft = track.scrollLeft + step; });

  document.getElementById('addMomentBtn').addEventListener('click', ()=>openModal(momentForm(me)));
}
function momentForm(me){
  const box = el('div',{});
  const _head=el('div',{class:'modal-head'});
_head.append(el('h3',{},'Novo momento'),(()=>{const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b;})());
box.append(_head);
box.append(el('h3',{},'Novo momento'));
  const date = el('input',{type:'date', class:'input'});
  const title = el('input',{class:'input', placeholder:'Título'});
  const text = el('textarea',{class:'input', rows:4, placeholder:'Descrição'});
  const img = el('input',{type:'file', accept:'image/*', class:'input'});
  const submit = el('button',{class:'btn primary'},[icon('plus'),'Salvar']);
  submit.addEventListener('click', async ()=>{ submit.disabled = true;
    if(!date.value){ const m = await import('../js/util.js'); m.notify('Informe a data.','error'); return; }
    if(!title.value.trim()){ const m = await import('../js/util.js'); m.notify('Informe um título.','error'); return; }
    let img64=''; if(img.files[0]) img64 = await readAsDataURL(img.files[0]);
    const rec = { date: date.value || new Date().toISOString().slice(0,10), title: title.value||'Sem título', text: text.value||'', image: img64||'', by: me.name };
    await dbPut('timeline', rec);
    const m = await import('../js/util.js'); m.notify('Momento adicionado!','ok');
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close();
    setTimeout(()=>{ location.hash='#/timeline'; location.reload(); }, 150);
  });
  box.append(date, title, text, img, submit);
  return box;
}
function readAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }