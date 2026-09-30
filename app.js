const CONFIG = window.WELTENCLICKER_CONFIG || {};
const $ = (id) => document.getElementById(id);

const I18N = {
  de: {
    streamMode:"Streamer-Modus", exitStream:"Streamer-Modus beenden", connecting:"Verbindung wird hergestellt …",
    resets:"Resets", noReset:"Noch kein Universums-Reset", globalLabel:"WELTEN VON ALLEN SPIELERN",
    globalSub:"Jeder Klick auf der Welt zählt zu derselben globalen Zahl.", createWorld:"WELT ERSCHAFFEN",
    yourWorlds:"Deine Welten", worldsPerClick:"Welten / Klick", thisSession:"Diese Sitzung",
    profileEyebrow:"PROFIL", usernameTitle:"Benutzername", save:"Speichern",
    usernameHint:"Erlaubt: Buchstaben, Zahlen und _ . Dein Name bleibt in diesem Browser gespeichert.",
    chooseMascot:"DEIN BEGLEITER", petHint:"Klick mich zum Streicheln",
    upgrades:"UPGRADES", production:"Deine Produktion", energy:"Energie", resetEyebrow:"UNIVERSUMS-RESET",
    resetTitle:"Donation → zurück auf 0", resetDesc:"Eine bestätigte Donation setzt den globalen Zähler, Energie und Upgrades aller ungeschützten Spieler zurück. Ein aktives Schild schützt deinen Fortschritt.",
    donationPending:"Donation-Zahlung wird eingerichtet", donationReady:"TEST-SPENDE & UNIVERSUM RESETTEN",
    donationSecure:"Der Reset wird nur serverseitig nach bestätigter Zahlung ausgelöst.",
    shieldEyebrow:"RESET-SCHUTZ", shieldTitle:"15-Minuten Schild", shieldInactive:"Kein aktives Schild", shieldActive:"Schild aktiv",
    shieldDesc:"Für 2 € schützt das Schild 15 Minuten lang deine Energie und Upgrades vor einem Universums-Reset.",
    shieldButton:"TEST-SCHILD FÜR 2 € KAUFEN", shieldUsernameHint:"Du brauchst zuerst einen Benutzernamen. Beim Stripe-Test bitte exakt denselben Namen eingeben.",
    shieldReadyHint:"Beim Stripe-Test exakt deinen Benutzernamen eingeben. Weitere Käufe verlängern die Restzeit um 15 Minuten.",
    shieldCopied:"Benutzername kopiert – im Stripe-Feld einfügen.",
    streamerTitle:"Overlay für Streams", streamerDesc:"Transparente Browser-Source mit Live-Zähler und Reset-Anzeige.",
    openOverlay:"Overlay öffnen", copyUrl:"URL kopieren", copied:"Kopiert!",
    leaderboardEyebrow:"GLOBAL", leaderboardTitle:"Top 10 Weltenbauer", leaderboardLoading:"Rangliste wird geladen …",
    worlds:"Welten", clicks:"Klicks",
    mission:"MISSION", missionTitle:"Eine Zahl. Eine Weltgemeinschaft.", missionText:"Jeder Besucher kann mitmachen. Alle erhöhen gemeinsam denselben Weltzähler.",
    liveTitle:"Synchron für alle", liveText:"Supabase speichert den Zähler und verteilt Änderungen live an alle offenen Browser.",
    fairPlay:"FAIR PLAY", fairTitle:"Serverseitig geprüft", fairText:"Klickstärke, Energie, Upgrades und Resets werden nicht vom Browser bestimmt.",
    preparing:"Serververbindung wird vorbereitet", online:"Global live verbunden", reconnect:"Verbindung unterbrochen • erneuter Versuch läuft",
    notEnough:"Nicht genug Energie für dieses Upgrade", invalidName:"3–20 Zeichen: nur A–Z, 0–9 und _", nameTaken:"Dieser Benutzername ist bereits vergeben.",
    nameSaved:"Benutzername gespeichert", guest:"Gast", lastReset:"Letzter Reset", by:"von", rate:"Sehr viele Klicks • kurze Serverpause",
    mascotSaved:"Begleiter gewechselt", resetKicker:"UNIVERSUM ZERSTÖRT", resetTitleEvent:"NEUE ÄRA", resetSub:"Energie und Upgrades ungeschützter Spieler wurden ausgelöscht.",
    shieldKicker:"SCHUTZSCHILD AKTIVIERT", shieldEvent:"RESET-SCHUTZ", shieldSub:"15 Minuten Schutz wurden aktiviert.",
    petOrbix:["mrrp…","Warm…","Noch eine Welt.","Ich bleibe bei dir."],
    petAshen:["*wedelt*","Wir halten stand.","Noch ein Versuch.","Gut… nochmal."],
    petNova:["✦","Die Sterne hören zu.","So viel Licht…","Weiter."],
    petMoss:["…hm.","Die Ruinen erinnern sich.","Ganz ruhig.","Neues Leben."],
    hype:["Schneller!","Mehr Welten!","Wir wachsen!","Weiter!"],
    resetMascot:["Eine neue Ära beginnt…","Nicht das Ende.","Wir fangen wieder an."],
    shieldMascot:["Geschützt.","Diese Ära nimmt uns nichts.","Ich halte stand."]
  },
  en: {
    streamMode:"Streamer mode", exitStream:"Exit streamer mode", connecting:"Connecting …",
    resets:"Resets", noReset:"No universe reset yet", globalLabel:"WORLDS CREATED BY ALL PLAYERS",
    globalSub:"Every click anywhere in the world contributes to the same global counter.", createWorld:"CREATE WORLD",
    yourWorlds:"Your worlds", worldsPerClick:"Worlds / click", thisSession:"This session",
    profileEyebrow:"PROFILE", usernameTitle:"Username", save:"Save",
    usernameHint:"Allowed: letters, numbers and _ . Your identity is stored in this browser.",
    chooseMascot:"YOUR COMPANION", petHint:"Click to pet me",
    upgrades:"UPGRADES", production:"Your production", energy:"Energy", resetEyebrow:"UNIVERSE RESET",
    resetTitle:"Donation → reset to 0", resetDesc:"A confirmed donation resets the global counter, energy and upgrades for every unprotected player. An active shield protects your progress.",
    donationPending:"Donation payments are being connected", donationReady:"TEST DONATION & RESET UNIVERSE",
    donationSecure:"The reset only happens server-side after a confirmed payment.",
    shieldEyebrow:"RESET PROTECTION", shieldTitle:"15-minute shield", shieldInactive:"No active shield", shieldActive:"Shield active",
    shieldDesc:"For €2 the shield protects your energy and upgrades from a universe reset for 15 minutes.",
    shieldButton:"BUY TEST SHIELD FOR €2", shieldUsernameHint:"Create a username first. In Stripe test checkout, enter exactly the same username.",
    shieldReadyHint:"Enter your exact username in Stripe. Extra purchases extend remaining protection by 15 minutes.",
    shieldCopied:"Username copied – paste it into the Stripe field.",
    streamerTitle:"Stream overlay", streamerDesc:"Transparent browser source with live counter and reset information.",
    openOverlay:"Open overlay", copyUrl:"Copy URL", copied:"Copied!",
    leaderboardEyebrow:"GLOBAL", leaderboardTitle:"Top 10 World Builders", leaderboardLoading:"Loading leaderboard …",
    worlds:"worlds", clicks:"clicks",
    mission:"MISSION", missionTitle:"One number. One global community.", missionText:"Everyone can participate. All visitors grow the same shared counter.",
    liveTitle:"Live for everyone", liveText:"Supabase stores the counter and broadcasts changes to every open browser.",
    fairPlay:"FAIR PLAY", fairTitle:"Server verified", fairText:"Click power, energy, upgrades and resets are not controlled by the browser.",
    preparing:"Preparing server connection", online:"Global live connection", reconnect:"Connection interrupted • retrying",
    notEnough:"Not enough energy for this upgrade", invalidName:"3–20 characters: A–Z, 0–9 and _ only", nameTaken:"That username is already taken.",
    nameSaved:"Username saved", guest:"Guest", lastReset:"Last reset", by:"by", rate:"Very fast clicking • brief server pause",
    mascotSaved:"Companion changed", resetKicker:"UNIVERSE DESTROYED", resetTitleEvent:"NEW ERA", resetSub:"Energy and upgrades of unprotected players were erased.",
    shieldKicker:"SHIELD ACTIVATED", shieldEvent:"RESET PROTECTION", shieldSub:"15 minutes of protection activated.",
    petOrbix:["mrrp…","Warm…","One more world.","I’ll stay with you."],
    petAshen:["*tail wag*","We hold the line.","One more try.","Good… again."],
    petNova:["✦","The stars are listening.","So much light…","Onward."],
    petMoss:["…hm.","The ruins remember.","Easy now.","New life."],
    hype:["Faster!","More worlds!","We grow!","Keep going!"],
    resetMascot:["A new era begins…","Not the end.","We begin again."],
    shieldMascot:["Protected.","This era takes nothing from us.","I’ll hold the line."]
  }
};

let lang=localStorage.getItem("wc_lang")||((navigator.language||"").toLowerCase().startsWith("en")?"en":"de");
let streamerMode=new URLSearchParams(location.search).get("stream")==="1";
let recentClicks=[];
let leaderboardTimer=null;

const upgrades=[
  {id:"hands",icon:"🖱️",baseCost:25,growth:1.7,de:["Schnellere Hände","+1 Welt pro Klick"],en:["Faster Hands","+1 world per click"]},
  {id:"portal",icon:"🌀",baseCost:160,growth:1.85,de:["Mikro-Portal","+5 Welten pro Klick"],en:["Micro Portal","+5 worlds per click"]},
  {id:"reactor",icon:"⚛️",baseCost:900,growth:1.95,de:["Weltenreaktor","+25 Welten pro Klick"],en:["World Reactor","+25 worlds per click"]},
  {id:"multiverse",icon:"🌌",baseCost:7000,growth:2.05,de:["Multiversum","+150 Welten pro Klick"],en:["Multiverse","+150 worlds per click"]}
];

const mascotMeta={
  orbix:{name:"Orbix",glyph:"◉",accessory:"✦",dialog:"petOrbix"},
  ashen_pup:{name:"Ashen Pup",glyph:"🐾",accessory:"⚔",dialog:"petAshen"},
  nova:{name:"Nova",glyph:"✦",accessory:"✧",dialog:"petNova"},
  mossling:{name:"Mossling",glyph:"🍃",accessory:"❧",dialog:"petMoss"}
};

function makeSessionId(){
  if(crypto&&crypto.randomUUID)return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)});
}

const state={
  sessionId:localStorage.getItem("wc_session_id")||makeSessionId(),
  globalCount:0,personalWorlds:0,energy:0,sessionWorlds:0,
  upgrades:{hands:0,portal:0,reactor:0,multiverse:0},
  clickPower:1,username:null,mascotId:"orbix",
  resetCount:0,lastResetAt:null,lastResetBy:null,
  shieldExpiresAt:null,lastShieldAt:null,lastShieldBy:null,
  leaderboard:[],
  pendingClicks:0,sendingClicks:0,online:false,ready:false,flushTimer:null,retryTimer:null
};
localStorage.setItem("wc_session_id",state.sessionId);

function t(key){return(I18N[lang]&&I18N[lang][key])||key}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function formatNumber(value){
  const n=Number(value||0);if(!Number.isFinite(n))return"0";
  if(n<1000000)return new Intl.NumberFormat(lang==="de"?"de-DE":"en-US").format(Math.floor(n));
  const units=lang==="de"
    ?[[1e30,"Nonillion"],[1e27,"Oktillion"],[1e24,"Septillion"],[1e21,"Sextillion"],[1e18,"Trillion"],[1e15,"Billiarde"],[1e12,"Billion"],[1e9,"Milliarde"],[1e6,"Million"]]
    :[[1e30,"nonillion"],[1e27,"octillion"],[1e24,"septillion"],[1e21,"sextillion"],[1e18,"quintillion"],[1e15,"quadrillion"],[1e12,"trillion"],[1e9,"billion"],[1e6,"million"]];
  for(const unit of units){if(n>=unit[0]){const v=n/unit[0];return(v>=100?v.toFixed(0):v.toFixed(2))+" "+unit[1]}}
  return String(Math.floor(n))
}
function getLevel(id){return Number((state.upgrades&&state.upgrades[id])||0)}
function getCost(item){return Math.floor(item.baseCost*Math.pow(item.growth,getLevel(item.id)))}
function setStatus(mode,text){const dot=$("statusDot");dot.classList.remove("online","offline");if(mode==="online")dot.classList.add("online");if(mode==="offline")dot.classList.add("offline");$("statusText").textContent=text}

function applyLanguage(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(function(el){const key=el.getAttribute("data-i18n");if(I18N[lang][key])el.textContent=I18N[lang][key]});
  $("langToggle").textContent=lang==="de"?"EN":"DE";
  $("streamToggle").textContent=streamerMode?t("exitStream"):t("streamMode");
  $("usernameInput").placeholder=lang==="de"?"3–20 Zeichen":"3–20 characters";
  const overlayUrl=new URL("/overlay.html",location.origin);overlayUrl.searchParams.set("lang",lang);$("overlayLink").href=overlayUrl.toString();
  render()
}
function renderReset(){
  $("resetCount").textContent=formatNumber(state.resetCount);
  if(!state.lastResetAt){$("lastResetText").textContent=t("noReset");return}
  const d=new Date(state.lastResetAt),when=d.toLocaleString(lang==="de"?"de-DE":"en-US",{dateStyle:"short",timeStyle:"short"});
  $("lastResetText").textContent=t("lastReset")+": "+when+(state.lastResetBy?" • "+t("by")+" "+state.lastResetBy:"")
}
function formatShieldTime(ms){if(ms<=0)return"00:00";const total=Math.ceil(ms/1000),minutes=Math.floor(total/60),seconds=total%60;return String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0")}
function shieldActive(){return Boolean(state.shieldExpiresAt&&new Date(state.shieldExpiresAt).getTime()>Date.now())}
function renderShield(){
  const expires=state.shieldExpiresAt?new Date(state.shieldExpiresAt).getTime():0,remaining=expires-Date.now(),active=remaining>0;
  $("shieldStatus").textContent=active?t("shieldActive")+" • "+formatShieldTime(remaining):t("shieldInactive");
  $("shieldStatus").classList.toggle("active",active);$("shieldBadge").classList.toggle("active",active);
  $("shieldButton").disabled=!(CONFIG.shieldUrl&&state.username);$("shieldButton").textContent=t("shieldButton");
  $("shieldHint").textContent=state.username?t("shieldReadyHint"):t("shieldUsernameHint");
  $("mascotAvatar").classList.toggle("shield-active",active)
}
function renderMascot(){
  const meta=mascotMeta[state.mascotId]||mascotMeta.orbix;
  $("mascotAvatar").className="mascot-avatar mascot-"+state.mascotId+(shieldActive()?" shield-active":"");
  $("mascotAccessory").textContent=meta.accessory;$("mascotName").textContent=meta.name;
  document.querySelectorAll("[data-mascot]").forEach(function(btn){btn.classList.toggle("selected",btn.dataset.mascot===state.mascotId)})
}
function mascotGlyph(id){return(mascotMeta[id]||mascotMeta.orbix).glyph}
function renderLeaderboard(){
  const el=$("leaderboard");
  if(!state.leaderboard.length){el.innerHTML='<div class="leaderboard-loading">'+t("leaderboardLoading")+'</div>';return}
  el.innerHTML=state.leaderboard.map(function(row,i){
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+row.rank;
    return '<div class="leader-row '+(row.username===state.username?"is-you":"")+'">'+
      '<span class="leader-rank">'+medal+'</span>'+
      '<span class="leader-mascot">'+mascotGlyph(row.mascot_id)+'</span>'+
      '<span class="leader-name">'+escapeHtml(row.username)+(row.shield_active?' <span class="leader-shield">🛡️</span>':'')+'</span>'+
      '<span class="leader-worlds"><strong>'+formatNumber(row.personal_worlds)+'</strong><small>'+t("worlds")+'</small></span>'+
      '</div>'
  }).join("")
}
function escapeHtml(v){return String(v||"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]})}
function render(){
  $("globalCount").textContent=formatNumber(state.globalCount);$("personalClicks").textContent=formatNumber(state.personalWorlds);
  $("energy").textContent=formatNumber(state.energy);$("sessionClicks").textContent=formatNumber(state.sessionWorlds);
  $("powerDisplay").textContent=formatNumber(state.clickPower);$("clickPower").textContent=formatNumber(state.clickPower);
  $("profileBadge").textContent=state.username||t("guest");
  if(state.username&&document.activeElement!==$("usernameInput"))$("usernameInput").value=state.username;
  renderReset();renderShield();renderMascot();renderLeaderboard();
  const busy=!state.ready||state.sendingClicks>0||state.pendingClicks>0;
  $("shop").innerHTML=upgrades.map(function(item){
    const level=getLevel(item.id),cost=getCost(item),txt=item[lang];
    return '<button class="upgrade" data-upgrade="'+item.id+'" '+((state.energy<cost||busy)?"disabled":"")+'>'+
      '<span class="upgrade-icon">'+item.icon+'</span><span><span class="upgrade-title">'+txt[0]+'</span>'+
      '<span class="upgrade-desc">'+txt[1]+'</span><span class="upgrade-level">Level '+level+'</span></span>'+
      '<span class="upgrade-price">'+formatNumber(cost)+' ⚡</span></button>'
  }).join("");
  document.querySelectorAll("[data-upgrade]").forEach(function(button){button.addEventListener("click",function(){buyUpgrade(button.dataset.upgrade)})});
  $("donationButton").disabled=!CONFIG.donationUrl;$("donationButton").textContent=CONFIG.donationUrl?t("donationReady"):t("donationPending")
}

function animateClick(amount){
  const el=document.createElement("span");el.className="floating-plus";el.textContent="+"+formatNumber(amount);
  el.style.left=(44+Math.random()*12)+"%";el.style.top=(48+Math.random()*10)+"%";$("clickBurst").appendChild(el);setTimeout(function(){el.remove()},850)
}
function showMascotBubble(text,duration){
  const bubble=$("mascotBubble");bubble.textContent=text;bubble.classList.add("show");clearTimeout(showMascotBubble.timer);
  showMascotBubble.timer=setTimeout(function(){bubble.classList.remove("show")},duration||1800)
}
function mascotParticles(){
  for(let i=0;i<5;i++){const p=document.createElement("span");p.textContent=i%2?"✦":"♥";p.style.left=(30+Math.random()*45)+"%";p.style.animationDelay=(Math.random()*.18)+"s";$("mascotParticles").appendChild(p);setTimeout(function(){p.remove()},1000)}
}
function mascotReact(cls,dialogKey,duration){
  const a=$("mascotAvatar");a.classList.remove("petting","hype","shocked","shield-pop","click-pop");void a.offsetWidth;a.classList.add(cls);
  if(dialogKey){const d=t(dialogKey);showMascotBubble(Array.isArray(d)?pick(d):d,duration||1800)}
  setTimeout(function(){a.classList.remove(cls)},duration||900)
}
function petMascot(){mascotParticles();mascotReact("petting",(mascotMeta[state.mascotId]||mascotMeta.orbix).dialog,1500)}
function showGameEvent(kind){
  const box=$("gameEventOverlay");
  if(kind==="reset"){$("gameEventKicker").textContent=t("resetKicker");$("gameEventTitle").textContent=t("resetTitleEvent");$("gameEventSubtitle").textContent=t("resetSub");box.className="game-event-overlay reset-event show"}
  else{$("gameEventKicker").textContent=t("shieldKicker");$("gameEventTitle").textContent=t("shieldEvent");$("gameEventSubtitle").textContent=t("shieldSub");box.className="game-event-overlay shield-event show"}
  setTimeout(function(){box.classList.remove("show")},2200)
}
function applyServerState(data){
  if(!data)return;
  state.globalCount=Number(data.global_count||0);state.personalWorlds=Number(data.personal_worlds||0);state.energy=Number(data.energy||0);
  state.upgrades=data.upgrades||state.upgrades;state.clickPower=Number(data.click_power||1);state.username=data.username||null;
  state.mascotId=data.mascot_id||state.mascotId||"orbix";state.resetCount=Number(data.reset_count||0);state.lastResetAt=data.last_reset_at||null;
  state.lastResetBy=data.last_reset_by||null;state.shieldExpiresAt=data.shield_expires_at||null;
  state.lastShieldAt=data.last_shield_at||state.lastShieldAt;state.lastShieldBy=data.last_shield_by||state.lastShieldBy;state.ready=true
}
async function gameApi(action,extra){
  const response=await fetch(CONFIG.supabaseUrl+"/functions/v1/world-game",{method:"POST",headers:{"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey},body:JSON.stringify(Object.assign({action:action,sessionId:state.sessionId},extra||{}))});
  let body={};try{body=await response.json()}catch(e){}
  if(!response.ok){const err=new Error(body.error||("HTTP_"+response.status));err.status=response.status;throw err}return body
}
function scheduleFlush(delay){clearTimeout(state.flushTimer);state.flushTimer=setTimeout(flushClicks,delay||90)}
function scheduleRetry(){clearTimeout(state.retryTimer);state.retryTimer=setTimeout(async function(){if(state.pendingClicks>0&&state.sendingClicks===0)await flushClicks();else if(!state.online)await loadState()},2500)}
async function flushClicks(){
  if(!state.ready||state.sendingClicks>0||state.pendingClicks<=0)return;
  const batch=Math.min(25,state.pendingClicks);state.pendingClicks-=batch;state.sendingClicks=batch;render();
  try{const data=await gameApi("click",{clicks:batch});applyServerState(data);state.online=true;setStatus("online",t("online"));$("footerState").textContent=t("online")}
  catch(err){console.error(err);state.pendingClicks+=batch;state.online=false;setStatus("offline",err.status===429?t("rate"):t("reconnect"));scheduleRetry()}
  finally{state.sendingClicks=0;render()}
  if(state.pendingClicks>0&&state.online)scheduleFlush(120)
}
function createWorld(){
  if(!state.ready)return;
  const amount=state.clickPower;state.personalWorlds+=amount;state.energy+=amount;state.sessionWorlds+=amount;state.globalCount+=amount;state.pendingClicks+=1;
  animateClick(amount);mascotReact("click-pop",null,300);
  const now=Date.now();recentClicks.push(now);recentClicks=recentClicks.filter(function(x){return now-x<2000});
  if(recentClicks.length===8)mascotReact("hype","hype",1000);
  render();scheduleFlush()
}
async function buyUpgrade(id){
  if(!state.ready||state.pendingClicks>0||state.sendingClicks>0)return;
  try{const data=await gameApi("buy",{upgrade:id});applyServerState(data);state.online=true;render()}
  catch(err){console.error(err);setStatus(err.status===409?"online":"offline",err.status===409?t("notEnough"):t("reconnect"));if(err.status!==409)scheduleRetry()}
}
async function saveUsername(){
  const name=$("usernameInput").value.trim();if(!/^[A-Za-z0-9_]{3,20}$/.test(name)){$("usernameHelp").textContent=t("invalidName");return}
  $("saveUsername").disabled=true;
  try{const data=await gameApi("set_username",{username:name});applyServerState(data);$("usernameHelp").textContent=t("nameSaved");render();loadLeaderboard()}
  catch(err){$("usernameHelp").textContent=err.status===409?t("nameTaken"):t("reconnect")}
  finally{$("saveUsername").disabled=false}
}
async function setMascot(id){
  if(!mascotMeta[id]||!state.ready)return;
  try{const data=await gameApi("set_mascot",{mascot:id});applyServerState(data);render();showMascotBubble(t("mascotSaved"),1100);loadLeaderboard()}
  catch(err){console.error(err)}
}
async function loadLeaderboard(){
  try{const data=await gameApi("leaderboard");state.leaderboard=Array.isArray(data.leaderboard)?data.leaderboard:[];renderLeaderboard()}catch(err){console.error(err)}
}
async function loadState(){
  try{const data=await gameApi("state");applyServerState(data);state.online=true;setStatus("online",t("online"));$("footerState").textContent=t("online");render()}
  catch(err){console.error(err);state.online=false;setStatus("offline",t("reconnect"));$("footerState").textContent=t("reconnect");render();scheduleRetry()}
}

let supabaseClient=null,realtimeChannel=null;
function initRealtime(){
  supabaseClient=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  realtimeChannel=supabaseClient.channel("weltenclicker-live").on("postgres_changes",{event:"UPDATE",schema:"public",table:"world_counter",filter:"id=eq.1"},function(payload){
    const row=payload.new||{},serverGlobal=Number(row.count||0),optimistic=state.pendingClicks*state.clickPower;
    const prevReset=state.resetCount,prevShield=state.lastShieldAt;
    if(Number.isFinite(serverGlobal))state.globalCount=serverGlobal+optimistic;
    state.resetCount=Number(row.reset_count||state.resetCount||0);state.lastResetAt=row.last_reset_at||state.lastResetAt;state.lastResetBy=row.last_reset_by||state.lastResetBy;
    state.lastShieldAt=row.last_shield_at||state.lastShieldAt;state.lastShieldBy=row.last_shield_by||state.lastShieldBy;
    render();
    if(state.resetCount>prevReset){showGameEvent("reset");mascotReact("shocked","resetMascot",1900);setTimeout(loadState,180);setTimeout(loadLeaderboard,500)}
    if(row.last_shield_at&&row.last_shield_at!==prevShield){showGameEvent("shield");if(row.last_shield_by===state.username){mascotReact("shield-pop","shieldMascot",1600);setTimeout(loadState,180)}}
  }).subscribe()
}

$("worldButton").addEventListener("click",createWorld);$("mainClickButton").addEventListener("click",createWorld);
$("saveUsername").addEventListener("click",saveUsername);$("usernameInput").addEventListener("keydown",function(e){if(e.key==="Enter")saveUsername()});
$("langToggle").addEventListener("click",function(){lang=lang==="de"?"en":"de";localStorage.setItem("wc_lang",lang);applyLanguage()});
$("streamToggle").addEventListener("click",function(){streamerMode=!streamerMode;document.body.classList.toggle("streamer-mode",streamerMode);applyLanguage()});
$("copyOverlay").addEventListener("click",async function(){const url=$("overlayLink").href;try{await navigator.clipboard.writeText(url);$("copyOverlay").textContent=t("copied");setTimeout(function(){$("copyOverlay").textContent=t("copyUrl")},1200)}catch(e){window.prompt("OBS URL",url)}});
$("donationButton").addEventListener("click",function(){if(CONFIG.donationUrl)location.href=CONFIG.donationUrl});
$("shieldButton").addEventListener("click",async function(){if(!state.username||!CONFIG.shieldUrl)return;try{await navigator.clipboard.writeText(state.username);$("shieldHint").textContent=t("shieldCopied")}catch(e){}setTimeout(function(){location.href=CONFIG.shieldUrl},180)});
$("mascotPet").addEventListener("click",petMascot);
document.querySelectorAll("[data-mascot]").forEach(function(btn){btn.addEventListener("click",function(){setMascot(btn.dataset.mascot)})});
document.addEventListener("keydown",function(e){if(e.code==="Space"&&e.target===document.body){e.preventDefault();createWorld()}});
window.addEventListener("beforeunload",function(){try{if(realtimeChannel&&supabaseClient)supabaseClient.removeChannel(realtimeChannel)}catch(e){}});

document.body.classList.toggle("streamer-mode",streamerMode);
applyLanguage();render();initRealtime();
Promise.all([loadState(),loadLeaderboard()]);
setInterval(function(){if(state.shieldExpiresAt)renderShield()},1000);
leaderboardTimer=setInterval(loadLeaderboard,15000);
