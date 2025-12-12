import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import emailRoutes from './routes/email.js';
import healthRoutes from './routes/health.js';

// Import middleware
import { errorHandler, requestLogger } from './middleware/auth.js';

// Import Firebase initialization
import { initializeFirebase, isFirebaseConfigured } from './config/firebase.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check routes (no auth required)
app.use('/', healthRoutes);

// API routes
app.use('/api', emailRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'PhishGuard API',
        version: '1.0.0',
        description: 'AI-Powered Phishing Email Detection Backend',
        mode: isFirebaseConfigured() ? 'production' : 'development',
        endpoints: {
            health: '/health',
            processEmail: 'POST /api/process-email',
            analyzeEmail: 'POST /api/analyze-email',
            getEmails: 'GET /api/emails',
            getStats: 'GET /api/emails/stats',
            getByRisk: 'GET /api/emails/risk/:level'
        }
    });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
async function startServer() {
    try {
        // Initialize Firebase (optional - will gracefully handle missing config)
        console.log('Initializing Firebase...');
        const db = initializeFirebase();

        const mode = db ? '🔥 Firebase connected' : '💾 In-memory storage (dev mode)';

        // Start Express server
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛡️  PhishGuard API Server                               ║
║                                                           ║
║   Server running on port ${PORT}                            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(10)}                      ║
║   Storage: ${mode.padEnd(30)}        ║
║                                                           ║
║   Endpoints:                                              ║
║   - Health: http://localhost:${PORT}/health                 ║
║   - API:    http://localhost:${PORT}/api/process-email      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
