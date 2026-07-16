/* ================================================================
   WasteWise — backend server
   ----------------------------------------------------------------
   Serves the static site AND proxies ThingSpeak so the API keys
   stay on the server (in .env) and never reach the browser.

   Endpoints:
     GET  /api/config   -> { channelId, writeEnabled, adminAuth }  (no secrets)
     GET  /api/feeds    -> ThingSpeak feeds (uses READ key server-side)
     POST /api/login    -> { role, token } if admin credentials are valid
     POST /api/reading  -> writes a reading; REQUIRES a valid admin token

   Run:  npm install  &&  npm start        (http://localhost:3000)
   ================================================================ */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const resetFilePath = path.join(__dirname, 'reset_timestamp.txt');
let localResetTime = null;
if (fs.existsSync(resetFilePath)) {
  try {
    const tsStr = fs.readFileSync(resetFilePath, 'utf8').trim();
    if (tsStr) localResetTime = new Date(tsStr);
  } catch (e) {
    console.error('Failed to read reset timestamp:', e);
  }
}

const CHANNEL = process.env.TS_CHANNEL_ID || '';
const READ_KEY = process.env.TS_READ_KEY || '';
const WRITE_KEY = process.env.TS_WRITE_KEY || '';
const USER_KEY = process.env.TS_USER_API_KEY || '';   // account key — needed to clear a channel
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_ENABLED = Boolean(ADMIN_USER && ADMIN_PASS && ADMIN_TOKEN);
const PORT = process.env.PORT || 3000;

// Multi-channel configuration (splits 14 hostels across 4 channels)
const CHANNELS = [
  {
    id: process.env.TS_CHANNEL_1_ID || '',
    readKey: process.env.TS_READ_KEY_1 || '',
    writeKey: process.env.TS_WRITE_KEY_1 || ''
  },
  {
    id: process.env.TS_CHANNEL_2_ID || '',
    readKey: process.env.TS_READ_KEY_2 || '',
    writeKey: process.env.TS_WRITE_KEY_2 || ''
  },
  {
    id: process.env.TS_CHANNEL_3_ID || '',
    readKey: process.env.TS_READ_KEY_3 || '',
    writeKey: process.env.TS_WRITE_KEY_3 || ''
  },
  {
    id: process.env.TS_CHANNEL_4_ID || '',
    readKey: process.env.TS_READ_KEY_4 || '',
    writeKey: process.env.TS_WRITE_KEY_4 || ''
  }
];

const IS_MULTI_CHANNEL = Boolean(
  CHANNELS[0].id && CHANNELS[1].id && CHANNELS[2].id && CHANNELS[3].id
);

function getChannelIndex(hostelCode) {
  const code = parseInt(hostelCode, 10);
  if (isNaN(code)) return null;
  // Channel 1: Hostels 1-4 (Brahmaputra, Subansiri, Lohit, Dhansiri Girls)
  if (code >= 1 && code <= 4) return 0;
  // Channel 2: Hostels 5-8 (Manas, Kopili, Barak, Jia Bharali)
  if (code >= 5 && code <= 8) return 1;
  // Channel 3: Hostels 9-11 (Pagladiya, Dikhow, Dhansiri Boys)
  if (code >= 9 && code <= 11) return 2;
  // Channel 4: Hostels 12-14 (Kojoli Annex, Bhrigu, Neelachal)
  if (code >= 12 && code <= 14) return 3;
  return null;
}

// Public, non-secret config the frontend needs
app.get('/api/config', (req, res) => {
  res.json({ channelId: CHANNEL, writeEnabled: Boolean(WRITE_KEY), adminAuth: ADMIN_ENABLED });
});

// Admin login — validates credentials server-side and hands back a token.
// The token (a static secret in .env) is required by write endpoints, so
// only someone who proves admin credentials can write. Read endpoints are open.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (ADMIN_ENABLED && username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ role: 'admin', token: ADMIN_TOKEN });
  }
  return res.status(401).json({ error: 'invalid admin credentials' });
});

// Middleware: require a valid admin token for write actions
function requireAdmin(req, res, next) {
  if (!ADMIN_ENABLED) {
    return res.status(503).json({ error: 'admin auth not configured on the server (set ADMIN_USER / ADMIN_PASS / ADMIN_TOKEN)' });
  }
  const token = req.get('x-admin-token') || '';
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'admin token required' });
  }
  next();
}

// Proxy: read feeds — the READ key stays here, never sent to the client
app.get('/api/feeds', async (req, res) => {
  const results = Math.min(parseInt(req.query.results, 10) || 8000, 8000);

  if (IS_MULTI_CHANNEL) {
    try {
      // Fetch feeds from all 4 channels concurrently
      const fetchPromises = CHANNELS.map((ch, idx) => {
        console.log(`[Multi-Channel] Fetching from Channel ${idx + 1} (ID: ${ch.id})`);
        const url = `https://api.thingspeak.com/channels/${ch.id}/feeds.json?results=${results}&api_key=${ch.readKey}`;
        return fetch(url, { signal: AbortSignal.timeout(10000) })
          .then(async r => {
            if (!r.ok) throw new Error(`Channel ${ch.id} returned status ${r.status}`);
            return r.json();
          });
      });

      const resultsArray = await Promise.all(fetchPromises);
      
      let combinedFeeds = [];
      resultsArray.forEach(data => {
        if (data && Array.isArray(data.feeds)) {
          combinedFeeds = combinedFeeds.concat(data.feeds);
        }
      });

      // Sort combined feeds by created_at in ascending order (earliest to latest)
      combinedFeeds.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // Filter feeds if localResetTime is set
      if (localResetTime) {
        combinedFeeds = combinedFeeds.filter(f => new Date(f.created_at) > localResetTime);
      }

      // Slice the combined list to the requested count of latest readings
      if (combinedFeeds.length > results) {
        combinedFeeds = combinedFeeds.slice(-results);
      }

      res.set('Cache-Control', 'no-store');
      res.json({
        channel: { name: 'WasteWise Multi-Channel' },
        feeds: combinedFeeds
      });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  } else {
    // Single channel fallback
    if (!CHANNEL || !READ_KEY) {
      return res.status(500).json({ error: 'server missing TS_CHANNEL_ID / TS_READ_KEY' });
    }
    const url = `https://api.thingspeak.com/channels/${CHANNEL}/feeds.json?results=${results}&api_key=${READ_KEY}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) return res.status(502).json({ error: 'thingspeak ' + r.status });
      const data = await r.json();
      if (data && Array.isArray(data.feeds) && localResetTime) {
        data.feeds = data.feeds.filter(f => new Date(f.created_at) > localResetTime);
      }
      res.set('Cache-Control', 'no-store');
      res.json(data);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  }
});

// Proxy: write a reading — the WRITE key stays here; requires an admin token
app.post('/api/reading', requireAdmin, async (req, res) => {
  const weight = Number(req.body.weight);
  const hostel = req.body.hostel;
  const rssi = Number(req.body.rssi);
  if (!isFinite(weight)) return res.status(400).json({ error: 'valid weight required' });

  let writeKey = WRITE_KEY;
  let chId = CHANNEL;

  if (IS_MULTI_CHANNEL && hostel) {
    const chIdx = getChannelIndex(hostel);
    if (chIdx !== null && CHANNELS[chIdx].writeKey) {
      writeKey = CHANNELS[chIdx].writeKey;
      chId = CHANNELS[chIdx].id;
    }
  }

  if (!writeKey) {
    return res.status(403).json({ error: 'writes disabled (no WRITE_KEY for channel/hostel)' });
  }

  console.log(`[Multi-Channel] Routing write for Hostel ${hostel} (mapped to Channel ID: ${chId})`);
  let url = `https://api.thingspeak.com/update?api_key=${writeKey}&field1=${encodeURIComponent(weight)}`;
  if (hostel) url += `&field2=${encodeURIComponent(hostel)}`;
  if (isFinite(rssi)) url += `&field3=${encodeURIComponent(rssi)}`;   // ESP32 WiFi signal (dBm)

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const entry = Number(await r.text());   // 0 = rate-limited / failed
    res.json({ entry_id: entry });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// DANGER: clear ALL data from the ThingSpeak channels (admin only, irreversible).
app.post('/api/reset', requireAdmin, async (req, res) => {
  const resetTime = new Date();
  try {
    fs.writeFileSync(resetFilePath, resetTime.toISOString(), 'utf8');
    localResetTime = resetTime;
  } catch (err) {
    console.error('Failed to save reset timestamp:', err);
  }

  let tsCleared = false;
  let tsError = null;

  if (IS_MULTI_CHANNEL) {
    const key = USER_KEY; // User API Key is required to clear feeds from account channels
    if (key && key !== 'CKPKGPFN0V5ZIWNG') {
      try {
        const clearPromises = CHANNELS.map(ch => {
          if (!ch.id) return Promise.resolve();
          return fetch(`https://api.thingspeak.com/channels/${ch.id}/feeds.json`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'api_key=' + encodeURIComponent(key),
            signal: AbortSignal.timeout(15000)
          }).then(async r => {
            const txt = (await r.text()).trim();
            if (!r.ok) throw new Error(`Channel ${ch.id}: ${txt || r.status}`);
            return txt;
          });
        });

        await Promise.all(clearPromises);
        tsCleared = true;
      } catch (e) {
        tsError = e.message;
      }
    }
  } else {
    // Single channel reset fallback
    const key = USER_KEY || WRITE_KEY;
    if (CHANNEL && key && key !== 'CKPKGPFN0V5ZIWNG' && key !== '8UQC65LT36FK7DT6') {
      try {
        const r = await fetch(`https://api.thingspeak.com/channels/${CHANNEL}/feeds.json`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'api_key=' + encodeURIComponent(key),
          signal: AbortSignal.timeout(15000)
        });
        const txt = (await r.text()).trim();
        if (r.ok) {
          tsCleared = true;
        } else {
          tsError = r.status === 401
            ? 'ThingSpeak rejected the key. Add TS_USER_API_KEY (Account → My Profile → User API Key) to .env.'
            : 'thingspeak ' + r.status + ': ' + txt;
        }
      } catch (e) {
        tsError = e.message;
      }
    }
  }

  return res.json({
    ok: true,
    message: tsCleared
      ? 'All channels cleared on ThingSpeak and local dashboard reset.'
      : 'Local dashboard reset. (ThingSpeak channels not cleared: ' + (tsError || 'TS_USER_API_KEY not configured') + ')'
  });
});

// Static site — deny dotfiles so .env / .git are never served
app.use(express.static(__dirname, { dotfiles: 'deny', extensions: ['html'] }));

// Export the app for Vercel
module.exports = app;

// Only listen if called directly (e.g. `node server.js`)
if (require.main === module) {
  app.listen(PORT, () => console.log(`WasteWise running on http://localhost:${PORT}`));
}
