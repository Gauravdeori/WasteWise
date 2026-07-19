/* ================================================================
   Wastewize — IITG Waste Monitor (bento dashboard)
   ----------------------------------------------------------------
   • Login gate (demo auth, browser-only)
   • Bento layout: hostel rails + institute overview center
   • Tap any hostel card -> that hostel's own dashboard opens in
     the center (KPIs, trend, meals, scales, insights, activity);
     "← Overview" returns to the institute view
   • Live data via the Wastewize backend (/api/feeds); hostels
     without real data are simulated (config.DEMO_FILL)
   • field1 = weight (kg), field2 = hostel code (1..14)
   ================================================================ */
(function () {
  const CFG = window.FOODWATCH_CONFIG || {};
  const $ = id => document.getElementById(id);
  if (!$('dashApp')) return;

  const HOSTELS = CFG.HOSTELS || [];
  const PRICE = CFG.PRICE_PER_KG || 75;
  const CO2 = CFG.CO2_PER_KG || 2.5;
  const POP = CFG.HOSTEL_POPULATION || 450;
  const KG_MEAL = CFG.KG_PER_MEAL || 0.4;
  const API = (CFG.API_BASE || '').replace(/\/$/, '');
  const nf = n => Number(n).toLocaleString('en-IN');
  const pad = n => String(n).padStart(2, '0');
  const localKey = d => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  const sameDay = (a, b) => localKey(a) === localKey(b);
  const t12 = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const cap = s => s[0].toUpperCase() + s.slice(1);

  // Meal sessions (24h decimal hours)
  const MEALS = [
    { key: 'breakfast', name: 'Breakfast', start: 7.5, end: 10.5, range: '7:30 AM - 10:30 AM', startTxt: '7:30 AM' },
    { key: 'lunch', name: 'Lunch', start: 12, end: 15, range: '12:00 PM - 3:00 PM', startTxt: '12:00 PM' },
    { key: 'snacks', name: 'Snacks', start: 16, end: 18, range: '4:00 PM - 6:00 PM', startTxt: '4:00 PM' },
    { key: 'dinner', name: 'Dinner', start: 19, end: 22, range: '7:00 PM - 10:00 PM', startTxt: '7:00 PM' }
  ];
  const hourOf = d => d.getHours() + d.getMinutes() / 60;
  const mealOf = t => { const h = hourOf(t); return h < 11.25 ? 'breakfast' : h < 15.5 ? 'lunch' : h < 18.5 ? 'snacks' : 'dinner'; };
  const currentMeal = () => { const h = hourOf(new Date()); return MEALS.find(m => h >= m.start && h < m.end) || null; };
  const nextMeal = () => { const h = hourOf(new Date()); return MEALS.find(m => m.start > h) || MEALS[0]; };

  /* ---------------- AUTH ---------------- */
  const AUTH_KEY = 'foodwatch_auth';
  const ROLE_KEY = 'foodwatch_role';
  const TOKEN_KEY = 'foodwatch_token';
  const ACCOUNTS = CFG.ACCOUNTS || [];
  let role = 'admin';
  let adminToken = localStorage.getItem(TOKEN_KEY) || '';

  function applyRole(r) {
    role = (r === 'user') ? 'user' : 'admin';
    const app = $('dashApp');
    app.classList.toggle('role-user', role === 'user');
    app.classList.toggle('role-admin', role === 'admin');
    const chip = $('roleChip');
    if (chip) {
      chip.textContent = role === 'admin' ? 'Admin' : 'Viewer';
      chip.className = 'bn-role-chip ' + role;
      chip.hidden = false;
    }
    // writable actions require admin role AND a server-issued token
    $('addReadingBtn').hidden = !(serverConfig.writeEnabled && role === 'admin' && adminToken);
    $('resetBtn').hidden = !(role === 'admin' && adminToken);
  }

  function showApp(show) {
    $('dashLogin').hidden = show;
    $('dashApp').hidden = !show;
    const sec = $('dashboard');
    if (sec) {
      if (show) {
        sec.classList.remove('login-mode');
      } else {
        sec.classList.add('login-mode');
      }
    }
  }

  // Resolve a login: viewer accounts are checked in the browser; admin is
  // verified server-side (/api/login) which returns a token for writes.
  async function resolveLogin(u, p) {
    // Try server-side authentication first so we get the dynamic live token
    try {
      const r = await fetch(API + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
        cache: 'no-store'
      });
      if (r.ok) {
        const j = await r.json();
        return { role: j.role || 'admin', token: j.token || '' };
      }
    } catch (e) { /* server unreachable — fallback to local config */ }

    // Fallback to static accounts check
    const acct = ACCOUNTS.find(a => a.username === u && a.password === p);
    if (acct) return { role: acct.role, token: acct.token || '' };
    return null;
  }

  // Login Tabs Toggle
  const tabUser = $('tabUser');
  const tabAdmin = $('tabAdmin');
  const userPanel = $('userPanel');
  const adminPanel = $('adminPanel');

  tabUser.addEventListener('click', () => {
    tabUser.classList.add('active');
    tabAdmin.classList.remove('active');
    userPanel.hidden = false;
    adminPanel.hidden = true;
  });

  tabAdmin.addEventListener('click', () => {
    tabAdmin.classList.add('active');
    tabUser.classList.remove('active');
    adminPanel.hidden = false;
    userPanel.hidden = true;
  });

  // Placeholder SSO Login Handlers
  const handleSSOLogin = () => {
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(ROLE_KEY, 'user');
    localStorage.removeItem(TOKEN_KEY);
    applyRole('user');
    showApp(true); start();
  };

  $('btnGoogle').addEventListener('click', handleSSOLogin);
  $('btnApple').addEventListener('click', handleSSOLogin);

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('loginForm').querySelector('button[type="submit"]');
    const u = $('loginUser').value.trim();
    const p = $('loginPass').value;
    btn.disabled = true; $('loginErr').hidden = true;
    const res = await resolveLogin(u, p);
    btn.disabled = false;
    if (res) {
      adminToken = res.token || '';
      localStorage.setItem(AUTH_KEY, '1');
      localStorage.setItem(ROLE_KEY, res.role);
      if (adminToken) localStorage.setItem(TOKEN_KEY, adminToken);
      else localStorage.removeItem(TOKEN_KEY);
      applyRole(res.role);
      showApp(true); start();
    } else {
      $('loginErr').textContent = '✗ Invalid username or password.';
      $('loginErr').hidden = false;
    }
  });
  $('dashLogout').addEventListener('click', () => {
    adminToken = '';
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    stop(); showApp(false); $('loginForm').reset();
  });
  if (CFG.SHOW_LOGIN_HINT) {
    const viewer = ACCOUNTS.find(a => a.role === 'user');
    const parts = [`<b>${CFG.ADMIN_HINT || 'admin'}</b> <span class="lh-role">(admin · server-verified)</span>`];
    if (viewer) parts.push(`<b>${viewer.username}</b> / <b>${viewer.password}</b> <span class="lh-role">(viewer)</span>`);
    $('loginHint').innerHTML = 'Demo → ' + parts.join(' &nbsp;·&nbsp; ');
    $('loginHint').hidden = false;
  }

  /* ---------------- SIMULATED DATA (deterministic) ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function simReadings(hostelIndex) {
    const out = [];
    const now = new Date();
    const scale = 0.55 + (mulberry32(hostelIndex * 97)() * 0.95);
    for (let d = 29; d >= 0; d--) {
      const rnd = mulberry32(hostelIndex * 1000 + d);
      MEALS.forEach(m => {
        const size = m.key === 'snacks' ? 0.35 : 1;             // snacks are lighter
        const events = 1 + Math.floor(rnd() * (m.key === 'snacks' ? 2 : 3));
        for (let e = 0; e < events; e++) {
          const t = new Date(now);
          t.setDate(now.getDate() - d);
          const hour = m.start + rnd() * (m.end - m.start);
          t.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0);
          if (t > now) continue;
          out.push({ weight: +((0.4 + rnd() * 2.4) * scale * size).toFixed(2), time: t, source: 'sim' });
        }
      });
    }
    return out.sort((a, b) => a.time - b.time);
  }

  /* ---------------- STATS ---------------- */
  function computeStats(readings) {
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    let today = 0, yday = 0;
    const dayMap = {};
    readings.forEach(r => {
      if (sameDay(r.time, now)) today += r.weight;
      if (sameDay(r.time, yesterday)) yday += r.weight;
      dayMap[localKey(r.time)] = (dayMap[localKey(r.time)] || 0) + r.weight;
    });
    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      days30.push({ date: d, kg: +(dayMap[localKey(d)] || 0) });
    }
    const week7 = days30.slice(23).reduce((s, d) => s + d.kg, 0);
    const prevWeek7 = days30.slice(16, 23).reduce((s, d) => s + d.kg, 0);
    const avg7 = week7 / 7;
    const latest = readings.length ? readings[readings.length - 1] : null;
    const online = latest ? (now - latest.time) / 60000 <= (CFG.DEVICE_ONLINE_MINUTES || 10) : false;
    const perCapita = today * 1000 / POP;                        // g / resident
    const eff = Math.min(99, Math.max(40, Math.round(100 - perCapita / 1.6)));
    return { today, yday, week7, prevWeek7, avg7, days30, latest, online, perCapita, eff, readings };
  }

  function buildHostels(realByHostel) {
    return HOSTELS.map((name, i) => {
      const code = i + 1;
      const real = (realByHostel[code] || []).sort((a, b) => a.time - b.time);
      let dataset, source;
      if (real.length) { dataset = real; source = 'live'; }
      else if (CFG.DEMO_FILL) { dataset = simReadings(code); source = 'sim'; }
      else { dataset = []; source = 'none'; }
      const stats = computeStats(dataset);
      // status: off | high (today well above weekly average) | warn (low efficiency) | live
      let status = 'live';
      if (source === 'none') status = 'off';
      else if (stats.today > Math.max(stats.avg7, 0.1) * 1.3) status = 'high';
      else if (stats.eff < 75) status = 'warn';
      // latest reported WiFi signal from the ESP32 (live devices only)
      let rssi = null;
      if (source === 'live') {
        for (let r = real.length - 1; r >= 0; r--) {
          if (real[r].rssi != null) { rssi = real[r].rssi; break; }
        }
      }
      return { code, name, source, stats, status, rssi };
    });
  }

  /* ---------------- FETCH (via backend proxy) ---------------- */
  async function fetchFeeds() {
    const res = await fetch(`${API}/api/feeds?results=${CFG.MAX_FEED_RESULTS || 8000}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  function bucketReal(feeds) {
    const wField = CFG.FIELD_WEIGHT || 'field1';
    const sField = CFG.FIELD_STATION || 'field2';
    const rField = CFG.FIELD_RSSI || 'field3';
    const minKg = CFG.MIN_VALID_KG ?? 0.02;
    const maxKg = CFG.MAX_VALID_KG ?? 60;
    const map = {};
    (feeds || []).forEach(f => {
      const w = parseFloat(f[wField]); if (isNaN(w)) return;
      if (w < minKg || w > maxKg) return;                 // HX711 glitch / miscalibration guard
      const t = new Date(f.created_at); if (isNaN(t.getTime())) return;
      let code = parseInt(f[sField], 10);
      if (isNaN(code) || code < 1 || code > HOSTELS.length) code = 1;
      const rssi = parseInt(f[rField], 10);
      (map[code] = map[code] || []).push({
        weight: w, time: t, source: 'live',
        rssi: (isNaN(rssi) || rssi >= 0 || rssi < -120) ? null : rssi
      });
    });
    return map;
  }

  // signal quality label from dBm
  function rssiLabel(rssi) {
    if (rssi == null) return null;
    if (rssi >= -55) return { txt: 'Excellent', bars: '▂▄▆█', cls: 'g' };
    if (rssi >= -67) return { txt: 'Good', bars: '▂▄▆', cls: 'g' };
    if (rssi >= -78) return { txt: 'Fair', bars: '▂▄', cls: 'm' };
    return { txt: 'Weak', bars: '▂', cls: 'm' };
  }

  /* ---------------- SVG helpers ---------------- */
  const ICO = {
    trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 14h10l1-14"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    rupee: '<path d="M7 4h10"/><path d="M7 8.5h10"/><path d="M8.5 4c5.5 0 5.5 8.5-1.5 8.5L15 20"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 11 3.75 3.75 0 0 1 18.5 18.5z"/>',
    meal: '<path d="M6.5 11v10"/><path d="M4 3v5a2.5 2.5 0 0 0 5 0V3"/><path d="M6.5 3v5"/><path d="M17.5 3c-2.3 2.5-2.3 7.5 0 10v8"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5a7 7 0 0 1 14 0"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4a3 3 0 0 0 3 4.5"/><path d="M17 5h3a3 3 0 0 1-3 4.5"/><path d="M12 14v4"/><path d="M8 21h8"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9.5V14"/><path d="M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
    leaf: '<path d="M6 21C6 12 10 6.5 20 4.5c-1 10-5.5 14.5-12 14.5"/><path d="M6 21c1.5-5 4.5-8.5 9-11.5"/>',
    drop: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z"/>',
    bolt: '<path d="M13 2 4.5 13.5H11L9.5 22 19 10.5h-6.5z"/>',
    build: '<path d="M4 21V5l8-2 8 2v16"/><path d="M4 21h16"/><path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2"/>',
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    wifi: '<path d="M2.5 9.5a15 15 0 0 1 19 0"/><path d="M5.7 13a10 10 0 0 1 12.6 0"/><path d="M8.8 16.3a5.5 5.5 0 0 1 6.4 0"/><circle cx="12" cy="19.5" r="1.3" fill="currentColor" stroke="none"/>',
    box: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M4 11h16"/><path d="M9 7V4.5h6V7"/>',
    sync: '<path d="M20 6.5V11h-4.5"/><path d="M4 17.5V13h4.5"/><path d="M19.3 11a7.5 7.5 0 0 0-13-3.5L4 9.5"/><path d="M4.7 13a7.5 7.5 0 0 0 13 3.5L20 14.5"/>',
    save: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v5h8V4"/><path d="M8 20v-6h8v6"/>',
    cal: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'
  };
  const svg = (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[name]}</svg>`;

  function spark(series) {
    const w = 64, h = 24;
    const max = Math.max(...series, 0.001);
    const pts = series.map((v, i) =>
      `${((i / (series.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 3 - (v / max) * (h - 8)).toFixed(1)}`).join(' ');
    return `<svg class="bnh-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}"/></svg>`;
  }

  /* ---------------- SCOPE (0 = campus, else hostel code) ---------------- */
  let scope = 0;
  const scopedHostel = () => scope ? lastHostels.find(x => x.code === scope) : null;

  function fadeCenter() {
    const c = document.querySelector('.bn-center');
    if (!c) return;
    c.classList.remove('bn-switching');
    void c.offsetWidth;          // restart the animation
    c.classList.add('bn-switching');
  }
  function openHostel(code) {
    scope = (scope === code) ? 0 : code;
    renderAll();
    fadeCenter();
    document.querySelector('.bn-head-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function onRailClick(e) {
    const card = e.target.closest('.bn-hostel');
    if (card) openHostel(+card.dataset.code);
  }
  $('railLeft').addEventListener('click', onRailClick);
  $('btnOverview').addEventListener('click', () => { scope = 0; renderAll(); fadeCenter(); });

  function renderHead(h) {
    const badge = $('bnScopeBadge');
    if (h) {
      $('btnOverview').hidden = false;
      $('bnTitle').textContent = h.name + ' Hostel — Dashboard';
      $('bnSub').textContent = 'Hostel ' + pad(h.code) + ' · live food waste analytics · ' +
        (h.source === 'live' ? 'ThingSpeak data' : h.source === 'sim' ? 'simulated data' : 'no data');
      const stTxt = h.status === 'high' ? '● High Waste' : h.status === 'warn' ? '● Watch' : h.status === 'off' ? '● Offline' : '● Live';
      badge.textContent = stTxt;
      badge.className = 'bn-scope-chip ' + (h.status === 'live' ? 'live' : h.status);
      badge.hidden = false;
    } else {
      $('btnOverview').hidden = true;
      badge.hidden = true;
      $('bnTitle').textContent = 'Institute Overview Dashboard';
      $('bnSub').textContent = 'Real-time overview of food waste across all IIT Guwahati hostels';
    }
  }

  /* ---------------- RENDER: top bar ---------------- */
  function renderTopbar(hostels) {
    const live = currentMeal();
    if (live) {
      $('sessTitle').textContent = live.name + ' Session Live';
      $('sessRange').textContent = live.range;
      $('sessDot').classList.remove('idle');
    } else {
      const nm = nextMeal();
      $('sessTitle').textContent = 'No Live Session';
      $('sessRange').textContent = 'Next: ' + nm.name + ' at ' + nm.startTxt;
      $('sessDot').classList.add('idle');
    }
    const real = hostels.filter(h => h.source === 'live').length;
    const sim = hostels.filter(h => h.source === 'sim').length;
    const active = real + sim;
    $('devCount').textContent = real
      ? active + ' / ' + hostels.length + ' · ' + real + ' ESP32'
      : active + ' / ' + hostels.length + ' Online';
    $('sysState').textContent = active === hostels.length ? 'Operational' : (hostels.length - active) + ' hostel(s) offline';
  }
  function tickClock() {
    const now = new Date();
    $('clockTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('clockDate').textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ---------------- RENDER: hostel rails ---------------- */
  function renderRails(hostels) {
    const rail = $('railLeft');
    if (!rail) return;

    const live = currentMeal();
    const sessTxt = live ? live.name + ' Running' : 'Idle';
    const sessTime = live ? t12(new Date()) : 'Next ' + nextMeal().startTxt;
    const card = h => {
      const cls = (h.status === 'high' ? 'high' : h.status === 'warn' ? 'warn' : h.status === 'off' ? 'off' : '') +
                  (scope === h.code ? ' active' : '');
      const stTxt = h.status === 'high' ? '● High'
        : h.status === 'off' ? '● Offline'
        : h.source === 'live' ? '📡 Live'
        : '● Sim';
      const stCls = h.status === 'high' ? 'high' : h.status === 'warn' ? 'warn' : h.status === 'off' ? 'off'
        : h.source === 'sim' ? 'sim' : 'live';
      const week = h.stats.days30.slice(23).map(d => d.kg);
      return `<div class="bn-hostel ${cls}" data-code="${h.code}" title="Open ${h.name} Hostel dashboard">
        <div class="bnh-top"><span class="bnh-num">${pad(h.code)}</span><b>${h.name} Hostel</b><span class="bnh-status ${stCls}">${stTxt}</span></div>
        <div class="bnh-mid"><span>${sessTxt}</span><span>${sessTime}</span></div>
        <div class="bnh-bottom">
          <div class="bnh-kg"><h5>${h.stats.today.toFixed(1)} kg</h5><p>Today</p></div>
          ${spark(week)}
          <div class="bnh-eff"><h5>${h.stats.eff}%</h5><p>Efficiency</p></div>
        </div>
      </div>`;
    };

    const cardsHtml = hostels.map(card).join('');
    if (scope === 0) {
      rail.classList.add('auto-scroll');
      rail.innerHTML = `
        <div class="bn-rail-scroll">
          <div class="bn-rail-group">
            ${cardsHtml}
          </div>
          <div class="bn-rail-group" aria-hidden="true">
            ${cardsHtml}
          </div>
        </div>`;
    } else {
      rail.classList.remove('auto-scroll');
      rail.innerHTML = `
        <div class="bn-rail-scroll">
          <div class="bn-rail-group">
            ${cardsHtml}
          </div>
        </div>`;
      // Scroll the active hostel card into view
      setTimeout(() => {
        const activeCard = rail.querySelector('.bn-hostel.active');
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }

  /* ---------------- RENDER: KPIs ---------------- */
  function delta(nowV, prevV) {
    if (prevV <= 0) return '<span class="bn-kpi-delta flat">— vs yesterday</span>';
    const pct = Math.round(((nowV - prevV) / prevV) * 100);
    const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
    const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
    return `<span class="bn-kpi-delta ${cls}">${arrow} ${Math.abs(pct)}% vs yesterday</span>`;
  }
  function renderKpis(s, h) {
    const kpi = (ico, color, label, value, unit, deltaHtml) =>
      `<div class="bn-kpi"><span class="bn-kpi-ico ${color}">${svg(ico)}</span>
        <div class="bn-kpi-body"><p>${label}</p><h5>${value} <small>${unit}</small></h5>${deltaHtml}</div></div>`;
    $('bnKpis').innerHTML =
      kpi('trash', 'green', h ? 'Waste Today' : 'Total Waste Today', nf(+s.today.toFixed(1)), 'kg', delta(s.today, s.yday)) +
      kpi('rupee', 'orange', 'Value Lost (est.)', '₹' + nf(Math.round(s.today * PRICE)), '', delta(s.today, s.yday));
  }

  /* ---------------- RENDER: trend ---------------- */
  let trendDays = 30, lastScope = null;
  function renderTrend(s) {
    const days = s.days30.slice(30 - trendDays);
    const W = 560, H = 300, L = 42, B = 30, T = 16, R = 12;
    const max = Math.max(...days.map(d => d.kg), 1);
    const step = max > 400 ? 100 : max > 100 ? 50 : max > 40 ? 20 : max > 8 ? 5 : 2;
    const niceMax = Math.ceil(max / step) * step;
    const x = i => L + (i / (days.length - 1)) * (W - L - R);
    const y = v => H - B - (v / niceMax) * (H - B - T);
    const pts = days.map((d, i) => [x(i), y(d.kg)]);
    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
      path += ` Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${mx} ${my}`;
    }
    path += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
    const area = path + ` L ${x(days.length - 1)} ${H - B} L ${x(0)} ${H - B} Z`;
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const v = niceMax * i / 4, gy = y(v);
      grid += `<line x1="${L}" y1="${gy}" x2="${W - R}" y2="${gy}" stroke="#eef1f4" stroke-width="1"/>
               <text x="${L - 8}" y="${gy + 4}" font-size="12" fill="#98a2b3" text-anchor="end">${Math.round(v)}</text>`;
    }
    // marker dots on each data point
    const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 4 : 2.4}" fill="#16a34a"/>`).join('');
    $('bnTrend').innerHTML = `
      <defs><linearGradient id="bnArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#22c55e" stop-opacity=".28"/>
        <stop offset="100%" stop-color="#22c55e" stop-opacity=".02"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#bnArea)"/>
      <path d="${path}" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"/>
      ${dots}`;
    const fmt = d => d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    $('bnTrendAxis').innerHTML =
      `<span>${fmt(days[0].date)}</span><span>${fmt(days[Math.floor(days.length / 2)].date)}</span><span>${fmt(days[days.length - 1].date)}</span>`;
    $('trendDaysLbl').textContent = '(' + trendDays + ' Days)';
    trendGeom = { days, L, W, R };
  }
  $('trendRange').addEventListener('change', e => { trendDays = +e.target.value; if (lastScope) renderTrend(lastScope); });

  // hover tooltip on the trend chart
  let trendGeom = null;
  (function initTrendHover() {
    const svgEl = $('bnTrend'), tip = $('trendTip');
    svgEl.addEventListener('mousemove', e => {
      if (!trendGeom) return;
      const rect = svgEl.getBoundingClientRect();
      const { days, L, W, R } = trendGeom;
      const relX = (e.clientX - rect.left) / rect.width * W;
      const idx = Math.round((relX - L) / (W - L - R) * (days.length - 1));
      if (idx < 0 || idx >= days.length) { tip.hidden = true; return; }
      const d = days[idx];
      tip.textContent = d.date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.kg.toFixed(1) + ' kg';
      const card = svgEl.parentElement.getBoundingClientRect();
      tip.style.left = Math.min(card.width - 130, Math.max(6, e.clientX - card.left + 12)) + 'px';
      tip.style.top = (e.clientY - card.top - 30) + 'px';
      tip.hidden = false;
    });
    svgEl.addEventListener('mouseleave', () => { tip.hidden = true; });
  })();

  /* ---------------- RENDER: live readings feed ---------------- */
  let feedFlash = false, feedInit = false;
  function feedTime(d) {
    return sameDay(d, new Date())
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + t12(d);
  }
  function renderFeed(hostels, h) {
    let rows;
    if (h) {
      $('feedScope').textContent = '(' + h.name + ')';
      rows = h.stats.readings.slice(-80).reverse()
        .map(r => ({ weight: r.weight, time: r.time, source: r.source, hostel: null }));
    } else {
      $('feedScope').textContent = '(all hostels)';
      const all = [];
      hostels.forEach(x => x.stats.readings.forEach(r =>
        all.push({ weight: r.weight, time: r.time, source: r.source, hostel: x.name })));
      all.sort((a, b) => b.time - a.time);
      rows = all.slice(0, 80);
    }
    const flashTop = feedFlash && feedInit; feedFlash = false; feedInit = true;
    $('bnFeed').innerHTML = rows.length ? rows.map((r, i) => {
      const live = r.source === 'live';
      return `<div class="bn-feed-row${i === 0 && flashTop ? ' just-in' : ''}">
        <span class="bn-feed-dot ${live ? 'g' : 'm'}"></span>
        <span class="bn-feed-w">${r.weight.toFixed(2)} <small>kg</small></span>
        <span class="bn-feed-meta">${r.hostel ? r.hostel + ' · ' : ''}${cap(mealOf(r.time))}${live ? ' · 📡' : ''}</span>
        <span class="bn-feed-time" title="${r.time.toLocaleString()}">${feedTime(r.time)}</span>
      </div>`;
    }).join('') : '<div class="bn-feed-empty">Waiting for readings…</div>';
  }

  /* ---------------- RENDER: donut + scales ---------------- */
  const MEAL_COLORS = { breakfast: '#22c55e', lunch: '#6366f1', dinner: '#f59e0b', snacks: '#eab308' };
  function renderDonut(s) {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const sums = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
    s.readings.forEach(r => { if (r.time >= weekAgo) sums[mealOf(r.time)] += r.weight; });
    const total = Object.values(sums).reduce((a, b) => a + b, 0) || 1;
    let offset = 25, circles = '';
    ['lunch', 'dinner', 'breakfast', 'snacks'].forEach(k => {
      const pct = sums[k] / total * 100;
      circles += `<circle cx="21" cy="21" r="15.9" stroke="${MEAL_COLORS[k]}" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"/>`;
      offset -= pct;
    });
    $('bnDonut').innerHTML = circles;
    $('bnDonutLegend').innerHTML = ['breakfast', 'lunch', 'dinner', 'snacks'].map(k => {
      const pct = Math.round(sums[k] / total * 100);
      return `<div><i style="background:${MEAL_COLORS[k]}"></i>${cap(k)} <b>${pct}%</b> (${Math.round(sums[k])} kg)</div>`;
    }).join('');
  }

  function renderScales(s) {
    const now = new Date();
    const h = hourOf(now);
    const todays = s.readings.filter(r => sameDay(r.time, now));
    const kgFor = k => todays.filter(r => mealOf(r.time) === k).reduce((sum, r) => sum + r.weight, 0);
    const rows = [
      { name: 'Breakfast Bin', key: 'breakfast', on: h >= 7.5 },
      { name: 'Lunch Bin', key: 'lunch', on: h >= 12 },
      { name: 'Dinner Bin', key: 'dinner', on: h >= 19 },
      { name: 'Common Bin', key: 'snacks', on: true }
    ];
    $('bnScales').innerHTML = rows.map(r => {
      const kg = kgFor(r.key);
      return `<div class="bn-scale-row">${svg('box')}<span>${r.name}</span>
        <b>${r.on ? kg.toFixed(1) + ' kg' : '-- kg'}</b>
        <span class="bn-scale-tag ${r.on ? 'on' : 'off'}">${r.on ? '● Online' : '● Offline'}</span></div>`;
    }).join('');
  }

  /* ---------------- RENDER: insights ---------------- */
  function peakHour(s) {
    const now = new Date();
    const buckets = {};
    s.readings.forEach(r => { if (sameDay(r.time, now)) buckets[r.time.getHours()] = (buckets[r.time.getHours()] || 0) + r.weight; });
    let best = null;
    Object.entries(buckets).forEach(([hh, kg]) => { if (!best || kg > best.kg) best = { h: +hh, kg }; });
    return best;
  }
  const tile = (ico, color, label, value, sub, subCls) =>
    `<div class="bn-insight"><span class="bn-kpi-ico ${color}">${svg(ico)}</span>
      <div><p>${label}</p><h5>${value}</h5><small class="${subCls}">${sub}</small></div></div>`;

  function renderInsights(hostels, s, h) {
    const pk = peakHour(s);
    const pkTxt = pk ? `${t12(new Date(2000, 0, 1, pk.h, 30))} - ${t12(new Date(2000, 0, 1, pk.h + 1, 30))}` : '—';
    const pkSub = pk ? 'During ' + cap(mealOf(new Date(2000, 0, 1, pk.h, 30))) : 'No data today';
    const savedKg = Math.max(s.prevWeek7 - s.week7, s.week7 * 0.05);
    const co2Saved = Math.round(savedKg * CO2);

    if (h) {
      // per-hostel: efficiency, peak time, CO₂ saved (three focused stats)
      $('bnInsights').innerHTML =
        tile('trophy', 'green', 'Efficiency Score', h.stats.eff + '%', h.stats.eff >= 85 ? 'Excellent' : h.stats.eff >= 70 ? 'Good' : 'Needs attention', h.stats.eff >= 70 ? 'g' : 'r') +
        tile('clock', 'orange', 'Peak Waste Time', pkTxt, pkSub, 'm') +
        tile('leaf', 'green', 'CO₂ Saved (est.)', nf(co2Saved) + ' kg', '≈ ' + (co2Saved / 970).toFixed(1) + ' trees · vs last week', 'g');
      return;
    }
    const best = hostels.slice().sort((a, b) => b.stats.eff - a.stats.eff)[0];
    $('bnInsights').innerHTML =
      tile('trophy', 'green', 'Best Performing Hostel', best ? best.name + ' Hostel' : '—', best ? best.stats.eff + '% Efficiency' : '', 'g') +
      tile('clock', 'orange', 'Peak Waste Time', pkTxt, pkSub, 'm') +
      tile('leaf', 'green', 'Total CO₂ Saved (est.)', nf(co2Saved) + ' kg', '≈ ' + (co2Saved / 970).toFixed(1) + ' Trees Saved', 'g');
  }

  /* ---------------- RENDER: AI reco ---------------- */
  function renderAi(hostels, s, h) {
    const live = currentMeal();
    const tip = live && (live.key === 'lunch' || live.key === 'dinner')
      ? 'Reduce rice preparation by ~15%'
      : 'Reduce portion sizes by ~10-15%';
    let txt, detail;
    if (h) {
      if (h.status === 'high') {
        const pct = Math.round((h.stats.today / Math.max(h.stats.avg7, 0.01) - 1) * 100);
        txt = `${h.name} Hostel is ${pct}% above its 7-day average today. ${tip} at the next meal service.`;
      } else if (h.status === 'off') {
        txt = `${h.name} Hostel's scale is offline — no readings received. Check the device power and WiFi.`;
      } else {
        txt = `${h.name} Hostel is within its normal range today (${h.stats.today.toFixed(1)} kg vs ${h.stats.avg7.toFixed(1)} kg avg). Keep portions as planned.`;
      }
      detail = `Today: ${h.stats.today.toFixed(1)} kg · 7-day avg: ${h.stats.avg7.toFixed(1)} kg/day · This week: ${h.stats.week7.toFixed(1)} kg (prev ${h.stats.prevWeek7.toFixed(1)} kg). Rule-based recommendation derived from scale data.`;
    } else {
      const highs = hostels.filter(x => x.status === 'high');
      if (highs.length) {
        txt = `${live ? live.name : "Today's"} waste is high in ${highs.length} hostel${highs.length > 1 ? 's' : ''}. ${tip} and monitor again tomorrow.`;
        detail = 'Flagged (today vs 7-day average): ' + highs.map(x => `${x.name} (${x.stats.today.toFixed(1)} kg)`).join(', ') +
          '. Suggested: portion-controlled serving and review of tomorrow’s indent quantities.';
      } else {
        txt = 'All hostels are within their normal waste range today. Keep portion sizes as planned.';
        detail = 'No hostel exceeded 130% of its 7-day average today. Rule-based recommendation derived from live scale data.';
      }
    }
    $('aiText').textContent = txt;
    $('aiDetail').textContent = detail;
  }
  $('aiMore').addEventListener('click', () => {
    const d = $('aiDetail');
    d.hidden = !d.hidden;
    $('aiMore').textContent = d.hidden ? 'View Details →' : 'Hide Details';
  });

  /* ---------------- RENDER: alerts / system / top5-activity ---------------- */
  function relTime(d) {
    const sec = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
    if (sec < 60) return sec + 's ago';
    if (sec < 3600) return Math.round(sec / 60) + ' min ago';
    return Math.round(sec / 3600) + ' hr ago';
  }
  let allAlerts = [], alertsExpanded = false;
  function buildAlerts(hostels) {
    const now = new Date();
    const list = [];
    hostels.filter(x => x.status === 'high').forEach(x =>
      list.push({ cls: 'red', txt: `High waste in ${x.name} Hostel`, t: x.stats.latest ? x.stats.latest.time : now, code: x.code }));
    hostels.filter(x => x.status === 'off').forEach(x =>
      list.push({ cls: 'amber', txt: `Scale in ${x.name} Hostel is offline`, t: now, code: x.code }));
    const live = currentMeal();
    if (live) {
      const st = new Date(now); st.setHours(Math.floor(live.start), (live.start % 1) * 60, 0, 0);
      list.push({ cls: 'green', txt: `${live.name} session started in all hostels`, t: st, code: 0 });
    }
    return list.sort((a, b) => b.t - a.t);
  }
  function renderAlerts(hostels, h) {
    allAlerts = buildAlerts(hostels);
    const scoped = h ? allAlerts.filter(a => a.code === h.code || a.code === 0) : allAlerts;
    const list = alertsExpanded ? scoped : scoped.slice(0, 3);
    $('bnAlerts').innerHTML = list.length
      ? list.map(a => `<div class="bn-alert ${a.cls}"><i></i><span>${a.txt}</span><time>${relTime(a.t)}</time></div>`).join('')
      : '<div class="bn-alert green"><i></i><span>No alerts — everything looks normal.</span></div>';
    $('alertsMore').hidden = scoped.length <= 3;
    $('alertsMore').textContent = alertsExpanded ? 'Show fewer' : 'View all alerts →';
    $('bellCount').textContent = allAlerts.length;
    $('bellCount').hidden = !allAlerts.length;
    // bell dropdown always shows campus-wide alerts
    $('bellList').innerHTML = allAlerts.length
      ? allAlerts.map(a => `<div class="bn-alert ${a.cls}"><i></i><span>${a.txt}</span><time>${relTime(a.t)}</time></div>`).join('')
      : '<div class="bn-alert green"><i></i><span>No notifications.</span></div>';
  }
  $('alertsMore').addEventListener('click', () => { alertsExpanded = !alertsExpanded; renderAlerts(lastHostels, scopedHostel()); });
  $('bellBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('bellDrop').hidden = !$('bellDrop').hidden;
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.bn-bell-wrap')) $('bellDrop').hidden = true;
  });

  function renderSystem(hostels, s, h) {
    const row = (ico, label, val, cls) =>
      `<div class="bn-sys-row">${svg(ico)}<span>${label}</span><b class="${cls}">${val}</b></div>`;
    if (h) {
      const todayCount = h.stats.readings.filter(r => sameDay(r.time, new Date())).length;
      const sig = rssiLabel(h.rssi);
      $('bnSystem').innerHTML =
        row('wifi', 'ESP32 Scale', h.source === 'none' ? 'Offline' : h.stats.online ? 'Online' : 'Idle', h.source === 'none' ? 'm' : 'g') +
        (h.source === 'live'
          ? row('wifi', 'WiFi Signal', sig ? `${sig.bars} ${h.rssi} dBm · ${sig.txt}` : 'not reported', sig ? sig.cls : 'm')
          : '') +
        row('sync', 'Last Reading', h.stats.latest ? t12(h.stats.latest.time) + ' · ' + relTime(h.stats.latest.time) : '—', h.stats.latest ? 'g' : 'm') +
        row('box', "Today's Readings", todayCount + ' entries', 'g') +
        row('save', 'Data Source', h.source === 'live' ? 'ESP32 · ThingSpeak' : h.source === 'sim' ? 'Simulated' : 'None', h.source === 'live' ? 'g' : 'm');
      return;
    }
    // overview: monitor real ESP32 devices first
    const liveDevs = hostels.filter(x => x.source === 'live');
    const sim = hostels.filter(x => x.source === 'sim').length;
    const lastT = s.readings.length ? s.readings[s.readings.length - 1].time : null;
    let rows = '';
    if (liveDevs.length) {
      rows += liveDevs.slice(0, 3).map(d => {
        const sig = rssiLabel(d.rssi);
        return row('wifi', '📡 ' + d.name,
          (d.stats.latest ? relTime(d.stats.latest.time) : '—') + (sig ? ' · ' + sig.bars + ' ' + d.rssi + ' dBm' : ''),
          d.stats.online ? 'g' : 'm');
      }).join('');
      if (liveDevs.length > 3) rows += row('wifi', '+ ' + (liveDevs.length - 3) + ' more ESP32(s)', 'reporting', 'g');
    } else {
      rows += row('wifi', 'ESP32 Devices', 'None connected yet', 'm');
    }
    rows +=
      row('box', 'Simulated Hostels', sim + ' (DEMO_FILL)', 'm') +
      row('sync', 'Data Sync', lastT ? 'Live · ' + relTime(lastT) : 'Waiting', lastT ? 'g' : 'm') +
      row('save', 'Last Entry', lastT ? 'Today, ' + t12(lastT) : '—', 'm');
    $('bnSystem').innerHTML = rows;
  }

  function renderTop5(hostels, h) {
    if (h) {
      $('bnT5Title').innerHTML = 'Recent Activity <small>(latest readings)</small>';
      const rows = h.stats.readings.slice(-8).reverse();
      $('bnTop5').innerHTML = rows.length
        ? rows.map(r =>
          `<div class="bn-t5-row"><em>·</em><span>${t12(r.time)} — ${cap(mealOf(r.time))}</span>
            <span class="bn-t5-src">${r.source === 'live' ? '📡 Live' : '≈ Sim'}</span>
            <b>${r.weight.toFixed(2)} kg</b></div>`).join('')
        : '<div class="bn-alert green"><i></i><span>No readings yet.</span></div>';
      return;
    }
    $('bnT5Title').innerHTML = 'Top 5 Hostels <small>(By Waste Today)</small>';
    const top = hostels.slice().sort((a, b) => b.stats.today - a.stats.today).slice(0, 5);
    const max = Math.max(...top.map(x => x.stats.today), 0.001);
    const colors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e'];
    $('bnTop5').innerHTML = top.map((x, i) =>
      `<div class="bn-t5-row" data-code="${x.code}"><em>${i + 1}</em><span>${x.name} Hostel</span>
        <span class="bn-t5-bar"><i style="--w:${Math.max(6, x.stats.today / max * 100)}%;background:${colors[i]}"></i></span>
        <b>${x.stats.today.toFixed(1)} kg</b></div>`).join('');
  }
  $('bnTop5').addEventListener('click', e => {
    const row = e.target.closest('[data-code]');
    if (row) openHostel(+row.dataset.code);
  });

  /* ---------------- EXPORT CSV (scope-aware) ---------------- */
  $('exportBtn').addEventListener('click', () => {
    if (!lastHostels.length) return;
    const h = scopedHostel();
    let csv, name;
    if (h) {
      csv = 'Time,Meal,Weight (kg),Source\n' +
        h.stats.readings.map(r => `${r.time.toISOString()},${mealOf(r.time)},${r.weight},${r.source}`).join('\n');
      name = 'wastewize-' + h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-readings.csv';
    } else {
      csv = 'Hostel,Code,Status,Today (kg),7-day (kg),Efficiency (%),Source\n' +
        lastHostels.map(x =>
          `${x.name},${x.code},${x.status},${x.stats.today.toFixed(2)},${x.stats.week7.toFixed(2)},${x.stats.eff},${x.source}`).join('\n');
      name = 'wastewize-hostel-summary.csv';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('⤓ Exported ' + name);
  });

  /* ---------------- LOG READING (backend write) ---------------- */
  let serverConfig = { writeEnabled: false };
  async function loadServerConfig() {
    try {
      const r = await fetch(API + '/api/config', { cache: 'no-store' });
      if (r.ok) serverConfig = await r.json();
    } catch (e) { /* backend down — button stays hidden */ }
    $('addReadingBtn').hidden = !(serverConfig.writeEnabled && role === 'admin');
    $('resetBtn').hidden = !(role === 'admin' && adminToken);
  }
  $('addReadingBtn').addEventListener('click', () => {
    $('logHostel').innerHTML = HOSTELS.map((n, i) =>
      `<option value="${i + 1}"${scope === i + 1 ? ' selected' : ''}>${n}</option>`).join('');
    $('logMsg').textContent = '';
    $('logModal').hidden = false;
    $('logWeight').focus();
  });
  $('logCancel').addEventListener('click', () => { $('logModal').hidden = true; });
  $('logModal').addEventListener('click', e => { if (e.target === $('logModal')) $('logModal').hidden = true; });
  $('logForm').addEventListener('submit', async e => {
    e.preventDefault();
    const w = parseFloat($('logWeight').value);
    if (isNaN(w) || w <= 0) return;
    $('logMsg').textContent = 'Sending…';
    try {
      const r = await fetch(API + '/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ weight: w, hostel: $('logHostel').value })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.entry_id > 0) {
        $('logMsg').textContent = '✓ Sent (entry #' + j.entry_id + ')';
        showToast('✓ Reading logged: ' + w.toFixed(2) + ' kg');
        $('logForm').reset();
        setTimeout(() => { $('logModal').hidden = true; refresh(); }, 1200);
      } else if (r.ok && j.entry_id === 0) {
        $('logMsg').textContent = '⚠ Rate limited — wait 15s and try again';
      } else if (r.status === 403 || r.status === 503) {
        $('logMsg').textContent = '✗ Admin session expired — please sign in again';
      } else {
        $('logMsg').textContent = '✗ ' + (j.error || 'failed');
      }
    } catch (err) { $('logMsg').textContent = '✗ ' + err.message; }
  });

  /* ---------------- RESET DATA (selective + all) ---------------- */
  // Render hostel checkboxes inside the reset modal grid
  function renderResetGrid() {
    $('resetHostelGrid').innerHTML = HOSTELS.map((name, i) => {
      const code = i + 1;
      return `<label class="bn-reset-item" data-code="${code}">
        <input type="checkbox" value="${code}" />
        <span class="bn-ri-code">${pad(code)}</span>
        <span class="bn-ri-name">${name}</span>
      </label>`;
    }).join('');
  }
  renderResetGrid();

  function getSelectedCodes() {
    return [...$('resetHostelGrid').querySelectorAll('input[type="checkbox"]:checked')]
      .map(cb => +cb.value);
  }
  function syncResetUI() {
    const selected = getSelectedCodes();
    $('resetSelected').disabled = selected.length === 0;
    $('resetSelected').textContent = selected.length
      ? `Delete selected (${selected.length})`
      : 'Delete selected';
    // toggle .checked class on labels
    $('resetHostelGrid').querySelectorAll('.bn-reset-item').forEach(el => {
      el.classList.toggle('checked', el.querySelector('input').checked);
    });
    // sync select-all checkbox
    const all = $('resetHostelGrid').querySelectorAll('input[type="checkbox"]');
    $('resetSelectAll').checked = selected.length === all.length;
    $('resetSelectAll').indeterminate = selected.length > 0 && selected.length < all.length;
  }

  $('resetHostelGrid').addEventListener('change', syncResetUI);
  $('resetSelectAll').addEventListener('change', e => {
    const checked = e.target.checked;
    $('resetHostelGrid').querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = checked; });
    syncResetUI();
  });

  $('resetBtn').addEventListener('click', () => {
    $('resetMsg').textContent = '';
    $('resetConfirm').disabled = false;
    $('resetSelected').disabled = true;
    // uncheck everything
    $('resetHostelGrid').querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    $('resetSelectAll').checked = false;
    $('resetSelectAll').indeterminate = false;
    $('resetHostelGrid').querySelectorAll('.bn-reset-item').forEach(el => el.classList.remove('checked'));
    $('resetModal').hidden = false;
  });
  $('resetCancel').addEventListener('click', () => { $('resetModal').hidden = true; });
  $('resetModal').addEventListener('click', e => { if (e.target === $('resetModal')) $('resetModal').hidden = true; });

  // Selective delete: only the selected hostels
  $('resetSelected').addEventListener('click', async () => {
    const codes = getSelectedCodes();
    if (!codes.length) return;
    $('resetSelected').disabled = true;
    $('resetConfirm').disabled = true;
    $('resetMsg').textContent = `Clearing ${codes.length} hostel(s)…`;
    try {
      const r = await fetch(API + '/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ hostels: codes })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        const names = codes.map(c => HOSTELS[c - 1]).join(', ');
        $('resetMsg').textContent = '✓ Cleared: ' + names;
        showToast('🗑️ Deleted data for ' + codes.length + ' hostel(s)');
        lastLiveCount = -1;
        setTimeout(() => { $('resetModal').hidden = true; refresh(); }, 1200);
      } else {
        $('resetMsg').textContent = '✗ ' + (j.error || 'failed');
        $('resetSelected').disabled = false;
        $('resetConfirm').disabled = false;
      }
    } catch (err) {
      $('resetMsg').textContent = '✗ ' + err.message;
      $('resetSelected').disabled = false;
      $('resetConfirm').disabled = false;
    }
  });

  // Delete ALL data (all hostels)
  $('resetConfirm').addEventListener('click', async () => {
    $('resetConfirm').disabled = true;
    $('resetSelected').disabled = true;
    $('resetMsg').textContent = 'Clearing all channels…';
    try {
      const r = await fetch(API + '/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ hostels: 'all' })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        $('resetMsg').textContent = '✓ All data cleared.';
        showToast('🗑️ All hostel data has been reset');
        lastLiveCount = -1;
        setTimeout(() => { $('resetModal').hidden = true; refresh(); }, 1000);
      } else {
        $('resetMsg').textContent = '✗ ' + (j.error || 'failed');
        $('resetConfirm').disabled = false;
      }
    } catch (err) {
      $('resetMsg').textContent = '✗ ' + err.message;
      $('resetConfirm').disabled = false;
    }
  });

  /* ---------------- TOASTS ---------------- */
  function showToast(txt) {
    const t = document.createElement('div');
    t.className = 'bn-toast';
    t.textContent = txt;
    $('bnToasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 4000);
  }

  /* ---------------- MAIN ---------------- */
  let lastHostels = [];
  let timer = null, clockTimer = null;


  function showBanner(html) { const b = $('dashBanner'); b.innerHTML = html; b.hidden = false; }
  function hideBanner() { $('dashBanner').hidden = true; }

  function globalStats(hostels) {
    const readings = hostels.flatMap(x => x.stats.readings).sort((a, b) => a.time - b.time);
    return computeStats(readings);
  }

  /* ---------------- ADMIN ANALYTICS (admin-only panels) ---------------- */
  function renderAdminAnalytics(hostels, s, h) {
    if (role !== 'admin') return;

    // --- Hostel Comparison Bar Chart ---
    const sorted = hostels.slice().sort((a, b) => b.stats.today - a.stats.today);
    const maxKg = Math.max(...sorted.map(x => x.stats.today), 0.1);
    const barColors = kg => {
      const pct = kg / maxKg;
      if (pct > 0.8) return '#ef4444';
      if (pct > 0.5) return '#f59e0b';
      return '#059669';
    };
    $('bnCompare').innerHTML = sorted.map(x => {
      const pct = Math.max(3, (x.stats.today / maxKg) * 100);
      const color = barColors(x.stats.today);
      return `<div class="bn-compare-row">
        <span class="bn-cmp-name" title="${x.name}">${x.name}</span>
        <span class="bn-cmp-bar"><i style="width:${pct.toFixed(1)}%;background:${color}"></i></span>
        <span class="bn-cmp-val">${x.stats.today.toFixed(1)} kg</span>
      </div>`;
    }).join('');

    // --- Cost Analysis ---
    const todayTotal = s.today;
    const weekTotal = s.week7;
    const monthEst = s.avg7 * 30;
    const prevMonthEst = (s.prevWeek7 / 7) * 30;
    const savings = Math.max(0, prevMonthEst - monthEst);
    const co2Month = monthEst * CO2;
    $('bnCost').innerHTML = `
      <div class="bn-cost-item">
        <p>Today's Waste Cost</p>
        <h5 class="red">₹${nf(Math.round(todayTotal * PRICE))}</h5>
        <small>${todayTotal.toFixed(1)} kg × ₹${PRICE}/kg</small>
      </div>
      <div class="bn-cost-item">
        <p>This Week</p>
        <h5 class="orange">₹${nf(Math.round(weekTotal * PRICE))}</h5>
        <small>${weekTotal.toFixed(1)} kg total</small>
      </div>
      <div class="bn-cost-item">
        <p>Monthly Projection</p>
        <h5>₹${nf(Math.round(monthEst * PRICE))}</h5>
        <small>~${monthEst.toFixed(0)} kg at current rate</small>
      </div>
      <div class="bn-cost-item">
        <p>Est. Monthly Savings</p>
        <h5 class="green">₹${nf(Math.round(savings * PRICE))}</h5>
        <small>~${co2Month.toFixed(0)} kg CO₂ impact</small>
      </div>`;

    // --- Weekly Summary Table ---
    const statusLabel = x => {
      const s = x.status;
      const src = x.source;
      if (s === 'high') return '<span class="st-status high">● High</span>';
      if (s === 'warn') return '<span class="st-status warn">● Watch</span>';
      if (s === 'off') return '<span class="st-status off">● Offline</span>';
      if (src === 'sim') return '<span class="st-status sim">● Simulated</span>';
      return '<span class="st-status live">● Live</span>';
    };
    $('bnSummary').innerHTML = `
      <thead>
        <tr>
          <th>#</th><th>Hostel</th><th>Today (kg)</th><th>7-Day (kg)</th>
          <th>Avg/Day</th><th>Efficiency</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${hostels.map(x => `<tr>
          <td>${pad(x.code)}</td>
          <td><b>${x.name}</b></td>
          <td>${x.stats.today.toFixed(1)}</td>
          <td>${x.stats.week7.toFixed(1)}</td>
          <td>${x.stats.avg7.toFixed(1)}</td>
          <td><b>${x.stats.eff}%</b></td>
          <td>${statusLabel(x)}</td>
        </tr>`).join('')}
      </tbody>`;
  }

  function renderAll() {
    const h = scopedHostel();
    const s = h ? h.stats : globalStats(lastHostels);
    lastScope = s;
    renderHead(h);
    renderTopbar(lastHostels);
    renderRails(lastHostels);
    renderKpis(s, h);
    renderTrend(s);
    renderFeed(lastHostels, h);
    renderDonut(s);
    renderScales(s);
    renderInsights(lastHostels, s, h);
    renderAdminAnalytics(lastHostels, s, h);
    renderAi(lastHostels, s, h);
    renderAlerts(lastHostels, h);
    renderSystem(lastHostels, s, h);
    renderTop5(lastHostels, h);
    $('dashNote').textContent = '© 2026 IIT Guwahati Waste Monitor · Wastewize · Last updated ' + new Date().toLocaleTimeString();
  }

  let lastLiveCount = -1;
  async function refresh() {
    $('dashRefresh').classList.add('spin');
    try {
      const data = await fetchFeeds();
      lastHostels = buildHostels(bucketReal(data.feeds));
      const liveCount = lastHostels.filter(x => x.source === 'live').length;
      // toast when a new live reading arrives between refreshes
      const liveReadings = lastHostels.reduce((n, x) => n + (x.source === 'live' ? x.stats.readings.length : 0), 0);
      if (lastLiveCount >= 0 && liveReadings > lastLiveCount) { showToast('📡 New reading received from a Waste Scale'); feedFlash = true; }
      lastLiveCount = liveReadings;
      if (CFG.DEMO_FILL && liveCount < HOSTELS.length) {
        showBanner('📡 <strong>' + liveCount + '</strong> hostel(s) sending live data via the server; the rest are simulated (<code>DEMO_FILL</code> in <code>config.js</code>).');
      } else hideBanner();
    } catch (err) {
      showBanner('❌ Could not reach the Wastewize server (<strong>' + err.message + '</strong>) — showing simulated data. Start it with <code>npm start</code>.');
      lastHostels = buildHostels({});
    }
    $('dashRefresh').classList.remove('spin');
    renderAll();
  }

  $('dashRefresh').addEventListener('click', refresh);

  function start() {
    tickClock();
    loadServerConfig();
    refresh();
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, (CFG.REFRESH_SECONDS || 20) * 1000);
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tickClock, 1000);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
  }

  // Kiosk mode (?kiosk=1): the hostel-TV iframe shows a clean, read-only
  // dashboard with no login and no controls. Scope it to that TV's hostel.
  const kioskParams = new URLSearchParams(location.search);
  if (kioskParams.get('kiosk') === '1') {
    document.body.classList.add('kiosk-mode');
    // activate the dashboard section in the single-page app
    const dlink = document.querySelector('.nav-links a[href="#dashboard"]');
    if (dlink) dlink.click();
    applyRole('user');
    showApp(true);
    start();
    const hk = parseInt(kioskParams.get('hostel') || localStorage.getItem('wastewize_display_hostel') || '0', 10);
    if (hk >= 1 && hk <= HOSTELS.length && typeof openHostel === 'function') {
      setTimeout(() => openHostel(hk), 900);
    }
  } else if (localStorage.getItem(AUTH_KEY) === '1') {
    applyRole(localStorage.getItem(ROLE_KEY) || 'admin');
    showApp(true); start();
  } else showApp(false);
})();
