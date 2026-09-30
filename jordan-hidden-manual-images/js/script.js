const LOGO="assets/logo.webp",TEAM="Team Jordan Hidden";
const CAT={f:'Famous',h:'Hidden',e:'Experience'},COL={f:'#A85C4A',h:'#73734A',e:'#C99A3D'};
const P=[
{id:'petra',n:'Petra Treasury',c:'f',x:118,y:372,xp:200,d:'Moderate',t:'6 hrs',b:'Mar–May, Oct–Nov',loc:'Wadi Musa',tg:'ha',st:'A rose-red city carved into sandstone, reached through the mile-long Siq.',sp:'Hire local Bedouin guides and stay on marked paths.',lc:'Tea with a Bedouin family behind the Treasury.'},
{id:'rum',n:'Wadi Rum',c:'f',x:170,y:432,xp:200,d:'Moderate',t:'8 hrs',b:'Oct–Apr',loc:'Aqaba Governorate',tg:'an',st:'A valley of red dunes and granite towers where Lawrence once camped.',sp:'Book jeep tours run by Rum villagers.',lc:'Zarb dinner cooked underground.'},
{id:'qais',n:'Umm Qais',c:'h',x:122,y:38,xp:150,d:'Easy',t:'3 hrs',b:'Mar–Jun',loc:'Irbid',tg:'hn',st:'Black basalt ruins overlooking the Sea of Galilee and the Golan.',sp:'Low-impact heritage site with community-run cafés.',lc:'Olive-oil tasting with local farmers.'},
{id:'ajloun',n:'Ajloun Forest Reserve',c:'h',x:135,y:88,xp:150,d:'Easy',t:'4 hrs',b:'Apr–Jun',loc:'Ajloun',tg:'n',st:'Oak and pistachio woods above a Saladin-era castle.',sp:'Run by RSCN; income supports local women.',lc:'Soap and dried-fruit workshops.'},
{id:'disah',n:'Al Disah Canyon',c:'h',x:150,y:452,xp:150,d:'Hard',t:'5 hrs',b:'Oct–Mar',loc:'Wadi Rum North',tg:'an',st:'A quiet sandstone canyon with seasonal springs, far from the crowds.',sp:'Small groups only; carry your waste out.',lc:'Sunset tea with Zalabia guides.'},
{id:'dana',n:'Dana Village Trail',c:'h',x:122,y:318,xp:125,d:'Moderate',t:'5 hrs',b:'Mar–May',loc:'Tafilah',tg:'na',st:'A stone village on a cliff edge above Wadi Dana.',sp:'Eco-lodge and solar-powered workshops.',lc:'Dana silversmith and fig-jam kitchen.'},
{id:'mujib',n:'Wadi Mujib Siq',c:'h',x:105,y:240,xp:150,d:'Hard',t:'4 hrs',b:'May–Oct',loc:'Dead Sea',tg:'an',st:'Wade a narrow canyon to a waterfall.',sp:'Rangers cap daily visitors.',lc:'Ranger-led water trail.'},
{id:'fuheis',n:'Fuheis Home Cooking',c:'e',x:158,y:140,xp:100,d:'Easy',t:'3 hrs',b:'All year',loc:'Balqa',tg:'f',st:'Cook mansaf and maqluba in a family kitchen.',sp:'Money goes directly to the host family.',lc:'Cooking with Umm Khaled.'},
{id:'madaba',n:'Madaba Mosaic Workshop',c:'e',x:128,y:200,xp:100,d:'Easy',t:'2 hrs',b:'All year',loc:'Madaba',tg:'h',st:'Learn tessera cutting from a mosaic artisan.',sp:'Supports a women artisan collective.',lc:'Make your own mosaic tile.'},
{id:'karak',n:'Karak Family Lunch',c:'e',x:118,y:275,xp:100,d:'Easy',t:'2 hrs',b:'All year',loc:'Karak',tg:'f',st:'Lunch beneath the Crusader castle with a local family.',sp:'Community-run tourism.',lc:'Share a homemade lunch.'},
{id:'camp',n:'Bedouin Camp Dinner',c:'e',x:190,y:405,xp:100,d:'Easy',t:'3 hrs',b:'Oct–Apr',loc:'Wadi Rum',tg:'fa',st:'Stargazing and slow tea beside the fire.',sp:'Bedouin-owned camp.',lc:'Storytelling night.'}];
const EX=[['🏛️','History & Heritage','Ruins, stories and stone.','#8a5a3c'],['🏔️','Adventure & Nature','Canyons, trails and dunes.','#73734A'],['🍽️','Local Food & Community','Cook with local families.','#C99A3D'],['🌿','Eco-Traveler','Travel light, give back.','#5c6b3a'],['📸','Hidden Beauty','Quiet corners of Jordan.','#A85C4A']];
const TASKS=['Visit The Siq','Capture your best Petra photo','Discover a historical fact','Try a local experience','Support a local artisan'];
const BD=[['🏆','Petra Explorer','Completed the Petra Quest.',200,'petra'],['🌿','Eco Traveler','Completed 3 sustainable experiences.',125,'eco'],['🍽️','Local Food Hunter','Supported 3 local families.',100,'food'],['🗺️','Hidden Gem Hunter','Discovered 5 hidden destinations.',150,'gem'],['📸','Jordan Storyteller','Completed your first full Jordan Journey.',250,'story']];
const DEFAULT_STATE={
s:'splash',sel:'petra',j:['petra','disah','fuheis'],xp:1450,typ:null,fl:'all',
ub:{eco:1,food:1},pl:{d:2,i:['History','Nature'],eco:0},res:null,
activeQuest:null,
completedQuests:[],questCounter:0
};
const $=id=>document.getElementById(id),G=id=>P.find(p=>p.id==id);
const normalizeTasks=value=>Array.from({length:TASKS.length},(_,i)=>value?.[i]===1||value?.[i]===true?1:0);
const validDate=value=>typeof value==='string'&&!Number.isNaN(Date.parse(value))?value:new Date().toISOString();
function sessionId(counter){return 'quest-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+counter)}
function loadState(saved){
  if(!saved||typeof saved!=='object'||Array.isArray(saved))saved={};
  const state={
    ...structuredClone(DEFAULT_STATE),
    s:typeof saved.s==='string'&&['splash','onb','home','map','det','quest','plan','journey','ach','hidden','story','food','provider','admin','communityJourney','communityPost'].includes(saved.s)?saved.s:'splash',
    sel:G(saved.sel)?.id||'petra',
    j:Array.isArray(saved.j)?[...new Set(saved.j.filter(id=>G(id)))]:structuredClone(DEFAULT_STATE.j),
    xp:Number.isFinite(saved.xp)&&saved.xp>=0?saved.xp:DEFAULT_STATE.xp,
    typ:Number.isInteger(saved.typ)&&saved.typ>=0&&saved.typ<EX.length?saved.typ:null,
    fl:['all','f','h','e'].includes(saved.fl)?saved.fl:'all',
    ub:saved.ub&&typeof saved.ub==='object'&&!Array.isArray(saved.ub)?{...DEFAULT_STATE.ub,...saved.ub}:structuredClone(DEFAULT_STATE.ub),
    pl:{
      d:[1,2,3,4].includes(saved.pl?.d)?saved.pl.d:DEFAULT_STATE.pl.d,
      i:Array.isArray(saved.pl?.i)?saved.pl.i.filter(i=>['Adventure','Local Food','History','Nature'].includes(i)):structuredClone(DEFAULT_STATE.pl.i),
      eco:saved.pl?.eco===1?1:0
    },
    res:typeof saved.res==='string'?saved.res:null,
    questCounter:Number.isSafeInteger(saved.questCounter)&&saved.questCounter>=0?saved.questCounter:0
  };
  const seen=new Set();
  if(Array.isArray(saved.completedQuests)){
    for(const raw of saved.completedQuests){
      if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id||!G(raw.destination)||seen.has(raw.id))continue;
      seen.add(raw.id);
      state.completedQuests.push({
        id:raw.id,destination:raw.destination,name:G(raw.destination).n,
        startedAt:validDate(raw.startedAt||raw.completedAt),
        completedAt:validDate(raw.completedAt),tasks:[1,1,1,1,1],
        xp:Number.isFinite(raw.xp)?raw.xp:200
      });
    }
  }
  const raw=saved.activeQuest;
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
    const destination=G(raw.destination)?.id||state.sel;
    const tasks=normalizeTasks(Array.isArray(raw.tasks)?raw.tasks:saved.tk);
    const id=typeof raw.id==='string'&&raw.id?raw.id:sessionId(++state.questCounter);
    const completed=raw.completed===true||tasks.every(Boolean);
    if(completed){
      if(!seen.has(id)){
        state.completedQuests.push({id,destination,name:G(destination).n,
          startedAt:validDate(raw.startedAt),completedAt:validDate(raw.completedAt),
          tasks:[1,1,1,1,1],xp:200});
        seen.add(id);
      }
    }else if(!seen.has(id)){
      state.activeQuest={id,destination,startedAt:validDate(raw.startedAt),completed:false,tasks};
    }
  }else if(Array.isArray(saved.tk)&&!state.completedQuests.length){
    // Older versions stored progress on the profile, without a session ID.
    const tasks=normalizeTasks(saved.tk),destination=state.sel,id=sessionId(++state.questCounter);
    if(tasks.every(Boolean)){
      state.completedQuests.push({id,destination,name:G(destination).n,
        startedAt:validDate(null),completedAt:new Date().toISOString(),tasks,xp:200});
    }else{
      state.activeQuest={id,destination,startedAt:new Date().toISOString(),completed:false,tasks};
    }
  }
  // A fresh profile gets its initial Petra session; a completed profile does not.
  if(!state.activeQuest&&!state.completedQuests.length){
    state.activeQuest={id:sessionId(++state.questCounter),destination:state.sel,
      startedAt:new Date().toISOString(),completed:false,tasks:[0,0,0,0,0]};
  }
  return state;
}
let S=structuredClone(DEFAULT_STATE);
let CURRENT_USERNAME='';
let CURRENT_UID=null;
function needsAccount(page){
  if(CURRENT_UID||new URLSearchParams(location.search).has('figma'))return false;
  window.JordanHiddenRequireAccount?.(page);
  return true;
}
function saveState(){
  if(CURRENT_UID)return window.JordanHiddenSave?.(structuredClone(S));
}
window.JordanHidden={
  isAuthenticated:()=>!!CURRENT_UID,
  prepareProgress:raw=>loadState(raw),
  activateGuest:()=>{
    CURRENT_UID=null;
    CURRENT_USERNAME='';
    S={...structuredClone(DEFAULT_STATE),s:'home',j:[],xp:0,ub:{},activeQuest:null,completedQuests:[]};
    document.body.classList.add('site-ready');
    document.body.classList.remove('has-account');
    window.Community?.deactivate();
    draw();
  },
  activateUser:(uid,username,progress)=>{
    CURRENT_UID=uid;
    CURRENT_USERNAME=username;
    S=loadState(progress);
    if(!['splash','onb'].includes(S.s))S.s='home';
    document.body.classList.add('site-ready');
    document.body.classList.add('has-account');
    draw();
  },
  deactivateUser:()=>{
    CURRENT_UID=null;
    CURRENT_USERNAME='';
    S=structuredClone(DEFAULT_STATE);
    document.body.classList.remove('site-ready');
    document.body.classList.remove('has-account');
    $('hd').innerHTML='';
    $('app').innerHTML='';
    window.Community?.deactivate();
  }
};
function lastCompletedQuest(){return S.completedQuests.at(-1)||null}
function shownQuest(){return S.activeQuest||lastCompletedQuest()}
function questTasks(){return shownQuest()?.tasks||[0,0,0,0,0]}
function startNewQuest(destination){
  if(needsAccount('quest'))return;
  destination=G(destination)?.id||G(S.sel)?.id||'petra';
  S.questCounter++;
  S.activeQuest={
    id:sessionId(S.questCounter),
    destination,
    startedAt:new Date().toISOString(),
    completed:false,
    tasks:[0,0,0,0,0]
  };
  S.sel=destination;
  saveState();
  window.Community?.questStarted?.(structuredClone(S.activeQuest));
  go('quest');
}
function isQuestComplete(){return !S.activeQuest&&!!lastCompletedQuest()}
function activeDestination(){return G(shownQuest()?.destination||S.sel)||G('petra')}
function completeActiveQuest(){
  if(needsAccount('quest'))return false;
  const quest=S.activeQuest;
  if(!quest||quest.completed||!quest.tasks.every(Boolean)||S.completedQuests.some(q=>q.id===quest.id))return false;
  S.completedQuests.push({...quest,name:G(quest.destination).n,
    tasks:[...quest.tasks],completed:true,completedAt:new Date().toISOString(),xp:200});
  S.activeQuest=null;
  S.xp+=200;
  saveState();
  window.Community?.questCompleted?.(structuredClone(S.completedQuests.at(-1)));
  return true;
}
const lvl=()=>Math.floor(S.xp/200),pc=()=>(S.xp%200)/2;
const IMG=p=>`assets/places/${p.id}.svg`;
const THUMB=p=>`<img class="thumb" src="${IMG(p)}" alt="${p.n}" loading="lazy">`;
const ART=p=>`background:url(${IMG(p)}) center/cover no-repeat,linear-gradient(160deg,${COL[p.c]}cc,#241D18 130%),linear-gradient(#c99a3d,#241D18)`;
const NAV=[['home','Home'],['hidden','Explore'],['map','Map'],['quest','Quests'],['plan','AI Planner'],['journey','My Journey'],['ach','Achievements'],['story','Jordan Story']];
function go(s,id){if(!V[s])return;if(id)S.sel=id;S.s=s;saveState();draw();scrollTo(0,0);if(['food','provider','admin','communityJourney','communityPost'].includes(s))window.Community?.refresh?.()}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2100)}
function add(id){if(!G(id)||needsAccount('journey'))return;if(!S.j.includes(id)){S.j.push(id);saveState();toast('Added to My Journey')}else toast('Already in your journey');drawHd();}
function gain(n,m){if(needsAccount('quest'))return;S.xp+=n;saveState();toast('+'+n+' XP '+(m||''));drawHd()}
function modal(i,t,d,x){const m=document.createElement('div');m.className='modal';m.onclick=()=>m.remove();m.innerHTML=`<div class="modal-box" data-figma-name="Modal"><div class="big">${i}</div><h2 data-figma-name="Section Title" style="margin:8px 0">${t}</h2><p>${d}</p><p style="margin:14px 0;font:800 24px Georgia;color:#A85C4A">+${x} XP</p><button class="btn sm" data-figma-name="Primary CTA">Continue</button></div>`;document.body.appendChild(m)}
function drawHd(){const s=S.s;$('hd').style.display=(s=='splash'||s=='onb')?'none':'flex';
$('hd').innerHTML=`<div class="brand" data-figma-name="Logo Wordmark" onclick="go('home')">JORDAN HIDDEN<small>THE QUEST</small></div><nav data-figma-name="Navigation">${NAV.map(n=>`<button class="${s==n[0]?'on':''}" data-figma-name="Navigation Item" onclick="go('${n[0]}')">${n[1]}</button>`).join('')}</nav>${CURRENT_UID?`<div class="xp-pill" data-figma-name="XP Pill">⚡ LVL ${lvl()} · ${S.xp.toLocaleString()} XP</div>`:''}${CURRENT_USERNAME?`<span class="username-label" data-figma-name="Username">${CURRENT_USERNAME}</span><button class="logout-button" data-figma-name="Logout" onclick="JordanHiddenLogout()">Logout</button>`:!new URLSearchParams(location.search).has('figma')?'<button class="logout-button" onclick="JordanHiddenRequireAccount()">Log in / Sign up</button>':''}<div class="profile-avatar" data-figma-name="Profile Avatar">🧭</div><div class="team-logo" data-figma-name="Team Logo" data-t="${TEAM}"><img src="${LOGO}" alt="${TEAM}"></div>`}
function pcard(p){return `<div class="card ${p.c}" data-figma-name="Destination Card"><div class="card-image" data-figma-name="Card Image" style="${ART(p)}"><span class="tag" data-figma-name="Category Tag">${CAT[p.c]}</span></div><div class="card-body" data-figma-name="Card Content"><div class="row-between"><h3 data-figma-name="Heading H3" style="font-size:19px">${p.n}</h3><span class="pill" data-figma-name="XP Badge">+${p.xp} XP</span></div><div class="meta" data-figma-name="Meta Row"><span>📍 ${p.loc}</span><span>⛰ ${p.d}</span><span>⏱ ${p.t}</span></div><p class="text-muted" style="font-size:13px;min-height:60px">${p.st}</p><div style="display:flex;gap:8px;margin-top:12px"><button class="btn sm" data-figma-name="Primary CTA" onclick="add('${p.id}')">Add to journey</button><button class="btn g sm" data-figma-name="Secondary CTA" onclick="go('det','${p.id}')">Details</button></div></div></div>`}
function mapSVG(o={}){const L=o.route?S.j.map(G):[];
return `<svg viewBox="60 0 340 500"><defs><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#D8C5A3" stroke-opacity=".06"/></pattern></defs><rect x="0" width="400" height="500" fill="url(#gr)"/><polygon points="120,30 200,45 300,60 390,110 330,150 340,280 250,330 190,430 110,485 95,440 90,330 100,240 95,180 105,110" fill="#3a3025" stroke="#D8C5A3" stroke-opacity=".5" stroke-width="1.5"/><ellipse cx="102" cy="225" rx="7" ry="22" fill="#2b4a55"/>${L.length>1?`<polyline points="${L.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="#C99A3D" stroke-width="2" stroke-dasharray="6 5"/>`:''}${P.filter(p=>S.fl=='all'||p.c==S.fl).map(p=>`<g class="map-marker" onclick="pick('${p.id}')"><circle class="marker-pulse" cx="${p.x}" cy="${p.y}" r="6" fill="${COL[p.c]}"/><circle cx="${p.x}" cy="${p.y}" r="${p.id==S.sel?8:6}" fill="${COL[p.c]}" stroke="#F4EBDD" stroke-width="${p.id==S.sel?3:1.5}"><title>${p.n}, ${CAT[p.c]} (+${p.xp} XP)</title></circle></g>`).join('')}${L.map((p,i)=>`<text x="${p.x+10}" y="${p.y+4}" fill="#F4EBDD" font-size="10" font-weight="700">${i+1}</text>`).join('')}<text x="215" y="90" fill="#D8C5A3" fill-opacity=".4" font-size="14" letter-spacing="6" font-family="Georgia">JORDAN</text></svg>`}
function pick(id){S.sel=id;if(S.s=='map')draw()}
const V={
splash:()=>`<div class="splash"><img src="${LOGO}" alt="Team logo"><div class="eyebrow" data-figma-name="Eyebrow">Discover Jordan like you've never experienced it</div><h1 data-figma-name="Heading H1" style="font-size:64px">JORDAN HIDDEN</h1><p class="text-muted">The Quest Begins</p><button class="btn" data-figma-name="Primary CTA" onclick="go('onb')">Enter the quest</button><small class="text-muted" style="opacity:.6">Created by ${TEAM}</small></div>`,
onb:()=>`<div style="text-align:center;padding-top:50px"><div class="eyebrow" data-figma-name="Eyebrow">Step 1 of 1</div><h1 data-figma-name="Heading H1" style="font-size:48px;margin:10px 0 30px">What kind of explorer are you?</h1><div class="grid g4" style="grid-template-columns:repeat(5,1fr)">${EX.map((e,i)=>`<div class="explorer-option ${S.typ===i?'on':''}" data-figma-name="Explorer Option" style="background:linear-gradient(180deg,transparent 25%,#241D18ee 100%),url(assets/explorers/${i}.svg) center/cover no-repeat,${e[3]}" onclick="S.typ=${i};draw()"><div class="i">${e[0]}</div><h3 data-figma-name="Heading H3" style="font-size:18px">${e[1]}</h3><p>${e[2]}</p></div>`).join('')}</div>${S.typ!==null?`<div style="margin-top:40px;animation:fi .6s"><h2 data-figma-name="Section Title">You're a Hidden Explorer 🔥</h2><p class="text-muted" style="margin-bottom:20px">Let's discover the Jordan most tourists never see, while supporting local communities.</p><button class="btn" data-figma-name="Primary CTA" onclick="go('home')">Start my quest</button></div>`:''}</div>`,
home:()=>{const aq=activeDestination(),done=isQuestComplete(),n=questTasks().filter(Boolean).length;return `<div class="hero" data-figma-name="Hero"><div class="eyebrow" data-figma-name="Eyebrow">Welcome back, ${CURRENT_USERNAME||'Explorer'}</div><h1 data-figma-name="Heading H1">Your Jordan Adventure Starts Here.</h1><p class="text-muted" style="max-width:460px;margin-bottom:22px">${S.typ!==null?EX[S.typ][1]+' explorer · ':''}${done?'Last completed quest':'Your current quest'}: ${aq.n}, ${n}/5 tasks done${done?' · Completed':''}.</p><div style="max-width:420px"><div class="row-between" style="margin-bottom:6px"><b>LEVEL ${String(lvl()).padStart(2,'0')} · Eco-Desert Explorer</b><span>${S.xp.toLocaleString()} XP</span></div><div class="bar" data-figma-name="Progress Bar"><i id="xb" style="width:0"></i></div></div><br><button class="btn" data-figma-name="Primary CTA" onclick="${done ? `startNewQuest('${aq.id}')` : "go('quest')"}">${done?'Start a new journey':'Continue your quest'}</button> <button class="btn g" data-figma-name="Secondary CTA" onclick="go('map')">Open map</button></div><div class="eyebrow" data-figma-name="Eyebrow">Recommended for you</div><h2 data-figma-name="Section Title" style="margin-top:6px">Picked for a ${S.typ!==null?EX[S.typ][1]:'Hidden'} explorer</h2><div class="grid g3">${['disah','ajloun','fuheis'].map(i=>pcard(G(i))).join('')}</div><h2 data-figma-name="Section Title">Hidden Gem of the Day</h2><div class="card h" data-figma-name="Card" style="display:grid;grid-template-columns:1fr 1fr"><div class="card-image" data-figma-name="Card Image" style="${ART(G('dana'))};height:auto;min-height:220px"><span class="tag" data-figma-name="Category Tag">Hidden</span></div><div class="card-body" data-figma-name="Card Content" style="padding:36px"><h3 data-figma-name="Heading H3" style="font-size:28px">${G('dana').n}</h3><p class="text-muted" style="margin:10px 0 20px">${G('dana').st} ${G('dana').lc}</p><button class="btn o" data-figma-name="Accent CTA" onclick="go('det','dana')">Discover</button></div></div><h2 data-figma-name="Section Title">Your Progress</h2><div class="grid g4">${[['🗺️',S.j.length,'Saved places'],['✅',S.completedQuests.length*TASKS.length+(S.activeQuest?.tasks.filter(Boolean).length||0),'Tasks done'],['🏆',BD.filter(b=>U(b[4])).length,'Badges'],['⚡',S.xp,'Total XP']].map(x=>`<div class="card card-body" data-figma-name="Card"><div style="font-size:26px">${x[0]}</div><div class="serif" style="font-size:34px">${x[1]}</div><div class="text-muted">${x[2]}</div></div>`).join('')}</div>`},
map:()=>{const p=G(S.sel);return `<div class="row-between"><h1 data-figma-name="Heading H1" style="font-size:36px">Interactive Jordan Map</h1><div class="chips">${[['all','All'],['f','🔴 Famous'],['h','🟢 Hidden'],['e','🟡 Experience']].map(f=>`<button class="chip ${S.fl==f[0]?'on':''}" data-figma-name="Filter Chip" onclick="S.fl='${f[0]}';draw()">${f[1]}</button>`).join('')}</div></div><br><div class="grid" style="grid-template-columns:1.5fr 1fr"><div class="map" data-figma-name="Map Canvas">${mapSVG({route:1})}<div style="position:absolute;left:16px;bottom:16px" class="chips"><button class="chip" data-figma-name="Filter Chip" onclick="toast('Showing nearby experiences')">📍 Discover nearby</button></div></div><div class="card ${p.c}" data-figma-name="Card" style="height:610px;overflow:auto"><div class="card-image" data-figma-name="Card Image" style="${ART(p)};height:190px"><span class="tag" data-figma-name="Category Tag">${CAT[p.c]}</span></div><div class="card-body" data-figma-name="Card Content"><h2 data-figma-name="Section Title" style="margin:0">${p.n}</h2><div class="meta" data-figma-name="Meta Row"><span>📍 ${p.loc}</span><span>⛰ ${p.d}</span><span>⏱ ${p.t}</span></div><p>${p.st}</p><p class="text-muted" style="margin:12px 0"><b>Local:</b> ${p.lc}</p><span class="pill" data-figma-name="XP Badge">+${p.xp} XP</span><div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap"><button class="btn sm" data-figma-name="Primary CTA" onclick="add('${p.id}');draw()">Add to journey</button><button class="btn g sm" data-figma-name="Secondary CTA" onclick="go('det','${p.id}')">Full details</button></div></div></div></div>`},
det:()=>{const p=G(S.sel);return `<div class="card ${p.c}" data-figma-name="Destination Card"><div class="card-image" data-figma-name="Card Image" style="${ART(p)};height:340px"><span class="tag" data-figma-name="Category Tag">${CAT[p.c]}</span><div style="position:absolute;bottom:24px;left:36px;z-index:2"><div class="text-muted">📍 ${p.loc}, Jordan</div><h1 data-figma-name="Heading H1" style="font-size:52px">${p.n}</h1></div></div><div class="card-body" data-figma-name="Card Content" style="padding:32px"><p style="font-size:19px;max-width:760px;font-family:Georgia">${p.st}</p><div class="grid g4" style="margin:26px 0">${[['Difficulty',p.d],['Estimated time',p.t],['Best time',p.b],['XP reward','+'+p.xp+' XP']].map(x=>`<div class="card card-body" data-figma-name="Card"><div class="text-muted" style="font-size:12px">${x[0]}</div><b style="font-size:17px">${x[1]}</b></div>`).join('')}</div><div class="grid g2"><div class="card card-body" data-figma-name="Card"><div class="eyebrow" data-figma-name="Eyebrow">Local experience</div><p style="margin-top:6px">${p.lc}</p></div><div class="card card-body" data-figma-name="Card"><div class="eyebrow" data-figma-name="Eyebrow">🌿 Sustainability</div><p style="margin-top:6px">${p.sp}</p></div></div><div style="display:flex;gap:12px;margin-top:26px"><button class="btn" data-figma-name="Primary CTA" onclick="add('${p.id}')">Add to my journey</button><button class="btn o" data-figma-name="Accent CTA" onclick="startNewQuest('${p.id}')">Start new quest</button></div></div></div>`},
quest:()=>{
  const p=activeDestination(), tasks=questTasks(), n=tasks.filter(Boolean).length, done=isQuestComplete();
  return `<div class="grid" style="grid-template-columns:1.4fr 1fr">
    <div>
      <div class="eyebrow" data-figma-name="Eyebrow">${done?'Completed quest':'Active quest'}</div>
      <h1 data-figma-name="Heading H1" style="font-size:46px;margin:6px 0">${p.n.toUpperCase()} QUEST</h1>
      <div class="meta" data-figma-name="Meta Row"><span>⛰ ${p.d}</span><span>⏱ ~${p.t}</span><span>🏆 Explorer badge</span><span>${n*20}% complete</span></div>
      <div class="bar" data-figma-name="Progress Bar" style="margin:14px 0 26px"><i id="xb" style="width:0"></i></div>
      ${TASKS.map((t,i)=>`<div class="task ${tasks[i]?'d':''}" data-figma-name="Quest Task" onclick="${done ? "toast('This quest is completed. Start a new quest.')" : "tick("+i+")"}"><div class="task-check">${tasks[i]?'✓':''}</div><span>${t}</span></div>`).join('')}
      <div style="margin-top:22px">
        ${done?`<button class="btn" data-figma-name="Primary CTA" onclick="startNewQuest('${p.id}')">Start a new journey</button>`:`<button class="btn g" data-figma-name="Secondary CTA" onclick="go('map')">Choose another destination</button>`}
      </div>
    </div>
    <div class="card ${p.c}" data-figma-name="Card">
      <div class="card-image" data-figma-name="Card Image" style="${ART(p)};height:260px"><span class="tag" data-figma-name="Category Tag">Reward</span></div>
      <div class="card-body" data-figma-name="Card Content">
        <div class="big" style="font-size:52px">${done?'🏆':'🔒'}</div>
        <h3 data-figma-name="Heading H3">${p.n} Explorer</h3>
        <p class="text-muted">${done?'Quest completed. Your next quest will start with a fresh progress state.':'Finish all five objectives to unlock this badge and earn XP.'}</p>
      </div>
    </div>
  </div>`
},
plan:()=>{const q=S.pl,ch=(a,k,v)=>`class="chip ${a?'on':''}" data-figma-name="Filter Chip" onclick="${k}"`;return `<div style="text-align:center;margin-bottom:30px"><div class="eyebrow" data-figma-name="Eyebrow">✨ AI Trip Planner</div><h1 data-figma-name="Heading H1" style="font-size:46px">Build Your Jordan Quest.</h1></div><div class="grid" style="grid-template-columns:1fr 1.3fr"><div class="card card-body" data-figma-name="Card"><h3 data-figma-name="Heading H3">Trip duration</h3><div class="chips" style="margin:10px 0 20px">${[1,2,3,4].map(d=>`<button ${ch(q.d==d,`S.pl.d=${d};draw()`)}>${d} day${d>1?'s':''}</button>`).join('')}</div><h3 data-figma-name="Heading H3">Interests</h3><div class="chips" style="margin:10px 0 20px">${['Adventure','Local Food','History','Nature'].map(i=>`<button ${ch(q.i.includes(i),`tgI('${i}')`)}>${i}</button>`).join('')}</div><h3 data-figma-name="Heading H3">Budget & style</h3><div class="chips" style="margin:10px 0 20px">${['Low','Medium','Premium','Relaxed','Balanced'].map(i=>`<button class="chip" data-figma-name="Filter Chip" onclick="this.classList.toggle('on')">${i}</button>`).join('')}</div><h3 data-figma-name="Heading H3">Sustainability</h3><div class="chips" style="margin:10px 0 24px"><button ${ch(!q.eco,'S.pl.eco=0;draw()')}>Standard</button><button ${ch(q.eco,'S.pl.eco=1;draw()')}>Eco-focused</button></div><button class="btn" data-figma-name="Primary CTA" onclick="gen()">Generate my quest</button></div><div id="out">${S.res||'<div class="card card-body text-muted" data-figma-name="Card" style="height:100%;display:grid;place-items:center;text-align:center">Your personalized itinerary will appear here.</div>'}</div></div>`},
journey:()=>`<div class="row-between"><h1 data-figma-name="Heading H1" style="font-size:38px">My Journey</h1><button class="btn o" data-figma-name="Accent CTA" onclick="go('story')">View my Jordan story</button></div><br><div class="grid" style="grid-template-columns:1fr 1fr"><div>${S.j.map((id,i)=>{const p=G(id);return `<div class="card ${p.c} card-body" data-figma-name="Card" style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><span class="serif" style="font-size:28px;color:var(--gold)">${i+1}</span>${THUMB(p)}<div style="flex:1"><b>${p.n}</b><div class="text-muted" style="font-size:12px">${CAT[p.c]} · ${p.loc} · +${p.xp} XP</div></div><button class="chip" data-figma-name="Filter Chip" onclick="mv(${i},-1)">↑</button><button class="chip" data-figma-name="Filter Chip" onclick="mv(${i},1)">↓</button><button class="chip" data-figma-name="Filter Chip" onclick="startNewQuest('${p.id}')">Start</button><button class="chip" data-figma-name="Filter Chip" onclick="S.j.splice(${i},1);saveState();draw()">✕</button></div>`}).join('')||'<p class="text-muted">Nothing saved yet. Explore the map.</p>'}</div><div class="map" data-figma-name="Map Canvas" style="height:480px">${mapSVG({route:1})}</div></div><h2 data-figma-name="Section Title">Completed quests · ${S.completedQuests.length}</h2><div class="grid g3">${S.completedQuests.slice().reverse().map(q=>`<div class="card card-body" data-figma-name="Card"><b>${G(q.destination).n} Quest</b><div class="text-muted">5/5 objectives · Completed ${new Date(q.completedAt).toLocaleDateString()} · +${q.xp} XP</div></div>`).join('')||'<p class="text-muted">No completed quests yet.</p>'}</div>`,
ach:()=>`<h1 data-figma-name="Heading H1" style="font-size:38px">Achievements</h1><p class="text-muted" style="margin:6px 0 24px">${BD.filter(b=>U(b[4])).length} of ${BD.length} unlocked</p><div class="grid g3">${BD.map(b=>`<div class="card card-body ${U(b[4])?'':'lock'}" data-figma-name="Card"><div class="big" style="font-size:54px">${b[0]}</div><h3 data-figma-name="Heading H3">${b[1]}</h3><p class="text-muted" style="margin:6px 0">${b[2]}</p><span class="pill" data-figma-name="XP Badge">+${b[3]} XP</span> <span class="text-muted" style="font-size:12px">${U(b[4])?'Unlocked':'Locked'}</span></div>`).join('')}</div>`,
hidden:()=>`<div style="text-align:center;margin:20px 0 34px"><div class="eyebrow" data-figma-name="Eyebrow">Hidden Jordan</div><h1 data-figma-name="Heading H1" style="font-size:44px;line-height:1.15">You've seen Jordan.<br>Now discover the Jordan they don't show you.</h1></div><div class="grid g3">${P.filter(p=>p.c!='f').map(pcard).join('')}</div>`,
story:()=>{
  const hiddenCount = S.j.map(G).filter(p=>p.c=='h').length;
  const localCount = S.j.map(G).filter(p=>p.c=='e').length;
  const tasksDone =
    S.completedQuests.length * TASKS.length +
    (S.activeQuest?.tasks.filter(Boolean).length || 0);
  const favorite = G(S.j[0] || 'petra').n;

  return `
    <div style="max-width:1400px;margin:0 auto">

      <div style="
        position:relative;
        min-height:620px;
        border-radius:28px;
        overflow:hidden;
        background:
          radial-gradient(circle at 75% 20%,rgba(201,154,61,.12),transparent 35%),
          linear-gradient(135deg,#2b211a,#1b1511);
        border:1px solid rgba(216,197,163,.18);
        padding:70px;
        display:flex;
        align-items:center;
      ">

        <div style="
          position:absolute;
          inset:0;
          opacity:.12;
          pointer-events:none;
        ">
          ${mapSVG({route:1})}
        </div>

        <div style="
          position:relative;
          z-index:2;
          width:100%;
          max-width:980px;
        ">

          <div class="eyebrow">
            YOUR JORDAN STORY 🇯🇴
          </div>

          <h1 style="
            font-size:58px;
            line-height:1.05;
            margin:12px 0 18px;
            max-width:850px;
          ">
            Your journey through Jordan,<br>
            told your way.
          </h1>

          <p class="text-muted" style="
            max-width:680px;
            font-size:18px;
            line-height:1.7;
            margin-bottom:34px;
          ">
            Every hidden place, local experience and completed quest
            becomes part of your Jordan story.
          </p>

          <div style="
            display:grid;
            grid-template-columns:repeat(4,minmax(0,1fr));
            gap:16px;
            margin-bottom:32px;
          ">

            <div style="
              padding:22px;
              border-radius:18px;
              background:rgba(255,255,255,.045);
              border:1px solid rgba(216,197,163,.12);
            ">
              <div style="font-size:24px;margin-bottom:8px">🗺️</div>
              <div class="serif" style="font-size:34px;color:#F4EBDD">
                ${hiddenCount}
              </div>
              <div class="text-muted" style="font-size:13px">
                Hidden places
              </div>
            </div>

            <div style="
              padding:22px;
              border-radius:18px;
              background:rgba(255,255,255,.045);
              border:1px solid rgba(216,197,163,.12);
            ">
              <div style="font-size:24px;margin-bottom:8px">🤝</div>
              <div class="serif" style="font-size:34px;color:#F4EBDD">
                ${localCount}
              </div>
              <div class="text-muted" style="font-size:13px">
                Local experiences
              </div>
            </div>

            <div style="
              padding:22px;
              border-radius:18px;
              background:rgba(255,255,255,.045);
              border:1px solid rgba(216,197,163,.12);
            ">
              <div style="font-size:24px;margin-bottom:8px">✅</div>
              <div class="serif" style="font-size:34px;color:#F4EBDD">
                ${tasksDone}
              </div>
              <div class="text-muted" style="font-size:13px">
                Tasks completed
              </div>
            </div>

            <div style="
              padding:22px;
              border-radius:18px;
              background:rgba(255,255,255,.045);
              border:1px solid rgba(216,197,163,.12);
            ">
              <div style="font-size:24px;margin-bottom:8px">⚡</div>
              <div class="serif" style="font-size:34px;color:#F4EBDD">
                ${S.xp.toLocaleString()}
              </div>
              <div class="text-muted" style="font-size:13px">
                Total XP
              </div>
            </div>

          </div>

          <div style="
            display:flex;
            align-items:center;
            gap:14px;
            flex-wrap:wrap;
            margin-bottom:24px;
          ">

            <div class="pill" style="
              display:inline-block;
              font-size:15px;
              padding:10px 18px;
            ">
              🏆 Certified Jordan Explorer · Level ${lvl()}
            </div>

            <div class="text-muted">
              Sustainability score 82% · Favorite: ${favorite}
            </div>

          </div>

          <button
            class="btn"
            onclick="toast('Story link copied')"
          >
            Share my Jordan story
          </button>

        </div>
      </div>
    </div>
  `;
}
} 

const accountHome=V.home;
V.home=()=>CURRENT_UID||new URLSearchParams(location.search).has('figma')
  ? accountHome()
  : `<div class="hero" data-figma-name="Hero"><div class="eyebrow">DISCOVER JORDAN</div><h1>Find the Jordan most travelers miss.</h1><p class="text-muted" style="max-width:540px;margin-bottom:24px">Explore destinations, local food, and community experiences without an account. Sign in when you want to save a journey or earn XP.</p><button class="btn" onclick="go('map')">Explore the map</button> <button class="btn g" onclick="go('food')">Local food</button></div><div class="eyebrow">Places to discover</div><h2 class="section-title">Start exploring</h2><div class="grid g3">${[P[0],P[1],P[3]].map(pcard).join('')}</div>`;
const guestFeatureNotice=page=>`<div class="card card-body guest-feature-notice" role="note"><strong>This feature is visible to everyone.</strong> Sign in to save your own progress and use its personal actions. <button class="btn sm" onclick="JordanHiddenRequireAccount('${page}')">Log in / Sign up</button></div>`;
for(const page of ['quest','plan','journey','ach']){
  const view=V[page];
  V[page]=()=>!CURRENT_UID&&!new URLSearchParams(location.search).has('figma')
    ? guestFeatureNotice(page)+view()
    : view();
}
const accountStory=V.story;
V.story=()=>CURRENT_UID||new URLSearchParams(location.search).has('figma')
  ? accountStory()
  : `<div class="hero"><div class="eyebrow">YOUR JORDAN STORY</div><h1>Every journey has a story.</h1><p class="text-muted">Your visited places, finished quests, achievements and earned XP will come together here after you sign in and explore.</p><button class="btn" onclick="JordanHiddenRequireAccount('story')">Log in / Sign up</button> <button class="btn g" onclick="go('hidden')">Explore destinations</button></div>`;
function U(k){return k=='petra'?S.completedQuests.some(q=>q.destination==='petra'):k=='gem'?S.j.map(G).filter(p=>p.c=='h').length>=5:k=='story'?S.completedQuests.length>0:!!S.ub[k]}
function tick(i){
  if(needsAccount('quest'))return;
  const quest=S.activeQuest;
  if(!quest||!Number.isInteger(i)||i<0||i>=TASKS.length||quest.tasks[i]||quest.completed)return;
  quest.tasks[i]=1;
  if(quest.tasks.every(Boolean)){
    if(!completeActiveQuest())return;
    toast('+200 XP Quest complete');
    drawHd();
    draw();
    modal('🏆',`${activeDestination().n} Quest — Unlocked`,'You completed this journey. Start a new journey to begin with fresh objectives.',200);
  }else{
    gain(20,'Objective');
    draw();
  }
}
function tgI(i){const a=S.pl.i,k=a.indexOf(i);k<0?a.push(i):a.splice(k,1);draw()}
function mv(i,d){const j=i+d;if(j<0||j>=S.j.length)return;[S.j[i],S.j[j]]=[S.j[j],S.j[i]];saveState();draw()}
function gen(){if(needsAccount('plan'))return;const o=$('out');o.innerHTML='<div class="card card-body" data-figma-name="Card" style="height:100%;display:grid;place-items:center;text-align:center;justify-items:center;gap:14px"><div class="spin"></div><p class="text-muted">Matching your explorer profile with hidden gems…</p></div>';
setTimeout(()=>{const m={Adventure:'a',History:'h','Local Food':'f',Nature:'n'},q=S.pl,tg=q.i.map(x=>m[x]).join('');
const r=P.map(p=>({p,s:[...p.tg].filter(c=>tg.includes(c)).length+(q.eco&&p.c!='f'?1:0)+(p.c=='h'?.5:0)})).sort((a,b)=>b.s-a.s).slice(0,q.d*3).map(x=>x.p),sl=['Morning','Afternoon','Evening'];
S.res=Array.from({length:q.d},(_,d)=>`<div class="day" data-figma-name="Itinerary Day"><div class="eyebrow" data-figma-name="Eyebrow">Day 0${d+1}</div><h2 data-figma-name="Section Title" style="margin:4px 0 12px">${r[d*3]?.n||'Free exploration'} + more</h2>${r.slice(d*3,d*3+3).map((p,i)=>`<div class="card ${p.c} card-body" data-figma-name="Card" style="margin-bottom:10px;display:flex;align-items:center;gap:14px">${THUMB(p)}<div style="flex:1"><div class="text-muted" style="font-size:11px">${sl[i]}</div><b>${p.n}</b> <span class="pill" data-figma-name="XP Badge">+${p.xp}</span></div><button class="btn sm" data-figma-name="Primary CTA" onclick="add('${p.id}')">Add</button></div>`).join('')}</div>`).join('');
$('out').innerHTML=S.res},1800)}

const FR={splash:'01_Splash_Desktop',onb:'02_Onboarding_Desktop',home:'03_Home_Desktop',map:'04_Interactive_Map_Desktop',det:'05_Destination_Details_Desktop',quest:'06_Quest_Desktop',plan:'07_AI_Trip_Planner_Desktop',journey:'08_My_Journey_Desktop',ach:'09_Achievements_Desktop',hidden:'10_Hidden_Jordan_Desktop',story:'11_Jordan_Story_Desktop'};
function initFigmaMode(){const q=new URLSearchParams(location.search);if(q.get('figma')){document.body.classList.add('figma-static','site-ready');if(V[q.get('screen')])S.s=q.get('screen');draw()}}
function draw(){if(!new URLSearchParams(location.search).get('figma'))saveState();drawHd();$('app').style.animation='none';$('app').offsetHeight;$('app').style.animation='';$('app').innerHTML=`<section class="screen" data-figma-name="${FR[S.s]}" data-frame="${FR[S.s]}">${V[S.s]()}</section>`;setTimeout(()=>{const b=$('xb');if(b)b.style.width=(S.s=='quest'?questTasks().filter(Boolean).length*20:pc())+'%'},80)}
initFigmaMode();
if(!new URLSearchParams(location.search).has('figma'))window.JordanHidden.activateGuest();
