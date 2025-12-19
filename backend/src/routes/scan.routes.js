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

export default router;
