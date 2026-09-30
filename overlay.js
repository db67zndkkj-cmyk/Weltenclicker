const CONFIG=window.WELTENCLICKER_CONFIG||{};
const params=new URLSearchParams(location.search);
const lang=params.get("lang")==="en"?"en":"de";
document.documentElement.lang=lang;
const countEl=document.getElementById("overlayCount"),resetsEl=document.getElementById("overlayResets"),lastEl=document.getElementById("overlayLastReset");
const eventBox=document.getElementById("overlayEvent");
let lastResetCount=0,lastShieldAt=null,initialized=false;
document.getElementById("overlayLabel").textContent=lang==="en"?"GLOBAL WORLDS":"GLOBALE WELTEN";
function fmt(v){const n=Number(v||0);return Number.isFinite(n)?new Intl.NumberFormat(lang==="en"?"en-US":"de-DE").format(Math.floor(n)):"0"}
function showEvent(kind,name){
  eventBox.className="overlay-event "+(kind==="shield"?"shield ":"")+"show";
  document.getElementById("overlayEventKicker").textContent=kind==="reset"?(lang==="en"?"UNIVERSE DESTROYED":"UNIVERSUM ZERSTÖRT"):(lang==="en"?"SHIELD ACTIVATED":"SCHUTZSCHILD AKTIVIERT");
  document.getElementById("overlayEventTitle").textContent=kind==="reset"?(lang==="en"?"NEW ERA":"NEUE ÄRA"):(lang==="en"?"RESET PROTECTION":"RESET-SCHUTZ");
  document.getElementById("overlayEventSub").textContent=kind==="reset"?(name?((lang==="en"?"Reset by ":"Reset von ")+name):""):(name?((lang==="en"?"Protected: ":"Geschützt: ")+name):"");
  clearTimeout(showEvent.timer);showEvent.timer=setTimeout(function(){eventBox.classList.remove("show")},2600)
}
function draw(row,events){
  countEl.textContent=fmt(row.count);resetsEl.textContent=fmt(row.reset_count)+" RESETS";
  if(row.last_reset_at){const d=new Date(row.last_reset_at).toLocaleTimeString(lang==="en"?"en-US":"de-DE",{hour:"2-digit",minute:"2-digit"});lastEl.textContent="• "+(lang==="en"?"LAST RESET ":"LETZTER RESET ")+d+(row.last_reset_by?" • "+row.last_reset_by:"")}else lastEl.textContent="";
  const rc=Number(row.reset_count||0);
  if(events&&initialized&&rc>lastResetCount)showEvent("reset",row.last_reset_by||"");
  if(events&&initialized&&row.last_shield_at&&row.last_shield_at!==lastShieldAt)showEvent("shield",row.last_shield_by||"");
  lastResetCount=rc;lastShieldAt=row.last_shield_at||lastShieldAt;initialized=true
}
const client=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
async function load(){const res=await client.from("world_counter").select("count,reset_count,last_reset_at,last_reset_by,last_shield_at,last_shield_by").eq("id",1).single();if(!res.error)draw(res.data,false)}
client.channel("wc-overlay").on("postgres_changes",{event:"UPDATE",schema:"public",table:"world_counter",filter:"id=eq.1"},function(payload){draw(payload.new||{},true)}).subscribe(function(status){document.getElementById("overlayStatus").textContent=status==="SUBSCRIBED"?"LIVE":"…"});
load();