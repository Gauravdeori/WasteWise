/* ================================================================
   Wastewize — Advertisement Manager (admin only)
   ----------------------------------------------------------------
   Third dashboard: upload sponsor photos/videos, set how often and
   how long they play on the hostel TVs, target hostels, and track
   impressions. Talks to /api/ads/* which requires the admin token.
   ================================================================ */
(function () {
  const CFG = window.FOODWATCH_CONFIG || {};
  const API = (CFG.API_BASE || '').replace(/\/$/, '');
  const HOSTELS = CFG.HOSTELS || [];
  const $ = id => document.getElementById(id);
  if (!$('adsView')) return;

  const token = () => localStorage.getItem('foodwatch_token') || '';
  const isAdmin = () => localStorage.getItem('foodwatch_role') === 'admin';
  let cloudEnabled = false;
  let source = 'file';

  /* ---------- view switching ---------- */
  function showAds(on) {
    $('adsView').hidden = !on;
    const grid = document.querySelector('.bn-grid');
    if (grid) grid.hidden = on;
    if (on) { load(); $('adsView').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  $('adsBtn') && $('adsBtn').addEventListener('click', () => showAds(true));
  $('adsBack') && $('adsBack').addEventListener('click', () => showAds(false));

  /* ---------- hostel checkboxes ---------- */
  $('adHostels').innerHTML = HOSTELS.map((n, i) =>
    `<label class="ads-hostel"><input type="checkbox" value="${i + 1}"><span>${n}</span></label>`).join('');

  /* ---------- source tabs ---------- */
  document.querySelectorAll('.ads-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.ads-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    source = t.dataset.src;
    $('adsSrcFile').hidden = source !== 'file';
    $('adsSrcUrl').hidden = source !== 'url';
  }));

  /* ---------- load ---------- */
  async function load() {
    if (!isAdmin()) return;
    try {
      const r = await fetch(API + '/api/ads', { headers: { 'x-admin-token': token() }, cache: 'no-store' });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP ' + r.status);
      const j = await r.json();
      cloudEnabled = j.cloudEnabled;
      $('adsInterval').value = j.settings.intervalMinutes;
      $('adsDuration').value = j.settings.defaultDurationSec;
      $('adDuration').placeholder = j.settings.defaultDurationSec;
      renderCloudNote();
      renderList(j.ads || []);
      hideBanner();
    } catch (e) {
      banner('❌ Could not load ads: ' + e.message);
    }
  }

  function renderCloudNote() {
    const n = $('adsCloudNote');
    if (cloudEnabled) {
      n.innerHTML = '☁️ Uploads go to Cloudinary. Images and videos up to 60 MB.';
      n.className = 'ads-note ok';
      $('adFile').disabled = false;
    } else {
      n.innerHTML = '⚠️ File upload is off — add <code>CLOUDINARY_*</code> keys to <code>.env</code> to enable it. Use <b>Paste URL</b> for now.';
      n.className = 'ads-note warn';
      $('adFile').disabled = true;
    }
  }

  function banner(html) { $('adsBanner').innerHTML = html; $('adsBanner').hidden = false; }
  function hideBanner() { $('adsBanner').hidden = true; }

  /* ---------- list ---------- */
  function statusOf(ad) {
    if (ad.active === false) return { t: 'Paused', c: 'off' };
    const now = new Date();
    if (ad.start && now < new Date(ad.start)) return { t: 'Scheduled', c: 'wait' };
    if (ad.end && now > new Date(ad.end + 'T23:59:59')) return { t: 'Expired', c: 'off' };
    return { t: 'Live', c: 'live' };
  }
  function renderList(ads) {
    $('adsCount').textContent = `(${ads.length})`;
    const totalPlays = ads.reduce((s, a) => s + (a.plays || 0), 0);
    $('adsPlays').textContent = totalPlays ? `${totalPlays.toLocaleString('en-IN')} total plays` : '';
    if (!ads.length) {
      $('adsList').innerHTML = '<p class="ads-empty">No advertisements yet. Add one to start earning.</p>';
      return;
    }
    $('adsList').innerHTML = ads.map(ad => {
      const st = statusOf(ad);
      const where = (ad.hostels && ad.hostels.length)
        ? ad.hostels.map(h => HOSTELS[h - 1] || h).join(', ')
        : 'All 14 hostels';
      const media = ad.type === 'video'
        ? `<video src="${ad.url}" muted></video>`
        : `<img src="${ad.url}" alt="">`;
      const dates = (ad.start || ad.end) ? `${ad.start || '—'} → ${ad.end || '—'}` : 'Always on';
      return `<div class="ads-item" data-id="${ad.id}">
        <div class="ads-thumb">${media}<span class="ads-type">${ad.type === 'video' ? '▶' : '▣'}</span></div>
        <div class="ads-info">
          <div class="ads-item-top">
            <b>${ad.title}</b>
            <span class="ads-status ${st.c}">${st.t}</span>
          </div>
          ${ad.sponsor ? `<p class="ads-sponsor">${ad.sponsor}</p>` : ''}
          <p class="ads-meta">${ad.durationSec}s · ${where}</p>
          <p class="ads-meta dim">${dates} · ${(ad.plays || 0).toLocaleString('en-IN')} plays</p>
        </div>
        <div class="ads-actions">
          <button class="bn-back ads-toggle" data-id="${ad.id}" data-active="${ad.active !== false}">
            ${ad.active === false ? 'Resume' : 'Pause'}
          </button>
          <button class="bn-back danger ads-del" data-id="${ad.id}">Delete</button>
        </div>
      </div>`;
    }).join('');
  }

  /* ---------- create ---------- */
  $('adsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('adSubmit');
    const fd = new FormData();
    fd.append('title', $('adTitle').value.trim());
    fd.append('sponsor', $('adSponsor').value.trim());
    fd.append('durationSec', $('adDuration').value || $('adsDuration').value);
    fd.append('start', $('adStart').value);
    fd.append('end', $('adEnd').value);
    const hostels = [...document.querySelectorAll('#adHostels input:checked')].map(c => Number(c.value));
    fd.append('hostels', JSON.stringify(hostels));

    if (source === 'file') {
      const f = $('adFile').files[0];
      if (!f) { msg('✗ Choose a photo or video', true); return; }
      fd.append('file', f);
    } else {
      const u = $('adUrl').value.trim();
      if (!u) { msg('✗ Paste a media URL', true); return; }
      fd.append('url', u);
      fd.append('type', $('adType').value);
    }

    btn.disabled = true; msg('Uploading…');
    try {
      const r = await fetch(API + '/api/ads', { method: 'POST', headers: { 'x-admin-token': token() }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        msg('✓ Advertisement added');
        $('adsForm').reset();
        document.querySelectorAll('#adHostels input:checked').forEach(c => c.checked = false);
        load();
      } else if (r.status === 403) msg('✗ Admin session expired — sign in again', true);
      else msg('✗ ' + (j.error || 'failed'), true);
    } catch (err) { msg('✗ ' + err.message, true); }
    btn.disabled = false;
  });
  function msg(t, bad) { const m = $('adsMsg'); m.textContent = t; m.className = 'ads-msg' + (bad ? ' bad' : ''); if (!bad) setTimeout(() => (m.textContent = ''), 4000); }

  /* ---------- pause / delete ---------- */
  $('adsList').addEventListener('click', async e => {
    const tog = e.target.closest('.ads-toggle');
    const del = e.target.closest('.ads-del');
    if (tog) {
      const active = tog.dataset.active === 'true';
      await fetch(API + '/api/ads/' + tog.dataset.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
        body: JSON.stringify({ active: !active })
      });
      load();
    }
    if (del) {
      if (!confirm('Delete this advertisement? This also removes the media from Cloudinary.')) return;
      await fetch(API + '/api/ads/' + del.dataset.id, { method: 'DELETE', headers: { 'x-admin-token': token() } });
      load();
    }
  });

  /* ---------- settings ---------- */
  $('adsSaveSettings').addEventListener('click', async () => {
    try {
      const r = await fetch(API + '/api/ads/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token() },
        body: JSON.stringify({ intervalMinutes: $('adsInterval').value, defaultDurationSec: $('adsDuration').value })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        $('adsTimingNote').textContent =
          `Saved — each TV plays the ad break every ${j.settings.intervalMinutes} min; new ads default to ${j.settings.defaultDurationSec}s.`;
      } else banner('✗ ' + (j.error || 'could not save timing'));
    } catch (e) { banner('✗ ' + e.message); }
  });

  /* ---------- expose the ads button for admins ---------- */
  window.WW_showAdsButton = function () {
    const b = $('adsBtn');
    if (b) b.hidden = !isAdmin();
  };
  setTimeout(() => window.WW_showAdsButton(), 800);
})();
