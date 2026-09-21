/* Pole et Moi — Witchy Edition
   Version robuste : fonctionne même si aucune photo n'est encore importée.
*/

const MUSCLES = {
  "Rotations épaules, poignets, hanches":"Épaules · poignets · hanches",
  "Cat-cow (mobilité colonne)":"Colonne · abdos profonds",
  "Jumping jacks légers":"Jambes · cardio · épaules",
  "Rotations de tronc":"Obliques · mobilité du tronc",
  "Rows élastique ou TRX":"Dos · biceps · arrière d’épaules",
  "Superman hold":"Lombaires · fessiers · haut du dos",
  "Scapular pulls (dead hang, tirer les omoplates)":"Dos · fixateurs des omoplates",
  "Face pulls élastique":"Arrière d’épaules · haut du dos",
  "Pompes (genoux si besoin)":"Pectoraux · triceps · gainage",
  "Dips sur chaise":"Triceps · épaules · pectoraux",
  "Tirage épaule arrière avec élastique":"Arrière d’épaules · haut du dos",
  "Négatives de tractions (descente lente)":"Dos · biceps · grip",
  "Dead hangs":"Grip · avant-bras · épaules",
  "Farmer carry avec haltères ou sacs":"Grip · avant-bras · gainage",
  "Serrage balle anti-stress ou pince":"Avant-bras · doigts · grip",
  "Suspension serviette enroulée sur barre":"Grip · avant-bras · épaules",
  "Hollow body hold":"Abdos · fléchisseurs de hanches",
  "Planche":"Abdos · épaules · gainage global",
  "Leg raises":"Abdos · fléchisseurs de hanches",
  "Toes to bar assistés ou genoux relevés suspendue":"Abdos · grip · fléchisseurs de hanches",
  "Papillon (butterfly stretch)":"Adducteurs · hanches",
  "Grenouille (frog stretch)":"Adducteurs · hanches",
  "Fente profonde — jambe droite":"Fléchisseurs de hanche · quadriceps",
  "Fente profonde — jambe gauche":"Fléchisseurs de hanche · quadriceps",
  "Pigeon pose — côté droit":"Fessiers · hanches",
  "Pigeon pose — côté gauche":"Fessiers · hanches",
  "Ischios assis — une jambe à la fois":"Ischio-jambiers · hanches",
  "Grand écart facial progressif — avec support":"Adducteurs · ischio-jambiers",
  "Quadriceps — chaque jambe":"Quadriceps · fléchisseurs de hanche",
  "Étirement porte (doorway stretch)":"Pectoraux · épaules",
  "Rotation externe épaule avec bâton ou serviette":"Coiffe des rotateurs · épaules",
  "Cobra — légère extension du dos":"Abdos · pectoraux · colonne",
  "Chandelle contre mur — préparation au backbend":"Épaules · ouverture thoracique · dos",
  "Étirement triceps — bras droit":"Triceps · épaules",
  "Étirement triceps — bras gauche":"Triceps · épaules",
  "Rotations et étirement poignets":"Poignets · avant-bras",
  "Extension dos progressive — pont si niveau OK":"Dos · épaules · hanches",
  "Étirement pectoraux (chest opener)":"Pectoraux · épaules"
};

const PROGRAM_OFFSETS = {renfo:0,jambes:20,bras:29};
let active = "renfo";
let listVisible = false;
let sessionIndex = 0;
let sessionTimer = null;
let sessionRunning = false;
let modalTimer = null;
let modalRemaining = 0;
let modalTotal = 0;
let trackingMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function getProgram(){return programs.find(p=>p.id===active)}
function getExercises(){
  return getProgram().sections.flatMap(s=>s[1].map(e=>({
    name:e[0],duration:e[1],kind:e[2],instructions:e[3],seconds:Number(e[4]),section:s[0]
  })));
}
function exerciseNumber(localIndex, programId=active){return (PROGRAM_OFFSETS[programId]||0)+Number(localIndex)+1}
function imagePath(localIndex, programId=active){return `assets/exercises/${String(exerciseNumber(localIndex,programId)).padStart(2,"0")}.jpg`}
function imageMarkup(localIndex, programId=active, cls="exercisePhoto"){
  const n=String(exerciseNumber(localIndex,programId)).padStart(2,"0");
  const src=imagePath(localIndex,programId);
  return `<div class="photoFrame ${cls}">
    <img src="${src}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
    <div class="photoPlaceholder" hidden><span class="placeholderMoon">☾</span><span>PHOTO À AJOUTER</span><strong>${n}.jpg</strong></div>
  </div>`;
}
function muscleFor(e){return MUSCLES[e.name]||"Mobilité · contrôle · stabilité"}
function getDone(){try{return JSON.parse(localStorage.getItem("pole2_"+active)||"[]")}catch{return []}}
function saveDone(a){localStorage.setItem("pole2_"+active,JSON.stringify(a))}
function fmt(s){s=Math.max(0,Number(s)||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

function boot(){
  const hero=document.getElementById("homeHero");
  hero.innerHTML=`<img src="assets/accueil.jpg" alt="Illustration de l’accueil" class="homeHeroImg" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="heroPlaceholder" hidden><span>☾</span><b>IMAGE D’ACCUEIL</b><small>accueil.jpg</small></div>`;
  document.getElementById("icon-renfo").innerHTML=iconSvg("✦");
  document.getElementById("icon-jambes").innerHTML=iconSvg("☾");
  document.getElementById("icon-bras").innerHTML=iconSvg("✧");
}
function iconSvg(symbol){return `<div class="witchIcon">${symbol}</div>`}
function show(id){document.querySelectorAll(".view").forEach(x=>x.classList.remove("show"));document.getElementById(id).classList.add("show");window.scrollTo({top:0,behavior:"instant"})}
function goHome(){closeSession();closeModal();active="renfo";listVisible=false;show("home")}
function openProgram(id){active=id;listVisible=false;show("program");renderProgram()}

function renderProgram(){
  const p=getProgram(), ex=getExercises(), done=getDone();
  const minutes=p.id==="renfo"?45:20;
  document.getElementById("pTitle").textContent=p.name.split(" (")[0];
  document.getElementById("pSub").textContent=p.name.includes("(")?(p.name.match(/\((.*?)\)/)||[])[1]||"":p.name;
  document.getElementById("routineHero").innerHTML=`<div class="ritualOrb"><span class="moonGlyph">☾</span><span class="orbit orbit1"></span><span class="orbit orbit2"></span><span class="spark s1">✦</span><span class="spark s2">✧</span></div><h2>${p.id==="renfo"?"Plus forte pour la pole.":p.id==="jambes"?"Des jambes plus souples, plus de liberté.":"Des épaules plus libres pour la ballerina."}</h2><p>${minutes} min · à ton rythme</p>`;
  const start=document.getElementById("startBtn");
  start.textContent=`▶ Démarrer la séance · ${minutes} min`;
  start.onclick=()=>startSession();
  start.disabled=false;
  document.getElementById("pProgress").textContent=`${done.length} / ${ex.length} exercices`;
  document.getElementById("pPercent").textContent=`${Math.round(done.length/ex.length*100)||0}%`;
  document.getElementById("pFill").style.width=(done.length/ex.length*100)+"%";
  const toggle=document.getElementById("toggleExercises");
  toggle.textContent=listVisible?"Masquer les exercices":"Afficher les exercices";
  toggle.onclick=()=>toggleList();
  const list=document.getElementById("exerciseList");list.classList.toggle("show",listVisible);list.innerHTML="";
  if(!listVisible)return;
  p.sections.forEach(sec=>{
    const section=document.createElement("div");section.className="section";section.innerHTML=`<div class="sectionTitle">${sec[0]}</div>`;
    sec[1].forEach(raw=>{
      const i=ex.findIndex(x=>x.name===raw[0]);
      const e=ex[i];
      const row=document.createElement("div");row.className="exercise";
      row.innerHTML=`<div class="thumb">${imageMarkup(i,active,"thumbPhoto")}</div><div><div class="name">${e.name}</div><div class="meta">${e.duration} · ${muscleFor(e)}</div></div><input class="check" type="checkbox" ${done.includes(i)?"checked":""} aria-label="Marquer ${e.name} comme fait">`;
      row.addEventListener("click",ev=>{if(ev.target.closest("input"))return;openExercise(i)});
      row.querySelector(".check").addEventListener("change",ev=>{let a=getDone();if(ev.target.checked&&!a.includes(i))a.push(i);if(!ev.target.checked)a=a.filter(x=>x!==i);saveDone(a);renderProgram()});
      section.appendChild(row);
    });
    list.appendChild(section);
  });
}
function toggleList(){listVisible=!listVisible;renderProgram()}

function openExercise(i){
  const e=getExercises()[i];
  modalRemaining=e.seconds;modalTotal=e.seconds;clearInterval(modalTimer);modalTimer=null;
  document.getElementById("mSection").textContent=e.section;
  document.getElementById("mTitle").textContent=e.name;
  document.getElementById("mIll").innerHTML=imageMarkup(i,active,"detailPhoto");
  document.getElementById("mInstructions").innerHTML=`<p>${e.instructions}</p><div class="muscleBox"><span>Muscles visés</span><strong>${muscleFor(e)}</strong></div>`;
  updateModal();document.getElementById("modal").classList.add("show");
}
function closeModal(){clearInterval(modalTimer);modalTimer=null;document.getElementById("modal").classList.remove("show")}
function updateModal(){document.getElementById("mTimer").textContent=fmt(modalRemaining);document.getElementById("mFill").style.width=(modalTotal?modalRemaining/modalTotal*100:0)+"%";document.getElementById("mStart").textContent=modalTimer?"Pause":"Démarrer"}
function toggleModalTimer(){
  if(modalTimer){clearInterval(modalTimer);modalTimer=null;updateModal();return}
  if(modalRemaining<=0)modalRemaining=modalTotal;
  modalTimer=setInterval(()=>{modalRemaining--;updateModal();if(modalRemaining<=0){clearInterval(modalTimer);modalTimer=null;modalRemaining=0;updateModal();navigator.vibrate?.([180,80,180])}},1000);updateModal();
}
function resetModalTimer(){clearInterval(modalTimer);modalTimer=null;modalRemaining=modalTotal;updateModal()}

function startSession(){
  sessionIndex=0;
  openSession();
}
function openSession(){document.getElementById("session").classList.add("show");loadSession()}
function closeSession(){clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;document.getElementById("session").classList.remove("show")}
function loadSession(){
  const ex=getExercises();
  if(!ex.length)return;
  const e=ex[sessionIndex];
  clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;
  modalRemaining=e.seconds;modalTotal=e.seconds;
  document.getElementById("sCount").textContent=`${sessionIndex+1} / ${ex.length}`;
  document.getElementById("sVisual").innerHTML=imageMarkup(sessionIndex,active,"sessionPhoto");
  document.getElementById("sTitle").textContent=e.name;
  document.getElementById("sMeta").textContent=e.duration;
  document.getElementById("sMuscle").textContent=muscleFor(e);
  document.getElementById("sNote").textContent=e.instructions;
  document.getElementById("sToggle").disabled=false;
  updateSession();
}
function updateSession(){
  document.getElementById("sTime").textContent=fmt(modalRemaining);
  const deg=modalTotal?360*(1-modalRemaining/modalTotal):0;
  document.getElementById("ring").style.background=`conic-gradient(#cf315d ${deg}deg,#34252b ${deg}deg)`;
  document.getElementById("sToggle").textContent=sessionRunning?"Pause":"Démarrer";
}
function sessionToggle(){
  if(sessionRunning){clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;updateSession();return}
  if(modalRemaining<=0)modalRemaining=modalTotal;
  sessionRunning=true;
  sessionTimer=setInterval(()=>{
    modalRemaining--;updateSession();
    if(modalRemaining<=0){clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;markDone();navigator.vibrate?.([180,80,180]);setTimeout(sessionNext,450)}
  },1000);
  updateSession();
}
function sessionPrev(){if(sessionIndex<=0)return;clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;sessionIndex--;loadSession()}
function sessionNext(){
  clearInterval(sessionTimer);sessionTimer=null;sessionRunning=false;
  markDone();
  const total=getExercises().length;
  if(sessionIndex>=total-1){recordWorkoutDay();closeSession();renderProgram();showProgress();return}
  sessionIndex++;loadSession();
}
function markDone(){let a=getDone();if(!a.includes(sessionIndex)){a.push(sessionIndex);saveDone(a)}}

/* Suivi / séries */
function dateKey(d=new Date()){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`}
function loadWorkoutLog(){try{return JSON.parse(localStorage.getItem("pole_workout_log")||"{}")}catch{return {}}}
function saveWorkoutLog(log){localStorage.setItem("pole_workout_log",JSON.stringify(log))}
function recordWorkoutDay(){const log=loadWorkoutLog(),k=dateKey();if(!log[k])log[k]={sessions:0,programs:[]};log[k].sessions=(log[k].sessions||0)+1;if(!log[k].programs.includes(active))log[k].programs.push(active);saveWorkoutLog(log)}
function dayDiff(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000)}
function sortedWorkoutDates(){const log=loadWorkoutLog();return Object.keys(log).filter(k=>log[k]?.sessions>0).sort()}
function streakStats(){
  const dates=sortedWorkoutDates(),log=loadWorkoutLog(),set=new Set(dates),today=dateKey(),yesterday=dateKey(new Date(Date.now()-86400000));
  let current=0,cursor=set.has(today)?today:(set.has(yesterday)?yesterday:null);
  if(cursor){current=1;while(set.has(dateKey(new Date(new Date(cursor+"T12:00:00").getTime()-86400000)))){cursor=dateKey(new Date(new Date(cursor+"T12:00:00").getTime()-86400000));current++}}
  let best=0,run=0,prev=null;for(const d of dates){if(prev&&dayDiff(prev,d)===1)run++;else run=1;best=Math.max(best,run);prev=d}
  const totalSessions=dates.reduce((n,d)=>n+(log[d]?.sessions||0),0);
  const last7=Array.from({length:7},(_,i)=>dateKey(new Date(Date.now()-i*86400000))).filter(k=>set.has(k)).length;
  const last30=Array.from({length:30},(_,i)=>dateKey(new Date(Date.now()-i*86400000))).filter(k=>set.has(k)).length;
  return{current,best,totalDays:dates.length,totalSessions,last7,last30};
}
function monthLabel(d){return new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(d).replace(/^./,c=>c.toUpperCase())}
function renderMonthCalendar(viewDate){
  const box=document.getElementById("monthCalendar");if(!box)return;
  const y=viewDate.getFullYear(),m=viewDate.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),log=loadWorkoutLog(),today=dateKey();
  let cells=["L","M","M","J","V","S","D"].map(x=>`<div class="calDow">${x}</div>`).join("");
  for(let i=0;i<start;i++)cells+="<div class=\"calEmpty\"></div>";
  for(let d=1;d<=days;d++){
    const k=dateKey(new Date(y,m,d)),on=!!log[k],isToday=k===today,n=log[k]?.sessions||0;
    cells+=`<button type="button" class="calDay ${on?"active":""} ${isToday?"today":""}" title="${on?n+" séance(s)":"Aucune séance"}" onclick="showDayDetail('${k}')"><span>${d}</span>${on?`<i>${n>1?n:"✦"}</i>`:""}</button>`;
  }
  box.innerHTML=cells;document.getElementById("monthTitle").textContent=monthLabel(viewDate);
}
function changeTrackingMonth(delta){trackingMonth=new Date(trackingMonth.getFullYear(),trackingMonth.getMonth()+delta,1);renderMonthCalendar(trackingMonth)}
function showDayDetail(k){const log=loadWorkoutLog()[k];if(!log){return}const names={renfo:"Renfo",jambes:"Souplesse jambes",bras:"Souplesse bras"};alert(`${new Intl.DateTimeFormat("fr-FR",{dateStyle:"full"}).format(new Date(k+"T12:00:00"))}\n\n${log.sessions||1} séance(s)\n${(log.programs||[]).map(x=>names[x]||x).join(", ")}`)}
function renderWeekHeatmap(){const el=document.getElementById("weekGrid");if(!el)return;const log=loadWorkoutLog();let out="";for(let i=83;i>=0;i--){const k=dateKey(new Date(Date.now()-i*86400000)),n=log[k]?.sessions||0,level=n>=3?4:n===2?3:n===1?2:0;out+=`<div class="weekCell l${level}" title="${k}${n?` · ${n} séance(s)`:""}"></div>`}el.innerHTML=out}
function renderLog(){const el=document.getElementById("sessionLog"),log=loadWorkoutLog(),names={renfo:"Renfo",jambes:"Souplesse jambes",bras:"Souplesse bras"},rows=Object.keys(log).sort().reverse().slice(0,8);el.innerHTML=rows.length?rows.map(k=>`<div class="logRow"><span class="logDate">${new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short"}).format(new Date(k+"T12:00:00"))}</span><span class="logProg">${log[k].sessions||1} séance(s) · ${(log[k].programs||[]).map(x=>names[x]||x).join(" + ")}</span></div>`).join(""):"<div class=\"logRow\"><span class=\"logDate\">Pas encore de séance terminée.</span></div>"}
function renderMilestones(stats){document.getElementById("milestones").innerHTML=[3,7,14,30,50,100].map(n=>`<div class="milestone ${stats.best>=n?"done":""}"><div class="milestoneNum">${n}</div><div class="milestoneText">jours de série</div></div>`).join("")}
function getAllExercises(){return programs.flatMap(p=>p.sections.flatMap(s=>s[1].map(e=>({name:e[0],duration:e[1],kind:e[2],instructions:e[3],seconds:Number(e[4]),section:s[0],program:p.id}))))}
function renderGallery(){
  const g=document.getElementById("gallery");if(!g)return;const all=getAllExercises();
  g.innerHTML=`<div class="galleryTitle">Galerie des exercices</div><div class="gallery">${all.map((e,i)=>{const local=programs.find(p=>p.id===e.program).sections.flatMap(s=>s[1]).findIndex(x=>x[0]===e.name);return `<button type="button" class="galleryCard" onclick="openGalleryExercise('${e.program}',${local})"><div class="galleryImg">${imageMarkup(local,e.program,"galleryPhoto")}</div><div class="galleryText"><div class="galleryName">${e.name}</div><div class="galleryMeta">${e.duration}</div></div></button>`}).join("")}</div>`;
}
function openGalleryExercise(programId,localIndex){active=programId;openExercise(localIndex)}
function showProgress(){
  const stats=streakStats(),cards=document.getElementById("progressCards");cards.innerHTML="";
  programs.forEach(p=>{const n=p.sections.flatMap(s=>s[1]).length,done=(()=>{try{return JSON.parse(localStorage.getItem("pole2_"+p.id)||"[]").length}catch{return 0}})(),pct=Math.round(done/n*100)||0,b=document.createElement("button");b.type="button";b.className="menuCard";b.innerHTML=`<div class="menuIcon">${pct}%</div><div><div class="menuTitle">${p.name.split(" (")[0]}</div><div class="menuMeta">${done} / ${n} exercices · ${pct}%</div><div class="bar" style="margin-top:8px"><div class="fill" style="width:${pct}%"></div></div></div><div class="chev">›</div>`;b.onclick=()=>openProgram(p.id);cards.appendChild(b)});
  document.getElementById("streakBox").innerHTML=`<div class="streakHero"><div class="streakNumber">${stats.current} 🔥</div><div class="streakLabel">jours de série actuelle</div><div class="streakSub">${stats.current?"Continue demain pour prolonger ta série.":"Termine une séance aujourd’hui pour démarrer ta série."}</div></div><div class="statGrid"><div class="statCard"><div class="statValue">${stats.best}</div><div class="statLabel">meilleure série</div></div><div class="statCard"><div class="statValue">${stats.totalDays}</div><div class="statLabel">jours actifs</div></div><div class="statCard"><div class="statValue">${stats.totalSessions}</div><div class="statLabel">séances terminées</div></div><div class="statCard"><div class="statValue">${stats.last7}/7</div><div class="statLabel">jours actifs · 7 j</div></div><div class="statCard"><div class="statValue">${stats.last30}/30</div><div class="statLabel">jours actifs · 30 j</div></div><div class="statCard"><div class="statValue">${Math.round(stats.last30/30*100)}%</div><div class="statLabel">régularité · 30 j</div></div></div><div class="trackPanel"><div class="trackPanelHead"><div class="trackPanelTitle">Calendrier</div><div class="monthBtns"><button type="button" class="monthBtn" onclick="changeTrackingMonth(-1)">‹</button><button type="button" class="monthBtn" onclick="changeTrackingMonth(1)">›</button></div></div><div id="monthTitle" class="calendarTitle"></div><div id="monthCalendar" class="calendar"></div></div><div class="trackPanel"><div class="trackPanelHead"><div class="trackPanelTitle">Activité · 12 semaines</div></div><div id="weekGrid" class="weekGrid"></div><div class="calendarLegend">1 carré = 1 jour · l’intensité augmente avec plusieurs séances le même jour.</div></div><div class="trackPanel"><div class="trackPanelHead"><div class="trackPanelTitle">Jalons</div></div><div id="milestones" class="milestones"></div></div><div class="trackPanel"><div class="trackPanelHead"><div class="trackPanelTitle">Dernières séances</div></div><div id="sessionLog" class="sessionLog"></div></div>`;
  renderMonthCalendar(trackingMonth);renderWeekHeatmap();renderMilestones(stats);renderLog();renderGallery();show("progressView");
}
function showSettings(){show("settingsView")}
function resetAll(){if(confirm("Réinitialiser toute la progression ?")){programs.forEach(p=>localStorage.removeItem("pole2_"+p.id));localStorage.removeItem("pole_workout_days");localStorage.removeItem("pole_workout_log");showProgress()}}

window.addEventListener("load",boot);
