/* ================================================================
   WasteWise — Food Waste Monitor Dashboard
   ----------------------------------------------------------------
   • Login gate (demo auth, browser-only)
   • Facility selector: Global Campus View or any of the 14 hostels
   • KPI cards, Hostel Performance Matrix (+CSV export),
     30-day trend, weekly meal breakdown, live meal bins
   • Live data from ThingSpeak (field1 = weight, field2 = hostel code)
   • Hostels without real data are simulated (config.DEMO_FILL)
   ================================================================ */
(function () {
  const CFG = window.FOODWATCH_CONFIG || {};
  const $ = id => document.getElementById(id);
  if (!$('dashApp')) return;

  const HOSTELS = CFG.HOSTELS || [];
  const PRICE = CFG.PRICE_PER_KG || 75;
  const CO2 = CFG.CO2_PER_KG || 2.5;
  const POP = CFG.HOSTEL_POPULATION || 450;
  const API = (CFG.API_BASE || '').replace(/\/$/, '');   // backend base, '' = same origin
  const nf = n => Number(n).toLocaleString('en-IN');
  const localKey = d => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  const sameDay = (a, b) => localKey(a) === localKey(b);

  // Meal windows (24h): [startHour, endHour)
  const MEALS = [
    { key: 'breakfast', label: 'Breakfast Bin', start: 7.5, end: 11, startTxt: '07:30' },
    { key: 'lunch', label: 'Lunch Bin', start: 12.5, end: 16, startTxt: '12:30' },
    { key: 'dinner', label: 'Dinner Bin', start: 19.5, end: 23, startTxt: '19:30' }
  ];

  /* ---------------- AUTH ---------------- */
  const AUTH_KEY = 'foodwatch_auth';
  function showApp(show) { $('dashLogin').hidden = show; $('dashApp').hidden = !show; }

  $('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('loginUser').value.trim() === (CFG.AUTH_USERNAME || 'admin') &&
               $('loginPass').value === (CFG.AUTH_PASSWORD || 'foodwatch2026');
    if (ok) {
      localStorage.setItem(AUTH_KEY, '1');
      $('loginErr').hidden = true;
      showApp(true); start();
    } else {
      $('loginErr').textContent = '✗ Invalid username or password.';
      $('loginErr').hidden = false;
    }
  });
  $('dashLogout').addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    stop(); showApp(false); $('loginForm').reset();
  });
  if (CFG.SHOW_LOGIN_HINT) {
    $('loginHint').innerHTML = 'Demo login → <b>' + (CFG.AUTH_USERNAME || 'admin') + '</b> / <b>' + (CFG.AUTH_PASSWORD || 'foodwatch2026') + '</b>';
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
    const scale = 0.6 + (mulberry32(hostelIndex * 97)() * 0.9);
    for (let d = 29; d >= 0; d--) {
      const rnd = mulberry32(hostelIndex * 1000 + d);
      // cluster events inside meal windows so the meal breakdown looks right
      MEALS.forEach(m => {
        const events = 1 + Math.floor(rnd() * 3);
        for (let e = 0; e < events; e++) {
          const t = new Date(now);
          t.setDate(now.getDate() - d);
          const hour = m.start + rnd() * (m.end - m.start);
          t.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0);
          if (t > now) continue;
          out.push({ weight: +((0.4 + rnd() * 2.6) * scale).toFixed(2), time: t, source: 'sim' });
        }
      });
    }
    return out.sort((a, b) => a.time - b.time);
  }

  /* ---------------- STATS ---------------- */
  function computeStats(readings) {
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    let today = 0, yday = 0, week7 = 0;
    const dayMap = {};
    readings.forEach(r => {
      if (sameDay(r.time, now)) today += r.weight;
      if (sameDay(r.time, yesterday)) yday += r.weight;
      dayMap[localKey(r.time)] = (dayMap[localKey(r.time)] || 0) + r.weight;
    });
    // last 30 days (oldest -> newest)
    const days30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      days30.push({ date: d, kg: +(dayMap[localKey(d)] || 0) });
    }
    for (let i = 23; i < 30; i++) week7 += days30[i].kg;
    const latest = readings.length ? readings[readings.length - 1] : null;
    const online = latest ? (now - latest.time) / 60000 <= (CFG.DEVICE_ONLINE_MINUTES || 10) : false;
    return { today, yday, week7, days30, latest, online, readings };
  }

  function buildHostels(realByHostel) {
    return HOSTELS.map((name, i) => {
      const code = i + 1;
      const real = (realByHostel[code] || []).sort((a, b) => a.time - b.time);
      let dataset, source;
      if (real.length) { dataset = real; source = 'live'; }
      else if (CFG.DEMO_FILL) { dataset = simReadings(code); source = 'sim'; }
      else { dataset = []; source = 'none'; }
      return { code, name, source, stats: computeStats(dataset) };
    });
  }

  // merge stats for "Global Campus View"
  function globalStats(hostels) {
    const readings = hostels.flatMap(h => h.stats.readings).sort((a, b) => a.time - b.time);
    return computeStats(readings);
  }

  /* ---------------- FETCH (via backend proxy) ---------------- */
  let serverConfig = { channelId: '', writeEnabled: false };
  async function loadServerConfig() {
    try {
      const r = await fetch(API + '/api/config', { cache: 'no-store' });
      if (r.ok) serverConfig = await r.json();
    } catch (e) { /* backend down — handled during refresh */ }
  }
  async function fetchFeeds() {
    const res = await fetch(`${API}/api/feeds?results=${CFG.MAX_FEED_RESULTS || 8000}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }
  function bucketReal(feeds) {
    const wField = CFG.FIELD_WEIGHT || 'field1';
    const sField = CFG.FIELD_STATION || 'field2';
    const map = {};
    (feeds || []).forEach(f => {
      const w = parseFloat(f[wField]); if (isNaN(w)) return;
      const t = new Date(f.created_at); if (isNaN(t.getTime())) return;
      let code = parseInt(f[sField], 10);
      if (isNaN(code) || code < 1 || code > HOSTELS.length) code = 1;
      (map[code] = map[code] || []).push({ weight: w, time: t, source: 'live' });
    });
    return map;
  }

  /* ---------------- RENDER: KPIs ---------------- */
  function renderKpis(stats, scopePop) {
    $('kWaste').textContent = nf(+stats.today.toFixed(1));
    $('kValue').textContent = nf(Math.round(stats.today * PRICE));
    $('kCo2').textContent = (stats.today * CO2 / 1000).toFixed(1);
    $('kCapita').textContent = Math.round(stats.today * 1000 / scopePop);

    // deltas vs yesterday
    const dKg = stats.today - stats.yday;
    const pct = stats.yday > 0 ? (dKg / stats.yday) * 100 : 0;
    const wB = $('kWasteBadge');
    wB.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    wB.className = 'dw-pill' + (pct > 0 ? ' red' : '');

    const vB = $('kValueBadge');
    const dVal = dKg * PRICE;
    vB.textContent = (dVal >= 0 ? '+' : '-') + '₹' + nf(Math.abs(Math.round(dVal)));
    vB.className = 'dw-pill' + (dVal > 0 ? ' red' : '');

    const cB = $('kCo2Badge');
    const tons = stats.today * CO2 / 1000;
    cB.textContent = tons < 1 ? 'Low' : tons < 3 ? 'Neutral' : 'High';
    cB.className = 'dw-pill' + (tons >= 3 ? ' red' : '');

    const pB = $('kCapitaBadge');
    const dG = Math.round(dKg * 1000 / scopePop);
    pB.textContent = (dG >= 0 ? '+' : '') + dG + 'g';
    pB.className = 'dw-pill dark';
  }

  /* ---------------- RENDER: MATRIX ---------------- */
  let showAll = false;
  function trendArrow(s) {
    if (!s.readings.length) return '<span class="dw-trend na">N/A</span>';
    const avg = s.week7 / 7;
    if (avg <= 0) return '<span class="dw-trend flat">→</span>';
    if (s.today > avg * 1.15) return '<span class="dw-trend up">↗</span>';
    if (s.today < avg * 0.85) return '<span class="dw-trend down">↘</span>';
    return '<span class="dw-trend flat">→</span>';
  }
  function renderMatrix(hostels) {
    const rows = hostels.slice().sort((a, b) => b.stats.today - a.stats.today);
    const visible = showAll ? rows : rows.slice(0, 5);
    $('matrixBody').innerHTML = visible.map(h => {
      const on = h.source !== 'none';
      const kg = h.stats.today;
      return `<tr>
        <td class="h-name">${h.name}</td>
        <td><span class="dw-status ${on ? 'on' : 'off'}">● ${on ? 'ONLINE' : 'OFFLINE'}</span></td>
        <td class="${on ? 'h-kg' : 'h-muted'}">${on ? kg.toFixed(1) : '--'}</td>
        <td class="${on ? 'h-per' : 'h-muted'}">${on ? Math.round(kg * 1000 / POP) : '--'}</td>
        <td>${on ? trendArrow(h.stats) : '<span class="dw-trend na">N/A</span>'}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="dw-empty">No hostels configured</td></tr>';
    $('viewAllBtn').textContent = showAll ? 'Show Top 5' : 'View All ' + hostels.length + ' Hostels';
  }
  $('viewAllBtn').addEventListener('click', () => { showAll = !showAll; renderMatrix(lastHostels); });

  $('exportCsv').addEventListener('click', () => {
    const head = 'Hostel,Status,Waste Today (kg),Per Head (g),7-day Total (kg)\n';
    const body = lastHostels.map(h => {
      const on = h.source !== 'none';
      return [h.name, on ? 'ONLINE' : 'OFFLINE',
        on ? h.stats.today.toFixed(2) : '',
        on ? Math.round(h.stats.today * 1000 / POP) : '',
        on ? h.stats.week7.toFixed(2) : ''].join(',');
    }).join('\n');
    const blob = new Blob([head + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wastewise-hostel-matrix.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------------- RENDER: 30-DAY TREND (SVG area) ---------------- */
  function renderTrend(stats) {
    const days = stats.days30;
    const W = 320, H = 150, PAD = 8;
    const max = Math.max(...days.map(d => d.kg), 0.001);
    const pts = days.map((d, i) => [
      PAD + (i / (days.length - 1)) * (W - PAD * 2),
      H - PAD - (d.kg / max) * (H - PAD * 2 - 10)
    ]);
    // smooth path (quadratic midpoints)
    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      const my = (pts[i - 1][1] + pts[i][1]) / 2;
      path += ` Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${mx} ${my}`;
    }
    path += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
    const area = path + ` L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`;
    $('trendChart').innerHTML = `
      <defs>
        <linearGradient id="dwArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b6fe0" stop-opacity=".28"/>
          <stop offset="100%" stop-color="#3b6fe0" stop-opacity=".02"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#dwArea)"/>
      <path d="${path}" fill="none" stroke="#3b6fe0" stroke-width="2" stroke-linecap="round"/>`;

    const fmt = d => d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    $('trendAxis').innerHTML =
      `<span>${fmt(days[0].date)}</span><span>${fmt(days[15].date)}</span><span>${fmt(days[29].date)}</span>`;

    const total = days.reduce((s, d) => s + d.kg, 0);
    $('trendTotal').textContent = 'TOTAL: ' + (total / 1000).toFixed(1) + 't';
  }

  /* ---------------- RENDER: WEEKLY MEAL BREAKDOWN ---------------- */
  function mealOf(t) {
    const h = t.getHours() + t.getMinutes() / 60;
    if (h < 11.5) return 'breakfast';
    if (h < 17) return 'lunch';
    return 'dinner';
  }
  function renderMeals(stats) {
    const now = new Date();
    const days = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      days.push({ date: d, breakfast: 0, lunch: 0, dinner: 0 });
    }
    stats.readings.forEach(r => {
      const day = days.find(d => sameDay(d.date, r.time));
      if (day) day[mealOf(r.time)] += r.weight;
    });
    const max = Math.max(...days.map(d => d.breakfast + d.lunch + d.dinner), 0.001);
    $('mealChart').innerHTML = days.map(d => {
      const pb = (d.breakfast / max) * 100, pl = (d.lunch / max) * 100, pd = (d.dinner / max) * 100;
      const label = d.date.toLocaleDateString([], { weekday: 'narrow' });
      return `<div class="dw-stack" title="${d.date.toLocaleDateString()} — B ${d.breakfast.toFixed(1)} / L ${d.lunch.toFixed(1)} / D ${d.dinner.toFixed(1)} kg">
        <i class="seg-b" style="height:${pb}%"></i>
        <i class="seg-l" style="height:${pl}%"></i>
        <i class="seg-d" style="height:${pd}%"></i>
        <label>${label}</label>
      </div>`;
    }).join('');
  }

  /* ---------------- RENDER: MEAL BINS ---------------- */
  function renderBins(stats) {
    const now = new Date();
    const nowH = now.getHours() + now.getMinutes() / 60;
    const todays = stats.readings.filter(r => sameDay(r.time, now));
    const kgFor = key => todays.filter(r => mealOf(r.time) === key).reduce((s, r) => s + r.weight, 0);

    $('dwBins').innerHTML = MEALS.map(m => {
      const kg = kgFor(m.key);
      const isLive = nowH >= m.start && nowH < m.end;
      const isPast = nowH >= m.end;
      if (isLive) {
        const ageS = stats.latest ? Math.max(1, Math.round((now - stats.latest.time) / 1000)) : null;
        const age = ageS === null ? '—' : ageS < 60 ? ageS + 's ago' : Math.round(ageS / 60) + 'm ago';
        const loadPct = Math.min(100, (kg / 60) * 100);
        const load = loadPct > 75 ? 'High Load' : loadPct > 35 ? 'Normal Load' : 'Light Load';
        return `<div class="dw-bin live">
          <p class="dw-bin-label">Live: ${m.label}</p>
          <div class="dw-bin-row">
            <span class="dw-bin-kg">${kg.toFixed(1)} <small>kg</small></span>
            <span class="dw-bin-side">Update:<br>${age}<br>${load}</span>
          </div>
          <div class="dw-bin-bar"><i style="--w:${Math.max(4, loadPct)}%"></i></div>
        </div>`;
      }
      if (isPast) {
        return `<div class="dw-bin">
          <p class="dw-bin-label">${m.label} (done)</p>
          <div class="dw-bin-row">
            <span class="dw-bin-kg">${kg.toFixed(1)} <small>kg</small></span>
            <span class="dw-bin-side">Ended<br>Completed</span>
          </div>
          <div class="dw-bin-bar"><i style="--w:100%"></i></div>
        </div>`;
      }
      return `<div class="dw-bin">
        <p class="dw-bin-label">${m.label} (est)</p>
        <div class="dw-bin-row">
          <span class="dw-bin-kg">00.0 <small>kg</small></span>
          <span class="dw-bin-side">Starts<br>at ${m.startTxt}<br>Standby</span>
        </div>
        <div class="dw-bin-bar"><i style="--w:0%"></i></div>
      </div>`;
    }).join('');
  }

  /* ---------------- FACILITY SELECT ---------------- */
  let scope = 0; // 0 = global, else hostel code
  function initSelect() {
    $('facilitySelect').innerHTML =
      '<option value="0">Global Campus View</option>' +
      HOSTELS.map((n, i) => `<option value="${i + 1}">${n} Hostel</option>`).join('');
    $('facilitySelect').addEventListener('change', e => {
      scope = +e.target.value;
      renderAll();
    });
  }

  /* ---------------- MANUAL ENTRY (via backend) ---------------- */
  let manualReady = false;
  function setupManual() {
    if (manualReady || !serverConfig.writeEnabled) return;
    manualReady = true;
    $('dashManual').hidden = false;
    $('manualHostel').innerHTML = HOSTELS.map((n, i) => `<option value="${i + 1}">${n}</option>`).join('');
    $('manualForm').addEventListener('submit', async e => {
      e.preventDefault();
      const w = parseFloat($('manualWeight').value);
      if (isNaN(w)) return;
      $('manualMsg').textContent = 'Sending…';
      try {
        const r = await fetch(API + '/api/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: w, hostel: $('manualHostel').value })
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.entry_id > 0) $('manualMsg').textContent = '✓ Sent (entry #' + j.entry_id + ')';
        else if (r.ok && j.entry_id === 0) $('manualMsg').textContent = '⚠ Rate limited — wait 15s';
        else $('manualMsg').textContent = '✗ ' + (j.error || 'failed');
        $('manualForm').reset();
        setTimeout(refresh, 1500);
      } catch (err) { $('manualMsg').textContent = '✗ ' + err.message; }
      setTimeout(() => ($('manualMsg').textContent = ''), 6000);
    });
  }

  /* ---------------- MAIN ---------------- */
  let lastHostels = [];
  let timer = null;

  function showBanner(html) { const b = $('dashBanner'); b.innerHTML = html; b.hidden = false; }
  function hideBanner() { $('dashBanner').hidden = true; }

  function renderAll() {
    const stats = scope === 0
      ? globalStats(lastHostels)
      : (lastHostels.find(h => h.code === scope) || { stats: computeStats([]) }).stats;
    const pop = scope === 0 ? POP * HOSTELS.length : POP;
    renderKpis(stats, pop);
    renderMatrix(lastHostels);
    renderTrend(stats);
    renderMeals(stats);
    renderBins(stats);
    $('dashNote').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  }

  async function refresh() {
    try {
      const data = await fetchFeeds();
      lastHostels = buildHostels(bucketReal(data.feeds));
      const liveCount = lastHostels.filter(h => h.source === 'live').length;
      if (!data.feeds || !data.feeds.length) {
        showBanner('✅ Connected to the WasteWise server. Waiting for the first reading — other hostels show simulated data.');
      } else if (CFG.DEMO_FILL && liveCount < HOSTELS.length) {
        showBanner('📡 <strong>' + liveCount + '</strong> hostel(s) sending live data via the server; the rest are simulated (<code>DEMO_FILL</code> in <code>config.js</code>).');
      } else hideBanner();
    } catch (err) {
      showBanner('❌ Could not reach the WasteWise server (<strong>' + err.message + '</strong>) — showing simulated data. Start it with <code>npm start</code>.');
      lastHostels = buildHostels({});
    }
    renderAll();
  }

  $('dashRefresh').addEventListener('click', refresh);

  async function start() {
    await loadServerConfig();
    setupManual();
    refresh();
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, (CFG.REFRESH_SECONDS || 20) * 1000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  initSelect();
  if (localStorage.getItem(AUTH_KEY) === '1') { showApp(true); start(); }
  else showApp(false);
})();
