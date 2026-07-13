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

const app = express();
app.use(express.json());

const CHANNEL = process.env.TS_CHANNEL_ID || '';
const READ_KEY = process.env.TS_READ_KEY || '';
const WRITE_KEY = process.env.TS_WRITE_KEY || '';
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_ENABLED = Boolean(ADMIN_USER && ADMIN_PASS && ADMIN_TOKEN);
const PORT = process.env.PORT || 3000;

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
  if (!CHANNEL || !READ_KEY) {
    return res.status(500).json({ error: 'server missing TS_CHANNEL_ID / TS_READ_KEY' });
  }
  const results = Math.min(parseInt(req.query.results, 10) || 8000, 8000);
  const url = `https://api.thingspeak.com/channels/${CHANNEL}/feeds.json?results=${results}&api_key=${READ_KEY}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return res.status(502).json({ error: 'thingspeak ' + r.status });
    res.set('Cache-Control', 'no-store');
    res.json(await r.json());
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Proxy: write a reading — the WRITE key stays here; requires an admin token
app.post('/api/reading', requireAdmin, async (req, res) => {
  if (!WRITE_KEY) return res.status(403).json({ error: 'writes disabled (no TS_WRITE_KEY)' });
  const weight = Number(req.body.weight);
  const hostel = req.body.hostel;
  const rssi = Number(req.body.rssi);
  if (!isFinite(weight)) return res.status(400).json({ error: 'valid weight required' });
  let url = `https://api.thingspeak.com/update?api_key=${WRITE_KEY}&field1=${encodeURIComponent(weight)}`;
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

// Static site — deny dotfiles so .env / .git are never served
app.use(express.static(__dirname, { dotfiles: 'deny', extensions: ['html'] }));

// Export the app for Vercel
module.exports = app;

// Only listen if called directly (e.g. `node server.js`)
if (require.main === module) {
  app.listen(PORT, () => console.log(`WasteWise running on http://localhost:${PORT}`));
}
