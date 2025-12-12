import { Router, type Request, type Response } from 'express';
import { isFirebaseConfigured, isFirebaseReady } from '../config/firebase.js';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'phishguard-api',
        version: '1.0.0',
        mode: isFirebaseConfigured() ? 'production' : 'development'
    });
});

/**
 * GET /health/ready
 * Readiness check - verifies Firebase connection
 */
router.get('/health/ready', async (req: Request, res: Response) => {
    const firebaseConfigured = isFirebaseConfigured();
    const firebaseReady = isFirebaseReady();

    if (!firebaseConfigured) {
        return res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            firebase: 'not configured (dev mode)',
            storage: 'in-memory'
        });
    }

    if (firebaseReady) {
        return res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            firebase: 'connected'
        });
    }

    return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        firebase: 'disconnected'
    });
});

/**
 * GET /health/live
 * Liveness check - simple ping
 */
router.get('/health/live', (req: Request, res: Response) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

export default router;
