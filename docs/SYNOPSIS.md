# PhisGuard-AI

## Project Synopsis

**PhisGuard-AI** is an AI-powered automated phishing email detection system that combines machine learning with IoT hardware integration. It analyzes incoming emails in real-time to identify phishing threats and provides users with both a web dashboard and a voice-controlled ESP32 device for hands-free email security management.

---

## Software Implementation

### Technology Stack

| Layer            | Technology                          | Purpose                                      |
|:-----------------|:------------------------------------|:---------------------------------------------|
| Frontend         | Next.js 16, React, Tailwind CSS     | Modern web dashboard with responsive UI      |
| UI Components    | shadcn/UI, Lucide Icons             | Pre-built accessible components              |
| Backend          | Express.js, TypeScript              | RESTful API server with type safety          |
| Database         | Firebase Firestore                  | Real-time NoSQL cloud database               |
| Authentication   | Firebase Auth, Google OAuth         | Secure user identity management              |
| Encryption       | AES-256-GCM, SHA-256                | Data protection and secret hashing           |

### Backend Services

| Service               | File                      | Responsibility                              |
|:----------------------|:--------------------------|:--------------------------------------------|
| Email Management      | `firestore.ts`            | Store and retrieve emails from database     |
| Gmail Integration     | `gmail.service.js`        | Fetch emails via Gmail API                  |
| Phishing Detection    | `phishing.service.js`     | AI-based threat analysis and risk scoring   |
| Device Management     | `device.service.js`       | ESP32 pairing, commands, and heartbeat      |
| Auto-Scan Scheduler   | `scheduler.service.js`    | Background email scanning automation        |

### API Endpoints

| Route                 | Method | Auth Type       | Description                          |
|:----------------------|:------:|:----------------|:-------------------------------------|
| `/api/emails`         | GET    | Firebase Token  | Fetch user's analyzed emails         |
| `/api/gmail/fetch`    | POST   | Firebase Token  | Trigger Gmail email fetch            |
| `/api/device/pair`    | POST   | Firebase Token  | Generate device pairing token        |
| `/api/device/register`| POST   | Device Secret   | Complete ESP32 registration          |
| `/api/device/command` | POST   | Device Secret   | Execute voice command                |
| `/api/device/status`  | GET    | Firebase Token  | Get device connection status         |

---

## Hardware Implementation

### ESP32 Specifications

| Attribute         | Details                                          |
|:------------------|:-------------------------------------------------|
| Microcontroller   | ESP32 (Dual-core, Wi-Fi enabled)                 |
| Communication     | HTTPS REST API over Wi-Fi                        |
| Authentication    | X-Device-Id + X-Device-Secret headers            |
| Heartbeat Rate    | Up to 60 pings per minute                        |
| Power Mode        | Supports deep sleep for battery optimization     |

### Voice Commands

| Command        | Action                                    | Rate Limit      |
|:---------------|:------------------------------------------|:----------------|
| `READ_MAIL`    | Text-to-speech playback of latest email   | 30 req/min      |
| `DELETE_MAIL`  | Move suspicious email to trash            | 30 req/min      |
| `SENDER_INFO`  | Announce sender details and risk score    | 30 req/min      |

### Security Mechanisms

| Mechanism                 | Implementation                                       |
|:--------------------------|:-----------------------------------------------------|
| Pairing Token             | 64-char hex, single-use, 5-minute expiry             |
| Device Secret             | SHA-256 hashed before storage                        |
| Re-registration Block     | Prevents device hijacking to different users         |
| Rate Limiting             | Brute force protection (5 attempts per 15 min)       |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
├─────────────────────────────────┬───────────────────────────────────────────┤
│       Web Dashboard             │           ESP32 Device                    │
│     (Next.js Frontend)          │        (Voice Interface)                  │
│  • Email threat visualization   │  • Voice command processing               │
│  • Risk score display           │  • Audio alerts for threats               │
│  • Device pairing UI            │  • Wi-Fi REST communication               │
└────────────────┬────────────────┴──────────────────┬────────────────────────┘
                 │                                   │
                 │         HTTPS Requests            │
                 ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                     │
│                        (Express.js + TypeScript)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │   Email     │  │  Phishing   │  │   Device            │ │
│  │   Routes    │  │   Routes    │  │  Detection  │  │   Routes            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                                             │
│  Security: AES-256-GCM Encryption │ SHA-256 Hashing │ Rate Limiting        │
└────────────────┬────────────────────────────────────┬───────────────────────┘
                 │                                    │
                 ▼                                    ▼
┌─────────────────────────────────┐  ┌────────────────────────────────────────┐
│       DATA LAYER                │  │         EXTERNAL SERVICES              │
│    (Firebase Firestore)         │  │                                        │
├─────────────────────────────────┤  ├────────────────────────────────────────┤
│  • Users Collection             │  │  • Gmail API (Email Fetching)          │
│  • Emails Collection            │  │  • Firebase Auth (User Management)     │
│  • Devices Collection           │  │  • Google OAuth (Sign-in)              │
│  • Command Logs                 │  │                                        │
└─────────────────────────────────┘  └────────────────────────────────────────┘
```

---

## Data Flow

```
1. EMAIL INGESTION
   Gmail Account ──▶ Gmail API ──▶ Backend ──▶ Phishing Analysis ──▶ Firestore

2. THREAT DETECTION
                                                    ┌──▶ Web Dashboard (Display)
   Email Content ──▶ AI Model ──▶ Risk Score ──────┤
                                                    └──▶ ESP32 Device (Audio Alert)
                                                         [Triggered for High/Critical Risk]

3. DEVICE INTERACTION
   Voice Command ──▶ ESP32 ──▶ Backend API ──▶ Action Executed ──▶ Audio Response
```

### Alert Behavior by Risk Level

| Risk Level   | Dashboard Action              | ESP32 Device Action                    |
|:-------------|:------------------------------|:---------------------------------------|
| Low          | Green indicator, stored only  | No alert                               |
| Medium       | Yellow warning displayed      | No alert                               |
| High         | Orange alert with details     | Audio warning + LED indicator          |
| Critical     | Red urgent alert              | Urgent audio alert + rapid LED blink   |

---

## Key Features

| Category          | Features                                                     |
|:------------------|:-------------------------------------------------------------|
| **Security**      | End-to-end encryption, hashed credentials, rate limiting     |
| **AI Detection**  | Keyword analysis, URL scanning, sender reputation scoring    |
| **Dashboard**     | Real-time threats, email details, risk visualization         |
| **IoT Device**    | Voice control, audio alerts, hands-free email management     |
| **Multi-User**    | User data isolation, per-user email storage                  |

---

*PhisGuard-AI © 2024 — Protecting Your Inbox with AI + IoT*
