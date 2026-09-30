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
    upgrades:"UPGRADES", production:"Deine Produktion", energy:"Energie", resetEyebrow:"UNIVERSUMS-RESET",
    resetTitle:"Donation → zurück auf 0", resetDesc:"Eine bestätigte Donation kann den globalen Zähler auf 0 setzen. Persönliche Upgrades bleiben erhalten – dadurch kann der Clicker endlos weiterlaufen.",
    donationPending:"Donation-Zahlung wird eingerichtet", donationReady:"TEST-SPENDE & UNIVERSUM RESETTEN",
    donationSecure:"Der Reset wird nur serverseitig nach bestätigter Zahlung ausgelöst.",
    streamerTitle:"Overlay für Streams", streamerDesc:"Transparente Browser-Source mit Live-Zähler und Reset-Anzeige.",
    openOverlay:"Overlay öffnen", copyUrl:"URL kopieren", copied:"Kopiert!",
    mission:"MISSION", missionTitle:"Eine Zahl. Eine Weltgemeinschaft.", missionText:"Jeder Besucher kann mitmachen. Alle erhöhen gemeinsam denselben Weltzähler.",
    liveTitle:"Synchron für alle", liveText:"Supabase speichert den Zähler und verteilt Änderungen live an alle offenen Browser.",
    fairPlay:"FAIR PLAY", fairTitle:"Serverseitig geprüft", fairText:"Klickstärke, Energie, Upgrades und Resets werden nicht vom Browser bestimmt.",
    preparing:"Serververbindung wird vorbereitet", online:"Global live verbunden", reconnect:"Verbindung unterbrochen • erneuter Versuch läuft",
    notEnough:"Nicht genug Energie für dieses Upgrade", invalidName:"3–20 Zeichen: nur A–Z, 0–9 und _", nameTaken:"Dieser Benutzername ist bereits vergeben.",
    nameSaved:"Benutzername gespeichert", guest:"Gast", lastReset:"Letzter Reset", by:"von", rate:"Sehr viele Klicks • kurze Serverpause"
  },
  en: {
    streamMode:"Streamer mode", exitStream:"Exit streamer mode", connecting:"Connecting …",
    resets:"Resets", noReset:"No universe reset yet", globalLabel:"WORLDS CREATED BY ALL PLAYERS",
    globalSub:"Every click anywhere in the world contributes to the same global counter.", createWorld:"CREATE WORLD",
    yourWorlds:"Your worlds", worldsPerClick:"Worlds / click", thisSession:"This session",
    profileEyebrow:"PROFILE", usernameTitle:"Username", save:"Save",
    usernameHint:"Allowed: letters, numbers and _ . Your identity is stored in this browser.",
    upgrades:"UPGRADES", production:"Your production", energy:"Energy", resetEyebrow:"UNIVERSE RESET",
    resetTitle:"Donation → reset to 0", resetDesc:"A confirmed donation can reset the global counter to 0. Personal upgrades stay intact, so the clicker can continue forever.",
    donationPending:"Donation payments are being connected", donationReady:"TEST DONATION & RESET UNIVERSE",
    donationSecure:"The reset only happens server-side after a confirmed payment.",
    streamerTitle:"Stream overlay", streamerDesc:"Transparent browser source with live counter and reset information.",
    openOverlay:"Open overlay", copyUrl:"Copy URL", copied:"Copied!",
    mission:"MISSION", missionTitle:"One number. One global community.", missionText:"Everyone can participate. All visitors grow the same shared counter.",
    liveTitle:"Live for everyone", liveText:"Supabase stores the counter and broadcasts changes to every open browser.",
    fairPlay:"FAIR PLAY", fairTitle:"Server verified", fairText:"Click power, energy, upgrades and resets are not controlled by the browser.",
    preparing:"Preparing server connection", online:"Global live connection", reconnect:"Connection interrupted • retrying",
    notEnough:"Not enough energy for this upgrade", invalidName:"3–20 characters: A–Z, 0–9 and _ only", nameTaken:"That username is already taken.",
    nameSaved:"Username saved", guest:"Guest", lastReset:"Last reset", by:"by", rate:"Very fast clicking • brief server pause"
  }
};

let lang = localStorage.getItem("wc_lang") || (navigator.language && navigator.language.toLowerCase().startsWith("en") ? "en" : "de");
let streamerMode = new URLSearchParams(location.search).get("stream") === "1";

const upgrades = [
  { id:"hands", icon:"🖱️", baseCost:25, growth:1.7, de:["Schnellere Hände","+1 Welt pro Klick"], en:["Faster Hands","+1 world per click"] },
  { id:"portal", icon:"🌀", baseCost:160, growth:1.85, de:["Mikro-Portal","+5 Welten pro Klick"], en:["Micro Portal","+5 worlds per click"] },
  { id:"reactor", icon:"⚛️", baseCost:900, growth:1.95, de:["Weltenreaktor","+25 Welten pro Klick"], en:["World Reactor","+25 worlds per click"] },
  { id:"multiverse", icon:"🌌", baseCost:7000, growth:2.05, de:["Multiversum","+150 Welten pro Klick"], en:["Multiverse","+150 worlds per click"] }
];

function makeSessionId(){
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){
    const r=Math.random()*16|0, v=c==="x"?r:(r&3|8); return v.toString(16);
  });
}

const state = {
  sessionId: localStorage.getItem("wc_session_id") || makeSessionId(),
  globalCount:0, personalWorlds:0, energy:0, sessionWorlds:0,
  upgrades:{hands:0,portal:0,reactor:0,multiverse:0},
  clickPower:1, username:null, resetCount:0, lastResetAt:null, lastResetBy:null,
  pendingClicks:0, sendingClicks:0, online:false, ready:false, flushTimer:null, retryTimer:null
};
localStorage.setItem("wc_session_id",state.sessionId);

function t(key){ return (I18N[lang] && I18N[lang][key]) || key; }
function applyLanguage(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(function(el){
    const key=el.getAttribute("data-i18n"); if(I18N[lang][key]) el.textContent=I18N[lang][key];
  });
  $("langToggle").textContent=lang==="de"?"EN":"DE";
  $("streamToggle").textContent=streamerMode?t("exitStream"):t("streamMode");
  $("usernameInput").placeholder=lang==="de"?"3–20 Zeichen":"3–20 characters";
  const overlayUrl=new URL("/overlay.html",location.origin); overlayUrl.searchParams.set("lang",lang);
  $("overlayLink").href=overlayUrl.toString();
  render();
}

function formatNumber(value){
  const n=Number(value||0); if(!Number.isFinite(n)) return "0";
  if(n<1000000) return new Intl.NumberFormat(lang==="de"?"de-DE":"en-US").format(Math.floor(n));
  const units=lang==="de"
    ? [[1e30,"Nonillion"],[1e27,"Oktillion"],[1e24,"Septillion"],[1e21,"Sextillion"],[1e18,"Trillion"],[1e15,"Billiarde"],[1e12,"Billion"],[1e9,"Milliarde"],[1e6,"Million"]]
    : [[1e30,"nonillion"],[1e27,"octillion"],[1e24,"septillion"],[1e21,"sextillion"],[1e18,"quintillion"],[1e15,"quadrillion"],[1e12,"trillion"],[1e9,"billion"],[1e6,"million"]];
  for(const unit of units){ if(n>=unit[0]){ const v=n/unit[0]; return (v>=100?v.toFixed(0):v.toFixed(2))+" "+unit[1]; } }
  return String(Math.floor(n));
}
function getLevel(id){return Number((state.upgrades&&state.upgrades[id])||0)}
function getCost(item){return Math.floor(item.baseCost*Math.pow(item.growth,getLevel(item.id)))}
function setStatus(mode,text){const dot=$("statusDot");dot.classList.remove("online","offline");if(mode==="online")dot.classList.add("online");if(mode==="offline")dot.classList.add("offline");$("statusText").textContent=text}
function renderReset(){
  $("resetCount").textContent=formatNumber(state.resetCount);
  if(!state.lastResetAt){$("lastResetText").textContent=t("noReset");return}
  const d=new Date(state.lastResetAt);
  const when=d.toLocaleString(lang==="de"?"de-DE":"en-US",{dateStyle:"short",timeStyle:"short"});
  $("lastResetText").textContent=t("lastReset")+": "+when+(state.lastResetBy?" • "+t("by")+" "+state.lastResetBy:"");
}
function render(){
  $("globalCount").textContent=formatNumber(state.globalCount);
  $("personalClicks").textContent=formatNumber(state.personalWorlds);
  $("energy").textContent=formatNumber(state.energy);
  $("sessionClicks").textContent=formatNumber(state.sessionWorlds);
  $("powerDisplay").textContent=formatNumber(state.clickPower);
  $("clickPower").textContent=formatNumber(state.clickPower);
  $("profileBadge").textContent=state.username||t("guest");
  if(state.username && document.activeElement!==$("usernameInput")) $("usernameInput").value=state.username;
  renderReset();
  const busy=!state.ready||state.sendingClicks>0||state.pendingClicks>0;
  $("shop").innerHTML=upgrades.map(function(item){
    const level=getLevel(item.id), cost=getCost(item), text=item[lang];
    return '<button class="upgrade" data-upgrade="'+item.id+'" '+((state.energy<cost||busy)?"disabled":"")+'>'+
      '<span class="upgrade-icon">'+item.icon+'</span><span><span class="upgrade-title">'+text[0]+'</span>'+
      '<span class="upgrade-desc">'+text[1]+'</span><span class="upgrade-level">Level '+level+'</span></span>'+
      '<span class="upgrade-price">'+formatNumber(cost)+' ⚡</span></button>';
  }).join("");
  document.querySelectorAll("[data-upgrade]").forEach(function(button){button.addEventListener("click",function(){buyUpgrade(button.dataset.upgrade)})});
  const donationReady=Boolean(CONFIG.donationUrl);
  $("donationButton").disabled=!donationReady;
  $("donationButton").textContent=donationReady?t("donationReady"):t("donationPending");
}
function animateClick(amount){
  const el=document.createElement("span");el.className="floating-plus";el.textContent="+"+formatNumber(amount);
  el.style.left=(44+Math.random()*12)+"%";el.style.top=(48+Math.random()*10)+"%";$("clickBurst").appendChild(el);setTimeout(function(){el.remove()},850)
}
function applyServerState(data){
  if(!data)return;state.globalCount=Number(data.global_count||0);state.personalWorlds=Number(data.personal_worlds||0);
  state.energy=Number(data.energy||0);state.upgrades=data.upgrades||state.upgrades;state.clickPower=Number(data.click_power||1);
  state.username=data.username||null;state.resetCount=Number(data.reset_count||0);state.lastResetAt=data.last_reset_at||null;state.lastResetBy=data.last_reset_by||null;state.ready=true
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
  if(!state.ready)return;const amount=state.clickPower;state.personalWorlds+=amount;state.energy+=amount;state.sessionWorlds+=amount;state.globalCount+=amount;state.pendingClicks+=1;animateClick(amount);render();scheduleFlush()
}
async function buyUpgrade(id){
  if(!state.ready||state.pendingClicks>0||state.sendingClicks>0)return;
  try{const data=await gameApi("buy",{upgrade:id});applyServerState(data);state.online=true;render()}
  catch(err){console.error(err);setStatus(err.status===409?"online":"offline",err.status===409?t("notEnough"):t("reconnect"));if(err.status!==409)scheduleRetry()}
}
async function saveUsername(){
  const name=$("usernameInput").value.trim();
  if(!/^[A-Za-z0-9_]{3,20}$/.test(name)){$("usernameHelp").textContent=t("invalidName");return}
  $("saveUsername").disabled=true;
  try{const data=await gameApi("set_username",{username:name});applyServerState(data);$("usernameHelp").textContent=t("nameSaved");render()}
  catch(err){$("usernameHelp").textContent=err.status===409?t("nameTaken"):t("reconnect")}
  finally{$("saveUsername").disabled=false}
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
    if(Number.isFinite(serverGlobal))state.globalCount=Math.max(serverGlobal,serverGlobal+optimistic);
    state.resetCount=Number(row.reset_count||state.resetCount||0);state.lastResetAt=row.last_reset_at||state.lastResetAt;state.lastResetBy=row.last_reset_by||state.lastResetBy;render()
  }).subscribe()
}

$("worldButton").addEventListener("click",createWorld);
$("mainClickButton").addEventListener("click",createWorld);
$("saveUsername").addEventListener("click",saveUsername);
$("usernameInput").addEventListener("keydown",function(e){if(e.key==="Enter")saveUsername()});
$("langToggle").addEventListener("click",function(){lang=lang==="de"?"en":"de";localStorage.setItem("wc_lang",lang);applyLanguage()});
$("streamToggle").addEventListener("click",function(){streamerMode=!streamerMode;document.body.classList.toggle("streamer-mode",streamerMode);applyLanguage()});
$("copyOverlay").addEventListener("click",async function(){
  const url=$("overlayLink").href;try{await navigator.clipboard.writeText(url);$("copyOverlay").textContent=t("copied");setTimeout(function(){$("copyOverlay").textContent=t("copyUrl")},1200)}catch(e){window.prompt("OBS URL",url)}
});
$("donationButton").addEventListener("click",function(){if(CONFIG.donationUrl)location.href=CONFIG.donationUrl});
document.addEventListener("keydown",function(e){if(e.code==="Space"&&e.target===document.body){e.preventDefault();createWorld()}});
window.addEventListener("beforeunload",function(){try{if(realtimeChannel&&supabaseClient)supabaseClient.removeChannel(realtimeChannel)}catch(e){}});

document.body.classList.toggle("streamer-mode",streamerMode);
applyLanguage();
render();
initRealtime();
loadState();