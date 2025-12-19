# PhisGuard AI - Project Report

> **AI-Powered Automated Phishing Email Detection System**  
> Version 2.0.0 | December 2024

---

## Executive Summary

PhisGuard AI is a comprehensive cybersecurity application that automatically detects phishing emails using artificial intelligence and machine learning. The system integrates with Gmail via OAuth 2.0, analyzes incoming emails for phishing indicators, and provides a real-time dashboard for monitoring threats.

### Key Achievements
- ✅ Native Gmail API integration (replaced n8n workflow)
- ✅ OAuth 2.0 secure authentication
- ✅ Rule-based AI phishing detection engine
- ✅ Firebase Firestore for secure data storage
- ✅ AES-256 encryption for sensitive data
- ✅ Modern, responsive dashboard UI

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Documentation](#api-documentation)
7. [Security Features](#security-features)
8. [Database Schema](#database-schema)
9. [Setup & Installation](#setup--installation)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Problem Statement
Phishing attacks remain one of the most significant cybersecurity threats, with millions of phishing emails sent daily. Traditional email filters often fail to detect sophisticated phishing attempts, leaving users vulnerable to credential theft, financial fraud, and data breaches.

### Solution
PhisGuard AI provides an intelligent layer of protection by:
- Connecting securely to users' Gmail accounts via OAuth 2.0
- Fetching and analyzing emails for phishing indicators
- Using AI-powered detection algorithms to identify threats
- Providing real-time visibility through a cloud dashboard

### Target Users
- Individual users concerned about email security
- Small businesses without dedicated security teams
- Organizations requiring additional email protection layers

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js (ESM) | Runtime environment |
| Express.js | Web framework |
| Firebase Admin SDK | Authentication & Firestore |
| Google APIs (googleapis) | Gmail API access |
| AES-256-GCM | Data encryption |
| SHA-256 | URL hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| Firebase Auth | User authentication |
| Vercel Analytics | Performance monitoring |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Authentication | User login (Google Sign-In) |
| Cloud Firestore | NoSQL database |
| Vercel | Frontend hosting |

---

## System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Gmail     │───▶│  OAuth 2.0  │───▶│  AI Engine  │───▶│  Firestore  │
│   Inbox     │    │   Auth      │    │  Detection  │    │   Storage   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │  Dashboard  │
                                      │    (UI)     │
                                      └─────────────┘
```

### Data Flow
1. **User Authentication**: User logs in via Firebase Google Sign-In
2. **Gmail Connection**: User authorizes Gmail access via OAuth 2.0
3. **Token Storage**: OAuth tokens stored securely in Firestore
4. **Email Fetching**: Backend fetches emails using Gmail API
5. **Phishing Analysis**: AI engine analyzes each email
6. **Result Storage**: Scan results encrypted and stored
7. **Dashboard Display**: User views results in real-time

---

## Backend Implementation

### Folder Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── firebase.js        # Firebase Admin SDK setup
│   │   └── googleOAuth.js     # Google OAuth2 client
│   ├── controllers/
│   │   ├── gmail.controller.js # OAuth flow handlers
│   │   └── scan.controller.js  # Scan operations
│   ├── middlewares/
│   │   └── firebaseAuth.middleware.js # Token verification
│   ├── routes/
│   │   ├── auth.routes.js     # OAuth routes
│   │   ├── gmail.routes.js    # Email fetching routes
│   │   └── scan.routes.js     # Scan routes
│   ├── services/
│   │   ├── gmail.service.js   # Gmail API operations
│   │   └── phishing.service.js # Detection logic
│   ├── utils/
│   │   └── emailParser.js     # Email parsing utilities
│   ├── app.js                 # Express app config
│   └── server.js              # Entry point
├── .env                       # Environment variables
└── package.json
```

### Key Services

#### Gmail Service (`gmail.service.js`)
- Manages OAuth token storage and refresh
- Fetches emails from Gmail API
- Parses email content (subject, body, URLs)

#### Phishing Service (`phishing.service.js`)
- URL risk analysis (suspicious patterns, domains)
- Keyword detection (urgency, threats)
- Sender reputation analysis
- Composite risk scoring (0-100)

---

## Frontend Implementation

### Folder Structure
```
frontend/
├── app/
│   ├── dashboard/             # Main dashboard
│   ├── connect-gmail/         # Gmail OAuth page
│   ├── login/                 # Auth pages
│   └── docs/                  # Documentation
├── components/
│   ├── dashboard/
│   │   ├── scan-inbox-button.tsx  # Scan trigger
│   │   ├── dashboard-stats.tsx    # Statistics
│   │   └── recent-emails-table.tsx # Email list
│   ├── gmail/
│   │   └── gmail-connection-card.tsx # OAuth UI
│   └── landing/
│       ├── features-section.tsx
│       ├── how-it-works-section.tsx
│       └── architecture-section.tsx
├── lib/
│   ├── api.ts                 # API service
│   └── firebase.ts            # Firebase config
└── contexts/
    └── auth-context.tsx       # Auth state
```

### Key Components

#### ScanInboxButton
- Triggers inbox scanning
- Displays scan progress
- Shows results summary (high/medium/low risk counts)

#### GmailConnectionCard
- Guides users through OAuth flow
- Shows connection status
- Handles errors gracefully

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/gmail/connect?userId=<uid>` | Initiate Gmail OAuth |
| GET | `/auth/gmail/callback` | OAuth callback handler |
| GET | `/auth/gmail/status` | Check connection status |
| POST | `/auth/gmail/disconnect` | Remove Gmail access |

### Scan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan/inbox` | Scan inbox for phishing |
| GET | `/scan/latest` | Get latest scan results |
| GET | `/scan/history` | Get scan history |

### Gmail Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/gmail/emails` | Fetch Gmail messages |
| GET | `/gmail/emails/:id` | Get specific email |

### Response Format
```json
{
  "success": true,
  "data": {
    "scannedCount": 10,
    "summary": {
      "total": 10,
      "high": 1,
      "medium": 2,
      "low": 7
    },
    "results": [...]
  }
}
```

---

## Security Features

### Authentication
- **Firebase Authentication**: Secure user identity management
- **Google Sign-In**: OAuth 2.0 authentication
- **JWT Tokens**: Stateless session management
- **ID Token Verification**: Backend validates Firebase tokens

### Data Protection
- **AES-256-GCM Encryption**: Email content, URLs, and tokens encrypted
- **SHA-256 Hashing**: Email IDs hashed for deduplication
- **HTTPS**: All communications encrypted in transit
- **Environment Variables**: Secrets never hardcoded

### Access Control
- **Firebase Auth Middleware**: All sensitive endpoints protected
- **User Isolation**: Users can only access their own data
- **Token Refresh**: Automatic OAuth token refresh

### API Security
- **CORS Configuration**: Restricted origins
- **Helmet.js**: Security headers
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitized inputs

---

## Database Schema

### Firestore Collections

#### `gmail_tokens/{userId}`
```javascript
{
  access_token: "encrypted_access_token",
  refresh_token: "encrypted_refresh_token",
  scope: "https://www.googleapis.com/auth/gmail.readonly",
  token_type: "Bearer",
  expiry_date: 1734567890000,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `scan_results/{userId}/scans/{scanId}`
```javascript
{
  userId: "firebase_uid",
  scannedAt: Timestamp,
  scannedCount: 10,
  summary: {
    total: 10,
    high: 1,
    medium: 2,
    low: 7
  },
  results: [
    {
      messageId: "gmail_message_id",
      subject: "encrypted_subject",
      sender: "encrypted_sender",
      riskLevel: "HIGH",
      phishingScore: 85,
      flags: ["suspicious_url", "urgent_language"],
      receivedAt: Timestamp
    }
  ]
}
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- Firebase Project with Firestore & Authentication enabled
- Google Cloud Project with Gmail API enabled
- OAuth 2.0 credentials

### Environment Variables

#### Backend (`.env`)
```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/gmail/callback

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Encryption
ENCRYPTION_KEY=your_32_byte_hex_key
```

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### Installation Steps

```bash
# Clone repository
git clone https://github.com/your-repo/phishguard-ai.git
cd phishguard-ai

# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

---

## Future Enhancements

### Phase 2 - AI Improvements
- [ ] DistilBERT ML model integration
- [ ] Training on phishing email datasets
- [ ] Confidence scoring improvements
- [ ] URL reputation checking via external APIs

### Phase 3 - Features
- [ ] Real-time email notifications
- [ ] Email quarantine functionality
- [ ] Outlook/Microsoft 365 support
- [ ] Mobile app (React Native)

### Phase 4 - Enterprise
- [ ] Multi-user organization support
- [ ] Admin dashboard
- [ ] SIEM integration
- [ ] Compliance reporting (SOC 2, GDPR)

---

## Contributors

- **Development Team**: PhisGuard AI Team
- **Version**: 2.0.0
- **Last Updated**: December 2024

---

## License

This project is proprietary software. All rights reserved.

---

*Generated by PhisGuard AI Documentation System*
