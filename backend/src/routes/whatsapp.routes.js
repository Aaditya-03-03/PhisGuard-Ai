// ============================================
// WHATSAPP SCAN ROUTES
// Manual message scanning for WhatsApp
// ============================================

import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';
import { scanMessage } from '../services/message-scan.service.js';

const router = Router();

// All WhatsApp routes require Firebase authentication
router.use(verifyFirebaseToken);

/**
 * POST /api/scan/whatsapp
 * Scan a manually-pasted WhatsApp message for phishing
 * 
 * Body:
 *   - message: string (required) - The message text to scan
 * 
 * Response:
 *   - success: boolean
 *   - data: { risk, confidence, reasons[], id }
 */
router.post('/whatsapp', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.uid;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a string'
            });
        }

        if (message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        if (message.length > 10000) {
            return res.status(400).json({
                success: false,
                error: 'Message exceeds maximum length of 10,000 characters'
            });
        }

        // Scan the message
        const result = await scanMessage({
            platform: 'whatsapp',
            content: message.trim(),
            userId,
            metadata: {
                source: 'manual_paste',
                timestamp: new Date().toISOString()
            }
        });

        res.json({
            success: true,
            data: {
                id: result.id,
                risk: result.risk,
                confidence: result.confidence,
                reasons: result.reasons,
                flags: result.flags
            }
        });

    } catch (error) {
        console.error('[WhatsApp] Scan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scan message'
        });
    }
});

export default router;
