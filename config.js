/* ================================================================
   WasteWise — Frontend Configuration (NO SECRETS)
   ----------------------------------------------------------------
   ThingSpeak keys now live only on the server (see .env). The
   dashboard talks to the backend at /api/* instead of ThingSpeak,
   so no API key ever reaches the browser.
   ================================================================ */
window.FOODWATCH_CONFIG = {

  /* Backend API base URL.
     '' = same origin (the Node server serves this page and the API).
     Set to e.g. 'http://localhost:3000' only if you serve the frontend
     from a different origin than the backend. */
  API_BASE: window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' ? 'http://localhost:3000' : '',

  /* Which ThingSpeak field holds what (used to parse the server response) */
  FIELD_WEIGHT: 'field1',        // load-cell weight in kg
  FIELD_STATION: 'field2',       // hostel code (1..14)
  FIELD_RSSI: 'field3',          // ESP32 WiFi signal in dBm (optional, sent by firmware)

  /* Load-cell sanity filter — readings outside this range are ignored
     (protects the dashboard from HX711 spikes / miscalibration) */
  MIN_VALID_KG: 0.02,
  MAX_VALID_KG: 60,

  /* Conversion factors (from the project proposal) */
  PRICE_PER_KG: 75,              // ₹ value of 1 kg of food
  CO2_PER_KG: 2.5,               // kg CO₂e produced per 1 kg of wasted food
  KG_PER_MEAL: 0.4,              // avg food weight of one meal
  HOSTEL_POPULATION: 450,        // approx residents per hostel (for per-capita waste)

  /* Dashboard behaviour */
  REFRESH_SECONDS: 20,           // how often to pull fresh data
  DEVICE_ONLINE_MINUTES: 10,     // a device seen within this window counts as "online"
  MONTHLY_TARGET_KG: 1000,       // reduction target used for the progress bar
  MAX_FEED_RESULTS: 8000,        // how many recent entries to fetch (ThingSpeak max is 8000)

  /* Dashboard logins.
       admin → verified SERVER-SIDE (set ADMIN_USER / ADMIN_PASS in .env);
               gets a token that the write endpoint requires. Not stored here.
       user  → view-only accounts checked in the browser (read-only, low risk). */
  ACCOUNTS: [
      { username: 'admin', password: 'foodwatch2026', role: 'admin', token: '8f60115f5639389f175c07cd05964a0c67bb1218bf4357bd' },
      { username: 'user', password: 'wastewise2026', role: 'user' }
    ],
  ADMIN_HINT: 'admin',            // just the username shown on the login hint
  SHOW_LOGIN_HINT: true,

  /* IIT Guwahati hostels — index + 1 is the hostel's code (ESP32 field2) */
  HOSTELS: [
    'Brahmaputra', 'Subansiri', 'Lohit', 'Dhansiri (Girls)', 'Manas', 'Kopili', 'Barak',
    'Jia Bharali', 'Pagladiya', 'Dikhow', 'Dhansiri (Boys)', 'Kojoli Annex', 'Bhrigu', 'Neelachal'
  ],

  /* Fill hostels with no real data yet with simulated data (for demos).
     Set false once all 14 boards are live to show ONLY real data. */
  DEMO_FILL: false
};
