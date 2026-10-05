const CONFIG=window.WELTENCLICKER_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const SESSION_KEY="wc_session_id",TOKEN_KEY="wc_social_token";
const state={me:null,view:"for_you",items:[],series:[],library:null,currentSeries:null,currentIndex:0,observer:null,activeVideo:null,watch:new Map(),supabase:null};

function sid(){let id=sessionStorage.getItem(SESSION_KEY)||localStorage.getItem(SESSION_KEY);if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}return id}
function token(){return localStorage.getItem(TOKEN_KEY)||""}
function setToken(v){if(v)localStorage.setItem(TOKEN_KEY,v)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmt(v){return new Intl.NumberFormat("de-DE",{maximumFractionDigits:0}).format(Math.floor(Number(v)||0))}
function initials(p){return (p?.display_name||p?.handle||"?").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function avatar(p,cls="avatar"){return p?.avatar_url?'<img class="'+cls+'" src="'+esc(p.avatar_url)+'" alt="">':'<span class="'+cls+'">'+esc(initials(p))+'</span>'}
function ago(v){const t=new Date(v).getTime();if(!t)return"";const s=Math.max(0,Math.floor((Date.now()-t)/1000));if(s<60)return"gerade eben";if(s<3600)return Math.floor(s/60)+" Min.";if(s<86400)return Math.floor(s/3600)+" Std.";return Math.floor(s/86400)+" Tg."}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1700)}
function loading(m="Lädt …"){return '<div class="loading"><div class="spinner"></div>'+esc(m)+'</div>'}
function empty(t,m){return '<div class="empty"><strong>'+esc(t)+'</strong>'+esc(m)+'</div>'}
function head(k,t,a=""){return '<header class="page-head"><div><span class="eyebrow">'+esc(k)+'</span><h1>'+esc(t)+'</h1></div>'+a+'</header>'}
function openModal(h){$("#modalBody").innerHTML=h;$("#modal").hidden=false;document.body.style.overflow="hidden"}
function closeModal(){$("#modal").hidden=true;document.body.style.overflow=""}

async function socialBootstrap(){
  const headers={"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey};if(token())headers["x-social-token"]=token();
  const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/social-api",{method:"POST",headers,body:JSON.stringify({action:"bootstrap",sessionId:sid()})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"SOCIAL_BOOTSTRAP_FAILED");if(d.socialToken)setToken(d.socialToken);state.me=d.profile;renderAccount();return d
}
async function api(action,payload={},retry=true){
  const headers={"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey};if(token())headers["x-social-token"]=token();
  const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/animations-api",{method:"POST",headers,body:JSON.stringify({action,sessionId:sid(),...payload})});
  let d={};try{d=await r.json()}catch{}
  if(r.status===401&&retry){localStorage.removeItem(TOKEN_KEY);await socialBootstrap();return api(action,payload,false)}
  if(!r.ok){const e=new Error(d.error||"REQUEST_FAILED");e.status=r.status;e.data=d;throw e}return d
}
async function askOrbix(query){
  const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/animation-assistant",{method:"POST",headers:{"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey,"x-social-token":token()},body:JSON.stringify({sessionId:sid(),query})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"ASSISTANT_FAILED");return d
}
function renderAccount(){if(!state.me)return;$("#name").textContent=state.me.display_name;$("#handle").textContent="@"+state.me.handle;const a=$("#avatar");if(state.me.avatar_url){const img=document.createElement("img");img.id="avatar";img.className="avatar";img.src=state.me.avatar_url;a.replaceWith(img)}else a.textContent=initials(state.me)}
function activeNav(v){$$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===v))}
async function navigate(v,opts={}){
  state.view=v;activeNav(v);$("#page").innerHTML=loading();
  if(!opts.noHash&&location.hash!=="#"+v)history.pushState({view:v},"","#"+v);
  try{
    if(["for_you","following","continue","trending"].includes(v))await renderFeed(v);
    else if(v==="series")await renderSeries();
    else if(v==="studio")await renderStudio();
    else if(v==="assistant")renderAssistantPage();
  }catch(e){console.error(e);$("#page").innerHTML=empty("Fehler beim Laden",e.message||"Bitte erneut versuchen.")}
  window.scrollTo({top:0,behavior:"smooth"});
}
window.addEventListener("popstate",()=>navigate(location.hash.slice(1)||"for_you",{noHash:true}));

async function renderFeed(mode){
  const labels={for_you:["DEIN FEED","Für dich"],following:["CREATOR","Folge ich"],continue:["FORTSETZEN","Weiter ansehen"],trending:["ENTDECKEN","Trending"]};
  $("#page").innerHTML=head(...labels[mode])+'<div id="reels" class="reels">'+loading("Animationen werden geladen …")+'</div>';
  const d=await api("feed",{mode,limit:24});state.items=d.items||[];
  $("#reels").innerHTML=state.items.length?state.items.map(reelHtml).join(""):empty(mode==="continue"?"Noch nichts angefangen":"Noch keine Animationen",mode==="continue"?"Sobald du eine Animation beginnst, erscheint sie hier.":"Veröffentliche im Creator Studio die erste FanArt-Animation.");
  bindReels();
}
function reelHtml(x){
  const why=(x.why||[])[0]||"Neue Entdeckung";
  return '<article class="reel" data-reel="'+x.id+'"><div class="reel-shell">'+
    '<video data-video="'+x.id+'" src="'+esc(x.video_url||"")+'" poster="'+esc(x.thumbnail_url||"")+'" playsinline preload="metadata"></video>'+
    '<div class="reel-overlay"></div><button class="why" data-why="'+x.id+'">Warum sehe ich das?</button><button class="mute" data-mute="'+x.id+'">🔇</button>'+
    '<div class="reel-meta"><div class="creator-line">'+esc(x.creator?.display_name||x.creator?.handle)+(x.creator?.is_verified?' <span>✓</span>':'')+' · @'+esc(x.creator?.handle||"")+'</div>'+
    '<h2>'+esc(x.title)+'</h2>'+(x.series_id?'<button class="series-line" data-series-slug="'+esc(x.series_slug||"")+'">▤ '+esc(x.series_title||"Serie")+(x.episode_number?' · Episode '+x.episode_number:'')+'</button>':'')+
    '<p>'+esc(x.description||"")+'</p><div class="tags">'+[...(x.tags||[]),...(x.style_tags||[])].slice(0,6).map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div></div>'+
    '<div class="reel-actions"><button class="reel-action '+(x.viewer_liked?"active":"")+'" data-like="'+x.id+'">♥<small>'+fmt(x.like_count)+'</small></button>'+
    '<button class="reel-action" data-comments="'+x.id+'">◯<small>'+fmt(x.comment_count)+'</small></button>'+
    '<button class="reel-action '+(x.viewer_saved?"saved":"")+'" data-save="'+x.id+'">▱<small>Save</small></button>'+
    (x.series_id?'<button class="reel-action '+(x.viewer_follows_series?"saved":"")+'" data-follow-series="'+x.series_id+'">＋<small>Serie</small></button>':'')+
    '<button class="reel-action" data-more="'+x.id+'">•••<small>Mehr</small></button></div><div class="progress-line"><i></i></div></div></article>'
}
function item(id){return state.items.find(x=>x.id===id)}
function refreshReel(id){
  const x=item(id),old=$('[data-reel="'+id+'"]');if(!x||!old)return;
  const wrap=document.createElement("div");wrap.innerHTML=reelHtml(x);const fresh=wrap.firstElementChild;old.replaceWith(fresh);bindSingleReel(fresh)
}
function bindReels(){
  if(state.observer)state.observer.disconnect();
  state.observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&e.intersectionRatio>.65)activateReel(e.target)},{threshold:[.2,.65,.9]});
  $$(".reel").forEach(r=>{bindSingleReel(r);state.observer.observe(r)});
}
function bindSingleReel(r){
  const v=$("video",r);if(v){v.onclick=()=>v.paused?v.play():v.pause();v.ontimeupdate=()=>onVideoTime(v);v.onended=()=>onVideoEnded(v)}
  $$("[data-like]",r).forEach(b=>b.onclick=()=>toggleAnim(b.dataset.like,"like"));
  $$("[data-save]",r).forEach(b=>b.onclick=()=>toggleAnim(b.dataset.save,"save"));
  $$("[data-comments]",r).forEach(b=>b.onclick=()=>commentsModal(b.dataset.comments));
  $$("[data-why]",r).forEach(b=>b.onclick=()=>whyModal(b.dataset.why));
  $$("[data-more]",r).forEach(b=>b.onclick=()=>moreModal(b.dataset.more));
  $$("[data-follow-series]",r).forEach(b=>b.onclick=()=>toggleSeries(b.dataset.followSeries));
  $$("[data-series-slug]",r).forEach(b=>b.onclick=()=>seriesDetail(b.dataset.seriesSlug));
  $$("[data-mute]",r).forEach(b=>b.onclick=()=>{const x=$('video[data-video="'+b.dataset.mute+'"]');x.muted=!x.muted;b.textContent=x.muted?"🔇":"🔊"});
}
function activateReel(r){
  const v=$("video",r);if(!v)return;
  $$("video[data-video]").forEach(x=>{if(x!==v&&!x.paused)x.pause()});
  state.activeVideo=v;v.muted=true;v.play().catch(()=>{});
  const id=v.dataset.video,track=state.watch.get(id)||{last:v.currentTime||0,impression:false,lastSent:Date.now()};
  if(!track.impression){track.impression=true;api("watch",{animationId:id,position:v.currentTime||0,watchedDelta:0,impression:true}).catch(()=>{})}
  state.watch.set(id,track);
}
function onVideoTime(v){
  const id=v.dataset.video,x=item(id),track=state.watch.get(id)||{last:v.currentTime||0,impression:false,lastSent:Date.now()};
  const p=v.parentElement?.querySelector(".progress-line i");if(p&&v.duration)p.style.width=Math.min(100,v.currentTime/v.duration*100)+"%";
  const now=Date.now(),delta=Math.max(0,v.currentTime-track.last);
  if(now-track.lastSent>8000&&delta>0){api("watch",{animationId:id,position:v.currentTime,watchedDelta:Math.min(delta,30)}).catch(()=>{});track.last=v.currentTime;track.lastSent=now;state.watch.set(id,track)}
}
function onVideoEnded(v){const id=v.dataset.video,track=state.watch.get(id)||{last:0};api("watch",{animationId:id,position:v.duration||0,watchedDelta:Math.max(0,(v.duration||0)-track.last),completed:true}).catch(()=>{});const x=item(id);if(x?.animation_type==="short"){v.currentTime=0;v.play().catch(()=>{})}}
async function toggleAnim(id,kind){
  const x=item(id);if(!x)return;const flag=kind==="like"?"viewer_liked":"viewer_saved",count=kind==="like"?"like_count":null,prev=Boolean(x[flag]),old=Number(x[count]||0);
  x[flag]=!prev;if(count)x[count]=Math.max(0,old+(prev?-1:1));refreshReel(id);
  try{const d=await api(kind==="like"?"toggle_like":"toggle_save",{animationId:id});x[flag]=Boolean(d.active);if(count&&d.count!=null)x[count]=Number(d.count);refreshReel(id)}catch{ x[flag]=prev;if(count)x[count]=old;refreshReel(id);toast("Aktion fehlgeschlagen")}
}
async function toggleSeries(seriesId){
  const affected=state.items.filter(x=>x.series_id===seriesId),prev=affected[0]?.viewer_follows_series||false;affected.forEach(x=>x.viewer_follows_series=!prev);affected.forEach(x=>refreshReel(x.id));
  try{const d=await api("toggle_series_follow",{seriesId});affected.forEach(x=>x.viewer_follows_series=Boolean(d.active));affected.forEach(x=>refreshReel(x.id));toast(d.active?"Serie abonniert":"Serien-Follow entfernt")}catch{affected.forEach(x=>x.viewer_follows_series=prev);affected.forEach(x=>refreshReel(x.id))}
}
function whyModal(id){const x=item(id);openModal('<span class="eyebrow">DEINE EMPFEHLUNG</span><h2>Warum „'+esc(x?.title)+'“?</h2><div class="form">'+((x?.why||[]).length?(x.why||[]).map(w=>'<div class="upload-state">✓ '+esc(w)+'</div>').join(""):'<div class="upload-state">Diese Animation wurde als neue Entdeckung eingemischt.</div>')+'<p style="font-size:8px;color:var(--muted)">Der Feed kombiniert Watchtime, Abschlüsse, Saves, Likes, gefolgte Creator/Serien, Aktualität und bewusst neue Creator. Du kannst Inhalte jederzeit als „nicht interessiert“ markieren.</p></div>')}
function moreModal(id){openModal('<span class="eyebrow">ANIMATION</span><h2>Optionen</h2><div class="form"><button id="notInterested" class="secondary">Weniger davon / nicht interessiert</button><button id="reportAnimation" class="secondary danger">Animation melden</button></div>');$("#notInterested").onclick=async()=>{closeModal();state.items=state.items.filter(x=>x.id!==id);$('[data-reel="'+id+'"]')?.remove();await api("not_interested",{animationId:id}).catch(()=>{});toast("Empfehlungen werden angepasst")};$("#reportAnimation").onclick=()=>reportModal(id)}
function reportModal(id){openModal('<span class="eyebrow">MELDEN</span><h2>Animation melden</h2><div class="form"><label>Grund<select id="reportReason"><option value="copyright">Urheberrecht</option><option value="not_fanart_animation">Keine FanArt-Animation</option><option value="sexual">Sexuelle Inhalte</option><option value="hate">Hassrede</option><option value="harassment">Belästigung</option><option value="graphic">Grafische Gewalt</option><option value="spam">Spam</option><option value="other">Sonstiges</option></select></label><label>Details<textarea id="reportDetail"></textarea></label><button id="sendReport" class="primary">MELDEN</button></div>');$("#sendReport").onclick=async()=>{await api("report",{animationId:id,reason:$("#reportReason").value,detail:$("#reportDetail").value});closeModal();toast("Meldung eingereicht")}}
async function commentsModal(id){
  openModal('<span class="eyebrow">KOMMENTARE</span><h2>Community</h2><div id="comments">'+loading()+'</div><div class="form"><textarea id="commentBody" maxlength="500" placeholder="Kommentar schreiben …"></textarea><button id="sendComment" class="primary">SENDEN</button></div>');
  const load=async()=>{const d=await api("comments",{animationId:id});$("#comments").innerHTML=(d.comments||[]).length?'<div class="comment-list">'+d.comments.map(c=>'<div class="comment">'+avatar(c.author)+'<div><p><strong>'+esc(c.author?.display_name||c.author?.handle)+'</strong><br>'+esc(c.body)+'</p><small>'+ago(c.created_at)+'</small></div></div>').join("")+'</div>':empty("Noch keine Kommentare","Sei die erste Person.")};
  await load();$("#sendComment").onclick=async()=>{const body=$("#commentBody").value.trim();if(!body)return;$("#commentBody").value="";await api("comment",{animationId:id,body});const x=item(id);if(x)x.comment_count=Number(x.comment_count||0)+1;refreshReel(id);await load()}
}

async function renderSeries(){
  $("#page").innerHTML=head("ANIMATIONSREIHEN","Serien",'<button id="seriesSearchButton" class="secondary">Suchen</button>')+'<div id="seriesGrid" class="series-grid">'+loading()+'</div>';
  const d=await api("series_list");state.series=d.series||[];paintSeries();
  $("#seriesSearchButton").onclick=seriesSearch;
}
function paintSeries(){const g=$("#seriesGrid");if(!g)return;g.innerHTML=state.series.length?state.series.map(s=>'<article class="series-card panel"><div class="series-cover" '+(s.cover_url?'style="background-image:url(\''+esc(s.cover_url)+'\')"':'')+'></div><div class="series-body"><span class="eyebrow">'+esc(s.universe||"FANART SERIES")+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(s.description||"")+'</p><div class="stats"><span><b>'+fmt(s.episode_count)+'</b> Episoden</span><span><b>'+fmt(s.follower_count)+'</b> Follower</span></div><div class="actions"><button class="secondary" data-open-series="'+esc(s.slug)+'">Öffnen</button><button class="secondary '+(s.viewer_follows?"saved":"")+'" data-series-follow="'+s.id+'">'+(s.viewer_follows?"Folge ich":"+ Folgen")+'</button></div></div></article>').join(""):empty("Noch keine Serien","Creator können im Studio eine Animationsreihe veröffentlichen.");$$("[data-open-series]").forEach(b=>b.onclick=()=>seriesDetail(b.dataset.openSeries));$$("[data-series-follow]").forEach(b=>b.onclick=async()=>{const d=await api("toggle_series_follow",{seriesId:b.dataset.seriesFollow});const s=state.series.find(x=>x.id===b.dataset.seriesFollow);if(s){s.viewer_follows=d.active;s.follower_count=d.followers}paintSeries()})}
function seriesSearch(){openModal('<span class="eyebrow">SUCHE</span><h2>Animationsreihen finden</h2><div class="form"><input id="seriesQuery" placeholder="Titel, Universum oder Thema"><button id="runSeriesSearch" class="primary">SUCHEN</button></div>');$("#runSeriesSearch").onclick=async()=>{const d=await api("series_list",{query:$("#seriesQuery").value.trim()});state.series=d.series||[];closeModal();paintSeries()}}
async function seriesDetail(slug){
  $("#page").innerHTML=loading("Serie wird geladen …");state.view="series";activeNav("series");
  const d=await api("series_detail",{slug});state.currentSeries=d;
  const s=d.series;
  $("#page").innerHTML=head("ANIMATIONSREIHE",s.title,'<button id="backSeries" class="secondary">← Serien</button>')+
  '<article class="series-hero panel"><div class="series-banner" '+(s.banner_url?'style="background-image:url(\''+esc(s.banner_url)+'\')"':s.cover_url?'style="background-image:url(\''+esc(s.cover_url)+'\')"':'')+'></div><div class="series-info"><span class="eyebrow">'+esc(s.universe||"FANART")+'</span><div class="series-title"><div><h1>'+esc(s.title)+'</h1><small>von '+esc(s.owner?.display_name||s.owner?.handle)+'</small></div><button id="detailFollow" class="primary">'+(s.viewer_follows?"FOLGE ICH":"+ SERIE FOLGEN")+'</button></div><p>'+esc(s.description||"")+'</p><div class="tags">'+(s.tags||[]).map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div></div></article>'+
  renderSeasonBlocks(d.seasons||[],d.episodes||[]);
  $("#backSeries").onclick=()=>navigate("series",{noHash:true});$("#detailFollow").onclick=async()=>{const x=await api("toggle_series_follow",{seriesId:s.id});s.viewer_follows=x.active;$("#detailFollow").textContent=x.active?"FOLGE ICH":"+ SERIE FOLGEN"};
  $$("[data-play-episode]").forEach(b=>b.onclick=()=>playEpisodeModal(b.dataset.playEpisode));
}
function renderSeasonBlocks(seasons,episodes){
  const seasonList=seasons.length?seasons:[{id:null,season_number:1,title:"Episoden"}];
  return seasonList.map(se=>{const eps=episodes.filter(e=>(se.id?e.season_id===se.id:true)&&e.animation_type!=="trailer");return '<section class="season panel"><div class="series-title"><h3>Staffel '+se.season_number+(se.title?" · "+esc(se.title):"")+'</h3></div><div class="episode-list">'+(eps.length?eps.map(e=>{const pct=e.progress?Math.min(100,Number(e.progress.last_position_seconds||0)/Number(e.duration_seconds||1)*100):0;return '<article class="episode">'+(e.thumbnail_url?'<img class="episode-thumb" src="'+esc(e.thumbnail_url)+'" alt="">':'<div class="episode-thumb"></div>')+'<div><strong>'+(e.episode_number?'E'+e.episode_number+' · ':'')+esc(e.title)+'</strong><small>'+Math.ceil(Number(e.duration_seconds||0)/60)+' Min.</small><div class="episode-progress"><i style="width:'+pct+'%"></i></div></div><button class="secondary" data-play-episode="'+e.id+'">'+(pct>0?"Weiter":"Ansehen")+'</button></article>'}).join(""):empty("Keine Episoden","In dieser Staffel wurde noch nichts veröffentlicht."))+'</div></section>'}).join("")
}
function playEpisodeModal(id){
  const e=(state.currentSeries?.episodes||[]).find(x=>x.id===id);if(!e)return;
  openModal('<span class="eyebrow">'+esc(state.currentSeries.series.title)+'</span><h2>'+esc(e.title)+'</h2><video id="episodePlayer" src="'+esc(e.video_url)+'" poster="'+esc(e.thumbnail_url||"")+'" controls playsinline style="width:100%;max-height:70vh;background:#000;border-radius:12px"></video>');
  const v=$("#episodePlayer");v.currentTime=Math.min(Number(e.progress?.last_position_seconds||0),Number(e.duration_seconds||0)-1);let last=v.currentTime,lastSent=Date.now();v.ontimeupdate=()=>{if(Date.now()-lastSent>8000){api("watch",{animationId:id,position:v.currentTime,watchedDelta:Math.max(0,v.currentTime-last)}).catch(()=>{});last=v.currentTime;lastSent=Date.now()}};v.onended=()=>api("watch",{animationId:id,position:v.duration,watchedDelta:Math.max(0,v.duration-last),completed:true}).catch(()=>{})
}

async function renderStudio(){
  $("#page").innerHTML=head("CREATOR STUDIO","FanArt Studio",'<div class="tabs"><button id="newSeries" class="primary">+ SERIE</button><button id="newAnimation" class="primary">+ ANIMATION</button></div>')+'<div id="studioBody">'+loading("Bibliothek wird geladen …")+'</div>';
  const d=await api("creator_library");state.library=d;paintStudio();
  $("#newSeries").onclick=createSeriesModal;$("#newAnimation").onclick=uploadAnimationModal;
}
function paintStudio(){
  const d=state.library||{series:[],seasons:[],animations:[]};
  $("#studioBody").innerHTML='<div class="studio-top"><button id="studioSeries" class="secondary">Serien '+d.series.length+'</button><button id="studioAnimations" class="secondary">Animationen '+d.animations.length+'</button></div><div class="library-grid">'+
  [...d.series.map(s=>'<article class="library-card panel"><span class="status '+(s.status==="published"?"published":"")+'">'+esc(s.status)+'</span><h3>▤ '+esc(s.title)+'</h3><p>#'+esc(s.slug)+' · '+esc(s.universe||"")+'</p><div class="actions"><button class="secondary" data-add-season="'+s.id+'">+ Staffel</button>'+(s.status!=="published"?'<button class="secondary" data-publish-series="'+s.id+'">Veröffentlichen</button>':'')+'</div></article>'),
  ...d.animations.map(a=>'<article class="library-card panel"><span class="status '+(a.visibility==="public"?"published":"")+'">'+esc(a.visibility)+'</span><h3>▶ '+esc(a.title)+'</h3><p>'+esc(a.animation_type)+' · '+Math.ceil(Number(a.duration_seconds||0))+' Sek.</p>'+(a.visibility!=="public"&&a.fanart_rights_confirmed?'<button class="secondary" data-publish-animation="'+a.id+'">Veröffentlichen</button>':'')+'</article>')].join("")+
  (d.series.length||d.animations.length?"":empty("Dein Studio ist leer","Erstelle eine Serie oder veröffentliche eine einzelne FanArt-Animation."))+'</div>';
  $$("[data-add-season]").forEach(b=>b.onclick=()=>createSeasonModal(b.dataset.addSeason));
  $$("[data-publish-series]").forEach(b=>b.onclick=async()=>{const s=d.series.find(x=>x.id===b.dataset.publishSeries);if(!s.fanart_rights_confirmed){toast("Rechtebestätigung fehlt");return}await api("update_series",{seriesId:s.id,status:"published",rightsConfirmed:true});await renderStudio()});
  $$("[data-publish-animation]").forEach(b=>b.onclick=async()=>{await api("publish_animation",{animationId:b.dataset.publishAnimation});await renderStudio()});
}
async function uploadFile(file,kind,statusEl){
  const ticket=await api("create_upload",{kind,mimeType:file.type});
  if(!ticket.token||!ticket.path)throw new Error("UPLOAD_TICKET_INVALID");
  statusEl.textContent="Upload läuft: "+file.name;
  const {error}=await state.supabase.storage.from("fanart-animations").uploadToSignedUrl(ticket.path,ticket.token,file,{contentType:file.type,cacheControl:"3600"});
  if(error)throw error;statusEl.textContent="Upload abgeschlossen: "+file.name;return ticket.path
}
function videoMeta(file){return new Promise((resolve,reject)=>{const v=document.createElement("video"),u=URL.createObjectURL(file);v.preload="metadata";v.onloadedmetadata=()=>{const ratio=v.videoWidth/v.videoHeight;let aspect="9:16";if(ratio>1.4)aspect="16:9";else if(ratio>.9&&ratio<1.1)aspect="1:1";else if(ratio>.7)aspect="4:5";resolve({duration:v.duration,aspect});URL.revokeObjectURL(u)};v.onerror=()=>{URL.revokeObjectURL(u);reject(new Error("VIDEO_METADATA_FAILED"))};v.src=u})}
function createSeriesModal(){
  openModal('<span class="eyebrow">CREATOR STUDIO</span><h2>Animationsreihe erstellen</h2><div class="form"><label>Titel<input id="sTitle" maxlength="100"></label><label>URL-Slug<input id="sSlug" maxlength="60" placeholder="meine-serie"></label><label>Universum / Fandom<input id="sUniverse" maxlength="120"></label><label>Beschreibung<textarea id="sDesc" maxlength="2000"></textarea></label><label>Tags, mit Komma getrennt<input id="sTags" placeholder="dark fantasy, fight, 2d"></label><label>Cover (optional)<input id="sCover" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="check"><input id="sRights" type="checkbox"> Ich bestätige, dass ich die Animation/FanArt veröffentlichen darf und die Plattformregeln einhalte.</label><label class="check"><input id="sPublish" type="checkbox"> Serie direkt veröffentlichen</label><div id="sStatus" class="upload-state">Noch nichts hochgeladen.</div><button id="saveSeries" class="primary">SERIE ERSTELLEN</button></div>');
  $("#sTitle").oninput=()=>{if(!$("#sSlug").dataset.touched)$("#sSlug").value=$("#sTitle").value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)};$("#sSlug").oninput=()=>$("#sSlug").dataset.touched="1";
  $("#saveSeries").onclick=async()=>{try{const st=$("#sStatus"),f=$("#sCover").files?.[0];let coverPath=null;if(f)coverPath=await uploadFile(f,"cover",st);await api("create_series",{title:$("#sTitle").value,slug:$("#sSlug").value,universe:$("#sUniverse").value,description:$("#sDesc").value,tags:$("#sTags").value.split(","),coverPath,rightsConfirmed:$("#sRights").checked,publish:$("#sPublish").checked});closeModal();toast("Serie erstellt");await renderStudio()}catch(e){toast(e.message)}}
}
function createSeasonModal(seriesId){
  const seasons=(state.library?.seasons||[]).filter(x=>x.series_id===seriesId),next=Math.max(0,...seasons.map(x=>x.season_number))+1;
  openModal('<span class="eyebrow">SERIE</span><h2>Staffel hinzufügen</h2><div class="form"><label>Staffelnummer<input id="seasonNum" type="number" min="1" value="'+next+'"></label><label>Titel<input id="seasonTitle" maxlength="100"></label><label>Beschreibung<textarea id="seasonDesc"></textarea></label><button id="saveSeason" class="primary">STAFFEL ERSTELLEN</button></div>');
  $("#saveSeason").onclick=async()=>{await api("create_season",{seriesId,seasonNumber:Number($("#seasonNum").value),title:$("#seasonTitle").value,description:$("#seasonDesc").value});closeModal();toast("Staffel erstellt");await renderStudio()}
}
function uploadAnimationModal(){
  const lib=state.library||{series:[],seasons:[]};
  openModal('<span class="eyebrow">UPLOAD</span><h2>FanArt-Animation veröffentlichen</h2><div class="form"><label>Typ<select id="aType"><option value="short">Kurzanimation / Reel</option><option value="episode">Serienepisode</option><option value="trailer">Serientrailer</option></select></label><label>Titel<input id="aTitle" maxlength="120"></label><label>Beschreibung<textarea id="aDesc" maxlength="2000"></textarea></label><label>Tags<input id="aTags" placeholder="fight, fantasy, character"></label><label>Stil-Tags<input id="aStyles" placeholder="2d, anime, pixel art, 3d"></label><label id="seriesLabel">Serie<select id="aSeries"><option value="">Keine</option>'+lib.series.map(s=>'<option value="'+s.id+'">'+esc(s.title)+'</option>').join("")+'</select></label><label id="seasonLabel" style="display:none">Staffel<select id="aSeason"></select></label><label id="episodeLabel" style="display:none">Episodennummer<input id="aEpisode" type="number" min="1" value="1"></label><label>Video (MP4/WebM, max. 500 MB)<input id="aVideo" type="file" accept="video/mp4,video/webm"></label><label>Thumbnail (optional)<input id="aThumb" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="check"><input id="aRights" type="checkbox"> Ich bestätige, dass ich diese FanArt-Animation veröffentlichen darf und die Plattformregeln einhalte.</label><label class="check"><input id="aAi" type="checkbox"> Die Animation enthält wesentlich KI-generierte Bildinhalte.</label><label class="check"><input id="aPublish" type="checkbox" checked> Direkt veröffentlichen</label><div id="aStatus" class="upload-state">Bereit.</div><button id="saveAnimation" class="primary">HOCHLADEN & SPEICHERN</button></div>');
  const updateFields=()=>{const type=$("#aType").value,seriesId=$("#aSeries").value;$("#episodeLabel").style.display=type==="episode"?"block":"none";$("#seasonLabel").style.display=type==="episode"&&seriesId?"block":"none";const ss=lib.seasons.filter(x=>x.series_id===seriesId);$("#aSeason").innerHTML='<option value="">Keine Staffel</option>'+ss.map(x=>'<option value="'+x.id+'">Staffel '+x.season_number+(x.title?" · "+esc(x.title):"")+'</option>').join("")};
  $("#aType").onchange=updateFields;$("#aSeries").onchange=updateFields;updateFields();
  $("#saveAnimation").onclick=async()=>{const st=$("#aStatus"),vf=$("#aVideo").files?.[0],tf=$("#aThumb").files?.[0];if(!vf){toast("Video auswählen");return}if(vf.size>524288000){toast("Video ist größer als 500 MB");return}try{$("#saveAnimation").disabled=true;const meta=await videoMeta(vf);const videoPath=await uploadFile(vf,"video",st);let thumbnailPath=null;if(tf)thumbnailPath=await uploadFile(tf,"thumbnail",st);await api("create_animation",{animationType:$("#aType").value,title:$("#aTitle").value,description:$("#aDesc").value,tags:$("#aTags").value.split(","),styleTags:$("#aStyles").value.split(","),seriesId:$("#aSeries").value||null,seasonId:$("#aSeason").value||null,episodeNumber:Number($("#aEpisode").value||1),videoPath,thumbnailPath,durationSeconds:meta.duration,aspectRatio:meta.aspect,rightsConfirmed:$("#aRights").checked,aiGeneratedDisclosure:$("#aAi").checked,publish:$("#aPublish").checked});closeModal();toast("Animation gespeichert");await renderStudio()}catch(e){console.error(e);toast(e.message)}finally{if($("#saveAnimation"))$("#saveAnimation").disabled=false}}
}

function renderAssistantPage(){
  $("#page").innerHTML=head("ORBIX","Read-only Assistent")+'<section style="padding:16px"><article class="panel" style="padding:15px"><div class="assistant-head"><span class="orb-small">◉</span><div><strong>Orbix</strong><small>TECHNISCH READ-ONLY</small></div><span>🔒</span></div><p style="font-size:9px;color:var(--muted);line-height:1.55">Orbix kann Empfehlungen erklären, Serien finden und dir sagen, was du weiterschauen kannst. Der Assistent besitzt keinen Schreibzugriff auf Posts, Profile, Nachrichten, Serien, Animationen, Likes, Follows, Moderation oder Zahlungen.</p><div class="prompt-chips"><button data-main-prompt="Was könnte mir gefallen?">Was könnte mir gefallen?</button><button data-main-prompt="Was kann ich weiterschauen?">Weiter ansehen</button><button data-main-prompt="Was ist gerade beliebt?">Trending</button></div><div id="mainAssistantAnswer" class="assistant-answer"></div><form id="mainAssistantForm" class="assistant-form"><input id="mainAssistantInput" maxlength="500" placeholder="Frag Orbix nach Animationen …"><button>➤</button></form></article></section>';
  $$("[data-main-prompt]").forEach(b=>b.onclick=()=>runAssistant(b.dataset.mainPrompt,true));$("#mainAssistantForm").onsubmit=e=>{e.preventDefault();runAssistant($("#mainAssistantInput").value.trim(),true)}
}
async function runAssistant(q,main=false){
  if(!q)return;const target=main?$("#mainAssistantAnswer"):$("#assistantAnswer");target.innerHTML=loading("Orbix sucht …");
  try{const d=await askOrbix(q);target.innerHTML='<div class="answer">'+esc(d.answer)+'</div>'+[...(d.recommendations||[]).slice(0,4).map(x=>'<div class="assistant-result"><strong>▶ '+esc(x.title)+'</strong><small>'+esc((x.why||[]).join(" · "))+'</small></div>'),...(d.series||[]).slice(0,3).map(s=>'<div class="assistant-result"><strong>▤ '+esc(s.title)+'</strong><small>'+fmt(s.episode_count)+' Episoden</small></div>')].join("")}catch(e){target.innerHTML='<div class="answer">Orbix konnte die Anfrage gerade nicht beantworten.</div>'}
}
function rulesModal(){openModal('<span class="eyebrow">ORBIX SICHERHEIT</span><h2>Unveränderbare Aktionsgrenzen</h2><div class="form"><div class="upload-state">✓ Lesen und suchen</div><div class="upload-state">✓ Empfehlungen und „Warum?“ erklären</div><div class="upload-state">✓ Wiedergabefortschritt zur Navigation berücksichtigen</div><div class="upload-state">✕ Keine Posts/Animationen/Serien bearbeiten oder löschen</div><div class="upload-state">✕ Nichts veröffentlichen</div><div class="upload-state">✕ Keine Nachrichten senden</div><div class="upload-state">✕ Keine Likes/Follows setzen</div><div class="upload-state">✕ Keine Moderationsentscheidungen oder Zahlungen</div><p style="font-size:8px;color:var(--muted)">Der Assistent läuft über einen separaten Read-only-Endpunkt mit dem anonymen Datenbank-Schlüssel und einer einzigen freigegebenen Lese-Funktion.</p></div>')}

function setup(){
  $$("[data-view]").forEach(b=>b.onclick=()=>navigate(b.dataset.view));document.addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal()});
  $("#mobileStudio").onclick=()=>navigate("studio");$("#account").onclick=()=>location.href="/social.html#profile";
  $("#assistantForm").onsubmit=e=>{e.preventDefault();runAssistant($("#assistantInput").value.trim(),false)};$$("[data-prompt]").forEach(b=>b.onclick=()=>runAssistant(b.dataset.prompt,false));$("#assistantRules").onclick=rulesModal;
}
async function start(){
  $("#page").innerHTML=loading("Animations wird gestartet …");
  try{
    state.supabase=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    await socialBootstrap();setup();const v=location.hash.slice(1);await navigate(["for_you","following","series","continue","trending","studio","assistant"].includes(v)?v:"for_you",{noHash:true})
  }catch(e){console.error(e);$("#page").innerHTML=empty("Animations konnte nicht gestartet werden",e.message||"Bitte neu laden.")}
}
start();