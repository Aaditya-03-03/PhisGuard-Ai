// Express Application Setup
// Configures middleware, routes, and error handling

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import scanRoutes from './routes/scan.routes.js';
import autoscanRoutes from './routes/autoscan.routes.js';
import deviceRoutes from './routes/device.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import telegramRoutes from './routes/telegram.routes.js';

// Import config
import { isFirebaseConfigured } from './config/firebase.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Bot-Api-Secret-Token'],
    credentials: true
}));

// Rate limiting - relaxed for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs (increased for development)
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);
app.use('/auth/', limiter);
app.use('/scan/', limiter);
app.use('/gmail/', limiter);
app.use('/autoscan/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        firebase: isFirebaseConfigured() ? 'configured' : 'not configured',
        version: '2.0.0'
    });
});

// Also respond to /api/health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        firebase: isFirebaseConfigured() ? 'configured' : 'not configured',
        version: '2.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'PhishGuard API',
        version: '2.0.0',
        description: 'AI-Powered Multi-Platform Phishing Detection Backend',
        mode: isFirebaseConfigured() ? 'production' : 'development',
        endpoints: {
            health: 'GET /health',
            auth: {
                connect: 'GET /auth/gmail/connect?userId=<uid>',
                callback: 'GET /auth/gmail/callback',
                status: 'GET /auth/gmail/status',
                disconnect: 'POST /auth/gmail/disconnect'
            },
            gmail: {
                emails: 'GET /gmail/emails',
                emailById: 'GET /gmail/emails/:id'
            },
            scan: {
                inbox: 'POST /scan/inbox',
                whatsapp: 'POST /scan/whatsapp',
                history: 'GET /scan/history',
                latest: 'GET /scan/latest'
            },
            telegram: {
                webhook: 'POST /telegram/webhook',
                link: 'POST /telegram/link',
                status: 'GET /telegram/status',
                unlink: 'DELETE /telegram/unlink'
            }
        }
    });
});

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/scan', whatsappRoutes);  // WhatsApp manual scan
app.use('/api/autoscan', autoscanRoutes);
app.use('/api/device', deviceRoutes);  // ESP32 Device Integration
app.use('/api/telegram', telegramRoutes);  // Telegram Bot Integration

// Also mount without prefix for backwards compatibility
app.use('/auth', authRoutes);
app.use('/gmail', gmailRoutes);
app.use('/scan', scanRoutes);
app.use('/autoscan', autoscanRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
});

export default app;
