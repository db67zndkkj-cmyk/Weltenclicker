const CONFIG=window.WELTENCLICKER_CONFIG||{};
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const raidId=params.get("raid");
const fmt=n=>new Intl.NumberFormat("de-DE").format(Math.floor(Number(n)||0));
function escName(v){return String(v||"").slice(0,40)}
async function load(){
  try{
    const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/social-api",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey},
      body:JSON.stringify({action:"public_raid_state",raidId})
    });
    const d=await r.json();
    if(!r.ok||!d.raid){$("state").textContent="KEIN AKTIVER RAID";$("state").classList.add("offline");return}
    const x=d.raid,a=x.challenger||{},b=x.opponent||{};
    $("state").classList.remove("offline");
    $("state").textContent=(x.status==="live"?"● LIVE RAID":x.status.toUpperCase())+" · COMMUNITY VS COMMUNITY";
    $("nameA").textContent=escName(a.name||"TEAM A");$("nameB").textContent=escName(b.name||"TEAM B");
    $("codeA").textContent=a.code?"#"+a.code:"";$("codeB").textContent=b.code?"#"+b.code:"";
    $("emblemA").textContent=(a.name||"A").charAt(0).toUpperCase();$("emblemB").textContent=(b.name||"B").charAt(0).toUpperCase();
    const sa=Number(x.challenger_score||0),sb=Number(x.opponent_score||0),total=sa+sb;
    $("scoreA").textContent=fmt(sa);$("scoreB").textContent=fmt(sb);$("meter").style.width=(total?sa/total*100:50)+"%";
    const end=x.ends_at?new Date(x.ends_at).getTime():new Date(x.starts_at).getTime()+Number(x.duration_seconds||600)*1000;
    const left=Math.max(0,end-Date.now()),sec=Math.ceil(left/1000),m=Math.floor(sec/60),s=sec%60;
    $("time").textContent=x.status==="completed"?"ENDE":String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
    if(sa===sb)$("lead").textContent="GLEICHSTAND";
    else $("lead").innerHTML=(sa>sb?escName(a.name):escName(b.name))+" FÜHRT MIT <b>"+fmt(Math.abs(sa-sb))+"</b>";
  }catch(e){$("state").textContent="VERBINDUNG UNTERBROCHEN";$("state").classList.add("offline")}
}
setInterval(load,2000);load();