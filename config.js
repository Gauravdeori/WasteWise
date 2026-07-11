/* ================================================================
   FoodWatch — Configuration
   ----------------------------------------------------------------
   Edit the values below to connect the dashboard to your own
   ThingSpeak channel. Nothing else needs to change.
   ================================================================ */
window.FOODWATCH_CONFIG = {

  /* --- ThingSpeak channel (from the "API Keys" tab) --- */
  THINGSPEAK_CHANNEL_ID: '3425567',
  THINGSPEAK_READ_API_KEY: 'YOUR_READ_KEY',    // required (channel is Private)
  THINGSPEAK_WRITE_API_KEY: 'YOUR_WRITE_KEY',   // optional — only for the manual-entry form

  /* --- Which ThingSpeak field holds what --- */
  FIELD_WEIGHT: 'field1',        // load-cell weight in kg
  FIELD_STATION: 'field2',       // station / device number  (set to null if you didn't enable Field 2)

  /* --- Conversion factors (from the project proposal) --- */
  PRICE_PER_KG: 75,              // ₹ value of 1 kg of food
  CO2_PER_KG: 2.5,               // kg CO₂e produced per 1 kg of wasted food
  KG_PER_MEAL: 0.4,              // avg food weight of one meal, used for "meals saved"
  HOSTEL_POPULATION: 450,        // approx residents per hostel (for per-capita waste)

  /* --- Dashboard behaviour --- */
  REFRESH_SECONDS: 20,           // how often to pull fresh data (ThingSpeak min is ~15s)
  DEVICE_ONLINE_MINUTES: 10,     // a device seen within this window counts as "online"
  MONTHLY_TARGET_KG: 1000,       // reduction target used for the progress bar
  MAX_FEED_RESULTS: 8000,        // how many recent entries to fetch (ThingSpeak max is 8000)

  /* --- Dashboard login (demo auth — stored in the browser only) --- */
  AUTH_USERNAME: 'admin',
  AUTH_PASSWORD: 'foodwatch2026',
  SHOW_LOGIN_HINT: true,         // show the demo credentials under the login form

  /* --- IIT Guwahati hostels ---
     The list index + 1 is the hostel's code, sent by the ESP32 as field2.
     e.g. Barak = 1, Brahmaputra = 2, ... Kopili = 14.
     Rename freely to match your campus. */
  HOSTELS: [
    'Barak', 'Brahmaputra', 'Dhansiri', 'Dibang', 'Dihing', 'Disang', 'Kameng',
    'Kapili', 'Lohit', 'Manas', 'Siang', 'Subansiri', 'Umiam', 'Kopili'
  ],

  /* Fill hostels that have no real ThingSpeak data yet with realistic simulated
     data, so the comparison dashboard looks complete during demos.
     Set to false once all 14 boards are live to show ONLY real data. */
  DEMO_FILL: true
};
