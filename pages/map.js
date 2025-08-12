
import { el, openModal, notify, confirmBox, formatDateBR, iso2ToFlag, nameToISO2 } from '../js/util.js';
import { dbGetAll, dbPut, dbDelete } from '../js/db/indexed.js';
import { icon } from '../js/icons.js';
import { Auth } from '../js/auth/auth.js';

// ---- Time (BRT) ----
const BRT_OFFSET = '-03:00';
function brtMidnight(yyyy_mm_dd){ return new Date(`${yyyy_mm_dd}T00:00:00${BRT_OFFSET}`); }

// ---- SVG helpers ----
const SVG_NS='http://www.w3.org/2000/svg';
function svgEl(tag, attrs={}){ const e=document.createElementNS(SVG_NS,tag); for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); return e; }

// ---- Geo helpers ----
function countryName(props){
  return props?.name_pt || props?.NAME_PT || props?.ADMIN || props?.name || props?.Name || props?.admin || props?.SOVEREIGNT || props?.sovereignt || '—';
}
function countryISO3(props){
  const cand = props?.iso_a3 || props?.ISO_A3 || props?.adm0_a3 || props?.SOV_A3 || props?.BRK_A3 || props?.GU_A3 || props?.iso3 || props?.A3;
  if(typeof cand === 'string'){
    const up=cand.toUpperCase();
    if(/^[A-Z]{3}$/.test(up) && up!=='-99') return up;
  }
  return '';
}
const ISO2_TO_ISO3 = { US:'USA', GB:'GBR', BR:'BRA', AR:'ARG', UY:'URY', PY:'PRY' };
function countryISO2(props){
  const cand = props?.iso_a2 || props?.ISO_A2 || props?.wb_a2 || props?.WB_A2 || props?.iso2 || props?.A2;
  if(typeof cand==='string' && cand.length===2) return cand.toUpperCase();
  return '';
}
// Equirectangular: viewBox -180 -90 360 180 (lon=x, -lat=y)
function pathFromCoords(geom){
  function P([lon,lat]){ return [lon, -lat]; }
  function poly(rings){
    let d='';
    for(const ring of rings){
      if(!ring?.length) continue;
      const [x0,y0]=P(ring[0]); d += `M ${x0} ${y0}`;
      for(let i=1;i<ring.length;i++){ const [x,y]=P(ring[i]); d += ` L ${x} ${y}`; }
      d += ' Z';
    }
    return d;
  }
  if(!geom) return '';
  if(geom.type==='Polygon') return poly(geom.coordinates);
  if(geom.type==='MultiPolygon') return geom.coordinates.map(poly).join(' ');
  return '';
}

// ---- Data loading chain ----
const REMOTE_GEO = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const SAMPLE_INLINE = {
  "type":"FeatureCollection",
  "features":[
    {"type":"Feature","properties":{"iso_a3":"BRA","name_pt":"Brasil","iso_a2":"BR"},"geometry":{"type":"Polygon","coordinates":[[[-74,-34],[-34,-34],[-34,5.5],[-74,5.5],[-74,-34]]]} },
    {"type":"Feature","properties":{"iso_a3":"ARG","name_pt":"Argentina","iso_a2":"AR"},"geometry":{"type":"Polygon","coordinates":[[[-73.6,-55.2],[-53.6,-55.2],[-53.6,-21.8],[-73.6,-21.8],[-73.6,-55.2]]]}} 
  ]
};
async function loadWorld(){
  try{ const r=await fetch('data/world.geo.json',{cache:'no-cache'}); if(r.ok) return await r.json(); }catch{}
  try{ const r2=await fetch(REMOTE_GEO,{cache:'no-cache'}); if(r2.ok){ notify('Usando países do datasets/geo-countries.','info'); return await r2.json(); } }catch{}
  try{ const rs=await fetch('data/world.geo.sample.json',{cache:'no-cache'}); if(rs.ok){ notify('Usando mapa de amostra local.','warn'); return await rs.json(); } }catch{}
  notify('Usando mapa embutido de amostra.','warn'); return SAMPLE_INLINE;
}

// ---- DB helpers ----
async function upsertCountry(iso3, payload){
  const all=await dbGetAll('countries', null, 'next');
  const found=all.find(x=>String(x.iso3||'').toUpperCase()===String(iso3||'').toUpperCase());
  const rec=Object.assign({}, found||{}, payload, { iso3: String(iso3||'').toUpperCase() });
  await dbPut('countries', rec);
}
async function deleteCountry(iso3){
  const all=await dbGetAll('countries', null, 'next');
  const found=all.find(x=>String(x.iso3||'').toUpperCase()===String(iso3||'').toUpperCase());
  if(found) await dbDelete('countries', found.id);
}

// ---- UI pieces ----
function promptDateModal(titleText, onSave){
  const box = el('div',{});
  const head = el('div',{class:'modal-head'});
  const closeBtn = el('button',{class:'btn'},'Fechar'); closeBtn.onclick=()=>{ const dlg=document.getElementById('modal'); if(dlg?.close) dlg.close(); };
  head.append(el('h3',{},titleText), closeBtn);
  const date = el('input',{type:'date', class:'input'});
  const ok = el('button',{class:'btn primary'},'Confirmar');
  ok.onclick = ()=>{
    if(!date.value) return notify('Informe a data.','error');
    onSave(date.value);
    const dlg=document.getElementById('modal'); if(dlg?.close) dlg.close();
  };
  box.append(head, date, ok);
  return box;
}
function listItemRow(item, repaint){
  const row = el('div',{class:'row', style:'justify-content:space-between; align-items:center'});
  const flag = iso2ToFlag(item.iso2||'') || iso2ToFlag(nameToISO2(item.name)||'');
  row.append(
    el('div',{},[ el('strong',{}, `${flag?flag+' ':''}${item.name}`.trim()), el('div',{class:'muted'}, formatDateBR(item.dateISO)) ]),
    (()=>{
      const actions = el('div',{class:'row', style:'gap:8px'});
      const edit = el('button',{class:'btn'},[icon('calendar'),'Editar']);
      edit.onclick = ()=> openModal(promptDateModal(`Editar data — ${item.name}`, async (newISO)=>{
        await upsertCountry(item.iso3, { name:item.name, iso2:item.iso2||nameToISO2(item.name)||'', date:newISO, when: brtMidnight(newISO).getTime() });
        notify('Data atualizada.','ok'); repaint();
      }));
      const del = el('button',{class:'btn danger'},[icon('trash'),'']);
      del.onclick = async ()=>{ if(!(await confirmBox('Remover este país da lista?'))) return; await deleteCountry(item.iso3); notify('Removido.','ok'); repaint(); };
      actions.append(edit, del);
      return actions;
    })()
  );
  return row;
}

// ---- Main render ----
export async function renderMap(root){
  const me = Auth.getSessionUser();
  const card = el('div',{class:'card'});
  const header = el('div',{class:'header-row'},[ el('h3',{},'Mapa mundi — países visitados'), el('div',{id:'mapCounter', class:'muted'},'—') ]);
  const svg = svgEl('svg',{ id:'worldMap', viewBox:'-180 -90 360 180', style:'width:100%; height:auto; aspect-ratio:2/1; min-height:320px; border-radius:12px; background:#1b1217; border:1px solid #3b2431' });
  const g = svgEl('g',{});
  svg.appendChild(g);
  const pathByIso = new Map();
  card.append(header, svg);

  const listCard = el('div',{class:'card'});
  const listHeader = el('div',{class:'header-row'},[ el('h3',{},'Lista de países'), el('div',{class:'muted'},'Ordenado por ordem de visita') ]);
  const list = el('div',{id:'countryList'});
  listCard.append(listHeader, list);

  root.append(card, listCard);

  // Load and draw
  let world;
  try{ world = await loadWorld(); }catch(e){ notify('Falha ao carregar GeoJSON do mundo.','error'); return; }
  const feats = world && world.type==='FeatureCollection' ? world.features : [];
  if(!feats.length){ notify('GeoJSON não possui features.','error'); return; }

  for(const f of feats){
    const props=f.properties||{};
    const name=countryName(props);
    let iso3=countryISO3(props);
    if(!iso3){
      // Fallback to slug from name (ensures unique key)
      const nm = String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
      iso3 = nm.replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,12) || 'UNK';
    }
    const ISO = String(iso3).toUpperCase();
    const ISO2 = countryISO2(props) || nameToISO2(name);
    const d=pathFromCoords(f.geometry);
    if(!d) continue;

    const path = svgEl('path', { d, class:'country', 'data-iso3': ISO, 'data-name': name, 'data-iso2': ISO2, tabindex:'0', role:'button', 'aria-label': name });
    path.addEventListener('click', async ()=>{
      const iso = path.getAttribute('data-iso3');
      const nm = path.getAttribute('data-name') || '—';
      const iso2 = path.getAttribute('data-iso2') || nameToISO2(nm) || '';
      const items = await dbGetAll('countries', null, 'next');
      const exists = items.find(x=>String(x.iso3||'').toUpperCase()===String(iso||'').toUpperCase());
      if(exists){
        if(!(await confirmBox(`Remover ${nm}?`))) return;
        await deleteCountry(iso);
        notify(`${nm} removido.`, 'ok');
        repaint();
      }else{
        openModal(promptDateModal(`Primeira visita — ${nm}`, async (dateStr)=>{
          const when = brtMidnight(dateStr).getTime();
          await upsertCountry(iso, { name: nm, date: dateStr, when, iso2 });
          try{ await dbPut('timeline', { date: dateStr, title: `${iso2ToFlag(iso2)||''} Visitamos ${nm}`, by: me?.name || 'Sistema' }); }catch{}
          try{ await dbPut('achievements', { slug: `visit_${iso}`, title: `${iso2ToFlag(iso2)||''} Visitamos ${nm}`, desc: 'País visitado', icon: '', unlockedAt: when }); }catch{}
          notify(`${nm} adicionado!`, 'ok');
          repaint();
        }));
      }
    });
    path.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); path.click(); } });
    g.appendChild(path);
    pathByIso.set(ISO, path);
  }

  function setVisitedClass(set){
    for(const [,p] of pathByIso){ p.classList.remove('visited'); p.style.fill=''; }
    for(const iso of set){ const p=pathByIso.get(iso); if(p){ p.classList.add('visited'); p.style.fill='#6fbf73'; } }
  }

  async function repaint(){
    list.innerHTML='';
    const items = await dbGetAll('countries', null, 'next');
    const norm = items.map(x=>({ iso3:String(x.iso3||'').toUpperCase(), name:x.name, iso2:(x.iso2||nameToISO2(x.name)||'').toUpperCase(), dateISO: x.date || (new Date(x.when)).toISOString().slice(0,10), when: x.when || brtMidnight(x.date).getTime() }));
    norm.sort((a,b)=> (a.when||0) - (b.when||0));
    for(const it of norm){ list.appendChild(listItemRow(it, repaint)); }
    const counter = document.getElementById('mapCounter'); if (counter) counter.textContent = `${norm.length} países visitados`;
    const set = new Set(norm.map(i=>String(i.iso3||'').toUpperCase()));
  const setIso2 = new Set(norm.map(i=>String(i.iso2||'').toUpperCase()));
    setVisitedClass(set);
  }

  repaint();
}
