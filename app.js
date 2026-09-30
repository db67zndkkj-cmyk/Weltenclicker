const CONFIG = window.WELTENCLICKER_CONFIG || {};

const hasSupabaseConfig = Boolean(
  CONFIG.supabaseUrl &&
  CONFIG.supabasePublishableKey &&
  !CONFIG.supabaseUrl.includes("DEINE_") &&
  !CONFIG.supabasePublishableKey.includes("DEIN_")
);

const upgrades = [
  { id: "hands", icon: "🖱️", name: "Schnellere Hände", desc: "+1 Welt pro Klick", baseCost: 25, growth: 1.7, power: 1 },
  { id: "portal", icon: "🌀", name: "Mikro-Portal", desc: "+5 Welten pro Klick", baseCost: 160, growth: 1.85, power: 5 },
  { id: "reactor", icon: "⚛️", name: "Weltenreaktor", desc: "+25 Welten pro Klick", baseCost: 900, growth: 1.95, power: 25 },
  { id: "multiverse", icon: "🌌", name: "Multiversum", desc: "+150 Welten pro Klick", baseCost: 7000, growth: 2.05, power: 150 }
];

const $ = id => document.getElementById(id);

function makeSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const state = {
  sessionId: localStorage.getItem("wc_session_id") || makeSessionId(),
  globalCount: 0,
  personalWorlds: 0,
  energy: 0,
  sessionWorlds: 0,
  upgrades: { hands: 0, portal: 0, reactor: 0, multiverse: 0 },
  clickPower: 1,
  pendingClicks: 0,
  sendingClicks: 0,
  online: false,
  ready: false,
  flushTimer: null,
  retryTimer: null
};

localStorage.setItem("wc_session_id", state.sessionId);

function formatNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  if (n < 1_000_000) return new Intl.NumberFormat("de-DE").format(Math.floor(n));

  const units = [
    [1e30, "Nonillion"], [1e27, "Oktillion"], [1e24, "Septillion"],
    [1e21, "Sextillion"], [1e18, "Trillion"], [1e15, "Billiarde"],
    [1e12, "Billion"], [1e9, "Milliarde"], [1e6, "Million"]
  ];

  for (const [limit, label] of units) {
    if (n >= limit) {
      const v = n / limit;
      return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)} ${label}`;
    }
  }
  return String(Math.floor(n));
}

function getLevel(id) {
  return Number(state.upgrades?.[id] || 0);
}

function getCost(item) {
  return Math.floor(item.baseCost * Math.pow(item.growth, getLevel(item.id)));
}

function setStatus(mode, text) {
  const dot = $("statusDot");
  dot.classList.remove("online", "offline");
  if (mode === "online") dot.classList.add("online");
  if (mode === "offline") dot.classList.add("offline");
  $("statusText").textContent = text;
}

function render() {
  $("globalCount").textContent = formatNumber(state.globalCount);
  $("personalClicks").textContent = formatNumber(state.personalWorlds);
  $("energy").textContent = formatNumber(state.energy);
  $("sessionClicks").textContent = formatNumber(state.sessionWorlds);
  $("powerDisplay").textContent = formatNumber(state.clickPower);
  $("clickPower").textContent = formatNumber(state.clickPower);

  const busy = !state.ready || state.sendingClicks > 0 || state.pendingClicks > 0;

  $("shop").innerHTML = upgrades.map(item => {
    const level = getLevel(item.id);
    const cost = getCost(item);
    return `
      <button class="upgrade" data-upgrade="${item.id}" ${(state.energy < cost || busy) ? "disabled" : ""}>
        <span class="upgrade-icon">${item.icon}</span>
        <span>
          <span class="upgrade-title">${item.name}</span>
          <span class="upgrade-desc">${item.desc}</span>
          <span class="upgrade-level">Level ${level}</span>
        </span>
        <span class="upgrade-price">${formatNumber(cost)} ⚡</span>
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-upgrade]").forEach(button => {
    button.addEventListener("click", () => buyUpgrade(button.dataset.upgrade));
  });
}

function animateClick(amount) {
  const el = document.createElement("span");
  el.className = "floating-plus";
  el.textContent = `+${formatNumber(amount)}`;
  el.style.left = `${44 + Math.random() * 12}%`;
  el.style.top = `${48 + Math.random() * 10}%`;
  $("clickBurst").appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function applyServerState(data) {
  if (!data) return;
  state.globalCount = Number(data.global_count || 0);
  state.personalWorlds = Number(data.personal_worlds || 0);
  state.energy = Number(data.energy || 0);
  state.upgrades = data.upgrades || state.upgrades;
  state.clickPower = Number(data.click_power || 1);
  state.ready = true;
}

async function gameApi(action, extra = {}) {
  if (!hasSupabaseConfig) throw new Error("Supabase-Konfiguration fehlt");

  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/world-game`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": CONFIG.supabasePublishableKey
    },
    body: JSON.stringify({
      action,
      sessionId: state.sessionId,
      ...extra
    })
  });

  let body = {};
  try { body = await response.json(); } catch (_) {}

  if (!response.ok) {
    const error = new Error(body?.error || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

function scheduleFlush(delay = 90) {
  clearTimeout(state.flushTimer);
  state.flushTimer = setTimeout(() => flushClicks(), delay);
}

function scheduleRetry() {
  clearTimeout(state.retryTimer);
  state.retryTimer = setTimeout(async () => {
    if (state.pendingClicks > 0 && state.sendingClicks === 0) await flushClicks();
    else if (!state.online) await loadState();
  }, 2500);
}

async function flushClicks() {
  if (!state.ready || state.sendingClicks > 0 || state.pendingClicks <= 0) return;

  const batch = Math.min(25, state.pendingClicks);
  state.pendingClicks -= batch;
  state.sendingClicks = batch;
  render();

  try {
    const data = await gameApi("click", { clicks: batch });
    applyServerState(data);
    state.online = true;
    setStatus("online", "Global live verbunden");
    $("footerState").textContent = "Serverseitig geschützt • Live-Synchronisierung aktiv";
  } catch (err) {
    console.error(err);
    state.pendingClicks += batch;
    state.online = false;

    if (err.status === 429 || err.message === "RATE_LIMIT") {
      setStatus("offline", "Sehr viele Klicks • kurze Serverpause");
      $("footerState").textContent = "Rate-Limit aktiv • Klicks bleiben vorgemerkt";
    } else {
      setStatus("offline", "Verbindung unterbrochen • Klicks warten");
      $("footerState").textContent = "Wiederverbindung wird versucht";
    }
    scheduleRetry();
  } finally {
    state.sendingClicks = 0;
    render();
  }

  if (state.pendingClicks > 0 && state.online) scheduleFlush(120);
}

function createWorld() {
  if (!state.ready) return;

  const amount = state.clickPower;
  state.personalWorlds += amount;
  state.energy += amount;
  state.sessionWorlds += amount;
  state.globalCount += amount;
  state.pendingClicks += 1;

  animateClick(amount);
  render();
  scheduleFlush();
}

async function buyUpgrade(id) {
  const item = upgrades.find(u => u.id === id);
  if (!item || !state.ready || state.pendingClicks > 0 || state.sendingClicks > 0) return;

  try {
    const data = await gameApi("buy", { upgrade: id });
    applyServerState(data);
    state.online = true;
    render();
  } catch (err) {
    console.error(err);
    if (err.status === 409 || err.message === "NOT_ENOUGH_ENERGY") {
      setStatus("online", "Nicht genug Energie für dieses Upgrade");
    } else {
      state.online = false;
      setStatus("offline", "Upgrade konnte nicht gespeichert werden");
      scheduleRetry();
    }
  }
}

let supabaseClient = null;
let realtimeChannel = null;

async function loadState() {
  if (!hasSupabaseConfig || !window.supabase) {
    setStatus("offline", "Supabase-Konfiguration fehlt");
    $("footerState").textContent = "Nicht verbunden";
    render();
    return;
  }

  try {
    const data = await gameApi("state");
    applyServerState(data);
    state.online = true;
    setStatus("online", "Global live verbunden");
    $("footerState").textContent = "Serverseitig geschützt • Live-Synchronisierung aktiv";
    render();
  } catch (err) {
    console.error(err);
    state.online = false;
    setStatus("offline", "Verbindung fehlgeschlagen • erneuter Versuch läuft");
    $("footerState").textContent = "Wiederverbindung wird versucht";
    render();
    scheduleRetry();
  }
}

function initRealtime() {
  if (!hasSupabaseConfig || !window.supabase) return;

  supabaseClient = window.supabase.createClient(
    CONFIG.supabaseUrl,
    CONFIG.supabasePublishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  realtimeChannel = supabaseClient
    .channel("weltenclicker-live")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "world_counter", filter: "id=eq.1" },
      payload => {
        const serverGlobal = Number(payload.new?.count || 0);
        if (!Number.isFinite(serverGlobal)) return;
        const optimisticWorlds = state.pendingClicks * state.clickPower;
        state.globalCount = Math.max(state.globalCount, serverGlobal + optimisticWorlds);
        render();
      }
    )
    .subscribe();
}

$("worldButton").addEventListener("click", createWorld);
$("mainClickButton").addEventListener("click", createWorld);

document.addEventListener("keydown", event => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    createWorld();
  }
});

window.addEventListener("beforeunload", () => {
  try {
    if (realtimeChannel && supabaseClient) supabaseClient.removeChannel(realtimeChannel);
  } catch (_) {}
});

render();
initRealtime();
loadState();
