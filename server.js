/* ================================================================
   WasteWise — backend server
   ----------------------------------------------------------------
   Serves the static site AND proxies ThingSpeak so the API keys
   stay on the server (in .env) and never reach the browser.

   Endpoints:
     GET  /api/config   -> { channelId, writeEnabled }   (no secrets)
     GET  /api/feeds    -> ThingSpeak feeds (uses READ key server-side)
     POST /api/reading  -> writes a reading (uses WRITE key server-side)

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
const PORT = process.env.PORT || 3000;

// Public, non-secret config the frontend needs
app.get('/api/config', (req, res) => {
  res.json({ channelId: CHANNEL, writeEnabled: Boolean(WRITE_KEY) });
});

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

// Proxy: write a reading — the WRITE key stays here
app.post('/api/reading', async (req, res) => {
  if (!WRITE_KEY) return res.status(403).json({ error: 'writes disabled (no TS_WRITE_KEY)' });
  const weight = Number(req.body.weight);
  const hostel = req.body.hostel;
  if (!isFinite(weight)) return res.status(400).json({ error: 'valid weight required' });
  let url = `https://api.thingspeak.com/update?api_key=${WRITE_KEY}&field1=${encodeURIComponent(weight)}`;
  if (hostel) url += `&field2=${encodeURIComponent(hostel)}`;
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

app.listen(PORT, () => console.log(`WasteWise running on http://localhost:${PORT}`));
