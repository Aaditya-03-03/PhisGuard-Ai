# PhishGuard AI

AI-Powered Automated Phishing Email Detection System

## Project Structure

```
phishguard-ai/
├── frontend/          # Next.js dashboard (Tailwind + shadcn UI)
├── backend/           # Express.js API (TypeScript)
├── docs/              # Documentation and n8n workflow
└── package.json       # Monorepo scripts
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

## Components

- **Frontend**: Next.js 16, Tailwind CSS, shadcn UI
- **Backend**: Express.js, TypeScript, Firebase Admin SDK
- **Security**: AES-256-GCM encryption, SHA-256 hashing
- **Database**: Firebase Firestore
- **Automation**: n8n (Gmail trigger → API)

## Documentation

- [n8n Setup Guide](./docs/n8n-setup-guide.md)
- [Backend API](./backend/README.md)
