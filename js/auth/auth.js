
import { USERS } from './users.js';
const SESS_KEY='auth.session';const LOCK_KEY='auth.lock';

function saveSession(user){
  const exp=Date.now()+12*3600*1000;
  sessionStorage.setItem(SESS_KEY,JSON.stringify({id:user.id,name:user.name,exp}));
}
function clearSession(){sessionStorage.removeItem(SESS_KEY)}
function readSession(){
  try{
    const s=JSON.parse(sessionStorage.getItem(SESS_KEY)||'null');
    if(!s) return null; if(Date.now()>s.exp){ clearSession(); return null; } return s;
  }catch{ return null; }
}
function getLock(){ try{return JSON.parse(localStorage.getItem(LOCK_KEY)||'{}')}catch{return{}} }
function setLock(o){ localStorage.setItem(LOCK_KEY, JSON.stringify(o)); }
function clearLock(){ localStorage.removeItem(LOCK_KEY); }
function registerFail(){ const l=getLock(); l.count=(l.count||0)+1; const backoff=Math.min(600000, Math.pow(2,l.count)*1000); l.until=Date.now()+backoff; setLock(l); }
function isLocked(){ const l=getLock(); return l.until && Date.now()<l.until ? (l.until - Date.now()) : 0; }

function verify(userId, password){
  const user = USERS.find(u=>u.id===userId);
  if(!user) return null;
  const lockMs = isLocked();
  if(lockMs>0) throw new Error(`Bloqueado por ${Math.ceil(lockMs/1000)}s`);
  const ok = password === user.password;
  if(!ok){ registerFail(); return null; }
  clearLock();
  return user;
}

function ensureOverlay(){
  let ov = document.getElementById('loginOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'loginOverlay';
    ov.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:9999';
    ov.innerHTML =
      '<div class="login-dialog modern" style="background:#2a1b22; border-radius:20px; padding:26px; width:min(90vw,380px); box-shadow:0 10px 30px rgba(0,0,0,.35); border:1px solid #4a2a38">' +
        '<div style="width:68px;height:68px;border-radius:18px;background:radial-gradient(70% 70% at 30% 30%, #ff79a8, #3a1725);display:flex;align-items:center;justify-content:center;font-size:28px;margin:-8px auto 10px auto;box-shadow:0 8px 20px rgba(0,0,0,.25);border:1px solid #4a2a38"><img src="./assets/icons/favicon.png" alt="logo" style="width:56px;height:56px;object-fit:contain;border-radius:12px"></div>' +
        '<h2 style="text-align:center;margin:6px 0 12px 0;color:#ffdcea">Entrar</h2>' +
        '<label class="label">Quem é você?'+
          '<select id="ovUser" class="input">'+
            '<option value="gustavo">Gustavo</option>'+
            '<option value="luiza">Luiza</option>'+
          '</select>'+
        '</label>'+
        '<label class="label">Senha / PIN'+
          '<input id="ovPass" class="input" type="password" placeholder="Senha / PIN" inputmode="numeric" autocomplete="current-password" required>'+
        '</label>'+
        '<div class="row" style="margin-top:10px; justify-content:flex-end; gap:8px">'+
          '<button id="ovOk" class="btn primary">Entrar</button>'+
          '<button id="ovCancel" class="btn">Cancelar</button>'+
        '</div>'+
        '<p id="ovErr" class="muted" style="min-height:1em; margin:8px 0 0 0"></p>'+
      '</div>';
    document.body.appendChild(ov);
    const cancel = ov.querySelector('#ovCancel'); if(cancel) cancel.onclick=()=>{ ov.style.display='none'; };
  }
  return ov;
}


export async function showLoginDialog(){
  let dlg = document.getElementById('loginDialog');
  const supportsDialog = typeof HTMLDialogElement !== 'undefined' && dlg?.showModal;

  // Helper promise wrapper to avoid duplicated code
  const awaitOverlay = () => new Promise((resolve)=>{
    const ov = ensureOverlay();
    ov.style.display = 'flex';
    const userSel = ov.querySelector('#ovUser');
    const pass = ov.querySelector('#ovPass');
    const ok = ov.querySelector('#ovOk');
    const cancel = ov.querySelector('#ovCancel');
    const err = ov.querySelector('#ovErr');
    err.textContent=''; pass.value='';
    ok.onclick = () => {
      try{
        const u = userSel.value; const p = pass.value;
        const user = verify(u,p);
        if(user){ saveSession(user); try{ window.dispatchEvent(new CustomEvent('app:login',{ detail:{ id:user.id, name:user.name, password:p } })); }catch{} ov.style.display='none'; resolve(true); }
        else { err.textContent='Senha incorreta.'; }
      }catch(e){ err.textContent = e.message; }
    };
    cancel.onclick = () => { ov.style.display='none'; resolve(!!readSession()); };
  });

  if(supportsDialog){
    try{
      const form = document.getElementById('loginForm');
      const userSel = document.getElementById('loginUser');
      const pass = document.getElementById('loginPass');
      const err = document.getElementById('loginError');
      err.textContent=''; pass.value='';
      // Use onsubmit (no {once:true})
      form.onsubmit = (ev)=>{
        ev.preventDefault();
        try{
          const user = verify(userSel.value, pass.value);
          if(user){ saveSession(user); dlg.close(); }
          else { err.textContent = 'Senha incorreta.'; }
        }catch(e){ err.textContent = e.message; }
      };
      if(!dlg.open) dlg.showModal();
      return new Promise(res=>{
        dlg.addEventListener('close', ()=>res(!!readSession()), {once:true});
      });
    }catch(e){
      // Fallback to overlay if showModal fails
      return awaitOverlay();
    }
  }else{
    return awaitOverlay();
  }
}

export const Auth = { showLoginDialog, getSessionUser: ()=>readSession(), logout: ()=>{ try{ window.dispatchEvent(new CustomEvent('app:logout')); }catch{} clearSession(); } };

try{ window.Auth = window.Auth || Auth; }catch(e){}
