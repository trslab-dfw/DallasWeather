/* ===== Config (Dallas) ===== */
const LAT = 32.7767, LON = -96.7970;
const WEATHER_REFRESH_MS = 15 * 60 * 1000;
const WEATHER_API = `https://api.open-meteo.com/v1/forecast`
  + `?latitude=${LAT}&longitude=${LON}`
  + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant`
  + `&timezone=auto&forecast_days=10&temperature_unit=fahrenheit&wind_speed_unit=mph`;

/* ===== Diagnostics ===== */

const diagEl = document.getElementById('diag');
let diagTimer = null;

function showDiag(msg, isError = false) {
  if (!diagEl) return;
  diagEl.style.display = 'block';

  diagEl.innerHTML =
    (isError ? '<b class="err">Error:</b> ' : '<b>Info:</b> ') + msg;

  // Always hide after 5 seconds
  clearTimeout(diagTimer);
  diagTimer = setTimeout(() => {
    diagEl.style.display = 'none';
  }, 5000);

}


/* ===== Clock ===== */
function updateClock(){
  const now=new Date();
  document.getElementById('clock').textContent = now.toLocaleString(undefined,{
    hour:'numeric',minute:'2-digit',weekday:'short',month:'short',day:'numeric'
  });
}
setInterval(updateClock,1000); updateClock();

/* ===== Status ===== */
function setStatus(ok,text){
  document.getElementById('statusText').textContent = text || (ok?'OK':'Retrying…');
  document.getElementById('statusPulse').style.background = ok ? '#2bd576' : '#ff6b6b';
}

/* ===== Icons & labels (SVG) ===== */
function iconSvg(code){
  const base=(path,extra='')=>`<svg viewBox="0 0 48 48" width="100%" height="100%" role="img" aria-hidden="true"><g fill="none" stroke="#eaf6ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${path}</g>${extra}</svg>`;
  const sun=`<circle cx="24" cy="24" r="8" fill="none"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M11 37l4-4M33 15l4-4"/>`;
  const cloud=`<path d="M16 33h17a7 7 0 0 0 0-14 10 10 0 0 0-19-3 6 6 0 0 0 2 17z"/>`;
  const rain=`<path d="M19 38l-2 6M25 38l-2 6M31 38l-2 6"/>`;
  const heavyRain=`<path d="M17 37l-2 7M23 37l-2 7M29 37l-2 7M35 37l-2 7"/>`;
  const snow=`<path d="M18 38l3 6M24 38v6M30 38l-3 6 M15 41h6 M21 41h6 M27 41h6"/>`;
  const lightning=`<path d="M24 30l-4 8h5l-3 8 10-14h-5l3-8z"/>`;
  const fog=`<path d="M10 34h28M8 40h32" />`;
  if(code===0) return base(sun);
  if([1,2].includes(code)) return base(`${sun}${cloud}`);
  if(code===3) return base(`${cloud}${cloud.replace('M16','M12').replace('h17','h22')}`);
  if(code===45||code===48) return base(cloud,`<g stroke="#a7c4de" stroke-width="3">${fog}</g>`);
  if([51,53,55,56,57].includes(code)) return base(`${cloud}${rain}`);
  if([61,63,66].includes(code)) return base(`${cloud}${rain}`);
  if([65,67].includes(code)) return base(`${cloud}${heavyRain}`);
  if([71,73,75,77].includes(code)) return base(`${cloud}${snow}`);
  if([80,81].includes(code)) return base(`${cloud}${rain}`);
  if(code===82) return base(`${cloud}${heavyRain}`);
  if([85,86].includes(code)) return base(`${cloud}${snow}`);
  if([95,96,99].includes(code)) return base(`${cloud}${lightning}`);
  return base(cloud);
}
const LABELS={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Fog',
  51:'Drizzle',53:'Drizzle',55:'Drizzle',56:'Freezing drizzle',57:'Freezing drizzle',
  61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',
  71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',
  80:'Showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Snow showers',
  95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};

function dayLabel(s){const d=new Date(s+'T12:00:00');const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });const dayNum = d.toLocaleDateString(undefined, { day: '2-digit' });return `${weekday} ${dayNum}`;);}
function degToCardinal(deg){const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];return dirs[Math.round((deg%360)/22.5)%16];}

function renderWeather(data){
  const container=document.getElementById('forecast');container.innerHTML='';
  const d=data.daily;
  const {time,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,
         uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant}=d;

  for(let i=0;i<time.length;i++){
    const code=weather_code[i];
    const card=document.createElement('div');card.className='card';

    const day=document.createElement('div');day.className='day-name';day.textContent=dayLabel(time[i]);
    const iconWrap=document.createElement('div');iconWrap.className='icon';iconWrap.innerHTML=iconSvg(code);

    const short=document.createElement('div');short.className='short';
    const pop=precipitation_probability_max?.[i];const label=LABELS[code]??'—';
    short.textContent=(pop!=null)?`${label} · ${pop}% precip`:label;

    const temp=document.createElement('div');temp.className='temp';
    temp.textContent=`${Math.round(temperature_2m_max[i])}° / ${Math.round(temperature_2m_min[i])}°`;

    const metrics=document.createElement('div');metrics.className='metrics';
    const uv=Math.round(uv_index_max?.[i]??0);
    const w=Math.round(wind_speed_10m_max?.[i]??0);
    const wg=Math.round(wind_gusts_10m_max?.[i]??0);
    const wdir=wind_direction_10m_dominant?.[i];
    const wdirTxt=(typeof wdir==='number')?degToCardinal(wdir):'—';
    metrics.innerHTML=`<div>UV: <strong style="color:#fff">${uv}</strong></div>
                       <div>Wind: <strong style="color:#fff">${w} mph</strong> (gusts ${wg} mph · ${wdirTxt})</div>`;

    card.append(day,iconWrap,short,temp,metrics);container.appendChild(card);
  }
  setStatus(true,'Live');
  document.getElementById('updated').textContent='Last updated: '+new Date().toLocaleTimeString();
  showDiag('Forecast loaded successfully.');
}

let firstFetchDone=false;
setTimeout(()=>{ if(!firstFetchDone){ setStatus(false,'Connection issue – will retry'); showDiag('Initial fetch timed out after 7s. Will retry…', true); } }, 7000);

async function refreshWeather(){
  try{
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('Device appears offline');
    }
    setStatus(true,'Updating…');
    showDiag('Fetching: ' + WEATHER_API.replace(/&/g,'&amp;'));
    const r=await fetch(WEATHER_API,{cache:'no-store',mode:'cors'});
    if(!r.ok) {
      const txt = await r.text().catch(()=> '');
      throw new Error(`HTTP ${r.status} ${r.statusText} — ${txt.slice(0,140)}…`);
    }
    const j=await r.json();
    firstFetchDone=true;
    renderWeather(j);
  }catch(e){
    console.error(e);
    setStatus(false,'Connection issue – will retry');
    showDiag(String(e && e.message || e), true);
  }
}

refreshWeather();
setInterval(refreshWeather, WEATHER_REFRESH_MS);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) refreshWeather(); });
setTimeout(()=>{ const ok=document.getElementById('forecast').children.length>0; if(!ok) refreshWeather(); },8000);




