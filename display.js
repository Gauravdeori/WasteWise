/* ================================================================
   Wastewize — Hostel TV / Kiosk display
   ----------------------------------------------------------------
   Runs on the monitor installed in a hostel mess:
     • shows the live waste dashboard (read-only viewer)
     • every `intervalMinutes`, plays the sponsor ads full-screen,
       each for its own `durationSec`, then returns to the dashboard
   The playlist + timings come from /api/ads/playlist (public), which
   the Ads dashboard controls. Keyboard: F = fullscreen, R = reset.
   ================================================================ */
(function () {
  const CFG = window.FOODWATCH_CONFIG || {};
  const API = (CFG.API_BASE || '').replace(/\/$/, '');
  const HOSTELS = CFG.HOSTELS || [];
  const $ = id => document.getElementById(id);
  const KEY = 'wastewize_display_hostel';

  let playlist = [];
  let settings = { intervalMinutes: 10, defaultDurationSec: 15 };
  let hostel = null;
  let adCycleTimer = null;
  let playing = false;

  /* ---------------- setup ---------------- */
  function initSetup() {
    $('hostelPick').innerHTML = HOSTELS.map((n, i) =>
      `<option value="${i + 1}">${n} Hostel</option>`).join('');
    $('startBtn').addEventListener('click', () => {
      hostel = $('hostelPick').value;
      localStorage.setItem(KEY, hostel);
      start();
    });
  }

  function start() {
    $('setup').style.display = 'none';
    const board = $('board');
    // the dashboard, forced into the simplified read-only viewer
    board.src = 'index.html?kiosk=1#dashboard';
    board.hidden = false;
    loadPlaylist();
    scheduleNextBreak();
    setInterval(loadPlaylist, 60000);   // pick up ad changes within a minute
  }

  /* ---------------- playlist ---------------- */
  async function loadPlaylist() {
    try {
      const r = await fetch(`${API}/api/ads/playlist?hostel=${encodeURIComponent(hostel)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      settings = j.settings || settings;
      playlist = j.ads || [];
      $('err').hidden = true;
    } catch (e) {
      $('err').textContent = 'Ad service unreachable: ' + e.message;
      $('err').hidden = false;
    }
  }

  /* ---------------- ad break scheduling ---------------- */
  function scheduleNextBreak() {
    clearTimeout(adCycleTimer);
    const ms = Math.max(1, settings.intervalMinutes) * 60000;
    const at = Date.now() + ms;
    tickPill(at);
    adCycleTimer = setTimeout(runBreak, ms);
  }

  function tickPill(at) {
    const pill = $('nextPill'), txt = $('nextTxt');
    clearInterval(tickPill._t);
    const upd = () => {
      if (playing) { pill.classList.add('hide'); return; }
      const left = Math.max(0, at - Date.now());
      if (!playlist.length) { txt.textContent = 'No ads scheduled'; }
      else {
        const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
        txt.textContent = `Next sponsor break in ${m}:${String(s).padStart(2, '0')}`;
      }
      pill.classList.remove('hide');
    };
    upd();
    tickPill._t = setInterval(upd, 1000);
  }

  async function runBreak() {
    if (!playlist.length) { scheduleNextBreak(); return; }
    playing = true;
    $('nextPill').classList.add('hide');
    $('adLayer').classList.add('on');
    for (const ad of playlist) {
      await playAd(ad);
    }
    $('adLayer').classList.remove('on');
    $('adSlot').innerHTML = '';
    playing = false;
    scheduleNextBreak();
  }

  function playAd(ad) {
    return new Promise(resolve => {
      const slot = $('adSlot');
      const secs = Math.max(3, ad.durationSec || settings.defaultDurationSec);
      $('adTitle').textContent = ad.title || '';
      $('adSponsor').textContent = ad.sponsor ? 'Sponsored by ' + ad.sponsor : '';

      if (ad.type === 'video') {
        slot.innerHTML = `<video id="adVid" autoplay muted playsinline src="${ad.url}"></video>`;
      } else {
        slot.innerHTML = `<img src="${ad.url}" alt="${(ad.title || 'Advertisement').replace(/"/g, '')}">`;
      }
      countImpression(ad.id);

      // countdown ring
      const ring = $('ring'), C = 2 * Math.PI * 24;
      ring.style.strokeDasharray = C;
      let left = secs;
      const paint = () => {
        $('adCount').textContent = left;
        ring.style.strokeDashoffset = C * (1 - left / secs);
      };
      paint();
      const iv = setInterval(() => { left--; paint(); if (left <= 0) clearInterval(iv); }, 1000);

      const done = () => { clearInterval(iv); resolve(); };
      const vid = document.getElementById('adVid');
      if (vid) {
        // a video runs to its own end, but never longer than its slot
        vid.onended = done;
        setTimeout(done, secs * 1000);
      } else {
        setTimeout(done, secs * 1000);
      }
    });
  }

  function countImpression(id) {
    fetch(`${API}/api/ads/${id}/play`, { method: 'POST' }).catch(() => {});
  }

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'f') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    }
    if (k === 'r') { localStorage.removeItem(KEY); location.reload(); }
    if (k === 'a' && !playing) runBreak();   // preview a break on demand
  });

  /* ---------------- boot ---------------- */
  initSetup();
  const saved = localStorage.getItem(KEY);
  if (saved) { hostel = saved; start(); }
})();
