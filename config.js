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
  API_BASE: '',

  /* Which ThingSpeak field holds what (used to parse the server response) */
  FIELD_WEIGHT: 'field1',        // load-cell weight in kg
  FIELD_STATION: 'field2',       // hostel code (1..14)

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

  /* Dashboard login (demo auth — stored in the browser only) */
  AUTH_USERNAME: 'admin',
  AUTH_PASSWORD: 'foodwatch2026',
  SHOW_LOGIN_HINT: true,

  /* IIT Guwahati hostels — index + 1 is the hostel's code (ESP32 field2) */
  HOSTELS: [
    'Barak', 'Brahmaputra', 'Dhansiri', 'Dibang', 'Dihing', 'Disang', 'Kameng',
    'Kapili', 'Lohit', 'Manas', 'Siang', 'Subansiri', 'Umiam', 'Kopili'
  ],

  /* Fill hostels with no real data yet with simulated data (for demos).
     Set false once all 14 boards are live to show ONLY real data. */
  DEMO_FILL: true
};
