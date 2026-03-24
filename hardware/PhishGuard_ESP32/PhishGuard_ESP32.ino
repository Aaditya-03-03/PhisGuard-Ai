#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Ensure you install this via Arduino Library Manager
#include <Wire.h> 
#include <LiquidCrystal_I2C.h> // Standard library, ignore the 'avr' warning in Arduino IDE!

// ==========================================
// CONFIGURATION - UPDATE THESE VALUES
// ==========================================

// WiFi Credentials
const char* WIFI_SSID = "I";
const char* WIFI_PASS = "IIIIIIII";

// Backend API URL
// NOTE: "localhost" will NOT work on the ESP32. Use the host machine's IPv4 address.
const char* API_BASE_URL = "http://10.67.6.122:3001/api/device"; 

// Authentication (Hardcoded for single-tenant dev setup)
const char* DEVICE_ID = "ESP32_MAIN_UNIT_01";
const char* DEVICE_SECRET = "super_secret_device_password_123";

// Hardware
const int BUZZER_PIN = 18; // Passive buzzer I/O

// LCD Display
// Set the LCD address to 0x27 for a 16 chars and 2 line display (0x3F is the other common address)
LiquidCrystal_I2C lcd(0x27, 16, 2);  

/*
   ESP32 I2C WIRING FOR THE LCD:
   GND -> GND
   VCC -> 5V (VIN)
   SDA -> GPIO 21
   SCL -> GPIO 22
*/

// ==========================================
// GLOBALS
// ==========================================
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 5000; // Poll every 5 seconds
bool screenInAlertMode = false;
unsigned long alertStartTime = 0;

// Scrolling Globals
String alertPreviewText = "";
int scrollPosition = 0;
unsigned long lastScrollTime = 0;
const int SCROLL_SPEED = 300; // Milliseconds per character shift

void setup() {
  Serial.begin(115200);

  // Initialize Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PhishGuard AI...");
  lcd.setCursor(0, 1);
  lcd.print("Booting up...");

  Serial.println("\n==================================");
  Serial.println("  PhishGuard-AI Full Hardware     ");
  Serial.println("==================================\n");

  // Connect to WiFi
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi:");
  lcd.setCursor(0, 1);
  lcd.print(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi Connected Successfully!");
  
  // Show Default Idle Screen
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PhishGuard AI");
  lcd.setCursor(0, 1);
  lcd.print("System Secure");

  // Startup Beep 
  Serial.println("🔊 Running startup buzzer test...");
  tone(BUZZER_PIN, 2000); 
  delay(300);             
  noTone(BUZZER_PIN);     
  
  Serial.println("🔄 Starting 5-second polling loop...");
}

void loop() {
  // Ensure WiFi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("WiFi Disconnected!");
    Serial.println("⚠️ WiFi Disconnected! Attempting to reconnect...");
    delay(1000);
    return;
  }

  // Handle LCD resetting to IDLE after an alert is shown for 15 seconds
  if (screenInAlertMode) {
    if (millis() - alertStartTime > 15000) {
      screenInAlertMode = false;
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("PhishGuard AI");
      lcd.setCursor(0, 1);
      lcd.print("System Secure");
    } else {
      // Non-blocking scrolling logic for Line 2
      if (millis() - lastScrollTime >= SCROLL_SPEED) {
        lastScrollTime = millis();
        lcd.setCursor(0, 1);
        
        String windowText = "";
        if (alertPreviewText.length() <= 16) {
          windowText = alertPreviewText;
          while(windowText.length() < 16) windowText += " "; // Pad to clear old artifacts
        } else {
          windowText = alertPreviewText.substring(scrollPosition, scrollPosition + 16);
          while(windowText.length() < 16) windowText += " "; // Ensure 16 chars are always written
          
          scrollPosition++;
          // Reset scrolling when it fully disappears
          if (scrollPosition > (int)alertPreviewText.length()) {
            scrollPosition = 0;
          }
        }
        
        lcd.print(windowText);
      }
    }
  }

  // Poll for Alerts Non-Blockingly
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    pollForAlerts();
  }
}

/**
 * Perform a GET request to /api/device/alerts/pending
 */
void pollForAlerts() {
  HTTPClient http;
  String targetUrl = String(API_BASE_URL) + "/alerts/pending";
  
  http.begin(targetUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Secret", DEVICE_SECRET);

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool success = doc["success"];
      if (success) {
        JsonArray alerts = doc["data"].as<JsonArray>();
        
        if (alerts.size() > 0) {
          for (JsonObject alert : alerts) {
            String platform = alert["platform"].as<String>();
            String preview = alert["preview"].as<String>();
            
            triggerHardwareAlarm(platform, preview);
          }
        }
      }
    } else {
      Serial.println("⚠️ JSON Parse Error");
    }
  } else if (httpResponseCode > 0 && httpResponseCode != 429) {
    Serial.print("⚠️ HTTP Error code: ");
    Serial.println(httpResponseCode);
  } else if (httpResponseCode <= 0) {
    // Timeout or Connection Refused
  }
  
  http.end();
}

/**
 * Sounds the buzzer and displays the threat on the LCD
 */
void triggerHardwareAlarm(String platform, String preview) {
  Serial.println("🔊 SOUNDING ALARM!");
  
  // Set screen state
  screenInAlertMode = true;
  alertStartTime = millis();

  // Print Header
  lcd.clear();
  lcd.setCursor(0, 0);
  
  // Format "🚨 Email 🚨" 
  // (Using '*' since some standard 1602 LCDs don't support emojis well)
  platform.toUpperCase();
  String header = "* " + platform + " ALERT *";
  
  // Center the header
  int spaces = (16 - header.length()) / 2;
  for(int i=0; i<spaces; i++) lcd.print(" ");
  lcd.print(header);

  // Initialize Scrolling globals
  // Add padding at the end so it scrolls out completely before restarting
  alertPreviewText = preview + "   ***   "; 
  scrollPosition = 0;
  lastScrollTime = millis();

  // Print initial state of Preview (loop automatically animates it)
  lcd.setCursor(0, 1);
  if (alertPreviewText.length() <= 16) {
    lcd.print(alertPreviewText);
  } else {
    lcd.print(alertPreviewText.substring(0, 16)); 
  }

  // Rapid 3-beep signature 
  for(int i=0; i<3; i++) {
    tone(BUZZER_PIN, 2000); 
    delay(200);
    noTone(BUZZER_PIN);     
    delay(100);
  }
}
