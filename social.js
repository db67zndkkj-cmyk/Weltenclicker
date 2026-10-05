const CONFIG=window.WELTENCLICKER_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const SOCIAL_TOKEN_KEY="wc_social_token";
const SESSION_KEY="wc_session_id";
const state={
  view:"home",feedMode:"for_you",me:null,settings:null,community:null,creator:null,
  feed:[],search:{profiles:[],communities:[]},communities:[],raids:[],notifications:[],
  conversations:[],conversationId:null,messages:[],profileData:null,profilePosts:[],
  feedCache:new Map(),searchCache:new Map(),commentsCache:new Map(),messageCache:new Map(),
  game:{ready:false,count:0,power:1,busy:false},loading:false,skipNextHomeRefresh:false
};

function getSessionId(){
  let id=sessionStorage.getItem(SESSION_KEY)||localStorage.getItem(SESSION_KEY);
  if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}
  return id;
}
function socialToken(){return localStorage.getItem(SOCIAL_TOKEN_KEY)||""}
function setSocialToken(v){if(v)localStorage.setItem(SOCIAL_TOKEN_KEY,v)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmt(v){return new Intl.NumberFormat("de-DE",{maximumFractionDigits:0}).format(Math.floor(Number(v)||0))}
function ago(v){
  const t=new Date(v).getTime(); if(!t)return "";
  const s=Math.max(0,Math.floor((Date.now()-t)/1000));
  if(s<60)return "gerade eben"; if(s<3600)return Math.floor(s/60)+" Min.";
  if(s<86400)return Math.floor(s/3600)+" Std."; if(s<604800)return Math.floor(s/86400)+" Tg.";
  return new Date(v).toLocaleDateString("de-DE");
}
function initials(p){return (p?.display_name||p?.handle||"?").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function avatar(p,cls="avatar"){
  if(p?.avatar_url)return '<img class="'+cls+'" src="'+esc(p.avatar_url)+'" alt="">';
  return '<span class="'+cls+'">'+esc(initials(p))+'</span>';
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1800)}
function loading(msg="Lädt …"){return '<div class="loading"><div class="spinner"></div>'+esc(msg)+'</div>'}
function empty(title,text,button=""){return '<div class="empty"><strong>'+esc(title)+'</strong>'+esc(text)+(button||"")+'</div>'}
function openModal(html){$("#modalBody").innerHTML=html;$("#modal").hidden=false;document.body.style.overflow="hidden"}
function closeModal(){$("#modal").hidden=true;document.body.style.overflow=""}

async function socialApi(action,payload={},retry=true){
  const headers={"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey};
  const token=socialToken(); if(token)headers["x-social-token"]=token;
  const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/social-api",{
    method:"POST",headers,body:JSON.stringify({action,sessionId:getSessionId(),...payload})
  });
  let data={};try{data=await r.json()}catch{}
  if(r.status===401&&action!=="bootstrap"&&retry){
    localStorage.removeItem(SOCIAL_TOKEN_KEY);await bootstrap(true);return socialApi(action,payload,false);
  }
  if(!r.ok){const e=new Error(data.error||"REQUEST_FAILED");e.status=r.status;e.data=data;throw e}
  return data;
}
async function gameApi(action,payload={}){
  const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/world-game",{
    method:"POST",headers:{"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey},
    body:JSON.stringify({action,sessionId:getSessionId(),...payload})
  });
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw new Error(data.error||"GAME_ERROR");return data;
}
async function bootstrap(force=false){
  const data=await socialApi("bootstrap",{},false);
  if(data.socialToken)setSocialToken(data.socialToken);
  state.me=data.profile;state.settings=data.settings||{};state.community=data.community||null;
  renderAccount();
  return data;
}
function renderAccount(){
  if(!state.me)return;
  $("#accountAvatar").outerHTML=avatar(state.me,"avatar");
  const av=$(".account-mini .avatar");if(av)av.id="accountAvatar";
  $("#accountName").textContent=state.me.display_name;$("#accountHandle").textContent="@"+state.me.handle;
}

function pageHead(kicker,title,actions=""){return '<header class="page-head"><div><span class="eyebrow">'+esc(kicker)+'</span><h1>'+esc(title)+'</h1></div>'+actions+'</header>'}
function setActiveNav(view){
  $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
}
async function navigate(view,opts={}){
  state.view=view;setActiveNav(view);$("#page").innerHTML=loading();
  if(!opts.noHash&&location.hash!=="#"+view)history.pushState({view},"","#"+view);
  try{
    if(view==="home")await renderHome();
    else if(view==="explore")await renderExplore("");
    else if(view==="raids")await renderRaids();
    else if(view==="communities")await renderCommunities();
    else if(view==="notifications")await renderNotifications();
    else if(view==="messages")await renderMessages();
    else if(view==="creator")await renderCreator();
    else if(view==="profile")await renderProfile(opts.handle||state.me?.handle);
  }catch(e){console.error(e);$("#page").innerHTML=empty("Fehler beim Laden",e.message||"Bitte versuche es erneut.")}
  window.scrollTo({top:0,behavior:"smooth"});
}
window.addEventListener("popstate",()=>{const v=location.hash.slice(1)||"home";navigate(v,{noHash:true})});

async function loadFeed(mode=state.feedMode){
  state.feedMode=mode;
  const d=await socialApi("feed",{mode,limit:40});
  const posts=d.posts||[];
  state.feedCache.set(mode,posts);
  if(state.feedMode===mode)state.feed=posts;
  return posts;
}
function cachedFeed(mode=state.feedMode){return state.feedCache.get(mode)||[]}
function paintFeed(posts,el=$("#feed")){
  if(!el)return;
  el.innerHTML=posts.length?posts.map(postHtml).join(""):empty(
    state.feedMode==="live"?"Niemand ist gerade live":"Noch keine Beiträge",
    state.feedMode==="following"?"Folge zuerst einigen Accounts.":"Veröffentliche den ersten Beitrag."
  );
  bindPostActions(el);
}
function forEachPostCopy(id,fn){
  const seen=new Set();
  const pools=[state.feed,state.profilePosts,...state.feedCache.values()];
  for(const list of pools)for(const p of list||[])if(p?.id===id&&!seen.has(p)){seen.add(p);fn(p)}
}
function findPost(id){
  let found=null;forEachPostCopy(id,p=>{if(!found)found=p});return found
}
function repaintPost(id){
  const p=findPost(id);if(!p)return;
  document.querySelectorAll('[data-post="'+id+'"]').forEach(old=>{
    const wrap=document.createElement("div");wrap.innerHTML=postHtml(p);const fresh=wrap.firstElementChild;
    old.replaceWith(fresh);bindPostActions(fresh);
  });
}
async function optimisticPostAction(kind,id){
  const map={
    like:["liked","like_count","toggle_like"],
    save:["saved",null,"toggle_save"],
    repost:["reposted","repost_count","toggle_repost"]
  };
  const [flag,countKey,action]=map[kind];
  const p=findPost(id);if(!p)return;
  const prev=Boolean(p[flag]),prevCount=countKey?Number(p[countKey]||0):0;
  forEachPostCopy(id,x=>{x[flag]=!prev;if(countKey)x[countKey]=Math.max(0,Number(x[countKey]||0)+(prev?-1:1))});
  repaintPost(id);
  try{
    const d=await socialApi(action,{postId:id});
    forEachPostCopy(id,x=>{x[flag]=Boolean(d.active);if(countKey&&d.count!=null)x[countKey]=Number(d.count)});
    repaintPost(id);
    if(kind==="save")toast(d.active?"Gespeichert":"Speicherung entfernt");
  }catch(e){
    forEachPostCopy(id,x=>{x[flag]=prev;if(countKey)x[countKey]=prevCount});
    repaintPost(id);toast("Aktion konnte nicht gespeichert werden");
  }
}
async function optimisticPollVote(id,optionIndex){
  const p=findPost(id);if(!p)return;
  const prevVote=p.poll_vote,prevCounts=JSON.parse(JSON.stringify(p.poll_counts||[]));
  const counts=new Map((p.poll_counts||[]).map(x=>[Number(x.option_index),Number(x.count||0)]));
  if(prevVote!=null)counts.set(Number(prevVote),Math.max(0,(counts.get(Number(prevVote))||0)-1));
  counts.set(optionIndex,(counts.get(optionIndex)||0)+1);
  forEachPostCopy(id,x=>{x.poll_vote=optionIndex;x.poll_counts=[...counts.entries()].map(([option_index,count])=>({option_index,count}))});
  repaintPost(id);
  try{await socialApi("poll_vote",{postId:id,optionIndex})}
  catch(e){forEachPostCopy(id,x=>{x.poll_vote=prevVote;x.poll_counts=prevCounts});repaintPost(id);toast("Stimme konnte nicht gespeichert werden")}
}
function pollHtml(p){
  if(p.post_type!=="poll"||!Array.isArray(p.poll_options))return "";
  const counts={};for(const x of p.poll_counts||[])counts[x.option_index]=Number(x.count||0);
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  return '<div class="poll">'+p.poll_options.map((o,i)=>{
    const count=counts[i]||0,pct=total?Math.round(count/total*100):0;
    return '<button data-poll-post="'+p.id+'" data-poll-option="'+i+'"><i style="width:'+pct+'%"></i><span>'+esc(o)+' · '+pct+'%'+(p.poll_vote===i?" ✓":"")+'</span></button>'
  }).join("")+'</div>';
}
function postExtra(p){
  if(p.post_type==="image"&&p.media_url)return '<img class="post-media" src="'+esc(p.media_url)+'" alt="Post-Bild">';
  if(p.post_type==="poll")return pollHtml(p);
  if(p.post_type==="community")return '<div class="community-inline"><strong>◎ Community Update</strong><small>Dieser Beitrag wurde für eine Weltenclicker-Community veröffentlicht.</small></div>';
  if(p.post_type==="raid")return '<div class="raid-inline"><strong>⚔ Raid-Beitrag</strong><small>Öffne den Raid-Bereich für Live-Punktestand und Status.</small></div>';
  return "";
}
function postHtml(p){
  const a=p.author||{},own=state.me&&p.player_id===state.me.player_id;
  return '<article class="post" data-post="'+p.id+'">'+avatar(a,"avatar post-avatar")+
    '<div><div class="post-head"><button class="post-author" data-profile="'+esc(a.handle)+'"><strong>'+esc(a.display_name||a.handle)+'</strong>'+(a.is_verified?' <span class="verified">✓</span>':'')+(a.is_live?' <span class="live-dot">● LIVE</span>':'')+'<span>@'+esc(a.handle)+'</span><span>· '+ago(p.created_at)+'</span></button><button class="post-menu" data-post-menu="'+p.id+'">•••</button></div>'+
    '<div class="post-body">'+esc(p.body)+'</div>'+postExtra(p)+
    '<div class="post-actions"><button class="post-action" data-comments="'+p.id+'">◯ '+fmt(p.comment_count)+'</button><button class="post-action '+(p.reposted?"active-repost":"")+'" data-repost="'+p.id+'">↻ '+fmt(p.repost_count)+'</button><button class="post-action '+(p.liked?"active-like":"")+'" data-like="'+p.id+'">♥ '+fmt(p.like_count)+'</button><button class="post-action" data-share="'+p.id+'">⌁</button><button class="post-action '+(p.saved?"active-save":"")+'" data-save="'+p.id+'">▱</button></div></div></article>';
}
function bindPostActions(root=document){
  $("[data-profile]",root).forEach(b=>b.onclick=()=>navigate("profile",{handle:b.dataset.profile}));
  $("[data-like]",root).forEach(b=>b.onclick=()=>optimisticPostAction("like",b.dataset.like));
  $("[data-save]",root).forEach(b=>b.onclick=()=>optimisticPostAction("save",b.dataset.save));
  $("[data-repost]",root).forEach(b=>b.onclick=()=>optimisticPostAction("repost",b.dataset.repost));
  $("[data-comments]",root).forEach(b=>b.onclick=()=>openComments(b.dataset.comments));
  $("[data-post-menu]",root).forEach(b=>b.onclick=()=>openPostMenu(b.dataset.postMenu));
  $("[data-share]",root).forEach(b=>b.onclick=async()=>{const url=location.origin+"/social.html#post="+b.dataset.share;try{await navigator.clipboard.writeText(url);toast("Post-Link kopiert")}catch{toast(url)}});
  $("[data-poll-post]",root).forEach(b=>b.onclick=()=>optimisticPollVote(b.dataset.pollPost,Number(b.dataset.pollOption)));
}
async function refreshCurrentFeed(){
  if(state.view==="home"){await loadFeed();const el=$("#feed");if(el){el.innerHTML=state.feed.length?state.feed.map(postHtml).join(""):empty("Noch keine Beiträge","Folge Creatorn oder veröffentliche den ersten Post.");bindPostActions(el)}}
  else if(state.view==="profile")await navigate("profile",{handle:state.currentProfile,noHash:true});
}
async function renderHome(){
  const initial=cachedFeed(state.feedMode);
  state.feed=initial;
  $("#page").innerHTML=pageHead("SOCIAL HUB","Home",'<div class="tabs"><button class="tab '+(state.feedMode==="for_you"?"active":"")+'" data-feed="for_you">Für dich</button><button class="tab '+(state.feedMode==="following"?"active":"")+'" data-feed="following">Folge ich</button><button class="tab '+(state.feedMode==="live"?"active":"")+'" data-feed="live">Live</button></div>')+
    '<section class="composer card">'+avatar(state.me)+'<button id="composerShortcut" class="fake-input">Teile einen Meilenstein, Raid oder Gedanken …</button><button id="composerPlus" class="icon-button">＋</button></section><div id="feed" class="feed">'+(initial.length?initial.map(postHtml).join(""):loading("Feed wird geladen …"))+'</div>';
  if(initial.length)bindPostActions($("#feed"));
  $("[data-feed]").forEach(b=>b.onclick=async()=>{
    const mode=b.dataset.feed;state.feedMode=mode;$("[data-feed]").forEach(x=>x.classList.toggle("active",x===b));
    const cached=cachedFeed(mode);state.feed=cached;
    if(cached.length)paintFeed(cached);else $("#feed").innerHTML=loading();
    try{const posts=await loadFeed(mode);if(state.view==="home"&&state.feedMode===mode)paintFeed(posts)}catch(e){if(!cached.length)$("#feed").innerHTML=empty("Feed nicht erreichbar","Bitte versuche es gleich erneut.")}
  });
  $("#composerShortcut").onclick=openComposer;$("#composerPlus").onclick=openComposer;
  if(state.skipNextHomeRefresh){state.skipNextHomeRefresh=false;return}
  try{const posts=await loadFeed(state.feedMode);if(state.view==="home")paintFeed(posts)}catch(e){if(!initial.length)$("#feed").innerHTML=empty("Feed nicht erreichbar","Bitte versuche es gleich erneut.")}
}

function composeModal(){
  openModal('<span class="eyebrow">NEUER POST</span><h2>Mit Weltenclicker teilen</h2><textarea id="composeBody" class="compose-area" maxlength="500" placeholder="Was passiert gerade?"></textarea><div class="compose-tools"><button data-compose="text" class="active">Text</button><button data-compose="image">Bild</button><button data-compose="poll">Umfrage</button><button data-compose="community">Community</button><button data-compose="raid">Raid</button></div><div id="composeExtra"></div><div class="modal-actions"><span id="composeCount" style="margin-right:auto;color:var(--muted);font-size:8px">0 / 500</span><button class="secondary" data-close-modal>Abbrechen</button><button id="publishPost" class="primary" style="padding:9px 13px">POSTEN</button></div>');
  let type="text",mediaUrl=null;
  const body=$("#composeBody"),extra=$("#composeExtra");body.oninput=()=>$("#composeCount").textContent=body.value.length+" / 500";
  $$("[data-compose]").forEach(b=>b.onclick=()=>{
    type=b.dataset.compose;$$("[data-compose]").forEach(x=>x.classList.toggle("active",x===b));extra.innerHTML="";
    if(type==="image")extra.innerHTML='<div class="modal-form"><label>Bild auswählen<input id="postImage" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><div id="uploadPreview"></div></div>';
    if(type==="poll")extra.innerHTML='<div class="modal-form"><label>Option 1<input id="poll1" maxlength="80"></label><label>Option 2<input id="poll2" maxlength="80"></label><label>Option 3 (optional)<input id="poll3" maxlength="80"></label><label>Option 4 (optional)<input id="poll4" maxlength="80"></label></div>';
    if(type==="community")extra.innerHTML=state.community?'<div class="community-inline"><strong>'+esc(state.community.name)+'</strong><small>#'+esc(state.community.code)+' · wird als Community-Update markiert</small></div>':empty("Keine Community","Tritt zuerst einer Community bei.");
    if(type==="raid")extra.innerHTML='<p style="font-size:9px;color:var(--muted)">Der Beitrag wird als Raid-Post markiert. Verknüpfe konkrete Battles im Raid-Bereich.</p>';
    if(type==="image")setTimeout(()=>{$("#postImage").onchange=async()=>{
      const f=$("#postImage").files?.[0];if(!f)return;if(f.size>2097152){toast("Maximal 2 MB");return}
      const reader=new FileReader();reader.onload=async()=>{try{$("#uploadPreview").innerHTML=loading("Bild wird hochgeladen …");const d=await socialApi("upload_media",{dataUrl:String(reader.result)});mediaUrl=d.url;$("#uploadPreview").innerHTML='<img class="preview-img" src="'+esc(mediaUrl)+'" alt="Vorschau">'}catch(e){$("#uploadPreview").innerHTML=empty("Upload fehlgeschlagen",e.message)}};reader.readAsDataURL(f)
    }},0);
  });
  $("#publishPost").onclick=async()=>{
    const payload={postType:type,body:body.value.trim()};
    if(type==="image"){if(!mediaUrl){toast("Bitte erst ein Bild hochladen");return}payload.mediaUrl=mediaUrl}
    if(type==="poll")payload.pollOptions=[1,2,3,4].map(i=>$("#poll"+i)?.value.trim()).filter(Boolean);
    if(type==="text"&&!payload.body){toast("Schreib zuerst etwas");return}
    const temp={
      id:"temp-"+Date.now(),player_id:state.me.player_id,post_type:type,body:payload.body||"",media_url:payload.mediaUrl||null,
      poll_options:payload.pollOptions||null,poll_counts:[],poll_vote:null,created_at:new Date().toISOString(),author:state.me,
      like_count:0,comment_count:0,repost_count:0,liked:false,saved:false,reposted:false
    };
    const current=state.feedCache.get("for_you")||[];state.feedCache.set("for_you",[temp,...current]);state.feedMode="for_you";state.feed=state.feedCache.get("for_you");
    state.skipNextHomeRefresh=true;closeModal();navigate("home",{noHash:true});toast("Beitrag veröffentlicht");
    try{
      const d=await socialApi("create_post",payload);
      for(const [mode,list] of state.feedCache.entries())state.feedCache.set(mode,list.map(p=>p.id===temp.id?{...temp,...d.post,id:d.post.id,author:state.me}:p));
      state.feed=state.feedCache.get(state.feedMode)||state.feed;
      if(state.view==="home")paintFeed(state.feed);
    }catch(e){
      for(const [mode,list] of state.feedCache.entries())state.feedCache.set(mode,list.filter(p=>p.id!==temp.id));
      state.feed=state.feedCache.get(state.feedMode)||[];if(state.view==="home")paintFeed(state.feed);toast("Beitrag konnte nicht gespeichert werden")
    }
  };
}
function openComposer(){composeModal()}

function paintComments(postId){
  const list=state.commentsCache.get(postId)||[],el=$("#commentList");if(!el)return;
  el.innerHTML=list.length?'<div class="comment-list">'+list.map(c=>'<div class="comment">'+avatar(c.author)+'<div><p><strong>'+esc(c.author?.display_name||c.author?.handle)+'</strong><br>'+esc(c.body)+'</p><small>'+ago(c.created_at)+'</small></div></div>').join("")+'</div>':empty("Noch keine Kommentare","Sei die erste Person, die antwortet.");
}
async function openComments(postId){
  const cached=state.commentsCache.get(postId);
  openModal('<span class="eyebrow">THREAD</span><h2>Kommentare</h2><div id="commentList">'+(cached?"":loading())+'</div><div class="modal-form" style="margin-top:10px"><textarea id="commentText" maxlength="300" placeholder="Antwort schreiben …"></textarea><button id="sendComment" class="primary" style="padding:9px">KOMMENTIEREN</button></div>');
  if(cached)paintComments(postId);
  socialApi("comments",{postId}).then(d=>{state.commentsCache.set(postId,d.comments||[]);if(!$("#modal").hidden)paintComments(postId)}).catch(()=>{if(!cached&&$("#commentList"))$("#commentList").innerHTML=empty("Kommentare nicht erreichbar","Bitte erneut versuchen.")});
  $("#sendComment").onclick=async()=>{
    const text=$("#commentText").value.trim();if(!text)return;$("#commentText").value="";
    const temp={id:"temp-"+Date.now(),post_id:postId,player_id:state.me.player_id,body:text,created_at:new Date().toISOString(),author:state.me};
    const list=state.commentsCache.get(postId)||[];state.commentsCache.set(postId,[...list,temp]);paintComments(postId);
    forEachPostCopy(postId,p=>p.comment_count=Number(p.comment_count||0)+1);repaintPost(postId);
    try{
      const d=await socialApi("create_comment",{postId,body:text});
      const now=state.commentsCache.get(postId)||[];state.commentsCache.set(postId,now.map(c=>c.id===temp.id?{...d.comment,author:state.me}:c));paintComments(postId)
    }catch(e){
      state.commentsCache.set(postId,(state.commentsCache.get(postId)||[]).filter(c=>c.id!==temp.id));
      forEachPostCopy(postId,p=>p.comment_count=Math.max(0,Number(p.comment_count||0)-1));paintComments(postId);repaintPost(postId);toast("Kommentar konnte nicht gespeichert werden")
    }
  }
}
async function openPostMenu(postId){
  const p=findPost(postId);
  const own=p&&state.me&&p.player_id===state.me.player_id;
  if(own){
    openModal('<span class="eyebrow">DEIN POST</span><h2>Beitrag verwalten</h2><button id="deletePost" class="secondary danger">Beitrag löschen</button>');
    $("#deletePost").onclick=async()=>{if(!confirm("Beitrag wirklich löschen?"))return;await socialApi("delete_post",{postId});closeModal();toast("Beitrag gelöscht");await refreshCurrentFeed()};return;
  }
  const handle=p?.author?.handle;if(!handle)return;
  openModal('<span class="eyebrow">POST</span><h2>@'+esc(handle)+'</h2><div class="modal-form"><button id="muteUser" class="secondary">Nutzer stummschalten</button><button id="blockUser" class="secondary danger">Nutzer blockieren</button><button id="reportPost" class="secondary danger">Post melden</button></div>');
  $("#muteUser").onclick=async()=>{await socialApi("toggle_mute",{handle});closeModal();toast("Stummschaltung aktualisiert");await refreshCurrentFeed()};
  $("#blockUser").onclick=async()=>{await socialApi("toggle_block",{handle});closeModal();toast("Blockierung aktualisiert");await refreshCurrentFeed()};
  $("#reportPost").onclick=()=>openReport(postId);
}
function openReport(postId){
  openModal('<span class="eyebrow">REPORT</span><h2>Beitrag melden</h2><div class="modal-form"><label>Grund<select id="reportReason"><option value="spam">Spam</option><option value="harassment">Belästigung</option><option value="hate">Hassrede</option><option value="scam">Betrug / Scam</option><option value="other">Sonstiges</option></select></label><label>Details<textarea id="reportDetail" maxlength="500"></textarea></label><button id="submitReport" class="primary" style="padding:9px">MELDEN</button></div>');
  $("#submitReport").onclick=async()=>{await socialApi("report",{postId,reason:$("#reportReason").value,detail:$("#reportDetail").value});closeModal();toast("Meldung eingereicht")}
}

async function renderExplore(query=""){
  $("#page").innerHTML=pageHead("DISCOVERY","Entdecken")+'<label class="search-box"><span>⌕</span><input id="exploreQuery" value="'+esc(query)+'" placeholder="Creator oder Community suchen"></label><section class="section"><div class="section-head"><h2>Accounts</h2></div><div id="profileResults" class="result-grid">'+loading()+'</div></section><section class="section"><div class="section-head"><h2>Communities</h2></div><div id="communityResults" class="community-grid">'+loading()+'</div></section>';
  const run=async(q)=>{
    const key=q.toLowerCase();
    if(state.searchCache.has(key)){state.search=state.searchCache.get(key);renderSearchResults()}
    try{const d=await socialApi("search",{query:q});state.search=d;state.searchCache.set(key,d);renderSearchResults()}catch(e){if(!state.searchCache.has(key))toast("Suche konnte nicht geladen werden")}
  };
  let timer;$("#exploreQuery").oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>run(e.target.value.trim()),120)};
  await run(query);
}
function profileCard(p){
  const self=state.me?.player_id===p.player_id;
  return '<article class="profile-card card"><div class="top">'+avatar(p)+'<div><h3>'+esc(p.display_name)+' '+(p.is_verified?'<span class="verified">✓</span>':'')+(p.is_live?'<span class="live-dot"> ●</span>':'')+'</h3><p>@'+esc(p.handle)+(p.bio?'<br>'+esc(p.bio):'')+'</p></div></div><div class="modal-actions"><button class="secondary" data-open-profile="'+esc(p.handle)+'">Profil</button>'+(!self?'<button class="follow '+(p.following?"active":"")+'" data-follow="'+esc(p.handle)+'">'+(p.following?"Folge ich":"Folgen")+'</button>':'')+'</div></article>';
}
function communityCard(c){
  const joined=state.community?.id===c.id;
  return '<article class="community-card card"><div class="top"><span class="avatar">'+esc((c.name||"?")[0])+'</span><div><h3>'+esc(c.name)+' '+(c.is_verified?'<span class="verified">✓</span>':'')+'</h3><p>#'+esc(c.code)+(c.description?'<br>'+esc(c.description):'')+'</p></div></div><div class="stats"><span><b>'+fmt(c.members)+'</b> Mitglieder</span><span><b>'+fmt(c.total_worlds)+'</b> Welten</span><span><b>'+fmt(c.wins)+'–'+fmt(c.losses)+'</b> Raids</span></div><div class="modal-actions"><button class="join '+(joined?"active":"")+'" data-community="'+esc(c.code)+'">'+(joined?"Verlassen":"Beitreten")+'</button></div></article>';
}
function renderSearchResults(){
  $("#profileResults").innerHTML=(state.search.profiles||[]).length?state.search.profiles.map(profileCard).join(""):empty("Keine Accounts gefunden","Probiere einen anderen Suchbegriff.");
  $("#communityResults").innerHTML=(state.search.communities||[]).length?state.search.communities.map(communityCard).join(""):empty("Keine Communities gefunden","Erstelle im Creator Hub die erste Community.");
  $$("[data-open-profile]").forEach(b=>b.onclick=()=>navigate("profile",{handle:b.dataset.openProfile}));
  $("[data-follow]").forEach(b=>b.onclick=()=>optimisticSearchFollow(b.dataset.follow,b));
  $("[data-community]").forEach(b=>b.onclick=()=>optimisticCommunityChange(b.dataset.community,b));
}
async function optimisticSearchFollow(handle,button){
  const p=(state.search.profiles||[]).find(x=>x.handle.toLowerCase()===handle.toLowerCase());if(!p)return;
  const prev=Boolean(p.following);p.following=!prev;button.classList.toggle("active",p.following);button.textContent=p.following?"Folge ich":"Folgen";
  try{const d=await socialApi("toggle_follow",{handle});p.following=Boolean(d.active);button.classList.toggle("active",p.following);button.textContent=p.following?"Folge ich":"Folgen"}
  catch(e){p.following=prev;button.classList.toggle("active",prev);button.textContent=prev?"Folge ich":"Folgen";toast("Follow konnte nicht gespeichert werden")}
}
async function optimisticCommunityChange(code,button){
  const previous=state.community;
  const leaving=previous?.code?.toLowerCase()===code.toLowerCase();
  const target=[...(state.search.communities||[]),...(state.communities||[])].find(x=>x.code?.toLowerCase()===code.toLowerCase());
  state.community=leaving?null:(target||{code,name:code});
  renderSearchResults();
  try{
    if(leaving)await socialApi("leave_community");else await socialApi("join_community",{code});
    bootstrap().catch(()=>{});
    toast(leaving?"Community verlassen":"Community beigetreten");
  }catch(e){state.community=previous;renderSearchResults();toast("Community konnte nicht aktualisiert werden")}
}

async function renderProfile(handle){
  state.currentProfile=handle;
  const cached=state.profileData?.handle?.toLowerCase()===String(handle).toLowerCase()?{profile:state.profileData,posts:state.profilePosts}:null;
  if(!cached)$("#page").innerHTML=loading("Profil wird geladen …");
  const d=cached||await socialApi("profile",{handle});const p=d.profile,own=p.player_id===state.me.player_id;
  state.profileData=p;state.profilePosts=d.posts||[];
  $("#page").innerHTML=pageHead("PROFIL",p.display_name)+
    '<article class="profile-hero card"><div class="profile-banner" '+(p.banner_url?'style="background-image:url(\''+esc(p.banner_url)+'\')"':'')+'></div><div class="profile-info">'+avatar(p,"avatar profile-main-avatar")+
    '<div class="profile-title"><div><h2>'+esc(p.display_name)+' '+(p.is_verified?'<span class="verified">✓</span>':'')+(p.is_live?'<span class="live-dot"> ● LIVE</span>':'')+'</h2><small>@'+esc(p.handle)+'</small></div>'+(own?'<button id="editProfile" class="secondary">Profil bearbeiten</button>':'<button id="profileFollow" class="follow '+(p.viewer_follows?"active":"")+'">'+(p.viewer_follows?"Folge ich":"Folgen")+'</button>')+'</div>'+
    '<p class="bio">'+esc(p.bio||"Noch keine Bio.")+'</p><div class="stats"><span><b id="profileFollowerCount">'+fmt(p.followers)+'</b> Follower</span><span><b>'+fmt(p.following_count)+'</b> folgt</span><span><b>'+fmt(p.post_count)+'</b> Posts</span><span><b>'+fmt(p.personal_worlds)+'</b> Welten</span></div></div></article><div id="profileFeed" class="feed">'+((d.posts||[]).length?d.posts.map(postHtml).join(""):empty("Noch keine Posts","Hier wurde noch nichts veröffentlicht."))+'</div>';
  bindPostActions($("#profileFeed"));if(own)$("#editProfile").onclick=()=>openEditProfile(p);else $("#profileFollow").onclick=()=>optimisticProfileFollow(p);
}
async function optimisticProfileFollow(p){
  const button=$("#profileFollow");if(!button)return;
  const prev=Boolean(p.viewer_follows),prevFollowers=Number(p.followers||0);
  p.viewer_follows=!prev;p.followers=Math.max(0,prevFollowers+(prev?-1:1));
  button.classList.toggle("active",p.viewer_follows);button.textContent=p.viewer_follows?"Folge ich":"Folgen";
  if($("#profileFollowerCount"))$("#profileFollowerCount").textContent=fmt(p.followers);
  try{const d=await socialApi("toggle_follow",{handle:p.handle});p.viewer_follows=Boolean(d.active);if(d.followers!=null)p.followers=Number(d.followers);button.classList.toggle("active",p.viewer_follows);button.textContent=p.viewer_follows?"Folge ich":"Folgen";if($("#profileFollowerCount"))$("#profileFollowerCount").textContent=fmt(p.followers)}
  catch(e){p.viewer_follows=prev;p.followers=prevFollowers;button.classList.toggle("active",prev);button.textContent=prev?"Folge ich":"Folgen";if($("#profileFollowerCount"))$("#profileFollowerCount").textContent=fmt(prevFollowers);toast("Follow konnte nicht gespeichert werden")}
}
function openEditProfile(p){
  openModal('<span class="eyebrow">PROFIL</span><h2>Profil bearbeiten</h2><div class="modal-form"><label>Handle<input id="editHandle" maxlength="24" value="'+esc(p.handle)+'"></label><label>Anzeigename<input id="editDisplay" maxlength="40" value="'+esc(p.display_name)+'"></label><label>Bio<textarea id="editBio" maxlength="180">'+esc(p.bio||"")+'</textarea></label><label>Profilbild<input id="editAvatarFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>Banner<input id="editBannerFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><button id="saveProfile" class="primary" style="padding:9px">SPEICHERN</button></div>');
  let avatarUrl=p.avatar_url||null,bannerUrl=p.banner_url||null;
  const upload=async(file)=>{if(!file)return null;if(file.size>2097152)throw new Error("Maximal 2 MB");const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});return (await socialApi("upload_media",{dataUrl})).url};
  $("#saveProfile").onclick=async()=>{try{$("#saveProfile").disabled=true;const af=$("#editAvatarFile").files?.[0],bf=$("#editBannerFile").files?.[0];if(af)avatarUrl=await upload(af);if(bf)bannerUrl=await upload(bf);const d=await socialApi("update_profile",{handle:$("#editHandle").value.trim(),displayName:$("#editDisplay").value.trim(),bio:$("#editBio").value.trim(),avatarUrl,bannerUrl});state.me=d.profile;renderAccount();closeModal();toast("Profil gespeichert");await renderProfile(d.profile.handle)}catch(e){toast(e.message)}finally{if($("#saveProfile"))$("#saveProfile").disabled=false}}
}

async function renderCommunities(){
  $("#page").innerHTML=pageHead("TEAMS","Communities",'<button data-view="creator" class="primary" style="padding:8px 11px;font-size:8px">CREATOR HUB</button>')+'<section class="section">'+(state.community?'<article class="community-card card" style="margin-bottom:12px"><span class="eyebrow">DEIN TEAM</span><h2>'+esc(state.community.name)+'</h2><p>'+esc(state.community.description||"")+'</p><div class="stats"><span><b>#'+esc(state.community.code)+'</b> Code</span><span><b>'+fmt(state.community.total_worlds)+'</b> Welten</span></div><div class="modal-actions"><button id="leaveCurrentCommunity" class="secondary danger">Community verlassen</button></div></article>':'')+'<div id="communityGrid" class="community-grid">'+loading()+'</div></section>';
  bindNav($("#page"));
  if(state.communities.length)$("#communityGrid").innerHTML=state.communities.map(communityCard).join("");
  const d=await socialApi("communities");state.communities=d.communities||[];$("#communityGrid").innerHTML=state.communities.length?state.communities.map(communityCard).join(""):empty("Noch keine Communities","Im Creator Hub kannst du die erste erstellen.");
  $("[data-community]").forEach(b=>b.onclick=()=>optimisticCommunityPageChange(b.dataset.community));
  if($("#leaveCurrentCommunity"))$("#leaveCurrentCommunity").onclick=()=>optimisticCommunityPageChange(state.community.code);
}
async function optimisticCommunityPageChange(code){
  const previous=state.community,leaving=previous?.code?.toLowerCase()===code.toLowerCase();
  const target=state.communities.find(x=>x.code?.toLowerCase()===code.toLowerCase());
  state.community=leaving?null:(target||{code,name:code});
  document.querySelectorAll("[data-community]").forEach(btn=>{
    const on=state.community?.code?.toLowerCase()===btn.dataset.community?.toLowerCase();
    btn.classList.toggle("active",Boolean(on));btn.textContent=on?"Verlassen":"Beitreten";
  });
  if($("#leaveCurrentCommunity"))$("#leaveCurrentCommunity").disabled=true;
  try{
    if(leaving)await socialApi("leave_community");else await socialApi("join_community",{code});
    bootstrap().catch(()=>{});toast(leaving?"Community verlassen":"Community beigetreten");
    await renderCommunities();
  }catch(e){state.community=previous;toast("Community konnte nicht aktualisiert werden");await renderCommunities()}
}

function raidStatus(r){if(r.status==="live")return "LIVE";if(r.status==="accepted")return "GEPLANT";if(r.status==="pending")return "ANFRAGE";if(r.status==="completed")return "BEENDET";return r.status.toUpperCase()}
function raidCard(r,ownedId){
  const myChallenge=ownedId&&r.challenger_community_id===ownedId,myOpponent=ownedId&&r.opponent_community_id===ownedId;
  let actions='<button class="secondary" data-raid-overlay="'+r.id+'">OBS Overlay</button>';
  if(r.status==="pending"&&myOpponent)actions+='<button class="primary" data-raid-accept="'+r.id+'" style="padding:8px">ANNEHMEN</button><button class="secondary danger" data-raid-decline="'+r.id+'">Ablehnen</button>';
  if(r.status==="pending"&&myChallenge)actions+='<button class="secondary danger" data-raid-cancel="'+r.id+'">Abbrechen</button>';
  return '<article class="raid-card card"><div class="section-head"><span class="status '+(r.status==="live"?"live":"")+'">'+raidStatus(r)+'</span><small>'+new Date(r.starts_at).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"})+'</small></div><div class="raid-teams"><div><strong>'+esc(r.challenger?.name||"Team A")+'</strong><small>#'+esc(r.challenger?.code||"")+'</small><b>'+fmt(r.challenger_score)+'</b></div><span class="versus">VS</span><div><strong>'+esc(r.opponent?.name||"Team B")+'</strong><small>#'+esc(r.opponent?.code||"")+'</small><b>'+fmt(r.opponent_score)+'</b></div></div><div class="modal-actions">'+actions+'</div></article>';
}
async function renderRaids(){
  const creator=await socialApi("creator_state");state.creator=creator;$("#page").innerHTML=pageHead("COMMUNITY VS COMMUNITY","Raids",creator.community?'<button id="createRaid" class="primary" style="padding:8px 11px;font-size:8px">+ HERAUSFORDERUNG</button>':'')+'<section class="section"><div id="raidGrid" class="raid-grid">'+loading()+'</div></section>';
  const d=await socialApi("raids");state.raids=d.raids||[];$("#raidGrid").innerHTML=state.raids.length?state.raids.map(r=>raidCard(r,creator.community?.id)).join(""):empty("Noch keine Raids","Creator können hier das erste Community-Duell starten.");
  if($("#createRaid"))$("#createRaid").onclick=()=>openCreateRaid();
  $$("[data-raid-overlay]").forEach(b=>b.onclick=()=>window.open("/social-raid-overlay.html?raid="+encodeURIComponent(b.dataset.raidOverlay),"_blank","noopener"));
  $$("[data-raid-accept]").forEach(b=>b.onclick=async()=>{await socialApi("accept_raid",{raidId:b.dataset.raidAccept});toast("Raid angenommen");await renderRaids()});
  $$("[data-raid-decline]").forEach(b=>b.onclick=async()=>{await socialApi("decline_raid",{raidId:b.dataset.raidDecline});await renderRaids()});
  $$("[data-raid-cancel]").forEach(b=>b.onclick=async()=>{await socialApi("cancel_raid",{raidId:b.dataset.raidCancel});await renderRaids()});
}
async function openCreateRaid(){
  const c=await socialApi("communities");const choices=(c.communities||[]).filter(x=>x.id!==state.creator?.community?.id);
  openModal('<span class="eyebrow">RAID</span><h2>Community herausfordern</h2><div class="modal-form"><label>Gegner<select id="raidOpponent">'+choices.map(x=>'<option value="'+esc(x.code)+'">'+esc(x.name)+' (#'+esc(x.code)+')</option>').join("")+'</select></label><label>Start<input id="raidStart" type="datetime-local"></label><label>Dauer<select id="raidDuration"><option value="300">5 Minuten</option><option value="600" selected>10 Minuten</option><option value="900">15 Minuten</option></select></label><button id="submitRaid" class="primary" style="padding:9px">HERAUSFORDERN</button></div>');
  const dt=new Date(Date.now()+5*60000);dt.setMinutes(dt.getMinutes()-dt.getTimezoneOffset());$("#raidStart").value=dt.toISOString().slice(0,16);
  $("#submitRaid").onclick=async()=>{await socialApi("create_raid",{opponentCode:$("#raidOpponent").value,startsAt:new Date($("#raidStart").value).toISOString(),durationSeconds:Number($("#raidDuration").value)});closeModal();toast("Raid-Anfrage gesendet");await renderRaids()}
}

async function renderNotifications(){
  $("#page").innerHTML=pageHead("AKTIVITÄT","Benachrichtigungen",'<button id="readAll" class="text-button">Alle gelesen</button>')+'<div id="noticeList" class="notice-list">'+loading()+'</div>';
  const d=await socialApi("notifications");state.notifications=d.notifications||[];renderNoticeList();$("#readAll").onclick=async()=>{await socialApi("mark_notifications");state.notifications.forEach(n=>n.read_at=new Date().toISOString());renderNoticeList();updateNotificationBadge();toast("Alles als gelesen markiert")};
}
function notificationText(n){
  const name=n.actor?.display_name||n.actor?.handle||"Weltenclicker";
  if(n.notification_type==="follow")return name+" folgt dir jetzt.";
  if(n.notification_type==="like")return name+" gefällt dein Beitrag.";
  if(n.notification_type==="comment")return name+" hat deinen Beitrag kommentiert.";
  if(n.notification_type==="repost")return name+" hat deinen Beitrag repostet.";
  if(n.notification_type==="raid")return "Neue Raid-Aktivität von "+name+".";
  if(n.notification_type==="message")return "Neue Nachricht von "+name+".";
  return "Neue Weltenclicker-Aktivität.";
}
function renderNoticeList(){
  $("#noticeList").innerHTML=state.notifications.length?state.notifications.map(n=>'<button class="notice '+(!n.read_at?"unread":"")+'" data-notice="'+n.id+'">'+avatar(n.actor)+'<span><p>'+esc(notificationText(n))+'</p><small>'+ago(n.created_at)+'</small></span>'+(!n.read_at?'<i class="unread-dot"></i>':'')+'</button>').join(""):empty("Alles ruhig","Neue Likes, Follows, Kommentare, Nachrichten und Raids erscheinen hier.");
  $$("[data-notice]").forEach(b=>b.onclick=async()=>{await socialApi("mark_notifications",{notificationId:b.dataset.notice});const n=state.notifications.find(x=>x.id===b.dataset.notice);if(n)n.read_at=new Date().toISOString();updateNotificationBadge();if(n?.notification_type==="message"&&n.payload?.conversation_id){state.conversationId=n.payload.conversation_id;await navigate("messages")}else if(n?.actor?.handle)await navigate("profile",{handle:n.actor.handle});else renderNoticeList()});
}
async function updateNotificationBadge(){
  try{const d=await socialApi("notifications");state.notifications=d.notifications||[];const n=state.notifications.filter(x=>!x.read_at).length;$("#notificationBadge").hidden=!n;$("#notificationBadge").textContent=String(n)}catch{}
}

async function renderMessages(){
  $("#page").innerHTML=pageHead("DIREKTNACHRICHTEN","Nachrichten",'<button id="newConversation" class="primary" style="padding:8px 11px;font-size:8px">+ NEUE NACHRICHT</button>')+'<section class="messages-shell card"><aside id="conversationList" class="conversation-list">'+loading()+'</aside><section class="chat"><header id="chatHeader">Wähle eine Unterhaltung</header><div id="chatMessages" class="chat-messages"></div><form id="chatForm" class="chat-form"><input id="messageInput" maxlength="1000" placeholder="Nachricht schreiben …" disabled><button class="primary" disabled>➤</button></form></section></section>';
  $("#newConversation").onclick=openNewConversation;
  if(state.conversations.length)renderConversationList();
  const d=await socialApi("conversations");state.conversations=d.conversations||[];renderConversationList();
  if(!state.conversationId&&state.conversations[0])state.conversationId=state.conversations[0].id;
  if(state.conversationId)await loadConversation(state.conversationId);
}
function renderConversationList(){
  $("#conversationList").innerHTML=state.conversations.length?state.conversations.map(c=>{const p=c.participants?.[0]||{};return '<button class="conversation '+(c.id===state.conversationId?"active":"")+'" data-conversation="'+c.id+'">'+avatar(p)+'<span><strong>'+esc(p.display_name||p.handle||"Unterhaltung")+'</strong><small>'+esc(c.last_message?.body||"Noch keine Nachricht")+'</small></span></button>'}).join(""):empty("Keine Nachrichten","Starte eine Unterhaltung über einen Handle.");
  $$("[data-conversation]").forEach(b=>b.onclick=async()=>{state.conversationId=b.dataset.conversation;renderConversationList();await loadConversation(state.conversationId)});
}
function paintConversation(id){
  const conv=state.conversations.find(c=>c.id===id),p=conv?.participants?.[0]||{},messages=state.messageCache.get(id)||[];
  $("#chatHeader").innerHTML='<strong>'+esc(p.display_name||p.handle||"Unterhaltung")+'</strong>'+(p.handle?' <small>@'+esc(p.handle)+'</small>':'');
  $("#chatMessages").innerHTML=messages.length?messages.map(m=>'<div class="bubble '+(m.sender_id===state.me.player_id?"me":"")+'">'+esc(m.body)+'</div>').join(""):empty("Noch leer","Schreib die erste Nachricht.");
  $("#messageInput").disabled=false;$("#chatForm button").disabled=false;setTimeout(()=>{$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight},0);
}
async function loadConversation(id){
  if(state.messageCache.has(id))paintConversation(id);
  const d=await socialApi("conversation",{conversationId:id});state.messages=d.messages||[];state.messageCache.set(id,state.messages);paintConversation(id);
  $("#chatForm").onsubmit=async e=>{
    e.preventDefault();const text=$("#messageInput").value.trim();if(!text)return;$("#messageInput").value="";
    const temp={id:"temp-"+Date.now(),conversation_id:id,sender_id:state.me.player_id,body:text,created_at:new Date().toISOString()};
    const list=state.messageCache.get(id)||[];state.messageCache.set(id,[...list,temp]);
    const conv=state.conversations.find(c=>c.id===id);if(conv)conv.last_message=temp;
    paintConversation(id);renderConversationList();
    try{
      const sent=await socialApi("send_message",{conversationId:id,body:text});
      state.messageCache.set(id,(state.messageCache.get(id)||[]).map(m=>m.id===temp.id?sent.message:m));
      const c=state.conversations.find(x=>x.id===id);if(c)c.last_message=sent.message;paintConversation(id);renderConversationList()
    }catch(err){
      state.messageCache.set(id,(state.messageCache.get(id)||[]).filter(m=>m.id!==temp.id));paintConversation(id);toast("Nachricht konnte nicht gesendet werden")
    }
  }
}
function openNewConversation(){
  openModal('<span class="eyebrow">DM</span><h2>Neue Nachricht</h2><div class="modal-form"><label>Handle<input id="dmHandle" placeholder="Benutzername"></label><label>Nachricht<textarea id="dmText" maxlength="1000"></textarea></label><button id="startDm" class="primary" style="padding:9px">SENDEN</button></div>');
  $("#startDm").onclick=async()=>{try{const c=await socialApi("start_conversation",{handle:$("#dmHandle").value.trim().replace(/^@/,"")});await socialApi("send_message",{conversationId:c.conversationId,body:$("#dmText").value.trim()});state.conversationId=c.conversationId;closeModal();await navigate("messages",{noHash:true})}catch(e){toast(e.message)}}
}

async function renderCreator(){
  const d=await socialApi("creator_state");state.creator=d;
  let body=pageHead("CREATOR HUB","Streamer Dashboard",'<span class="status">'+(state.me.is_live?"● LIVE":"OFFLINE")+'</span>');
  if(!d.community){
    body+='<section class="section"><article class="panel card"><span class="eyebrow">DEINE COMMUNITY</span><h2>Creator-Community erstellen</h2><p class="bio">Du kannst sofort eine Community erstellen. Twitch-Verifizierung kann später auf dieselbe Community gesetzt werden.</p><div class="modal-form"><label>Name<input id="createCommunityName" maxlength="40"></label><label>Code<input id="createCommunityCode" maxlength="20" placeholder="TEAMCODE"></label><label>Beschreibung<textarea id="createCommunityDesc" maxlength="300"></textarea></label><button id="createCommunity" class="primary" style="padding:9px">COMMUNITY ERSTELLEN</button></div></article></section>';
    $("#page").innerHTML=body;$("#createCommunity").onclick=async()=>{try{await socialApi("create_community",{name:$("#createCommunityName").value,code:$("#createCommunityCode").value,description:$("#createCommunityDesc").value});await bootstrap();toast("Community erstellt");await renderCreator()}catch(e){toast(e.message)}};return;
  }
  const c=d.community;
  body+='<section class="section"><div class="creator-grid"><article class="metric card"><span>Community-Welten</span><strong>'+fmt(c.total_worlds)+'</strong><small>#'+esc(c.code)+'</small></article><article class="metric card"><span>Raid-Bilanz</span><strong>'+fmt(c.wins)+'–'+fmt(c.losses)+'</strong><small>Community Battles</small></article><article class="metric card"><span>Status</span><strong>'+(state.me.is_live?"LIVE":"OFFLINE")+'</strong><small>'+esc(state.me.live_title||"")+'</small></article></div></section>'+
  '<section class="section creator-columns"><article class="panel card"><div class="section-head"><h2>Community verwalten</h2></div><label>Name<input id="creatorCommunityName" value="'+esc(c.name)+'"></label><label>Code<input id="creatorCommunityCode" value="'+esc(c.code)+'"></label><label>Beschreibung<textarea id="creatorCommunityDescription">'+esc(c.description||"")+'</textarea></label><div class="toggle-row"><span>Beitritt offen</span><button id="joinToggle" class="toggle '+(c.join_open?"on":"")+'"><i></i></button></div><div class="toggle-row"><span>Raid-Anfragen erlauben</span><button id="raidToggle" class="toggle '+(c.raid_requests_open?"on":"")+'"><i></i></button></div><button id="saveCommunity" class="primary" style="padding:9px;width:100%">SPEICHERN</button></article>'+
  '<article class="panel card"><div class="section-head"><h2>Stream Status</h2></div><label>Stream-Titel<input id="liveTitle" maxlength="100" value="'+esc(state.me.live_title||"")+'"></label><div class="toggle-row"><span>Auf Weltenclicker als live anzeigen</span><button id="liveToggle" class="toggle '+(state.me.is_live?"on":"")+'"><i></i></button></div><button id="saveLive" class="primary" style="padding:9px;width:100%">STATUS SPEICHERN</button><p class="bio">Später wird dieser Status automatisch mit Twitch synchronisiert.</p></article></section>'+
  '<section class="section creator-columns"><article class="panel card"><div class="section-head"><h2>Community Events</h2><button id="newEvent" class="text-button">+ Event</button></div><div id="eventList">'+renderEvents(d.events||[])+'</div></article><article class="panel card"><div class="section-head"><h2>Moderation</h2><button id="moderationOpen" class="text-button">Öffnen</button></div><p class="bio">Wortfilter, Moderatoren und Reports werden serverseitig gespeichert.</p><div class="stats"><span><b>'+fmt(d.words?.length||0)+'</b> Filter</span><span><b>'+fmt(d.moderators?.length||0)+'</b> Mods</span></div></article></section>'+
  '<section class="section"><article class="panel card"><div class="section-head"><h2>Stream Tools</h2></div><div class="modal-actions" style="justify-content:flex-start"><button id="openRaidCreator" class="secondary">⚔ Raid starten</button><button id="openOverlayCreator" class="secondary">◫ OBS Overlay</button><button data-view="raids" class="secondary">Raid-Verwaltung</button></div></article></section>';
  $("#page").innerHTML=body;bindNav($("#page"));
  let joinOpen=c.join_open,raidOpen=c.raid_requests_open,live=state.me.is_live;
  $("#joinToggle").onclick=()=>{$("#joinToggle").classList.toggle("on");joinOpen=!joinOpen};
  $("#raidToggle").onclick=()=>{$("#raidToggle").classList.toggle("on");raidOpen=!raidOpen};
  $("#liveToggle").onclick=()=>{$("#liveToggle").classList.toggle("on");live=!live};
  $("#saveCommunity").onclick=async()=>{await socialApi("update_community",{name:$("#creatorCommunityName").value,code:$("#creatorCommunityCode").value,description:$("#creatorCommunityDescription").value,joinOpen,raidRequestsOpen:raidOpen});await bootstrap();toast("Community gespeichert");await renderCreator()};
  $("#saveLive").onclick=async()=>{const x=await socialApi("set_live",{isLive:live,liveTitle:$("#liveTitle").value});state.me=x.profile;renderAccount();toast("Live-Status gespeichert");await renderCreator()};
  $("#newEvent").onclick=()=>openNewEvent();$("#moderationOpen").onclick=openModeration;$("#openRaidCreator").onclick=openCreateRaid;$("#openOverlayCreator").onclick=()=>window.open("/social-raid-overlay.html","_blank","noopener");
  $$("[data-cancel-event]").forEach(b=>b.onclick=async()=>{await socialApi("cancel_event",{eventId:b.dataset.cancelEvent});await renderCreator()});
}
function renderEvents(events){
  if(!events.length)return empty("Keine aktiven Events","Starte ein Community-Ziel oder einen Boss.");
  return events.map(e=>{const pct=Math.min(100,Number(e.progress_value||0)/Number(e.target_value||1)*100);return '<div class="event-card"><div class="section-head"><strong>'+esc(e.title)+'</strong><span class="status">'+esc(e.event_type.toUpperCase())+'</span></div><div class="progress"><i style="width:'+pct+'%"></i></div><small>'+fmt(e.progress_value)+' / '+fmt(e.target_value)+' · '+esc(e.status)+'</small>'+(e.status==="active"?'<div class="modal-actions"><button class="secondary danger" data-cancel-event="'+e.id+'">Beenden</button></div>':'')+'</div>'}).join("");
}
function openNewEvent(){
  openModal('<span class="eyebrow">COMMUNITY EVENT</span><h2>Event starten</h2><div class="modal-form"><label>Typ<select id="eventType"><option value="goal">Community-Ziel</option><option value="boss">Boss</option></select></label><label>Titel<input id="eventTitle" maxlength="80" value="Road to 1 Billion"></label><label>Zielwert / HP<input id="eventTarget" type="number" min="1" value="1000000"></label><label>Dauer in Minuten<input id="eventMinutes" type="number" min="1" max="1440" value="60"></label><button id="createEvent" class="primary" style="padding:9px">STARTEN</button></div>');
  $("#createEvent").onclick=async()=>{await socialApi("create_event",{eventType:$("#eventType").value,title:$("#eventTitle").value,targetValue:Number($("#eventTarget").value),durationMinutes:Number($("#eventMinutes").value)});closeModal();toast("Event gestartet");await renderCreator()}
}
async function openModeration(){
  const d=await socialApi("moderation_state");
  const reports=(d.reports||[]).length
    ?(d.reports||[]).map(r=>'<div class="event-card"><strong>'+esc(r.reason)+'</strong><small>'+ago(r.created_at)+' · '+esc(r.status)+'</small>'+(r.status==="open"?'<button class="secondary" data-review-report="'+r.id+'">Als geprüft markieren</button>':'')+'</div>').join("")
    :empty("Keine offenen Reports","");
  openModal('<span class="eyebrow">MODERATION</span><h2>Creator Safety</h2><div class="modal-form"><label>Wortfilter hinzufügen<input id="modWord"></label><button id="addModWord" class="secondary">Begriff hinzufügen</button><div id="wordList">'+(d.words||[]).map(w=>'<button class="secondary" data-remove-word="'+esc(w.term)+'">'+esc(w.term)+' ×</button>').join(" ")+'</div><label>Moderator per Handle<input id="modHandle"></label><button id="addModerator" class="secondary">Moderator hinzufügen</button><div class="section-head"><h3>Reports</h3></div><div>'+reports+'</div></div>');
  $("#addModWord").onclick=async()=>{const term=$("#modWord").value.trim();if(!term)return;await socialApi("mod_word",{term});closeModal();await openModeration()};
  $("#addModerator").onclick=async()=>{const handle=$("#modHandle").value.trim().replace(/^@/,"");if(!handle)return;await socialApi("mod_member",{handle});closeModal();await openModeration()};
  $$("[data-remove-word]").forEach(b=>b.onclick=async()=>{await socialApi("mod_word",{term:b.dataset.removeWord,remove:true});closeModal();await openModeration()});
  $$("[data-review-report]").forEach(b=>b.onclick=async()=>{await socialApi("review_report",{reportId:b.dataset.reviewReport,status:"reviewed"});closeModal();await openModeration()});
}

function bindNav(root=document){$$("[data-view]",root).forEach(b=>b.onclick=()=>navigate(b.dataset.view))}
async function loadRightRail(){
  try{
    const [s,c]=await Promise.all([socialApi("search",{query:""}),socialApi("communities")]);
    state.search=s;state.communities=c.communities||[];
    $("#sideCreators").innerHTML=(s.profiles||[]).filter(p=>p.player_id!==state.me.player_id).slice(0,4).map(p=>'<button class="side-row" data-side-profile="'+esc(p.handle)+'">'+avatar(p)+'<span><strong>'+esc(p.display_name)+(p.is_live?' <span class="live-dot">●</span>':'')+'</strong><small>@'+esc(p.handle)+'</small></span><i>›</i></button>').join("")||'<div class="empty">Noch keine Creator</div>';
    $("#sideCommunities").innerHTML=(c.communities||[]).slice(0,4).map(x=>'<button class="side-row" data-side-community="'+esc(x.code)+'"><span class="avatar">'+esc((x.name||"?")[0])+'</span><span><strong>'+esc(x.name)+'</strong><small>'+fmt(x.total_worlds)+' Welten</small></span><i>›</i></button>').join("")||'<div class="empty">Noch keine Teams</div>';
    $$("[data-side-profile]").forEach(b=>b.onclick=()=>navigate("profile",{handle:b.dataset.sideProfile}));
    $$("[data-side-community]").forEach(b=>b.onclick=()=>navigate("communities"));
  }catch(e){console.error(e)}
}
async function loadGame(){
  try{const d=await gameApi("state");state.game={ready:true,count:Number(d.global_count||0),power:Number(d.click_power||1),busy:false};renderGame()}catch(e){$("#globalLiveState").textContent="OFFLINE";$("#globalGameInfo").textContent="Spielserver nicht erreichbar"}
}
function renderGame(){
  $("#globalWorlds").textContent=fmt(state.game.count);$("#globalClickButton").disabled=!state.game.ready||state.game.busy;$("#globalClickButton").textContent="+"+fmt(state.game.power)+" WELT"+(state.game.power===1?"":"EN");$("#globalGameInfo").textContent="Klick zählt wirklich zum globalen Zähler";
}
async function clickGlobal(){
  if(!state.game.ready||state.game.busy)return;state.game.busy=true;renderGame();
  try{const d=await gameApi("click",{clicks:1});state.game.count=Number(d.global_count||state.game.count);state.game.power=Number(d.click_power||state.game.power);toast("+"+fmt(state.game.power)+" globale Welt"+(state.game.power===1?"":"en"))}catch{toast("Klick konnte nicht gespeichert werden")}finally{state.game.busy=false;renderGame()}
}
function accountMenu(){
  openModal('<span class="eyebrow">ACCOUNT</span><h2>'+esc(state.me.display_name)+'</h2><div class="modal-form"><button id="accountProfile" class="secondary">Profil öffnen</button><button id="savedPosts" class="secondary">Gespeicherte Posts</button><button id="privacySettings" class="secondary">Social-Privatsphäre</button><button data-view="creator" class="secondary">Creator Hub</button></div>');bindNav($("#modalBody"));
  $("#accountProfile").onclick=()=>{closeModal();navigate("profile",{handle:state.me.handle})};$("#savedPosts").onclick=async()=>{const d=await socialApi("feed",{mode:"saved",limit:50});state.feedCache.set("saved",d.posts||[]);openModal('<span class="eyebrow">GESPEICHERT</span><h2>Deine gespeicherten Posts</h2><div class="feed">'+((d.posts||[]).length?d.posts.map(postHtml).join(""):empty("Noch nichts gespeichert","Nutze das Lesezeichen unter einem Beitrag."))+'</div>');bindPostActions($("#modalBody"))};$("#privacySettings").onclick=openPrivacy
}
function openPrivacy(){
  openModal('<span class="eyebrow">PRIVATSPHÄRE</span><h2>Social-Einstellungen</h2><div class="modal-form"><label>Direktnachrichten<select id="dmPolicy"><option value="everyone">Alle</option><option value="following">Nur Accounts, denen ich folge</option><option value="none">Niemand</option></select></label><label>Mentions<select id="mentionPolicy"><option value="everyone">Alle</option><option value="following">Nur Accounts, denen ich folge</option></select></label><label><input id="activityVisible" type="checkbox"> Aktivitätsstatus sichtbar</label><button id="savePrivacy" class="primary" style="padding:9px">SPEICHERN</button></div>');
  $("#dmPolicy").value=state.settings.dm_policy||"everyone";$("#mentionPolicy").value=state.settings.mention_policy||"everyone";$("#activityVisible").checked=state.settings.activity_visible!==false;
  $("#savePrivacy").onclick=async()=>{const d=await socialApi("settings",{update:true,dmPolicy:$("#dmPolicy").value,mentionPolicy:$("#mentionPolicy").value,activityVisible:$("#activityVisible").checked});state.settings=d.settings;closeModal();toast("Privatsphäre gespeichert")}
}

function setupGlobalEvents(){
  bindNav();$("#newPostButton").onclick=openComposer;$("#mobilePost").onclick=openComposer;$("#accountMini").onclick=accountMenu;$("#globalClickButton").onclick=clickGlobal;
  $("#globalSearch").onkeydown=e=>{if(e.key==="Enter")navigate("explore").then(()=>{const q=$("#globalSearch").value;$("#exploreQuery").value=q;$("#exploreQuery").dispatchEvent(new Event("input"))})};
  document.addEventListener("click",e=>{if(e.target.closest("[data-close-modal]"))closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal()});
}

async function start(){
  $("#page").innerHTML=loading("Social Hub wird gestartet …");
  try{
    await bootstrap();setupGlobalEvents();await Promise.all([loadRightRail(),loadGame(),updateNotificationBadge()]);
    const initial=location.hash.slice(1);await navigate(["home","explore","raids","communities","notifications","messages","creator"].includes(initial)?initial:"home",{noHash:true});
    setInterval(updateNotificationBadge,20000);
    setInterval(()=>{if(state.view==="messages"&&state.conversationId)loadConversation(state.conversationId).catch(()=>{})},8000);
  }catch(e){console.error(e);$("#page").innerHTML=empty("Social Hub konnte nicht gestartet werden",e.message||"Bitte lade die Seite neu.")}
}
start();