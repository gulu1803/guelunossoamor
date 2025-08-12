
import { el, openModal, formatDateBR, notify, confirmBox } from '../js/util.js';
import { icon } from '../js/icons.js';
import { dbPut, dbGetAll, dbDelete } from '../js/db/indexed.js';
import { Auth } from '../js/auth/auth.js';

export async function renderLetters(root){
  const me = Auth.getSessionUser();
  const header = el('div',{class:'header-row'},[
    el('h3',{},'Cartas'),
    (()=>{ const b=el('button',{id:'addLetterBtn', class:'btn primary'},[icon('plus'),'Adicionar carta']); b.onclick=()=>openModal(letterForm(me)); return b; })()
  ]);

  let items = await dbGetAll('letters', null, 'next');
  // ordenar por data (when) desc; fallback createdAt
  items.sort((a,b)=> (new Date(b.when||b.createdAt)) - (new Date(a.when||a.createdAt)) );

  const fromLu = items.filter(it => (it.author||it.by) === 'Luiza');
const fromGu = items.filter(it => (it.author||it.by) === 'Gustavo');

function makeList(arr){
  const list = el('div',{class:'grid'});
  for(const it of arr){
    const row = el('div',{class:'card'});
    const who = ((it.author||it.by)==='Luiza') ? 'De Lu para Gu' : 'De Gu para Lu';
    row.append(
      el('div',{class:'row', style:'justify-content:space-between; align-items:center'},[
        el('div',{},[
          el('strong',{}, it.title || 'Sem título'),
          el('div',{class:'muted'}, `${who} • ${formatDateBR(it.when||it.createdAt)}`)
        ]),
        el('div',{class:'row'},[ (()=>{ const b=el('button',{class:'btn'},[icon('open'),'Abrir']); b.onclick=()=>openModal(letterPreview(it)); return b; })() ])
      ])
    );
    list.append(row);
  }
  return list;
}

function toggleSection(h, body){ let open=true; const ch = el('span',{class:'muted small', style:'margin-left:12px; padding-right:6px'}); const chev=icon('chevronRight',18); chev.style.transition='transform .2s'; const head=el('div',{class:'row between center clickable', style:'margin-bottom:8px'},[ el('div',{class:'row center', style:'gap:8px'},[chev, h]), ch ]); head.addEventListener('click',()=>{ open=!open; body.style.display=open?'':'none'; chev.style.transform=open?'rotate(90deg)':'rotate(0deg)'; }); return {head, ch}; }
const secLu = el('div',{class:'card'});
const luH = el('h4',{},'De Lu para Gu'); const luList = makeList(fromLu); const _lu = toggleSection(luH, luList); secLu.append(_lu.head); secLu.append(luList);

const secGu = el('div',{class:'card'});
const guH = el('h4',{},'De Gu para Lu'); const guList = makeList(fromGu); const _gu = toggleSection(guH, guList); secGu.append(_gu.head); secGu.append(guList);

const card = el('div',{class:'card'});
_lu.ch.textContent = `${fromLu.length}`; _gu.ch.textContent = `${fromGu.length}`; card.append(header, secLu, secGu);

  root.append(card);
}

function letterForm(me){
  const box = el('div',{});
  const head = el('div',{class:'modal-head'});
  head.append(el('h3',{},'Nova carta'), (()=>{ const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b; })());
  const title = el('input',{class:'input', placeholder:'Título'});
  const when = el('input',{type:'date', class:'input'});
  const content = el('textarea',{class:'input', placeholder:'Conteúdo', rows:6});
  const submit = el('button',{class:'btn primary'},'Salvar');
  submit.onclick = async ()=>{
    const _title = title.value.trim();
    const _when = when.value;
    const _content = content.value.trim();
    if(!_title){ notify('Informe um título para a carta.','error'); return; }
    if(!_when){ notify('Informe a data para exibição da carta.','error'); return; }
    if(!_content){ notify('Escreva o conteúdo da carta.','error'); return; }
    submit.disabled = true;
    await dbPut('letters', { title:_title, when:_when, content:_content, author:(me?.name||'—'), createdAt: Date.now() });
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close();
    notify('Carta adicionada!','ok'); setTimeout(()=>{ location.hash='#/letters'; location.reload(); }, 150);
  };
  box.append(head, title, when, content, submit);
  return box;
}

function letterPreview(it){
  const box = el('div',{});
  const head = el('div',{class:'modal-head'});
  head.append(el('div',{},`${it.author||'—'} • ${formatDateBR(it.when||it.createdAt)}`), (()=>{ const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b; })());
  const paper = el('div',{class:'card', style:'background:linear-gradient(180deg,#2b1821,#23141b); border-color:#4a2a38'});
  paper.append(el('h3',{}, it.title || 'Sem título'));
  paper.append(el('p',{}, it.content || ''));
  const del = el('button',{class:'btn danger', style:'margin-top:10px'}, [icon('trash'),'']);
  del.addEventListener('click', async ()=>{
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close){ try{ dlg.close(); }catch{} }
    const ok = await confirmBox('Excluir esta carta?'); if(!ok) return;
    await dbDelete('letters', it.id);
    notify('Carta excluída.','ok'); setTimeout(()=>{ location.hash='#/letters'; location.reload(); }, 150);
  });
  box.append(head, paper, del);
  return box;
}
