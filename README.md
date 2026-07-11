# WasteWise — IoT Based Real-Time Food Waste Monitoring System

An IoT project by **IIT Guwahati · TIH** to *measure, monitor and reduce food waste*.
An **ESP32 + load cell (HX711)** in each hostel weighs food waste and pushes readings to
**ThingSpeak**, and a password-protected web **dashboard** shows live analytics for all
**14 IITG hostels** — both a comparison overview and per-hostel drill-downs.

```
ESP32 + HX711 (per hostel) ──(WiFi/HTTP)──► ThingSpeak (cloud) ──(REST API)──► WasteWise Dashboard
   weighs waste, tags hostel                 stores + timestamps               login → overview + per-hostel
```

### Dashboard features
- **Login gate** (demo auth) — default `admin` / `foodwatch2026` (set in `config.js`).
- **Facility selector** — "Global Campus View" or any single hostel; every widget rescopes.
- **KPI cards** — waste today (kg), value lost (INR), CO2e footprint (tons) and per-capita
  waste (grams), each with a delta badge vs yesterday.
- **Hostel Performance Matrix** — status (online/offline), waste today, per-head grams and
  a 7-day trend arrow for every hostel, with **Export CSV** and a view-all toggle.
- **30-day Waste Trend** — smooth area chart with total tonnage badge.
- **Weekly Meal Breakdown** — stacked breakfast/lunch/dinner bars for the last 5 days.
- **Meal bins** — live bin for the current meal window (with load bar and last-update age),
  standby/completed cards for the others.
- **Live + simulated** — hostels sending real ThingSpeak data show live; the rest use
  realistic **simulated** data (`config.DEMO_FILL`) so demos look complete.

---

## Project structure

```
TIH IOT Project/
├── index.html                       # Landing page + dashboard (Home/About/Solution/Gallery/Dashboard/Contact)
├── style.css                        # All styling
├── script.js                        # Navigation, animations, live dashboard logic
├── config.js                        # ⚙️ ThingSpeak keys, login, hostels, settings
├── dashboard.js                     # Multi-hostel dashboard logic (login, overview, per-hostel)
├── README.md
└── firmware/
    └── esp32_foodwatch/
        └── esp32_foodwatch.ino      # ESP32 + HX711 -> ThingSpeak sketch
```

---

## 1. The website / dashboard

The site is a single static page — no build step, no server required.

**Run it locally (recommended, avoids browser file:// limits):**
```bash
cd "TIH IOT Project"
python -m http.server 5173
# then open http://localhost:5173
```
Or simply double-click `index.html`.

### Configuration — `config.js`
Everything is controlled from one file:
```js
THINGSPEAK_CHANNEL_ID:   '3425567',
THINGSPEAK_READ_API_KEY: 'YOUR_READ_KEY',   // dashboard reads with this
THINGSPEAK_WRITE_API_KEY:'YOUR_WRITE_KEY',   // enables the manual-entry form
FIELD_WEIGHT:  'field1',      // load-cell weight (kg)
FIELD_STATION: 'field2',      // HOSTEL CODE (1..14)
PRICE_PER_KG:  75,            // ₹ value of 1 kg of food
CO2_PER_KG:    2.5,           // kg CO₂e per kg of food
REFRESH_SECONDS: 20,          // dashboard auto-refresh interval

AUTH_USERNAME: 'admin',       // dashboard login
AUTH_PASSWORD: 'foodwatch2026',
HOSTELS: [ 'Barak', 'Brahmaputra', ... ],  // 14 hostels; index+1 = hostel code
DEMO_FILL: true               // simulate hostels that have no real data yet
```

**How hostels map to data:** there's one ThingSpeak channel. Each reading's `field2`
carries the **hostel code (1–14)** — the position of the hostel in the `HOSTELS` list.
The dashboard buckets readings by that code to build per-hostel and comparison analytics.
Each hostel's ESP32 sets its own `HOSTEL_CODE` (see firmware).

> If the Read API key is missing/invalid, the dashboard falls back to **fully simulated
> data** with a banner, so the page always looks complete.

### Login
The dashboard opens on a **sign-in screen**. Default credentials (change in `config.js`):
```
username: admin
password: foodwatch2026
```
> This is **demo-level** auth (checked in the browser, session stored in `localStorage`) —
> fine for a project/demo, but not real security. For production, put the data behind a
> server with real accounts.

---

## 2. The ThingSpeak channel

- **Channel ID:** `3425567` — *IOT TIH waste detection management system* (Private)
- **Fields:** `field1` = weight (kg), `field2` = hostel code (1–14)
- **API Keys tab** gives you the Read key (dashboard) and Write key (ESP32).

**Test the pipeline from a terminal** (no hardware needed):
```bash
# write a reading (weight=2.4 kg, station=1)
curl "https://api.thingspeak.com/update?api_key=YOUR_WRITE_KEY&field1=2.4&field2=1"

# read it back
curl "https://api.thingspeak.com/channels/3425567/feeds.json?api_key=YOUR_READ_KEY&results=5"
```
> ThingSpeak's free tier allows **one update every ~15 seconds**.
> To wipe test data: channel → **Data Import / Export → Clear Channel**.

---

## 3. The ESP32 firmware

Open `firmware/esp32_foodwatch/esp32_foodwatch.ino` in the Arduino IDE.

### Wiring (HX711 → ESP32)
| HX711 | ESP32 |
|-------|-------|
| VCC   | 3V3   |
| GND   | GND   |
| DT    | GPIO16 |
| SCK   | GPIO4  |

Load cell → HX711: `E+/E-` = red/black, `A+/A-` = white/green (typical 4-wire cell).

### Software setup
1. Install the **ESP32 board package** (Espressif) in the Arduino IDE.
2. Install the **"HX711 Arduino Library"** by Bogdan Necula (Library Manager).
3. In the sketch, set:
   - `WIFI_SSID` / `WIFI_PASSWORD`
   - `CALIBRATION_FACTOR` (see below)
   - `HOSTEL_CODE` (1–14 — which hostel this board is; goes to `field2`)
   - `TS_WRITE_API_KEY` is already set to your channel's write key.

> Flash one ESP32 per hostel, each with its own `HOSTEL_CODE`. They all write to the
> same channel; the dashboard separates them by that code.

### Calibration (once)
1. Set `CALIBRATION_FACTOR = 1.0`, upload, open Serial Monitor @ **115200**.
2. Empty scale should read ~0 after tare.
3. Place a **known weight** (e.g. 500 g) and note the raw reading `R`.
4. `CALIBRATION_FACTOR = R / grams` (so `get_units()` returns grams). Re-upload.

### How it reports
- Tares on startup (keep scale empty).
- When waste is placed and the weight **stabilises**, it sends that weight to `field1`
  and the station to `field2`.
- Waits until the scale is cleared before allowing the next reading (no duplicates).

---

## 4. End-to-end check
1. Flash the ESP32, open Serial Monitor — confirm WiFi connects and `ThingSpeak -> HTTP 200`.
2. Place waste on the scale → a new entry appears on ThingSpeak.
3. Open the dashboard → the reading shows up within one refresh cycle (~20 s).

---

## Notes & next steps
- The load cell measures **weight only** — it can't identify food *category*. A
  category breakdown would need a manual selector (button/keypad) writing to `field3`.
- Keys in `config.js` are visible in the browser. For a public deployment, make the
  channel **Public** (read-only) or proxy reads through a small server.
- Ideas: per-mess dashboards (filter by `field2`), daily email reports, and a
  MATLAB/ThingSpeak reaction to alert when daily waste crosses a threshold.

---
*An initiative supported by **IITG TIH**.*
