
import { el, openModal, formatDateBR, notify, confirmBox } from '../js/util.js';
import { icon } from '../js/icons.js';
import { dbPut, dbGetAll, dbDelete } from '../js/db/indexed.js';
import { Auth } from '../js/auth/auth.js';

export async function renderGallery(root){
  const wrap = el('div',{class:'grid'});
  const header = el('div',{class:'header-row'},[ el('h3',{},'Galeria'), el('button',{class:'btn primary', id:'addPhotoBtn'},[icon('camera'), 'Adicionar foto']) ]);
  const photos = await dbGetAll('photos','byDate','prev');
  wrap.append(el('div',{class:'card'},[header]), gridCard(photos));
  root.append(wrap);
  document.getElementById('addPhotoBtn').addEventListener('click', ()=>openModal(photoForm()));
}

function gridCard(items){
  const grid = el('div',{class:'grid gallery-grid'});
  if(!items.length){
    grid.append(el('div',{class:'muted'},'Nenhuma foto ainda.'));
    return el('div',{class:'card'},[grid]);
  }
  for(const it of items){
    const p = el('div',{class:'polaroid', style:`--r:${(Math.random()*6-3).toFixed(2)}deg; cursor:pointer`});
    const img = el('img',{src: it.dataUrl || 'assets/images/image1.jpg', alt: it.caption||'Foto'});
    p.addEventListener('click', ()=>openModal(photoPreview(it)));
    const cap = el('div',{class:'cap'}, (it.title? it.title+': ' : '') + (it.caption||''));
    const d = it.date || it.createdAt || '';
    const meta = el('div',{class:'muted'}, `${formatDateBR(d)} • por ${it.by||'—'}`);
    p.append(img, cap, meta);
    grid.append(p);
  }
  return el('div',{class:'card'},[grid]);
}


function photoForm(){
  const box = el('div',{});
  const top = el('div',{class:'modal-head'});
  top.append(el('h3',{},'Nova foto'), ( ()=>{ const b=el('button',{class:'btn'},'Fechar'); b.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close(); }; return b; })() );
  const file = el('input',{type:'file', accept:'image/*', class:'input'});
  const title = el('input',{placeholder:'Nome', class:'input'});
  const cap = el('input',{placeholder:'Legenda (opcional)', class:'input'});
  const loc = el('input',{placeholder:'Local (opcional)', class:'input'});
  const date = el('input',{type:'date', class:'input'});
  const submit = el('button',{class:'btn primary'},'Salvar');
  submit.addEventListener('click', async ()=>{
    const me = (await import('../js/auth/auth.js')).Auth.getSessionUser() || {name:'—'};
    if(!file.files[0]) return notify('Selecione uma imagem','error');
    if(!title.value.trim()) return notify('Informe o nome da foto.','error');
    if(!cap.value.trim()) return notify('Informe a descrição/legenda da foto.','error');
    if(!date.value) return notify('Informe a data da foto.','error');
    submit.disabled = true;
    const dataUrl = await readAsDataURL(file.files[0]);
    const rec = { title: title.value.trim(), dataUrl, caption: cap.value.trim(), location: loc.value.trim(), date: date.value, by: me.name, createdAt: Date.now() };
    const { dbPut } = await import('../js/db/indexed.js');
    await dbPut('photos', rec);
    const dlg=document.getElementById('modal'); if(dlg&&dlg.close) dlg.close();
    notify('Foto adicionada!','ok');
    setTimeout(()=>{ location.hash='#/gallery'; location.reload(); }, 200);
  });
  box.append(top, file, title, cap, loc, date, submit);
  return box;
}


function photoPreview(it){
  const box = el('div',{});
  const top = el('div',{class:'row', style:'justify-content:flex-end'});
  const closeBtn = el('button',{class:'btn'},[icon('x'),'Fechar']);
  closeBtn.addEventListener('click', ()=>{ const dlg=document.getElementById('modal'); if(dlg && dlg.close) dlg.close(); });
  top.append(closeBtn);

  const img = el('img',{src: it.dataUrl || 'assets/images/image1.jpg', style:'width:100%; border-radius:12px; animation: popIn .25s ease'});
  const d = it.date || it.createdAt || '';
  const meta = el('div',{class:'muted'}, `${it.caption||''} • ${it.location||'—'} • ${formatDateBR(d)} • por ${it.by||'—'}`);
  const del = el('button',{class:'btn danger', style:'margin-top:10px'},[icon('trash'),'']);
  del.addEventListener('click', async ()=>{ const dlg=document.getElementById('modal'); if(dlg&&dlg.close){ try{ dlg.close(); }catch{} } if(await confirmBox('Excluir esta foto?')){
      await dbDelete('photos', it.id);
      const dlg=document.getElementById('modal'); if(dlg && dlg.close) dlg.close();
      notify('Foto excluída.','ok');
      setTimeout(()=>{ location.hash='#/gallery'; location.reload(); }, 400);
    }
  });
  box.append(top, img, meta, del);
  return box;
}

function readAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
