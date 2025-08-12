
import { ensureSW } from './util.js';
import { icon } from './icons.js';
import { router } from './router.js';
import { Auth } from './auth/auth.js';
window.Auth = Auth; // expose for debug
import { renderHome } from '../pages/home.js?v=home13';
import { renderGallery } from '../pages/gallery.js';
import { renderLetters } from '../pages/letters.js';
import { renderTimeline } from '../pages/timeline.js?v=flags13';
import { renderAchievements } from '../pages/achievements.js?v=flags13';
import { renderMap } from '../pages/map.js?v=map14';

const routes = { '/': renderHome,'/gallery': renderGallery,'/letters': renderLetters,'/timeline': renderTimeline,'/achievements': renderAchievements,'/map': renderMap };

const weatherEl = document.getElementById('weather');
const clockEl = document.getElementById('clock');
const navbar = document.getElementById('navbar');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

function tickClock(){ const d=new Date(); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); clockEl.textContent=`${hh}:${mm}`; }
setInterval(tickClock, 1000); tickClock();

function watchScroll(){ const atTop = window.scrollY < 10; navbar.classList.toggle('hidden', !atTop); }
window.addEventListener('scroll', watchScroll);

async function updateWeather(){
  try{
    const pos = await new Promise((res,rej)=>{ navigator.geolocation.getCurrentPosition(p=>res(p), e=>rej(e), {enableHighAccuracy:true, timeout:5000}); });
    const lat = pos.coords.latitude.toFixed(3); const lon = pos.coords.longitude.toFixed(3);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const r = await fetch(url); const j = await r.json();
    const temp = Math.round(j.current.temperature_2m); const code = j.current.weather_code; const wx = weatherIcon(code);
    weatherEl.textContent = `${wx} ${temp}°C`; localStorage.setItem('lastWeather', JSON.stringify({temp, code, ts:Date.now()}));
  }catch{ const last = JSON.parse(localStorage.getItem('lastWeather')||'null'); if(last){ weatherEl.textContent = `${weatherIcon(last.code)} ${last.temp}°C`; } else { weatherEl.textContent = '⛅ —'; } }
}
function weatherIcon(code){ if([0].includes(code)) return '☀️'; if([1,2,3].includes(code)) return '⛅'; if([45,48].includes(code)) return '🌫️';
  if([51,53,55,61,63,65,80,81,82].includes(code)) return '🌧️'; if([71,73,75,77,85,86].includes(code)) return '❄️'; if([95,96,99].includes(code)) return '⛈️'; return '☁️'; }

async function requireLogin(){
  const user = Auth.getSessionUser();
  if(!user){ await Auth.showLoginDialog(); }
  const me = Auth.getSessionUser(); if(!me) return false;
  document.getElementById('greeting').textContent = `Olá, ${me.name}`; return true;
}

window.addEventListener('hashchange', ()=>router(routes, requireLogin));
window.addEventListener('DOMContentLoaded', async ()=>{
  ensureSW(); await updateWeather(); setInterval(updateWeather, 10*60*1000);
  var _lb=document.getElementById('logoutBtn'); if(_lb){ _lb.addEventListener('click', function(){ Auth.logout(); location.reload(); }); }
  watchScroll();
  // Decorate navbar with icons
  const mapIcons = { '/':'user', '/gallery':'image', '/letters':'mail', '/timeline':'calendar', '/achievements':'checkCircle', '/map':'mapPin' };
  document.querySelectorAll('.navbar .nav-link').forEach(a=>{
    const path = a.getAttribute('href').replace('#','');
    const ic = icon(mapIcons[path] || 'open', 18);
    if(!a.querySelector('svg')){ a.prepend(ic); }
  });
 if(!location.hash) location.hash = '#/'; router(routes, requireLogin);
});