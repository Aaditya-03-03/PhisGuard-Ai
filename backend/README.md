# PhishGuard Backend API

AI-Powered Phishing Email Detection Backend with AES-256 encryption and Firebase Firestore.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Firebase credentials and encryption key

# Run development server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/process-email` | Process and store email (requires API key) |
| POST | `/api/analyze-email` | Analyze email without storing (requires API key) |

## Environment Variables

- `PORT` - Server port (default: 3001)
- `API_KEY` - API key for authentication
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- `AES_ENCRYPTION_KEY` - 64-character hex key for AES-256 encryption
- `FRONTEND_URL` - Frontend URL for CORS

## Deployment

Deploy to Render:
1. Connect GitHub repo
2. Set environment variables
3. Build command: `npm run build`
4. Start command: `npm run start`
