// Scan Routes
// Handles phishing scan endpoints

import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';
import { scanInbox, getScanHistory, getLatestScan } from '../controllers/scan.controller.js';

const router = Router();

// All scan routes require authentication
router.use(verifyFirebaseToken);

/**
 * POST /scan/inbox
 * Scan user's inbox for phishing emails
 * Body params:
 *   - maxEmails: Number of emails to scan (default: 10, max: 50)
 *   - query: Gmail search query (default: 'in:inbox')
 */
router.post('/inbox', scanInbox);

/**
 * GET /scan/history
 * Get user's scan history
 * Query params:
 *   - limit: Maximum number of scans to return (default: 10)
 */
router.get('/history', getScanHistory);

/**
 * GET /scan/latest
 * Get the most recent scan results
 */
router.get('/latest', getLatestScan);

/**
 * GET /scan/results
 * Get phishing results filtered by platform
 * Query params:
 *   - platform: 'email' | 'telegram' | 'whatsapp'
 *   - limit: Maximum results (default: 50)
 */
router.get('/results', async (req, res) => {
    try {
        const { platform = 'email', limit = 50 } = req.query;
        const userId = req.user.uid;

        const { getResultsByPlatform } = await import('../services/message-scan.service.js');
        const results = await getResultsByPlatform(userId, platform === 'email' ? 'gmail' : platform, parseInt(limit));

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('[Scan] Platform results error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch results' });
    }
});

/**
 * GET /scan/stats
 * Get stats for a specific platform
 * Query params:
 *   - platform: 'email' | 'telegram' | 'whatsapp'
 */
router.get('/stats', async (req, res) => {
    try {
        const { platform = 'email' } = req.query;
        const userId = req.user.uid;

        const { getStatsByPlatform } = await import('../services/message-scan.service.js');
        const stats = await getStatsByPlatform(userId, platform === 'email' ? 'gmail' : platform);

        res.json({
            success: true,
            data: {
                total: stats.total,
                highRisk: stats.high,
                mediumRisk: stats.medium,
                lowRisk: stats.low
            }
        });
    } catch (error) {
        console.error('[Scan] Platform stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

export default router;

