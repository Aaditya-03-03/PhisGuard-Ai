// Server Entry Point
// Initializes Firebase and starts the Express server

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (one level up from src/)
const envPath = resolve(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error.message);
} else {
    console.log('.env file loaded successfully');
}

// Debug: Log whether Gmail env vars are loaded (not the actual values)
console.log('Environment check:', {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI
});

import app from './app.js';
import { initializeFirebase, isFirebaseConfigured } from './config/firebase.js';
import { startScheduler } from './services/scheduler.service.js';
import { startUserbot } from './userbot/userbot.runner.js';

const PORT = process.env.PORT || 3001;

/**
 * Start the server
 */
async function startServer() {
    try {
        // Initialize Firebase
        console.log('Initializing Firebase...');
        const firebase = initializeFirebase();

        const firebaseStatus = firebase
            ? '🔥 Firebase connected'
            : '💾 In-memory storage (dev mode)';

        // Check for Google OAuth configuration
        const googleConfigured = !!(
            process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET
        );

        // Start Express server
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛡️  PhishGuard API Server v2.0                          ║
║                                                           ║
║   Server running on port ${String(PORT).padEnd(4)}                           ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(15)}                 ║
║   Storage: ${firebaseStatus.padEnd(35)}║
║   Gmail API: ${(googleConfigured ? '✅ Configured' : '⚠️  Not configured').padEnd(25)}        ║
║                                                           ║
║   Endpoints:                                              ║
║   - Health:  http://localhost:${PORT}/health                ║
║   - Connect: http://localhost:${PORT}/auth/gmail/connect    ║
║   - Scan:    http://localhost:${PORT}/scan/inbox            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
            `);

            if (!googleConfigured) {
                console.warn('\n⚠️  Gmail API not configured!');
                console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
                console.warn('   to enable Gmail integration.\n');
            }

            // Start the auto-scan scheduler
            startScheduler();

            // Start Telegram MTProto Userbot asynchronously
            startUserbot().catch(err => {
                console.error('Failed to start Telegram Userbot:', err);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
