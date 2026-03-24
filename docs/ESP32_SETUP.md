# PhishGuard-AI ESP32 Hardware Setup Guide

This guide explains how to deploy the physical ESP32 Hardware alarm device to receive High-Risk phishing alerts in real-time.

---

## 1. Prerequisites

1. Hardware Requirements:
   * Any standard **ESP32 Development Board** (NodeMCU, ESP-WROOM-32, etc.)
   * Micro-USB or USB-C cable.
   * (Optional) An active Buzzer or Speaker connected to GPIO pin 18.
2. Software Requirements:
   * Install the [Arduino IDE](https://www.arduino.cc/en/software).
   * Install the ESP32 Board Library in Arduino IDE (`Tools` -> `Board` -> `Boards Manager` -> search for `esp32` by Espressif Systems).
   * Install the **ArduinoJson** library (`Sketch` -> `Include Library` -> `Manage Libraries` -> search `ArduinoJson` by Benoit Blanchon).

---

## 2. Firmware Configuration

1. Locate the generated source code in your project at `hardware/PhishGuard_ESP32/PhishGuard_ESP32.ino`.
2. Open the file in the Arduino IDE.
3. You must replace the configuration constants at the top of the file before flashing:

```cpp
// 1. WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// 2. Local Backend Settings (Must not be "localhost", must be your computer's local network IP)
const char* API_BASE_URL = "http://192.168.1.100:3001/api/device";

// 3. Device Registration Tokens
// Ensure DEVICE_SECRET matches the AES_ENCRYPTION_KEY or a secure value recorded in your backend
const char* DEVICE_ID = "ESP32_MAIN_UNIT_01";
const char* DEVICE_SECRET = "super_secret_device_password_123";
```

### Important Networking Note
Because the ESP32 is a separate physical device on your network, it **cannot** reach the backend utilizing `http://localhost:3001`. You must find your development machine's local IPv4 address (e.g., `192.168.0.x`) using `ipconfig` (Windows) or `ifconfig` (Mac/Linux), and use that in the `API_BASE_URL`.

---

## 3. Flash to the Board
1. Plug in your ESP32.
2. Under `Tools` -> `Board`, select **ESP32 Dev Module**.
3. Under `Tools` -> `Port`, select the active COM/USB port.
4. Click **Upload** (the right-arrow icon at the top).
5. Open the **Serial Monitor** (magnifying glass upper right) and set the baud rate to **115200**.

## 4. Operation
* The ESP32 will connect to your WiFi network.
* Once connected, it begins polling the new `/api/device/alerts/pending` endpoint every 5 seconds.
* Whenever your Telegram Userbot or Gmail Scanner detects a `HIGH` risk payload, the backend will queue the alert.
* Within 5 seconds, the ESP32 will fetch the alert, print the details to the Serial interface, and (if wired) trigger an audible alarm!
