/* ============================================================================
   WasteWise — IoT Food Waste Monitoring
   ESP32 + HX711 load cell  ->  ThingSpeak  ->  WasteWise dashboard

   HOW IT WORKS
   ------------
   A load cell (via HX711 amplifier) measures the weight of food waste placed
   on the scale. When a stable weight is detected, the ESP32 sends that reading
   to a ThingSpeak channel over WiFi. The dashboard reads the channel and shows
   this hostel as "Live".

   ---------------------------------------------------------------------------
   BRING-UP IN 4 STEPS
   ---------------------------------------------------------------------------
   1) WIRING (HX711 -> ESP32)
        HX711 VCC -> ESP32 3V3        HX711 DT (DOUT) -> GPIO16
        HX711 GND -> ESP32 GND        HX711 SCK (PD_SCK) -> GPIO4
      Load cell -> HX711:  E+/E- = red/black,  A+/A- = white/green (typical)

   2) LIBRARY:  Arduino IDE -> Library Manager -> install
        "HX711 Arduino Library" by Bogdan Necula (bogde/HX711)
      Board:  Tools -> Board -> "ESP32 Dev Module"
      (install "esp32 by Espressif Systems" via Boards Manager first)

   3) CALIBRATE (once):
        - Set  CALIBRATION_MODE = true , upload, open Serial Monitor @115200.
        - Keep the scale EMPTY (it auto-tares), then place a KNOWN weight
          (e.g. a 0.5 kg / 500 g object).
        - Read the printed "raw" value and compute:
              CALIBRATION_FACTOR = raw / known_grams
          e.g. raw = 210000 with 500 g  ->  factor = 420.0
        - Put that number in CALIBRATION_FACTOR, set CALIBRATION_MODE = false,
          re-upload. Now readings are in real kilograms.

   4) CONFIGURE + RUN:  fill in WIFI_*, TS_WRITE_API_KEY and HOSTEL_CODE below,
      upload. Watch Serial for "ThingSpeak -> HTTP 200". Place waste on the
      scale and it appears on the dashboard within ~20 s.
   ============================================================================ */

#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

/* ==================== USER CONFIG — EDIT THESE ==================== */
// Set true to find CALIBRATION_FACTOR; set false for normal operation.
bool  CALIBRATION_MODE = true;

const char* WIFI_SSID     = "Arrya";
const char* WIFI_PASSWORD = "aryyaman2006";

// Which hostel is this board? -> goes to field2 so the dashboard can tell
// the 14 hostels apart. Match the order in config.js HOSTELS:
//   1 Brahmaputra  2 Subansiri   3 Lohit       4 Dhansiri(G)  5 Manas
//   6 Kopili       7 Barak       8 Jia Bharali 9 Pagladiya   10 Dikhow
//  11 Dhansiri(B) 12 Kojoli     13 Bhrigu     14 Neelachal
const int HOSTEL_CODE = 1;

// ThingSpeak Write API Key lookup function based on hostel code.
// Routes data to the correct channel among the 4 configured channels.
String getWriteApiKey(int stationCode) {
  if (stationCode >= 1 && stationCode <= 4)   return "AJ0MZWZXKCUBZ1J5"; // Channel 1
  if (stationCode >= 5 && stationCode <= 8)   return "YJG5POD4Z0XBWRGW"; // Channel 2
  if (stationCode >= 9 && stationCode <= 11)  return "MXMCFG7C9J9TZJ3M"; // Channel 3
  if (stationCode >= 12 && stationCode <= 14) return "8UQC65LT36FK7DT6"; // Channel 4
  return "";
}

// HX711 pins
const int DOUT_PIN = 16;   // HX711 DT
const int SCK_PIN  = 4;    // HX711 SCK

// Calibration factor: raw counts per gram (see step 3). Makes get_units()=grams.
float CALIBRATION_FACTOR = 420.0;

// Event detection
const float MIN_EVENT_KG   = 0.05;   // ignore anything lighter than 50 g
const float STABLE_TOL_KG  = 0.02;   // "stable" = consecutive reads within 20 g
const int   STABLE_SAMPLES = 8;      // consecutive stable samples required
const unsigned long TS_MIN_INTERVAL_MS = 16000; // ThingSpeak free tier: >=15 s
/* ================================================================= */

HX711 scale;
bool eventActive = false;
unsigned long lastSendMs = 0;

float readKg(uint8_t samples = 5) {
  return scale.get_units(samples) / 1000.0;   // get_units() = grams -> kg
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi \"");
  Serial.print(WIFI_SSID);
  Serial.print("\"");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(400);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi connected. IP %s, signal %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\nWiFi FAILED — check SSID/password. Will retry when sending.");
  }
}

bool sendToThingSpeak(float kg, int station) {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return false;

  // respect ThingSpeak's minimum update interval
  unsigned long since = millis() - lastSendMs;
  if (lastSendMs != 0 && since < TS_MIN_INTERVAL_MS) {
    Serial.printf("(waiting %lus for ThingSpeak rate limit)\n",
                  (TS_MIN_INTERVAL_MS - since) / 1000);
    delay(TS_MIN_INTERVAL_MS - since);
  }

  String apiKey = getWriteApiKey(station);
  if (apiKey == "") {
    Serial.println("Error: Invalid hostel code. No API Key mapped.");
    return false;
  }

  HTTPClient http;
  String url = "https://api.thingspeak.com/update?api_key=";
  url += apiKey;
  url += "&field1=" + String(kg, 3);          // weight (kg)
  url += "&field2=" + String(station);        // hostel code
  url += "&field3=" + String(WiFi.RSSI());    // WiFi signal (dBm) -> device health

  http.begin(url);
  int code = http.GET();
  String resp = http.getString();
  http.end();

  lastSendMs = millis();
  Serial.printf("ThingSpeak -> HTTP %d, entry id: %s\n", code, resp.c_str());
  if (resp == "0") Serial.println("  (0 = rejected: check Write API Key or rate limit)");
  return (code == 200 && resp != "0");
}

// Wait until the weight stops changing, then return the stable value.
float waitForStableKg() {
  float last = readKg();
  int stable = 0;
  unsigned long t0 = millis();
  while (stable < STABLE_SAMPLES && millis() - t0 < 6000) {
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
  delay(400);
  Serial.println("\n\n=== WasteWise ESP32 — hostel " + String(HOSTEL_CODE) + " ===");

  scale.begin(DOUT_PIN, SCK_PIN);

  // Verify the HX711 is actually wired up before doing anything else.
  Serial.print("Detecting HX711 on DT=" + String(DOUT_PIN) + " SCK=" + String(SCK_PIN) + " ... ");
  if (!scale.wait_ready_timeout(1500)) {
    Serial.println("NOT FOUND!");
    Serial.println(">> Check HX711 wiring (VCC->3V3, GND->GND, DT->GPIO16, SCK->GPIO4)");
    Serial.println(">> and that the load cell's 4 wires go to E+/E-/A+/A-.");
  } else {
    Serial.println("OK");
  }

  scale.set_scale(CALIBRATION_FACTOR);
  Serial.println("Taring — keep the scale EMPTY...");
  delay(1500);
  scale.tare(20);
  Serial.println("Tare done.");

  if (CALIBRATION_MODE) {
    Serial.println("\n*** CALIBRATION MODE ***");
    Serial.println("Place a KNOWN weight and read 'raw'. factor = raw / grams.");
    Serial.println("Then set CALIBRATION_FACTOR, CALIBRATION_MODE=false, re-upload.\n");
    return;   // skip WiFi in calibration mode
  }

  connectWiFi();
  Serial.println("Ready. Place food waste on the scale to log a reading.");
}

void loop() {
  // ---- Calibration helper: print raw counts + current grams, then stop ----
  if (CALIBRATION_MODE) {
    long raw = scale.get_value(10);        // reading minus tare offset (raw units)
    float grams = scale.get_units(10);     // raw / CALIBRATION_FACTOR
    Serial.printf("raw=%-8ld  current=%.1f g   | factor = raw / (known grams)\n", raw, grams);
    delay(500);
    return;
  }

  // ---- Normal operation: detect a stable weigh event and send it ----
  float kg = readKg();

  if (!eventActive && kg > MIN_EVENT_KG) {
    Serial.println("Waste detected — measuring...");
    float stableKg = waitForStableKg();
    if (stableKg > MIN_EVENT_KG) {
      Serial.printf("Stable weight: %.3f kg  (hostel %d)\n", stableKg, HOSTEL_CODE);
      sendToThingSpeak(stableKg, HOSTEL_CODE);
      eventActive = true;   // wait for it to be cleared before the next send
    }
  }

  if (eventActive && kg < MIN_EVENT_KG) {
    eventActive = false;
    Serial.println("Scale cleared — ready for next reading.");
  }

  delay(200);
}
