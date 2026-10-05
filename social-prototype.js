const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const CONFIG=window.WELTENCLICKER_CONFIG||{};
const STORE_KEY="wc_social_prototype_v3";
const SESSION_KEY="wc_social_session_id";
const DEFAULT_STATE={
  view:"home",feed:"for-you",following:["nova"],joined:["nova"],liked:[],saved:[],reposted:[],
  hiddenPosts:[],muted:[],blocked:[],reports:[],reminders:[],readNotifications:[],
  customPosts:[],comments:{},pollVotes:{},messages:{},
  currentChat:"nova",raidJoined:false,raidWatching:false,raidContribution:0,
  raidEndsAt:0,raidBonusA:0,communityGoal:1000000000,boss:null,
  communitySettings:{name:"Team Sascha",code:"SASCHA",desc:"Gemeinsam bauen wir das größte Universum.",autoJoin:true,raidRequests:true},
  wordFilter:["beleidigung1","spamlink","scam","botfarm"],moderators:["NovaMod","OrbitalMod"],
  self:{name:"Sascha",handle:"@SaschaWorlds",bio:"Weltenclicker, Community-Raids und viel zu viele Welten.",initial:"SL"},
  privacy:{dm:"everyone",mentions:"everyone",activity:true}
};
function hydrate(){
  let raw={};try{raw=JSON.parse(localStorage.getItem(STORE_KEY)||"{}")}catch{}
  return {
    ...structuredClone(DEFAULT_STATE),...raw,
    following:new Set(raw.following||DEFAULT_STATE.following),joined:new Set(raw.joined||DEFAULT_STATE.joined),
    liked:new Set(raw.liked||[]),saved:new Set(raw.saved||[]),reposted:new Set(raw.reposted||[]),
    hiddenPosts:new Set(raw.hiddenPosts||[]),muted:new Set(raw.muted||[]),blocked:new Set(raw.blocked||[]),
    reports:raw.reports||[],reminders:new Set(raw.reminders||[]),readNotifications:new Set(raw.readNotifications||[]),
    customPosts:raw.customPosts||[],comments:raw.comments||{},pollVotes:raw.pollVotes||{},messages:raw.messages||{},
    communitySettings:{...DEFAULT_STATE.communitySettings,...(raw.communitySettings||{})},
    self:{...DEFAULT_STATE.self,...(raw.self||{})},privacy:{...DEFAULT_STATE.privacy,...(raw.privacy||{})}
  };
}
const state=hydrate();
if(!state.raidEndsAt||state.raidEndsAt<Date.now())state.raidEndsAt=Date.now()+7*60*1000+42*1000;
function serializable(){
 return {...state,
  following:[...state.following],joined:[...state.joined],liked:[...state.liked],saved:[...state.saved],reposted:[...state.reposted],
  hiddenPosts:[...state.hiddenPosts],muted:[...state.muted],blocked:[...state.blocked],reminders:[...state.reminders],readNotifications:[...state.readNotifications]
 };
}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(serializable()))}catch(e){console.warn("Prototype state could not be saved",e)}}
window.addEventListener("storage",e=>{if(e.key===STORE_KEY)location.reload()});

const baseCreators=[
{id:"nova",name:"NovaNeko",handle:"@novaneko",initial:"N",followers:"148K",team:"Team Nova",live:true,bio:"Speedruns, Soulslikes & Weltenclicker-Raids. ✦"},
{id:"ash",name:"AshenTV",handle:"@ashentv",initial:"A",followers:"92K",team:"Ashen Army",live:true,bio:"No-hit attempts. Community wars. Kein Zurück."},
{id:"orb",name:"OrbitalJonas",handle:"@orbitaljonas",initial:"O",followers:"51K",team:"Orbital Crew",live:true,bio:"Variety & Community Games 🚀"},
{id:"moss",name:"MossBoss",handle:"@mossboss",initial:"M",followers:"34K",team:"Moss Legion",live:false,bio:"Chill streams, cursed builds und zu viele Pflanzen."}
];
const communities=[
{id:"nova",name:"Team Nova",code:"NOVA",initial:"N",members:28400,worlds:"3,92B",rank:1,raid:"18–3",desc:"Schnell, laut und gefährlich."},
{id:"ash",name:"Ashen Army",code:"ASHEN",initial:"A",members:23900,worlds:"3,71B",rank:2,raid:"17–4",desc:"Jeder Klick zählt. Keine Ausreden."},
{id:"moss",name:"Moss Legion",code:"MOSS",initial:"M",members:15800,worlds:"2,88B",rank:3,raid:"15–6",desc:"Entspannt klicken, hart raiden."},
{id:"orb",name:"Orbital Crew",code:"ORBIT",initial:"O",members:12100,worlds:"2,42B",rank:4,raid:"14–7",desc:"Bis zum nächsten Stern."}
];
const basePosts=[
{id:"p1",creator:"nova",time:"2 Min.",type:"clip",text:'DAS war gerade der knappste Lead-Change des Abends 😭 Team Nova, wir brauchen euch in 10 Minuten wieder. <a>#WorldWar</a> <a>#TeamNova</a>',likes:1832,comments:142,reposts:318,views:"44K"},
{id:"p2",creator:"ash",time:"8 Min.",type:"raid",text:"OFFIZIELL: Ashen Army akzeptiert die Revanche. Heute 21:30. 10 Minuten. Keine Multiplikatoren. Nur Community gegen Community.",likes:914,comments:211,reposts:174,views:"28K"},
{id:"p3",creator:"orb",time:"21 Min.",type:"text",text:"Wir haben gerade 2.000.000.000 Team-Welten geknackt. Was zur Hölle. Danke an jeden einzelnen von euch. 🚀",likes:2241,comments:188,reposts:96,views:"31K"},
{id:"p4",creator:"moss",time:"42 Min.",type:"quote",text:"Hot Take: Community-Bosse sollten stärker skalieren, wenn mehr Leute gleichzeitig online sind. Sonst schmelzen große Teams sie in Sekunden.",likes:511,comments:87,reposts:44,views:"9K"}
];
const notificationSeed=[
{icon:"⚔",text:"Team Nova hat eine Raid-Herausforderung von Ashen Army angenommen.",time:"vor 2 Min.",target:"raids"},
{icon:"♥",text:"NovaNeko und 18 weitere Personen gefällt dein Beitrag.",time:"vor 11 Min.",target:"home"},
{icon:"＋",text:"OrbitalJonas folgt dir jetzt.",time:"vor 26 Min.",target:"profile:orb"},
{icon:"◎",text:"Deine Community hat den Meilenstein 900 Mio. Welten erreicht.",time:"vor 1 Std.",target:"creator"},
{icon:"✦",text:"Du hast das Achievement „Veteran der 10. Ära“ freigeschaltet.",time:"vor 3 Std.",target:"profile:you"},
{icon:"↻",text:"AshenTV hat deinen Beitrag repostet.",time:"gestern",target:"home"}
];
const defaultConversations={
nova:{name:"NovaNeko",initial:"N",preview:"Können wir Freitag 20 Uhr festmachen?",messages:[["them","Hey! GG beim Raid gestern 😄"],["me","GG, das Ende war komplett absurd."],["them","Können wir Freitag 20 Uhr festmachen?"]]},
ash:{name:"AshenTV",initial:"A",preview:"10 Minuten, Standardregeln?",messages:[["them","Wollt ihr eine Revanche?"],["me","Auf jeden Fall."],["them","10 Minuten, Standardregeln?"]]},
mod:{name:"WC Moderation",initial:"W",preview:"Dein Report wurde geprüft.",messages:[["them","Dein Report wurde geprüft. Danke für deine Meldung."]]}
};
const game={sessionId:null,globalCount:0,clickPower:1,ready:false,busy:false};

function creators(){return [{id:"you",name:state.self.name,handle:state.self.handle,initial:state.self.initial,followers:"—",team:state.communitySettings.name,live:false,bio:state.self.bio},...baseCreators]}
function creator(id){return creators().find(x=>x.id===id)||creators()[0]}
function allPosts(){return [...state.customPosts,...basePosts]}
function conversations(){return {...defaultConversations,...state.messages}}
function fmt(n){return new Intl.NumberFormat("de-DE").format(Math.floor(Number(n)||0))}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1700)}
function toggleSet(set,id){set.has(id)?set.delete(id):set.add(id);save()}
function postById(id){return allPosts().find(p=>p.id===id)}
function addedComments(id){return state.comments[id]||[]}
function commentCount(p){return Number(p.comments||0)+addedComments(p.id).length}

function switchView(view,{push=true}={}){
 state.view=view;save();
 $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
 $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="notifications")renderNotifications();
 if(view==="messages")renderMessages();
 if(view==="creator")renderCreatorSettings();
 if(push&&location.hash!=="#"+view)history.pushState({view},"","#"+view);
 window.scrollTo({top:0,behavior:"smooth"});
}
window.addEventListener("popstate",()=>{const v=location.hash.slice(1)||"home";if($("#view-"+v))switchView(v,{push:false})});

function filteredPosts(){
 let list=allPosts().filter(p=>!state.hiddenPosts.has(p.id)&&!state.blocked.has(p.creator)&&!state.muted.has(p.creator));
 if(state.feed==="following")list=list.filter(p=>p.creator==="you"||state.following.has(p.creator));
 if(state.feed==="live")list=list.filter(p=>creator(p.creator).live);
 return list;
}
function renderFeed(){const feed=$("#feed");const list=filteredPosts();feed.innerHTML=list.length?list.map(postHtml).join(""):'<div class="explore-empty">Hier ist gerade nichts zu sehen. Passe deine Filter an.</div>';bindPostActions()}
function mediaHtml(p){
 if(p.type==="clip")return '<div class="post-media"><div class="planet-demo"></div><button class="play" data-play="'+p.id+'">▶</button><div class="clip-overlay"><span>RAID CLIP · 0:27</span><span>'+esc(p.views||"0")+' Aufrufe</span></div></div>';
 if(p.type==="image"&&p.image)return '<img class="post-image" src="'+p.image+'" alt="Vom Nutzer hinzugefügtes Bild">';
 if(p.type==="raid")return '<div class="raid-post-card"><div class="teams"><div><b>Team Nova</b><small>18–3</small></div><strong>⚔</strong><div><b>Ashen Army</b><small>17–4</small></div></div><div class="battle-meter" style="margin-top:12px"><i style="width:50%"></i></div><small style="display:block;text-align:center;margin-top:8px;color:#9099ba">HEUTE · 21:30 · 10 MINUTEN</small></div>';
 if(p.type==="quote")return '<div class="quoted-post"><strong>@RaidMaster</strong><p>Wie schwer sollten Community-Bosse wirklich sein?</p></div>';
 if(p.type==="community")return '<div class="community-post-badge"><div class="team-emblem purple">'+esc(state.communitySettings.code.slice(0,1))+'</div><div><strong>'+esc(state.communitySettings.name)+'</strong><small>#'+esc(state.communitySettings.code)+' · Community Update</small></div></div>';
 if(p.type==="poll"&&Array.isArray(p.options)){const vote=state.pollVotes[p.id];return '<div class="poll-box">'+p.options.map((o,i)=>{const pct=vote==null?(i===0?54:46):(vote===i?(i===0?61:58):(i===0?39:42));return '<button class="poll-option" data-poll="'+p.id+'" data-option="'+i+'"><i style="width:'+pct+'%"></i><span>'+esc(o)+' · '+pct+'%</span></button>'}).join("")+'</div>'}
 return "";
}
function postHtml(p){
 const c=creator(p.creator),liked=state.liked.has(p.id),saved=state.saved.has(p.id),reposted=state.reposted.has(p.id);
 return '<article class="post" data-post="'+p.id+'"><div class="avatar post-avatar">'+esc(c.initial)+'</div><div><div class="post-head"><div class="post-user"><button data-profile="'+p.creator+'"><strong>'+esc(c.name)+'</strong> <span class="verified">✓</span> <span>'+esc(c.handle)+'</span></button><span>· '+esc(p.time)+'</span></div><button class="post-menu" data-menu="'+p.id+'">•••</button></div><div class="post-copy">'+p.text+'</div>'+mediaHtml(p)+'<div class="post-actions"><button class="post-action" data-comment="'+p.id+'">◯ '+commentCount(p)+'</button><button class="post-action '+(reposted?"saved":"")+'" data-repost="'+p.id+'">↻ '+(Number(p.reposts||0)+(reposted?1:0))+'</button><button class="post-action '+(liked?"liked":"")+'" data-like="'+p.id+'">♥ '+(Number(p.likes||0)+(liked?1:0))+'</button><button class="post-action" data-share="'+p.id+'">⌁ '+esc(p.views||"0")+'</button><button class="post-action '+(saved?"saved":"")+'" data-save="'+p.id+'">▱</button></div></div></article>';
}
function bindPostActions(){
 $$("[data-like]").forEach(b=>b.onclick=()=>{toggleSet(state.liked,b.dataset.like);renderFeed()});
 $$("[data-save]").forEach(b=>b.onclick=()=>{toggleSet(state.saved,b.dataset.save);toast(state.saved.has(b.dataset.save)?"Gespeichert":"Aus Gespeichert entfernt");renderFeed()});
 $$("[data-repost]").forEach(b=>b.onclick=()=>{toggleSet(state.reposted,b.dataset.repost);toast("Repost aktualisiert");renderFeed()});
 $$("[data-share]").forEach(b=>b.onclick=async()=>{const url=location.origin+"/social-prototype.html#post="+b.dataset.share;try{await navigator.clipboard.writeText(url);toast("Link kopiert")}catch{toast("Teilen-Link: "+url)}});
 $$("[data-comment]").forEach(b=>b.onclick=()=>openComments(b.dataset.comment));
 $$("[data-menu]").forEach(b=>b.onclick=()=>openPostMenu(b.dataset.menu));
 $$("[data-profile]").forEach(b=>b.onclick=()=>renderProfile(b.dataset.profile));
 $$("[data-play]").forEach(b=>b.onclick=()=>toast("Clip-Wiedergabe ist im Prototyp simuliert"));
 $$("[data-poll]").forEach(b=>b.onclick=()=>{state.pollVotes[b.dataset.poll]=Number(b.dataset.option);save();renderFeed();toast("Stimme gespeichert")});
}

function renderCreators(){
 const q=($("#exploreSearch")?.value||"").trim().toLowerCase();
 const list=baseCreators.filter(c=>(c.name+" "+c.handle+" "+c.team+" "+c.bio).toLowerCase().includes(q));
 $("#creatorGrid").innerHTML=list.length?list.map(c=>'<article class="creator-card card" data-search="'+esc((c.name+" "+c.handle+" "+c.team).toLowerCase())+'"><div class="creator-cover" data-profile="'+c.id+'"></div><div class="avatar" data-profile="'+c.id+'">'+c.initial+'</div><h3><button class="text-btn" data-profile="'+c.id+'">'+esc(c.name)+' <span class="verified">✓</span></button></h3><p>'+esc(c.handle)+' · '+c.followers+' Follower<br>'+esc(c.bio)+'</p><button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" data-follow="'+c.id+'">'+(state.following.has(c.id)?"Folge ich":"Folgen")+'</button></article>').join(""):'<div class="explore-empty">Keine Creator gefunden.</div>';
 $$("[data-follow]").forEach(b=>b.onclick=e=>{e.stopPropagation();toggleSet(state.following,b.dataset.follow);renderCreators();renderSuggested();toast(state.following.has(b.dataset.follow)?"Du folgst diesem Creator":"Nicht mehr abonniert")});
 $$("[data-profile]").forEach(b=>b.onclick=()=>renderProfile(b.dataset.profile));
}
function communityCard(c){return '<article class="community-card card" data-search="'+esc((c.name+" "+c.code).toLowerCase())+'"><div class="team-emblem '+(c.id==="ash"?"red":"purple")+'">'+c.initial+'</div><h3>'+esc(c.name)+' <span class="verified">✓</span></h3><p>#'+esc(c.code)+' · '+fmt(c.members)+' Mitglieder<br>'+esc(c.desc)+'</p><button class="join-btn '+(state.joined.has(c.id)?"joined":"")+'" data-join="'+c.id+'">'+(state.joined.has(c.id)?"Beigetreten":"Beitreten")+'</button></article>'}
function renderCommunities(){
 const q=($("#exploreSearch")?.value||"").trim().toLowerCase();
 const list=communities.filter(c=>(c.name+" "+c.code+" "+c.desc).toLowerCase().includes(q));
 $("#communityGrid").innerHTML=list.length?list.map(communityCard).join(""):'<div class="explore-empty">Keine Communities gefunden.</div>';
 $("#communityList").innerHTML=communities.map(c=>'<article class="community-list-row card"><div class="team-emblem '+(c.id==="ash"?"red":"purple")+'">'+c.initial+'</div><div><strong>#'+c.rank+' · '+esc(c.name)+' <span class="verified">✓</span></strong><small>#'+esc(c.code)+' · '+fmt(c.members)+' Mitglieder · '+c.worlds+' Welten · '+c.raid+' Raids</small></div><button class="join-btn '+(state.joined.has(c.id)?"joined":"")+'" data-join="'+c.id+'">'+(state.joined.has(c.id)?"Beigetreten":"Beitreten")+'</button></article>').join("");
 $$("[data-join]").forEach(b=>b.onclick=()=>{toggleSet(state.joined,b.dataset.join);renderCommunities();toast(state.joined.has(b.dataset.join)?"Community beigetreten":"Community verlassen")});
}
function renderSuggested(){
 $("#suggestedUsers").innerHTML=baseCreators.slice(1,4).filter(c=>!state.blocked.has(c.id)).map(c=>'<div class="suggest-user"><i class="avatar" data-profile="'+c.id+'">'+c.initial+'</i><span><strong>'+esc(c.name)+' <span class="verified">✓</span></strong><small>'+esc(c.team)+'</small></span><button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" data-sfollow="'+c.id+'">'+(state.following.has(c.id)?"✓":"Folgen")+'</button></div>').join("");
 $$("[data-sfollow]").forEach(b=>b.onclick=()=>{toggleSet(state.following,b.dataset.sfollow);renderSuggested();renderCreators()});
 $$("[data-profile]").forEach(b=>b.onclick=()=>renderProfile(b.dataset.profile));
}

function renderExplore(){
 const filter=$("[data-explore-filter].active")?.dataset.exploreFilter||"all";
 const creatorSection=$("#creatorGrid").closest(".section-block"),communitySection=$("#communityGrid").closest(".section-block"),trendSection=$(".trend-grid").closest(".section-block");
 creatorSection.classList.toggle("hidden-by-filter",filter==="communities"||filter==="raids");
 communitySection.classList.toggle("hidden-by-filter",filter==="creators"||filter==="clips"||filter==="raids");
 trendSection.classList.toggle("hidden-by-filter",filter!=="all");
 if(filter==="clips"||filter==="raids"){
   creatorSection.classList.remove("hidden-by-filter");
   $(".section-title h2",creatorSection).textContent=filter==="clips"?"Clips":"Raid-Beiträge";
   const list=allPosts().filter(p=>filter==="clips"?p.type==="clip":p.type==="raid");
   $("#creatorGrid").innerHTML=list.map(p=>'<div class="card" style="padding:12px">'+postHtml(p)+'</div>').join("")||'<div class="explore-empty">Keine Inhalte gefunden.</div>';
   bindPostActions();
 }else{
   $(".section-title h2",creatorSection).textContent="Creator, die gerade wachsen";
   renderCreators();renderCommunities();
 }
}

function renderNotifications(){
 $("#notificationList").innerHTML=notificationSeed.map((n,i)=>{const unread=!state.readNotifications.has(String(i));return '<button class="notification '+(unread?"unread":"")+'" data-notification="'+i+'" style="width:100%;background:'+(unread?"rgba(98,230,255,.035)":"transparent")+';color:#fff;text-align:left;border-left:0;border-right:0;border-bottom:0"><div class="avatar">'+n.icon+'</div><div><p>'+esc(n.text)+'</p><small>'+n.time+'</small></div>'+(unread?'<i class="dot-unread"></i>':'')+'</button>'}).join("");
 const unreadCount=notificationSeed.filter((_,i)=>!state.readNotifications.has(String(i))).length;
 $("#notifBadge").style.display=unreadCount?"":"none";$("#notifBadge").textContent=String(unreadCount);
 $$("[data-notification]").forEach(b=>b.onclick=()=>{const i=b.dataset.notification,n=notificationSeed[Number(i)];state.readNotifications.add(i);save();renderNotifications();if(n.target.startsWith("profile:"))renderProfile(n.target.split(":")[1]);else switchView(n.target)});
}
function getConversation(id){
 const all=conversations();return all[id];
}
function renderMessages(){
 const all=conversations();
 if(!all[state.currentChat])state.currentChat=Object.keys(all)[0];
 $("#conversationList").innerHTML=Object.entries(all).map(([id,c])=>'<button class="conversation '+(state.currentChat===id?"active":"")+'" data-chat="'+id+'"><i class="avatar">'+esc(c.initial)+'</i><div><strong>'+esc(c.name)+'</strong><span>'+esc(c.preview||c.messages.at(-1)?.[1]||"")+'</span></div></button>').join("");
 $$("[data-chat]").forEach(b=>b.onclick=()=>{state.currentChat=b.dataset.chat;save();renderMessages()});
 const c=getConversation(state.currentChat);$("#chatHeader").innerHTML='<strong>'+esc(c.name)+'</strong><span class="verified"> ✓</span>';
 $("#chatMessages").innerHTML=c.messages.map(m=>'<div class="bubble '+(m[0]==="me"?"me":"")+'">'+esc(m[1])+'</div>').join("");
 setTimeout(()=>{$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight},0);
}
function saveConversation(id,c){
 if(defaultConversations[id]){
   state.messages[id]={...defaultConversations[id],...c,messages:c.messages};
 }else state.messages[id]=c;
 save();
}
function renderProfile(id,tab="posts"){
 const c=creator(id);
 const followButton=id==="you"?"":'<button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" id="profileFollow">'+(state.following.has(c.id)?"Folge ich":"Folgen")+'</button>';
 const own=id==="you"?'<button class="secondary" id="editSelfProfile">Profil bearbeiten</button>':followButton;
 let panel="";
 if(tab==="posts")panel='<div class="feed">'+allPosts().filter(p=>p.creator===id&&!state.hiddenPosts.has(p.id)).map(postHtml).join("")+'</div>';
 if(tab==="clips")panel='<div class="profile-tab-panel">'+(allPosts().filter(p=>p.creator===id&&p.type==="clip").map(p=>postHtml(p)).join("")||'<div class="explore-empty">Noch keine Clips.</div>')+'</div>';
 if(tab==="achievements")panel='<div class="profile-tab-panel achievement-grid"><article class="achievement card"><span>🌍</span><strong>100M Welten</strong><small>Legendärer Meilenstein</small></article><article class="achievement card"><span>⚔</span><strong>Raid Veteran</strong><small>10 Raids gespielt</small></article><article class="achievement card"><span>🛡</span><strong>Überlebender</strong><small>Reset mit Schild überlebt</small></article></div>';
 if(tab==="about")panel='<div class="profile-tab-panel card" style="padding:14px"><p class="profile-bio">'+esc(c.bio)+'</p><p style="font-size:9px;color:var(--muted)">Community: '+esc(c.team)+'<br>Seit 2026 auf Weltenclicker<br>Profil-Prototyp · Demodaten</p></div>';
 $("#profileContent").innerHTML='<article class="profile-hero card"><div class="profile-cover"></div><div class="profile-info"><div class="avatar">'+esc(c.initial)+'</div><div class="profile-title"><div><h2>'+esc(c.name)+' <span class="verified">✓</span></h2><p>'+esc(c.handle)+' · '+esc(c.team)+'</p></div>'+own+'</div><p class="profile-bio">'+esc(c.bio)+'</p><div class="profile-stats"><span><b>'+esc(c.followers)+'</b> Follower</span><span><b>'+allPosts().filter(p=>p.creator===id).length+'</b> Posts</span><span><b>18–3</b> Raids</span></div><div class="profile-tabs"><button data-profile-tab="posts" class="'+(tab==="posts"?"active":"")+'">Beiträge</button><button data-profile-tab="clips" class="'+(tab==="clips"?"active":"")+'">Clips</button><button data-profile-tab="achievements" class="'+(tab==="achievements"?"active":"")+'">Achievements</button><button data-profile-tab="about" class="'+(tab==="about"?"active":"")+'">Über</button></div></div></article>'+panel;
 if($("#profileFollow"))$("#profileFollow").onclick=()=>{toggleSet(state.following,id);renderProfile(id,tab);renderSuggested();renderCreators()};
 if($("#editSelfProfile"))$("#editSelfProfile").onclick=openEditProfile;
 $$("[data-profile-tab]").forEach(b=>b.onclick=()=>renderProfile(id,b.dataset.profileTab));
 bindPostActions();switchView("profile");
}

function openModal(content){$("#modalBody").innerHTML=content;$("#modal").hidden=false;document.body.style.overflow="hidden"}
function closeModal(){$("#modal").hidden=true;document.body.style.overflow=""}
let compose={type:"text",image:null,poll:["",""]};
function openComposer(){
 compose={type:"text",image:null,poll:["",""]};
 openModal('<div class="compose-modal"><span class="eyebrow">NEUER POST</span><h2>Mit der Community teilen</h2><textarea id="composeText" maxlength="500" placeholder="Was passiert gerade in deiner Welt?"></textarea><div class="compose-tools"><button class="compose-tool" data-compose-type="clip">▧ Clip</button><button class="compose-tool" data-compose-type="image">▦ Bild</button><button class="compose-tool" data-compose-type="poll">◫ Umfrage</button><button class="compose-tool" data-compose-type="raid">⚔ Raid</button><button class="compose-tool" data-compose-type="community">◎ Community</button></div><div id="composePreview" class="compose-preview"></div><div class="compose-footer"><span>0 / 500</span><button id="publishPost" class="primary">POSTEN</button></div></div>');
 const ta=$("#composeText"),counter=$(".compose-footer span");ta.oninput=()=>counter.textContent=ta.value.length+" / 500";
 $$("[data-compose-type]").forEach(b=>b.onclick=()=>selectComposeType(b.dataset.composeType));
 $("#publishPost").onclick=publishPost;setTimeout(()=>ta.focus(),20);
}
function selectComposeType(type){
 compose.type=type;$$("[data-compose-type]").forEach(b=>b.classList.toggle("active",b.dataset.composeType===type));
 const p=$("#composePreview");p.innerHTML="";
 if(type==="image"){
   const input=document.createElement("input");input.type="file";input.accept="image/*";input.hidden=true;document.body.appendChild(input);
   input.onchange=()=>{const f=input.files?.[0];if(!f)return;if(f.size>900000){toast("Bild für den Prototyp bitte unter 900 KB");input.remove();return}const r=new FileReader();r.onload=()=>{compose.image=String(r.result);p.innerHTML='<img src="'+compose.image+'" alt="Vorschau">';input.remove()};r.readAsDataURL(f)};input.click();
 }
 if(type==="poll"){p.innerHTML='<div class="compose-poll"><input id="pollA" maxlength="80" placeholder="Option 1"><input id="pollB" maxlength="80" placeholder="Option 2"></div>'}
 if(type==="raid")p.innerHTML='<div class="raid-post-card"><strong>⚔ RAID-ANKÜNDIGUNG</strong><small style="display:block;color:var(--muted);margin-top:5px">Team Sascha fordert eine Community heraus.</small></div>';
 if(type==="community")p.innerHTML='<div class="community-post-badge"><div class="team-emblem purple">'+esc(state.communitySettings.code.slice(0,1))+'</div><div><strong>'+esc(state.communitySettings.name)+'</strong><small>#'+esc(state.communitySettings.code)+'</small></div></div>';
}
function publishPost(){
 const ta=$("#composeText"),text=ta.value.trim();
 if(!text&&compose.type==="text"){toast("Schreib zuerst etwas");return}
 const p={id:"u"+Date.now(),creator:"you",time:"Gerade eben",type:compose.type,text:esc(text||"Neuer Community-Post"),likes:0,comments:0,reposts:0,views:"0"};
 if(compose.type==="image"){if(!compose.image){toast("Wähle zuerst ein Bild");return}p.image=compose.image}
 if(compose.type==="poll"){const a=$("#pollA")?.value.trim(),b=$("#pollB")?.value.trim();if(!a||!b){toast("Beide Umfrageoptionen ausfüllen");return}p.options=[a,b]}
 state.customPosts.unshift(p);save();closeModal();state.feed="for-you";renderFeed();switchView("home");toast("Beitrag veröffentlicht")
}
function openComments(id){
 const p=postById(id),items=addedComments(id);
 openModal('<span class="eyebrow">THREAD</span><h2>'+commentCount(p)+' Kommentare</h2><div class="comment-list">'+(items.length?items.map(c=>'<div class="comment-row"><div class="avatar">'+esc(c.initial)+'</div><div><p><strong>'+esc(c.name)+'</strong><br>'+esc(c.text)+'</p><small>'+esc(c.time)+'</small></div></div>').join(""):'<div class="explore-empty">Deine neuen Kommentare erscheinen hier. Die übrige Zahl ist Demodaten.</div>')+'</div><div class="modal-form"><textarea id="replyText" maxlength="300" placeholder="Deine Antwort …"></textarea><button class="primary" id="replySend">ANTWORTEN</button></div>');
 $("#replySend").onclick=()=>{const text=$("#replyText").value.trim();if(!text)return;(state.comments[id]??=[]).push({name:state.self.name,initial:state.self.initial,text,time:"Gerade eben"});save();closeModal();renderFeed();openComments(id)}
}
function openPostMenu(id){
 const p=postById(id),c=creator(p.creator);
 if(p.creator==="you"){openModal('<span class="eyebrow">DEIN BEITRAG</span><h2>Aktionen</h2><div style="display:grid;gap:7px"><button class="secondary" id="deleteOwnPost">Beitrag löschen</button></div>');$("#deleteOwnPost").onclick=()=>{state.customPosts=state.customPosts.filter(x=>x.id!==id);save();closeModal();renderFeed();toast("Beitrag gelöscht")};return}
 openModal('<span class="eyebrow">BEITRAG</span><h2>'+esc(c.name)+'</h2><div style="display:grid;gap:7px"><button class="secondary" data-post-action="hide">Nicht interessiert</button><button class="secondary" data-post-action="mute">Nutzer stummschalten</button><button class="secondary danger" data-post-action="block">Nutzer blockieren</button><button class="secondary danger" data-post-action="report">Beitrag melden</button></div>');
 $$("[data-post-action]").forEach(b=>b.onclick=()=>handlePostAction(b.dataset.postAction,p))
}
function handlePostAction(action,p){
 if(action==="hide"){state.hiddenPosts.add(p.id);save();closeModal();renderFeed();toast("Beitrag ausgeblendet")}
 if(action==="mute"){state.muted.add(p.creator);save();closeModal();renderFeed();toast("Nutzer stummgeschaltet")}
 if(action==="block"){state.blocked.add(p.creator);state.following.delete(p.creator);save();closeModal();renderFeed();renderSuggested();toast("Nutzer blockiert")}
 if(action==="report")openReport(p)
}
function openReport(p){
 openModal('<span class="eyebrow">REPORT</span><h2>Warum meldest du diesen Beitrag?</h2><div style="display:grid;gap:7px"><button class="secondary" data-reason="Spam">Spam</button><button class="secondary" data-reason="Belästigung">Belästigung</button><button class="secondary" data-reason="Hassrede">Hassrede</button><button class="secondary" data-reason="Betrug">Betrug / Scam</button><button class="secondary" data-reason="Sonstiges">Sonstiges</button></div>');
 $$("[data-reason]").forEach(b=>b.onclick=()=>{state.reports.push({postId:p.id,creator:p.creator,reason:b.dataset.reason,status:"offen",time:Date.now()});save();closeModal();renderModerationCounts();toast("Meldung eingereicht")})
}

function openEditProfile(){
 openModal('<span class="eyebrow">PROFIL</span><h2>Profil bearbeiten</h2><div class="modal-form"><label>Name<input id="editName" maxlength="30" value="'+esc(state.self.name)+'"></label><label>Handle<input id="editHandle" maxlength="24" value="'+esc(state.self.handle)+'"></label><label>Bio<textarea id="editBio" maxlength="180">'+esc(state.self.bio)+'</textarea></label><button class="primary" id="saveProfile">Speichern</button></div>');
 $("#saveProfile").onclick=()=>{const name=$("#editName").value.trim(),handle=$("#editHandle").value.trim(),bio=$("#editBio").value.trim();if(name.length<2||!/^[A-Za-z0-9_@]{3,24}$/.test(handle)){toast("Name oder Handle ungültig");return}state.self={...state.self,name,handle:handle.startsWith("@")?handle:"@"+handle,bio,initial:name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()};save();closeModal();renderAccount();renderProfile("you");toast("Profil gespeichert")}
}
function openAccountMenu(){
 openModal('<span class="eyebrow">ACCOUNT</span><h2>'+esc(state.self.name)+'</h2><div style="display:grid;gap:7px"><button class="secondary" data-account="profile">Profil bearbeiten</button><button class="secondary" data-account="privacy">Privatsphäre</button><button class="secondary" data-account="content">Content-Einstellungen</button><button class="secondary" data-account="saved">Gespeicherte Beiträge</button><button class="secondary danger" data-account="reset">Prototype-Daten zurücksetzen</button></div>');
 $$("[data-account]").forEach(b=>b.onclick=()=>accountAction(b.dataset.account))
}
function accountAction(a){
 if(a==="profile"){closeModal();openEditProfile()}
 if(a==="privacy"){openPrivacy()}
 if(a==="content"){openContentSettings()}
 if(a==="saved"){closeModal();openSaved()}
 if(a==="reset"){if(confirm("Alle lokalen Social-Prototyp-Daten zurücksetzen?")){localStorage.removeItem(STORE_KEY);location.reload()}}
}
function openPrivacy(){
 openModal('<span class="eyebrow">PRIVATSPHÄRE</span><h2>Social-Einstellungen</h2><div class="modal-form"><label>Direktnachrichten<select id="privacyDm"><option value="everyone">Alle</option><option value="following">Nur gefolgte Accounts</option><option value="none">Niemand</option></select></label><label>Mentions<select id="privacyMentions"><option value="everyone">Alle</option><option value="following">Nur gefolgte Accounts</option></select></label><label><input id="privacyActivity" type="checkbox"> Aktivitätsstatus anzeigen</label><button class="primary" id="savePrivacy">Speichern</button></div>');
 $("#privacyDm").value=state.privacy.dm;$("#privacyMentions").value=state.privacy.mentions;$("#privacyActivity").checked=state.privacy.activity;
 $("#savePrivacy").onclick=()=>{state.privacy={dm:$("#privacyDm").value,mentions:$("#privacyMentions").value,activity:$("#privacyActivity").checked};save();closeModal();toast("Privatsphäre gespeichert")}
}
function openContentSettings(){
 openModal('<span class="eyebrow">CONTENT</span><h2>Ausgeblendete Accounts</h2><p style="font-size:10px;color:var(--muted)">Stumm: '+[...state.muted].map(x=>esc(creator(x).name)).join(", ")||"keine"+'</p><p style="font-size:10px;color:var(--muted)">Blockiert: '+[...state.blocked].map(x=>esc(creator(x).name)).join(", ")||"keine"+'</p><button class="secondary" id="clearFilters">Alle Stummschaltungen und Blocks aufheben</button>');
 $("#clearFilters").onclick=()=>{state.muted.clear();state.blocked.clear();save();closeModal();renderFeed();renderSuggested();toast("Filter zurückgesetzt")}
}
function openSaved(){openModal('<span class="eyebrow">GESPEICHERT</span><h2>Gespeicherte Beiträge</h2><div>'+allPosts().filter(p=>state.saved.has(p.id)).map(postHtml).join("")||'<div class="explore-empty">Noch nichts gespeichert.</div>'+'</div>');bindPostActions()}

function openChallenge(){
 openModal('<span class="eyebrow">RAID-HERAUSFORDERUNG</span><h2>Creator herausfordern</h2><div class="modal-form"><label>Gegner<select id="challengeOpponent">'+baseCreators.map(c=>'<option value="'+c.id+'">'+esc(c.name)+' · '+esc(c.team)+'</option>').join("")+'</select></label><label>Dauer<select id="challengeDuration"><option>10 Minuten</option><option>5 Minuten</option><option>15 Minuten</option></select></label><label>Start<input id="challengeTime" type="datetime-local"></label><button class="primary" id="sendChallenge">HERAUSFORDERUNG SENDEN</button></div>');
 $("#sendChallenge").onclick=()=>{const opp=creator($("#challengeOpponent").value);state.readNotifications.delete("0");save();closeModal();toast("Raid-Anfrage an "+opp.name+" gesendet")}
}

function renderCreatorSettings(){
 $("#creatorNameSetting").value=state.communitySettings.name;$("#creatorCodeSetting").value=state.communitySettings.code;$("#creatorDescSetting").value=state.communitySettings.desc;
 $$("[data-setting-toggle]").forEach(b=>b.classList.toggle("on",Boolean(state.communitySettings[b.dataset.settingToggle])));
 renderModerationCounts();
}
function renderModerationCounts(){
 if($("#wordFilterCount"))$("#wordFilterCount").textContent=state.wordFilter.length+" Begriffe blockiert";
 if($("#modCount"))$("#modCount").textContent=state.moderators.length+" Team-Mitglieder";
 if($("#reportCount"))$("#reportCount").textContent=state.reports.filter(r=>r.status==="offen").length+" offen";
 if($("#blockedCount"))$("#blockedCount").textContent=state.blocked.size+" Accounts";
}
function openModeration(type){
 if(type==="words"){
  openModal('<span class="eyebrow">MODERATION</span><h2>Wortfilter</h2><div id="wordList">'+state.wordFilter.map((w,i)=>'<button class="secondary" data-remove-word="'+i+'" style="margin:3px">'+esc(w)+' ×</button>').join("")+'</div><div class="modal-form" style="margin-top:10px"><input id="newWord" placeholder="Neuer Begriff"><button class="primary" id="addWord">Hinzufügen</button></div>');
  $$("[data-remove-word]").forEach(b=>b.onclick=()=>{state.wordFilter.splice(Number(b.dataset.removeWord),1);save();openModeration("words");renderModerationCounts()});
  $("#addWord").onclick=()=>{const w=$("#newWord").value.trim().toLowerCase();if(w&&!state.wordFilter.includes(w)){state.wordFilter.push(w);save();openModeration("words");renderModerationCounts()}}
 }
 if(type==="mods"){
  openModal('<span class="eyebrow">MODERATION</span><h2>Moderatoren</h2><div>'+state.moderators.map((m,i)=>'<button class="secondary" data-remove-mod="'+i+'" style="margin:3px">'+esc(m)+' ×</button>').join("")+'</div><div class="modal-form" style="margin-top:10px"><input id="newMod" placeholder="@Benutzername"><button class="primary" id="addMod">Moderator hinzufügen</button></div>');
  $$("[data-remove-mod]").forEach(b=>b.onclick=()=>{state.moderators.splice(Number(b.dataset.removeMod),1);save();openModeration("mods");renderModerationCounts()});
  $("#addMod").onclick=()=>{const m=$("#newMod").value.trim();if(m){state.moderators.push(m);save();openModeration("mods");renderModerationCounts()}}
 }
 if(type==="reports"){
  openModal('<span class="eyebrow">MODERATION</span><h2>Reports</h2><div style="display:grid;gap:7px">'+(state.reports.length?state.reports.map((r,i)=>'<div class="card" style="padding:10px"><strong>'+esc(creator(r.creator).name)+'</strong><p style="font-size:9px;color:var(--muted)">'+esc(r.reason)+' · '+esc(r.status)+'</p>'+(r.status==="offen"?'<button class="secondary" data-resolve="'+i+'">Als geprüft markieren</button>':'')+'</div>').join(""):'<div class="explore-empty">Keine Reports.</div>')+'</div>');
  $$("[data-resolve]").forEach(b=>b.onclick=()=>{state.reports[Number(b.dataset.resolve)].status="geprüft";save();openModeration("reports");renderModerationCounts()})
 }
 if(type==="blocked"){
  openModal('<span class="eyebrow">MODERATION</span><h2>Geblockte Nutzer</h2><div style="display:grid;gap:7px">'+([...state.blocked].length?[...state.blocked].map(id=>'<button class="secondary" data-unblock="'+id+'">'+esc(creator(id).name)+' · Entblocken</button>').join(""):'<div class="explore-empty">Keine geblockten Accounts.</div>')+'</div>');
  $$("[data-unblock]").forEach(b=>b.onclick=()=>{state.blocked.delete(b.dataset.unblock);save();openModeration("blocked");renderModerationCounts();renderFeed();renderSuggested()})
 }
}

function openTool(tool){
 if(tool==="overlay"){
  const url=location.origin+"/social-raid-overlay.html";
  openModal('<span class="eyebrow">OBS TOOL</span><h2>Battle Overlay</h2><p style="font-size:10px;color:var(--muted)">Für die Prototype-Vorschau öffnet sich das Overlay in einem neuen Tab. Die Werte synchronisieren sich innerhalb desselben Browser-Profils.</p><div class="overlay-url"><input id="overlayUrl" readonly value="'+esc(url)+'"><button class="secondary" id="copyOverlayUrl">Kopieren</button></div><button class="primary" id="openOverlayPreview" style="margin-top:10px">OVERLAY ÖFFNEN</button>');
  $("#copyOverlayUrl").onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Overlay-URL kopiert")}catch{toast("URL markieren und kopieren")}};
  $("#openOverlayPreview").onclick=()=>window.open(url,"_blank","noopener");
 }
 if(tool==="goal"){
  openModal('<span class="eyebrow">STREAM TOOL</span><h2>Community-Ziel</h2><div class="modal-form"><label>Ziel-Welten<input id="goalInput" type="number" min="1000" step="1000" value="'+state.communityGoal+'"></label><div class="goal-progress"><i style="width:'+Math.min(100,928400000/state.communityGoal*100)+'%"></i></div><button class="primary" id="saveGoal">Ziel aktivieren</button></div>');
  $("#saveGoal").onclick=()=>{state.communityGoal=Math.max(1000,Number($("#goalInput").value)||1000);save();closeModal();toast("Community-Ziel gespeichert")}
 }
 if(tool==="boss"){
  const active=state.boss&&state.boss.hp>0&&state.boss.endsAt>Date.now();
  openModal('<span class="eyebrow">COMMUNITY EVENT</span><h2>Boss Event</h2>'+(active?'<div class="boss-card"><strong>'+esc(state.boss.name)+'</strong><div class="boss-hp"><i style="width:'+Math.max(0,state.boss.hp/state.boss.maxHp*100)+'%"></i></div><small>'+fmt(state.boss.hp)+' / '+fmt(state.boss.maxHp)+' HP</small></div><button class="secondary danger" id="stopBoss" style="margin-top:10px">Event beenden</button>':'<div class="modal-form"><label>Boss-Name<input id="bossName" value="Weltenfresser"></label><label>HP<input id="bossHp" type="number" value="5000000" min="1000"></label><label>Dauer<select id="bossDuration"><option value="600">10 Minuten</option><option value="900">15 Minuten</option><option value="1800">30 Minuten</option></select></label><button class="primary" id="startBoss">BOSS STARTEN</button></div>'));
  if($("#startBoss"))$("#startBoss").onclick=()=>{const hp=Math.max(1000,Number($("#bossHp").value)||5000000);state.boss={name:$("#bossName").value.trim()||"Weltenfresser",hp,maxHp:hp,endsAt:Date.now()+Number($("#bossDuration").value)*1000};save();closeModal();toast("Boss-Event gestartet")};
  if($("#stopBoss"))$("#stopBoss").onclick=()=>{state.boss=null;save();closeModal();toast("Boss-Event beendet")}
 }
 if(tool==="raid")openChallenge();
}

function renderAccount(){
 $$(".avatar-you").forEach(x=>x.textContent=state.self.initial);
 const block=$("#accountMini>div:nth-child(2)");if(block)block.innerHTML='<strong>'+esc(state.self.name)+'</strong><span>'+esc(state.self.handle)+'</span>';
 const identity=$(".creator-identity>div:nth-child(2)");if(identity)identity.innerHTML='<span class="verified-line">✓ TWITCH CREATOR · DEMO</span><h2>'+esc(state.self.handle.replace("@",""))+'</h2><p>Community Owner · #'+esc(state.communitySettings.code)+' · 6.842 Mitglieder</p>';
}
function renderCommunitySettingsElsewhere(){
 const mc=$(".my-community .community-main");if(mc)mc.innerHTML='<span class="verified-line">DEIN TEAM · TWITCH VERIFIZIERT ✓ · DEMO</span><h2>'+esc(state.communitySettings.name)+'</h2><p>'+esc(state.communitySettings.desc)+'</p><div class="community-stats"><span><b>28,4K</b> Mitglieder</span><span><b>3,92B</b> Welten</span><span><b>18–3</b> Raids</span></div>';
}

function renderRaid(){
 const baseA=18429210+state.raidBonusA,baseB=17981443;
 const total=baseA+baseB,pct=total?baseA/total*100:50,delta=Math.abs(baseA-baseB);
 $("#raidScoreA").textContent=fmt(baseA);$("#raidScoreB").textContent=fmt(baseB);$("#raidMeter").style.width=pct+"%";
 $("#raidDelta").innerHTML=(baseA>=baseB?"Team Nova":"Ashen Army")+" führt mit <strong>"+fmt(delta)+"</strong> Welten";
 const left=Math.max(0,state.raidEndsAt-Date.now()),sec=Math.ceil(left/1000),m=Math.floor(sec/60),s=sec%60;
 $("#raidLiveText").textContent=left>0?"● LIVE RAID · "+String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")+" RESTZEIT":"● RAID BEENDET";
 $("#joinRaid").textContent=state.raidJoined?"✓ DU KÄMPFST FÜR TEAM NOVA":"FÜR TEAM NOVA KÄMPFEN";
 $("#watchRaid").textContent=state.raidWatching?"✓ Raid wird verfolgt":"Raid verfolgen";
 let contrib=$(".raid-contribution");if(!contrib){contrib=document.createElement("div");contrib.className="raid-contribution";$("#raidDelta").after(contrib)}contrib.textContent=state.raidJoined?"Dein Beitrag: "+fmt(state.raidContribution)+" Welten":"";
 $$("[data-raid-reminder]").forEach(b=>{const on=state.reminders.has(b.dataset.raidReminder);b.textContent=on?"✓ Erinnerung aktiv":"Erinnern"})
}
setInterval(renderRaid,1000);

function sessionId(){
 let id=sessionStorage.getItem("wc_session_id")||localStorage.getItem("wc_session_id")||sessionStorage.getItem(SESSION_KEY);
 if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,id)}
 game.sessionId=id;return id;
}
async function gameApi(action,extra={}){
 if(!CONFIG.supabaseUrl||!CONFIG.supabasePublishableKey)throw new Error("CONFIG_MISSING");
 const r=await fetch(CONFIG.supabaseUrl+"/functions/v1/world-game",{method:"POST",headers:{"Content-Type":"application/json","apikey":CONFIG.supabasePublishableKey},body:JSON.stringify({action,sessionId:sessionId(),...extra})});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"GAME_ERROR");return data;
}
async function loadGame(){
 try{const d=await gameApi("state");game.globalCount=Number(d.global_count||0);game.clickPower=Number(d.click_power||1);game.ready=true;renderGame()}catch(e){$("#prototypeGameStatus").textContent="Live-Zähler vorübergehend nicht erreichbar";$("#prototypeClick").disabled=true}
}
function renderGame(){
 $("#prototypeWorlds").textContent=fmt(game.globalCount);$("#prototypeClick").textContent="+"+fmt(game.clickPower)+" WELT"+(game.clickPower===1?"":"EN");$("#prototypeClick").disabled=!game.ready||game.busy;$("#prototypeGameStatus").textContent="Echter Weltenclicker-Zähler · Klick zählt global";
}
async function clickGame(){
 if(!game.ready||game.busy)return;game.busy=true;renderGame();
 try{
   const d=await gameApi("click",{clicks:1});game.globalCount=Number(d.global_count||game.globalCount);game.clickPower=Number(d.click_power||game.clickPower);
   if(state.raidJoined){state.raidContribution+=game.clickPower;state.raidBonusA+=game.clickPower}
   if(state.boss&&state.boss.hp>0&&state.boss.endsAt>Date.now()){state.boss.hp=Math.max(0,state.boss.hp-game.clickPower);if(state.boss.hp===0)toast("Boss besiegt!")}
   save();renderRaid();toast("+"+fmt(game.clickPower)+" globale Welt"+(game.clickPower===1?"":"en"))
 }catch(e){toast("Klick konnte nicht gespeichert werden")}
 finally{game.busy=false;renderGame()}
}

function newMessage(){
 openModal('<span class="eyebrow">NEUE NACHRICHT</span><h2>Unterhaltung starten</h2><div class="modal-form"><label>Empfänger<select id="dmRecipient">'+baseCreators.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("")+'</select></label><label>Nachricht<textarea id="dmStart"></textarea></label><button class="primary" id="dmCreate">SENDEN</button></div>');
 $("#dmCreate").onclick=()=>{const id=$("#dmRecipient").value,c=creator(id),txt=$("#dmStart").value.trim();if(!txt)return;const existing=getConversation(id)||{name:c.name,initial:c.initial,preview:"",messages:[]};existing.messages=[...(existing.messages||[]),["me",txt]];existing.preview=txt;saveConversation(id,existing);state.currentChat=id;save();closeModal();renderMessages();switchView("messages");toast("Nachricht gesendet")}
}

function updateStaticActions(){
 $("#prototypeClick").onclick=clickGame;
 $("#openComposer").onclick=openComposer;$("#inlineCompose").onclick=openComposer;$("#quickWorldPost").onclick=()=>{openComposer();setTimeout(()=>{$("#composeText").value="Gerade einen neuen Weltenclicker-Meilenstein erreicht! 🌍 #RoadTo1B";$("#composeText").dispatchEvent(new Event("input"))},30)};
 $("#markRead").onclick=()=>{notificationSeed.forEach((_,i)=>state.readNotifications.add(String(i)));save();renderNotifications();toast("Alles als gelesen markiert")};
 $("#chatForm").onsubmit=e=>{e.preventDefault();const inp=$("#chatText"),txt=inp.value.trim();if(!txt)return;const c=getConversation(state.currentChat);c.messages.push(["me",txt]);c.preview=txt;saveConversation(state.currentChat,c);inp.value="";renderMessages()};
 $("#challengeCreator").onclick=openChallenge;
 $("#joinRaid").onclick=()=>{state.raidJoined=!state.raidJoined;save();renderRaid();toast(state.raidJoined?"Du kämpfst jetzt für Team Nova":"Raid verlassen")};
 $("#watchRaid").onclick=()=>{state.raidWatching=!state.raidWatching;save();renderRaid();toast(state.raidWatching?"Raid-Beobachtung aktiviert":"Raid-Beobachtung beendet")};
 $$("[data-raid-reminder]").forEach(b=>b.onclick=()=>{toggleSet(state.reminders,b.dataset.raidReminder);renderRaid();toast(state.reminders.has(b.dataset.raidReminder)?"Raid-Erinnerung gesetzt":"Erinnerung entfernt")});
 $("#accountMenu").onclick=e=>{e.stopPropagation();openAccountMenu()};$("#accountMini").onclick=e=>{if(e.target.id!=="accountMenu")renderProfile("you")};$("#accountMini").onkeydown=e=>{if(e.key==="Enter")renderProfile("you")};
 $("#newMessage").onclick=newMessage;$("#openMyCommunity").onclick=()=>openModal('<span class="eyebrow">DEINE COMMUNITY</span><h2>'+esc(state.communitySettings.name)+'</h2><p>'+esc(state.communitySettings.desc)+'</p><div class="community-stats"><span><b>28,4K</b> Mitglieder</span><span><b>3,92B</b> Welten</span><span><b>18–3</b> Raids</span></div><button class="primary" id="manageCommunity" style="margin-top:12px">IM CREATOR HUB VERWALTEN</button>');document.addEventListener("click",e=>{if(e.target?.id==="manageCommunity"){closeModal();switchView("creator")}});
 $$("[data-tool]").forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
 $$("[data-setting-toggle]").forEach(b=>b.onclick=()=>{const k=b.dataset.settingToggle;state.communitySettings[k]=!state.communitySettings[k];save();renderCreatorSettings()});
 $("#saveCreatorSettings").onclick=()=>{const name=$("#creatorNameSetting").value.trim(),code=$("#creatorCodeSetting").value.trim().toUpperCase(),desc=$("#creatorDescSetting").value.trim();if(name.length<3||!/^[A-Z0-9_]{3,20}$/.test(code)){toast("Name oder Code ungültig");return}state.communitySettings={...state.communitySettings,name,code,desc};save();renderAccount();renderCommunitySettingsElsewhere();toast("Community gespeichert")};
 $$("[data-mod]").forEach(b=>b.onclick=()=>openModeration(b.dataset.mod));
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
$$(".feed-tab").forEach(b=>b.onclick=()=>{$$(".feed-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.feed=b.dataset.feed;save();renderFeed()});
$$("[data-profile]").forEach(b=>b.onclick=()=>renderProfile(b.dataset.profile));
$$("[data-modal-close]").forEach(x=>x.onclick=closeModal);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal()});
$("#exploreSearch").oninput=()=>renderExplore();
$("#globalSearch").onkeydown=e=>{if(e.key==="Enter"){switchView("explore");$("#exploreSearch").value=e.target.value;renderExplore();setTimeout(()=>$("#exploreSearch").focus(),50)}};
$$("[data-explore-filter]").forEach(b=>b.onclick=()=>{$$("[data-explore-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderExplore()});

renderAccount();renderCommunitySettingsElsewhere();renderFeed();renderCreators();renderCommunities();renderSuggested();renderNotifications();renderMessages();renderCreatorSettings();renderRaid();updateStaticActions();loadGame();
const initialHash=location.hash.slice(1);if(initialHash&&$("#view-"+initialHash))switchView(initialHash,{push:false});
