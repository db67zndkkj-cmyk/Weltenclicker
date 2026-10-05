const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={view:"home",feed:"for-you",worlds:842193447,following:new Set(["nova"]),joined:new Set(["nova"]),liked:new Set(),saved:new Set(),reposted:new Set(),notificationsUnread:true,currentChat:"nova"};

const creators=[
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
let posts=[
{id:"p1",creator:"nova",time:"2 Min.",type:"clip",text:"DAS war gerade der knappste Lead-Change des Abends 😭 Team Nova, wir brauchen euch in 10 Minuten wieder. <a>#WorldWar</a> <a>#TeamNova</a>",likes:1832,comments:142,reposts:318,views:"44K"},
{id:"p2",creator:"ash",time:"8 Min.",type:"raid",text:"OFFIZIELL: Ashen Army akzeptiert die Revanche. Heute 21:30. 10 Minuten. Keine Multiplikatoren. Nur Community gegen Community.",likes:914,comments:211,reposts:174,views:"28K"},
{id:"p3",creator:"orb",time:"21 Min.",type:"text",text:"Wir haben gerade 2.000.000.000 Team-Welten geknackt. Was zur Hölle. Danke an jeden einzelnen von euch. 🚀",likes:2241,comments:188,reposts:96,views:"31K"},
{id:"p4",creator:"moss",time:"42 Min.",type:"quote",text:"Hot Take: Community-Bosse sollten stärker skalieren, wenn mehr Leute gleichzeitig online sind. Sonst schmelzen große Teams sie in Sekunden.",likes:511,comments:87,reposts:44,views:"9K"}
];
const notifications=[
{icon:"⚔",text:"Team Nova hat eine Raid-Herausforderung von Ashen Army angenommen.",time:"vor 2 Min.",unread:true},
{icon:"♥",text:"NovaNeko und 18 weitere Personen gefällt dein Beitrag.",time:"vor 11 Min.",unread:true},
{icon:"＋",text:"OrbitalJonas folgt dir jetzt.",time:"vor 26 Min.",unread:true},
{icon:"◎",text:"Deine Community hat den Meilenstein 900 Mio. Welten erreicht.",time:"vor 1 Std.",unread:true},
{icon:"✦",text:"Du hast das Achievement „Veteran der 10. Ära“ freigeschaltet.",time:"vor 3 Std.",unread:true},
{icon:"↻",text:"AshenTV hat deinen Beitrag repostet.",time:"gestern",unread:false}
];
const conversations={
nova:{name:"NovaNeko",initial:"N",preview:"Können wir Freitag 20 Uhr festmachen?",messages:[["them","Hey! GG beim Raid gestern 😄"],["me","GG, das Ende war komplett absurd."],["them","Können wir Freitag 20 Uhr festmachen?"]]},
ash:{name:"AshenTV",initial:"A",preview:"10 Minuten, Standardregeln?",messages:[["them","Wollt ihr eine Revanche?"],["me","Auf jeden Fall."],["them","10 Minuten, Standardregeln?"]]},
mod:{name:"WC Moderation",initial:"W",preview:"Dein Report wurde geprüft.",messages:[["them","Dein Report wurde geprüft. Danke für deine Meldung."]]}
};

function fmt(n){return new Intl.NumberFormat("de-DE").format(n)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1700)}
function creator(id){return creators.find(x=>x.id===id)||creators[0]}

function switchView(view){
 state.view=view;
 $$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
 $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="notifications") renderNotifications();
 if(view==="messages") renderMessages();
 window.scrollTo({top:0,behavior:"smooth"});
}
function renderFeed(){
 const feed=$("#feed");let list=[...posts];
 if(state.feed==="following")list=list.filter(p=>state.following.has(p.creator));
 if(state.feed==="live")list=list.filter(p=>creator(p.creator).live);
 feed.innerHTML=list.map(postHtml).join("");
 bindPostActions();
}
function mediaHtml(p){
 if(p.type==="clip")return '<div class="post-media"><div class="planet-demo"></div><button class="play">▶</button><div class="clip-overlay"><span>RAID CLIP · 0:27</span><span>44.182 Aufrufe</span></div></div>';
 if(p.type==="raid")return '<div class="raid-post-card"><div class="teams"><div><b>Team Nova</b><small>18–3</small></div><strong>⚔</strong><div><b>Ashen Army</b><small>17–4</small></div></div><div class="battle-meter" style="margin-top:12px"><i style="width:50%"></i></div><small style="display:block;text-align:center;margin-top:8px;color:#9099ba">HEUTE · 21:30 · 10 MINUTEN</small></div>';
 if(p.type==="quote")return '<div class="quoted-post"><strong>@RaidMaster</strong><p>Wie schwer sollten Community-Bosse wirklich sein?</p></div>';
 return "";
}
function postHtml(p){
 const c=creator(p.creator),liked=state.liked.has(p.id),saved=state.saved.has(p.id),reposted=state.reposted.has(p.id);
 return '<article class="post" data-post="'+p.id+'"><div class="avatar post-avatar">'+c.initial+'</div><div><div class="post-head"><div class="post-user"><strong>'+c.name+'</strong><span class="verified">✓</span><span>'+c.handle+'</span><span>· '+p.time+'</span></div><button class="post-menu" data-menu="'+p.id+'">•••</button></div><div class="post-copy">'+p.text+'</div>'+mediaHtml(p)+'<div class="post-actions"><button class="post-action" data-comment="'+p.id+'">◯ '+p.comments+'</button><button class="post-action '+(reposted?"saved":"")+'" data-repost="'+p.id+'">↻ '+(p.reposts+(reposted?1:0))+'</button><button class="post-action '+(liked?"liked":"")+'" data-like="'+p.id+'">♥ '+(p.likes+(liked?1:0))+'</button><button class="post-action" data-share="'+p.id+'">⌁ '+p.views+'</button><button class="post-action '+(saved?"saved":"")+'" data-save="'+p.id+'">▱</button></div></div></article>';
}
function bindPostActions(){
 $$("[data-like]").forEach(b=>b.onclick=()=>{toggleSet(state.liked,b.dataset.like);renderFeed()});
 $$("[data-save]").forEach(b=>b.onclick=()=>{toggleSet(state.saved,b.dataset.save);toast(state.saved.has(b.dataset.save)?"Gespeichert":"Aus Gespeichert entfernt");renderFeed()});
 $$("[data-repost]").forEach(b=>b.onclick=()=>{toggleSet(state.reposted,b.dataset.repost);toast("Repost aktualisiert");renderFeed()});
 $$("[data-share]").forEach(b=>b.onclick=()=>toast("Link in Zwischenablage kopiert"));
 $$("[data-comment]").forEach(b=>b.onclick=()=>openComment(b.dataset.comment));
 $$("[data-menu]").forEach(b=>b.onclick=()=>openPostMenu(b.dataset.menu));
}
function toggleSet(set,id){set.has(id)?set.delete(id):set.add(id)}

function renderCreators(){
 $("#creatorGrid").innerHTML=creators.map(c=>'<article class="creator-card card" data-search="'+(c.name+" "+c.handle+" "+c.team).toLowerCase()+'"><div class="creator-cover"></div><div class="avatar">'+c.initial+'</div><h3>'+c.name+' <span class="verified">✓</span></h3><p>'+c.handle+' · '+c.followers+' Follower<br>'+c.bio+'</p><button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" data-follow="'+c.id+'">'+(state.following.has(c.id)?"Folge ich":"Folgen")+'</button></article>').join("");
 $$("[data-follow]").forEach(b=>b.onclick=()=>{toggleSet(state.following,b.dataset.follow);renderCreators();renderSuggested();toast(state.following.has(b.dataset.follow)?"Du folgst diesem Creator":"Nicht mehr abonniert")});
}
function renderCommunities(){
 $("#communityGrid").innerHTML=communities.slice(0,4).map(c=>communityCard(c)).join("");
 $("#communityList").innerHTML=communities.map(c=>'<article class="community-list-row card"><div class="team-emblem '+(c.id==="ash"?"red":"purple")+'">'+c.initial+'</div><div><strong>#'+c.rank+' · '+c.name+' <span class="verified">✓</span></strong><small>#'+c.code+' · '+fmt(c.members)+' Mitglieder · '+c.worlds+' Welten · '+c.raid+' Raids</small></div><button class="join-btn '+(state.joined.has(c.id)?"joined":"")+'" data-join="'+c.id+'">'+(state.joined.has(c.id)?"Beigetreten":"Beitreten")+'</button></article>').join("");
 $$("[data-join]").forEach(b=>b.onclick=()=>{toggleSet(state.joined,b.dataset.join);renderCommunities();toast(state.joined.has(b.dataset.join)?"Community beigetreten":"Community verlassen")});
}
function communityCard(c){return '<article class="community-card card" data-search="'+(c.name+" "+c.code).toLowerCase()+'"><div class="team-emblem '+(c.id==="ash"?"red":"purple")+'">'+c.initial+'</div><h3>'+c.name+' <span class="verified">✓</span></h3><p>#'+c.code+' · '+fmt(c.members)+' Mitglieder<br>'+c.desc+'</p><button class="join-btn '+(state.joined.has(c.id)?"joined":"")+'" data-join="'+c.id+'">'+(state.joined.has(c.id)?"Beigetreten":"Beitreten")+'</button></article>'}
function renderSuggested(){
 $("#suggestedUsers").innerHTML=creators.slice(1,4).map(c=>'<div class="suggest-user"><i class="avatar">'+c.initial+'</i><span><strong>'+c.name+' <span class="verified">✓</span></strong><small>'+c.team+'</small></span><button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" data-sfollow="'+c.id+'">'+(state.following.has(c.id)?"✓":"Folgen")+'</button></div>').join("");
 $$("[data-sfollow]").forEach(b=>b.onclick=()=>{toggleSet(state.following,b.dataset.sfollow);renderSuggested();renderCreators()});
}
function renderNotifications(){
 $("#notificationList").innerHTML=notifications.map((n,i)=>'<article class="notification '+(n.unread?"unread":"")+'"><div class="avatar">'+n.icon+'</div><div><p>'+n.text+'</p><small>'+n.time+'</small></div>'+(n.unread?'<i class="dot-unread"></i>':'')+'</article>').join("");
 $("#notifBadge").style.display=notifications.some(n=>n.unread)?"":"none";
}
function renderMessages(){
 $("#conversationList").innerHTML=Object.entries(conversations).map(([id,c])=>'<button class="conversation '+(state.currentChat===id?"active":"")+'" data-chat="'+id+'"><i class="avatar">'+c.initial+'</i><div><strong>'+c.name+'</strong><span>'+c.preview+'</span></div></button>').join("");
 $$("[data-chat]").forEach(b=>b.onclick=()=>{state.currentChat=b.dataset.chat;renderMessages()});
 const c=conversations[state.currentChat];$("#chatHeader").innerHTML='<strong>'+c.name+'</strong><span class="verified"> ✓</span>';
 $("#chatMessages").innerHTML=c.messages.map(m=>'<div class="bubble '+(m[0]==="me"?"me":"")+'">'+esc(m[1])+'</div>').join("");
}
function renderProfile(id){
 const c=creator(id);
 $("#profileContent").innerHTML='<article class="profile-hero card"><div class="profile-cover"></div><div class="profile-info"><div class="avatar">'+c.initial+'</div><div class="profile-title"><div><h2>'+c.name+' <span class="verified">✓</span></h2><p>'+c.handle+' · '+c.team+'</p></div><button class="follow-btn '+(state.following.has(c.id)?"following":"")+'" id="profileFollow">'+(state.following.has(c.id)?"Folge ich":"Folgen")+'</button></div><p class="profile-bio">'+c.bio+'</p><div class="profile-stats"><span><b>'+c.followers+'</b> Follower</span><span><b>481</b> Posts</span><span><b>18–3</b> Raids</span></div><div class="profile-tabs"><button class="active">Beiträge</button><button>Clips</button><button>Achievements</button><button>Über</button></div></div></article><div class="feed">'+posts.filter(p=>p.creator===id).map(postHtml).join("")+'</div>';
 $("#profileFollow").onclick=()=>{toggleSet(state.following,id);renderProfile(id);renderSuggested();renderCreators()};
 bindPostActions();switchView("profile");
}

function openModal(content){$("#modalBody").innerHTML=content;$("#modal").hidden=false;document.body.style.overflow="hidden"}
function closeModal(){$("#modal").hidden=true;document.body.style.overflow=""}
function openComposer(){
 openModal('<div class="compose-modal"><span class="eyebrow">NEUER POST</span><h2>Mit der Community teilen</h2><textarea id="composeText" maxlength="500" placeholder="Was passiert gerade in deiner Welt?"></textarea><div class="compose-tools"><button>▧ Clip</button><button>▦ Bild</button><button>◫ Umfrage</button><button>⚔ Raid</button><button>◎ Community</button></div><div class="compose-footer"><span>0 / 500</span><button id="publishPost" class="primary">POSTEN</button></div></div>');
 const ta=$("#composeText"),counter=$(".compose-footer span");ta.oninput=()=>counter.textContent=ta.value.length+" / 500";
 $("#publishPost").onclick=()=>{const text=ta.value.trim();if(!text)return;posts.unshift({id:"p"+Date.now(),creator:"orb",time:"Gerade eben",type:"text",text:esc(text),likes:0,comments:0,reposts:0,views:"0"});closeModal();state.feed="for-you";renderFeed();switchView("home");toast("Beitrag veröffentlicht (Demo)")};
 setTimeout(()=>ta.focus(),20)
}
function openComment(id){openModal('<span class="eyebrow">ANTWORT</span><h2>Kommentar schreiben</h2><textarea id="replyText" style="width:100%;height:100px;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:12px;color:#fff;padding:10px" placeholder="Deine Antwort …"></textarea><button class="primary" id="replySend" style="margin-top:10px">ANTWORTEN</button>');$("#replySend").onclick=()=>{closeModal();toast("Antwort veröffentlicht (Demo)")}}
function openPostMenu(id){openModal('<span class="eyebrow">BEITRAG</span><h2>Aktionen</h2><div style="display:grid;gap:7px"><button class="secondary modal-action">Nicht interessiert</button><button class="secondary modal-action">Nutzer stummschalten</button><button class="secondary modal-action">Nutzer blockieren</button><button class="secondary modal-action">Beitrag melden</button></div>');$$(".modal-action").forEach(b=>b.onclick=()=>{closeModal();toast(b.textContent+" (Demo)")})}
function openChallenge(){openModal('<span class="eyebrow">RAID-HERAUSFORDERUNG</span><h2>Creator herausfordern</h2><label style="display:block;font-size:10px;color:#9099ba">Gegner<input value="@AshenTV" style="display:block;width:100%;margin:5px 0 10px;padding:9px;border-radius:9px;border:1px solid var(--line);background:#0d142b;color:#fff"></label><label style="display:block;font-size:10px;color:#9099ba">Dauer<select style="display:block;width:100%;margin:5px 0 10px;padding:9px;border-radius:9px;background:#0d142b;color:#fff"><option>10 Minuten</option><option>5 Minuten</option><option>15 Minuten</option></select></label><button class="primary" id="sendChallenge">HERAUSFORDERUNG SENDEN</button>');$("#sendChallenge").onclick=()=>{closeModal();toast("Raid-Anfrage gesendet (Demo)")}}

$$("[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
$$(".feed-tab").forEach(b=>b.onclick=()=>{$$(".feed-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.feed=b.dataset.feed;renderFeed()});
$$("[data-profile]").forEach(b=>b.onclick=()=>renderProfile(b.dataset.profile));
$("#openComposer").onclick=openComposer;$("#inlineCompose").onclick=openComposer;$("#quickWorldPost").onclick=()=>{openComposer();setTimeout(()=>{$("#composeText").value="Gerade einen neuen Weltenclicker-Meilenstein erreicht! 🌍 #RoadTo1B";$("#composeText").dispatchEvent(new Event("input"))},30)};
$$("[data-modal-close]").forEach(x=>x.onclick=closeModal);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal()});
$("#prototypeClick").onclick=()=>{state.worlds++;$("#prototypeWorlds").textContent=fmt(state.worlds);toast("+1 globale Welt (Demo)")};
$("#markRead").onclick=()=>{notifications.forEach(n=>n.unread=false);renderNotifications();toast("Alles als gelesen markiert")};
$("#chatForm").onsubmit=e=>{e.preventDefault();const inp=$("#chatText"),txt=inp.value.trim();if(!txt)return;conversations[state.currentChat].messages.push(["me",txt]);inp.value="";renderMessages();setTimeout(()=>{$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight},0)};
$("#challengeCreator").onclick=openChallenge;$("#joinRaid").onclick=()=>toast("Du kämpfst jetzt für Team Nova (Demo)");$("#watchRaid").onclick=()=>toast("Raid-Beobachtung aktiviert");$$(".reminder-btn").forEach(b=>b.onclick=()=>{b.textContent="✓ Erinnerung aktiv";toast("Raid-Erinnerung gesetzt")});
$("#accountMenu").onclick=()=>openModal('<span class="eyebrow">ACCOUNT</span><h2>SaschaWorlds</h2><div style="display:grid;gap:7px"><button class="secondary">Profil bearbeiten</button><button class="secondary">Privatsphäre</button><button class="secondary">Sicherheit</button><button class="secondary">Content-Einstellungen</button><button class="secondary">Abmelden</button></div>');

$("#exploreSearch").oninput=e=>{const q=e.target.value.toLowerCase();$$("[data-search]").forEach(card=>card.style.display=card.dataset.search.includes(q)?"":"none")};
$("#globalSearch").onkeydown=e=>{if(e.key==="Enter"){switchView("explore");$("#exploreSearch").value=e.target.value;$("#exploreSearch").dispatchEvent(new Event("input"));setTimeout(()=>$("#exploreSearch").focus(),50)}};
$$("[data-explore-filter]").forEach(b=>b.onclick=()=>{$$("[data-explore-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");toast("Filter: "+b.textContent)});

renderFeed();renderCreators();renderCommunities();renderSuggested();renderNotifications();renderMessages();
