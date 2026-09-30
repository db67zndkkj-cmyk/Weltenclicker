const CONFIG=window.WELTENCLICKER_CONFIG||{};
const params=new URLSearchParams(location.search);
const lang=params.get("lang")==="en"?"en":"de";
document.documentElement.lang=lang;
const countEl=document.getElementById("overlayCount");
const resetsEl=document.getElementById("overlayResets");
const lastEl=document.getElementById("overlayLastReset");
document.getElementById("overlayLabel").textContent=lang==="en"?"GLOBAL WORLDS":"GLOBALE WELTEN";
function fmt(v){const n=Number(v||0);return Number.isFinite(n)?new Intl.NumberFormat(lang==="en"?"en-US":"de-DE").format(Math.floor(n)):"0"}
function draw(row){
  countEl.textContent=fmt(row.count);
  resetsEl.textContent=fmt(row.reset_count)+" "+(lang==="en"?"RESETS":"RESETS");
  if(row.last_reset_at){const d=new Date(row.last_reset_at).toLocaleTimeString(lang==="en"?"en-US":"de-DE",{hour:"2-digit",minute:"2-digit"});lastEl.textContent="• "+(lang==="en"?"LAST RESET ":"LETZTER RESET ")+d+(row.last_reset_by?" • "+row.last_reset_by:"")}else lastEl.textContent=""
}
const client=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
async function load(){const res=await client.from("world_counter").select("count,reset_count,last_reset_at,last_reset_by").eq("id",1).single();if(!res.error)draw(res.data)}
client.channel("wc-overlay").on("postgres_changes",{event:"UPDATE",schema:"public",table:"world_counter",filter:"id=eq.1"},function(payload){draw(payload.new||{})}).subscribe(function(status){document.getElementById("overlayStatus").textContent=status==="SUBSCRIBED"?"LIVE":"…"});
load();