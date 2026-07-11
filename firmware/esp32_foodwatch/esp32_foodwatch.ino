/* ============================================================================
   WasteWise — IoT Food Waste Monitoring
   ESP32 + HX711 load cell  ->  ThingSpeak

   HOW IT WORKS
   ------------
   A load cell (via HX711 amplifier) measures the weight of food waste placed
   on the scale. When a stable weight is detected, the ESP32 sends that reading
   to a ThingSpeak channel over WiFi. The WasteWise dashboard then reads the
   channel and shows the data live.

   HARDWARE / WIRING (HX711 -> ESP32)
   ----------------------------------
     HX711 VCC  -> ESP32 3V3
     HX711 GND  -> ESP32 GND
     HX711 DT   -> ESP32 GPIO16   (data)     -- see DOUT_PIN below
     HX711 SCK  -> ESP32 GPIO4    (clock)     -- see SCK_PIN below
   Load cell -> HX711:  E+/E- = red/black,  A+/A- = white/green  (typical)

   LIBRARIES (install via Arduino IDE -> Library Manager)
   ------------------------------------------------------
     - "HX711 Arduino Library" by Bogdan Necula  (bogde/HX711)
     WiFi.h and HTTPClient.h ship with the ESP32 board package.

   BOARD SETUP
   -----------
     Tools -> Board -> "ESP32 Dev Module" (install esp32 by Espressif first).

   CALIBRATION (do this once)
   --------------------------
     1. Set CALIBRATION_FACTOR to 1.0, upload, open Serial Monitor @115200.
     2. With nothing on the scale it should read ~0 after taring.
     3. Place a KNOWN weight (e.g. a 500 g / 0.5 kg object).
     4. Note the raw reading R printed. CALIBRATION_FACTOR = R / grams.
        (so that get_units() returns grams). Put that value below and re-upload.
   ============================================================================ */

#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

/* ---------------- USER CONFIG — EDIT THESE ---------------- */
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ThingSpeak (already filled in for channel 3425567)
const char* TS_WRITE_API_KEY = "YOUR_WRITE_KEY";

// HOSTEL_CODE goes to field2 — it tells the dashboard which hostel this
// scale belongs to. Set it to this board's hostel number:
//   1 Barak        2 Brahmaputra   3 Dhansiri   4 Dibang    5 Dihing
//   6 Disang       7 Kameng        8 Kapili     9 Lohit    10 Manas
//  11 Siang       12 Subansiri    13 Umiam     14 Kopili
const int HOSTEL_CODE = 1;             // <-- set to this board's hostel

// HX711 pins
const int DOUT_PIN = 16;
const int SCK_PIN  = 4;

// Calibration: makes get_units() return GRAMS (see steps above)
float CALIBRATION_FACTOR = 420.0;      // <-- REPLACE with your calibrated value

// Event detection
const float MIN_EVENT_KG      = 0.05;  // ignore anything lighter than 50 g
const float STABLE_TOL_KG     = 0.02;  // "stable" = readings within 20 g
const int   STABLE_SAMPLES    = 8;     // consecutive stable samples required
const unsigned long TS_MIN_INTERVAL_MS = 16000; // ThingSpeak free tier: >=15 s
/* --------------------------------------------------------- */

HX711 scale;
bool eventActive = false;          // true while waste is sitting on the scale
unsigned long lastSendMs = 0;

float readKg(uint8_t samples = 5) {
  // get_units() returns grams after calibration; convert to kg
  return scale.get_units(samples) / 1000.0;
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nWiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi FAILED — will retry in loop.");
  }
}

bool sendToThingSpeak(float kg, int station) {
  if (WiFi.status() != WL_CONNECTED) { connectWiFi(); }
  if (WiFi.status() != WL_CONNECTED) return false;

  // respect ThingSpeak's minimum update interval
  unsigned long since = millis() - lastSendMs;
  if (lastSendMs != 0 && since < TS_MIN_INTERVAL_MS) {
    delay(TS_MIN_INTERVAL_MS - since);
  }

  HTTPClient http;
  String url = "https://api.thingspeak.com/update?api_key=";
  url += TS_WRITE_API_KEY;
  url += "&field1=" + String(kg, 3);
  url += "&field2=" + String(station);

  http.begin(url);
  int code = http.GET();
  String resp = http.getString();
  http.end();

  lastSendMs = millis();
  Serial.printf("ThingSpeak -> HTTP %d, entry id: %s\n", code, resp.c_str());
  // ThingSpeak returns the new entry id (>0) on success, "0" on failure
  return (code == 200 && resp != "0");
}

// Wait until the weight stops changing, then return the stable value.
float waitForStableKg() {
  float last = readKg();
  int stable = 0;
  while (stable < STABLE_SAMPLES) {
    delay(120);
    float now = readKg();
    if (fabs(now - last) <= STABLE_TOL_KG) stable++;
    else stable = 0;
    last = now;
  }
  return last;
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\nWasteWise ESP32 starting...");

  scale.begin(DOUT_PIN, SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);
  Serial.println("Taring — keep the scale EMPTY...");
  delay(1500);
  scale.tare();                    // zero the scale
  Serial.println("Tare done. Ready to weigh waste.");

  connectWiFi();
}

void loop() {
  float kg = readKg();

  // Waste placed on scale -> measure once it settles, then send
  if (!eventActive && kg > MIN_EVENT_KG) {
    Serial.println("Waste detected — measuring...");
    float stableKg = waitForStableKg();
    if (stableKg > MIN_EVENT_KG) {
      Serial.printf("Stable weight: %.3f kg\n", stableKg);
      sendToThingSpeak(stableKg, HOSTEL_CODE);
      eventActive = true;          // wait for it to be removed before next send
    }
  }

  // Waste removed -> ready for the next event
  if (eventActive && kg < MIN_EVENT_KG) {
    eventActive = false;
    Serial.println("Scale cleared — ready for next reading.");
  }

  delay(200);
}
