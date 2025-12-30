// ============================================
// TELEGRAM INTEGRATION ROUTES
// Webhook and user linking endpoints
// ============================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';
import { scanMessage } from '../services/message-scan.service.js';
import {
    validateWebhookSecret,
    generateLinkingCode,
    validateLinkingCode,
    getChatUserId,
    getUserLinkStatus,
    unlinkUserChat,
    parseTelegramUpdate,
    parseLinkCommand,
    sendTelegramMessage
} from '../services/telegram.service.js';

const router = Router();

// ============================================
// WEBHOOK RATE LIMITING
// ============================================

const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 100,             // 100 requests per minute per IP
    message: { success: false, error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false
});

// ============================================
// TELEGRAM WEBHOOK ENDPOINT
// ============================================

/**
 * POST /api/telegram/webhook
 * Receives updates from Telegram Bot API
 * 
 * Security:
 *   - Validates X-Telegram-Bot-Api-Secret-Token header
 *   - Rate limited to prevent abuse
 * 
 * Behavior:
 *   - Processes /link commands for account linking
 *   - Scans messages from linked chats
 *   - Ignores messages from unlinked chats
 */
router.post('/webhook', webhookLimiter, async (req, res) => {
    // Validate webhook secret
    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (!validateWebhookSecret(headerSecret)) {
        console.warn('[Telegram] Invalid webhook secret');
        return res.status(403).json({ success: false, error: 'Invalid webhook secret' });
    }

    try {
        const update = req.body;

        // Parse the update
        const parsed = parseTelegramUpdate(update);
        if (!parsed) {
            // Not a message update we care about
            return res.json({ ok: true });
        }

        const { chatId, text, chatType } = parsed;

        // Handle group chats differently (only process if bot is mentioned)
        if (chatType !== 'private') {
            // For now, only process private chats
            // Group support can be added later
            return res.json({ ok: true });
        }

        // Check for /link command
        const linkCommand = parseLinkCommand(text);
        if (linkCommand.isCommand) {
            const result = await validateLinkingCode(linkCommand.code, chatId);

            if (result.success) {
                await sendTelegramMessage(chatId,
                    '✅ <b>Account linked successfully!</b>\n\n' +
                    'Your Telegram is now connected to PhishGuard. ' +
                    'I will scan incoming messages for phishing threats.'
                );
            } else {
                await sendTelegramMessage(chatId,
                    `❌ <b>Linking failed:</b> ${result.error}\n\n` +
                    'Please get a new code from the PhishGuard website and try again.'
                );
            }

            return res.json({ ok: true });
        }

        // Check if this chat is linked to a user
        const userId = await getChatUserId(chatId);
        if (!userId) {
            // Chat not linked - ignore message silently
            // Don't spam unlinked users with responses
            return res.json({ ok: true });
        }

        // Scan the message for phishing
        if (text && text.trim().length > 0) {
            const scanResult = await scanMessage({
                platform: 'telegram',
                content: text,
                userId,
                metadata: {
                    chatId,
                    messageId: parsed.messageId,
                    chatType
                }
            });

            // Notify user of high-risk messages
            if (scanResult.risk === 'HIGH') {
                await sendTelegramMessage(chatId,
                    '🚨 <b>PHISHING ALERT!</b>\n\n' +
                    'This message appears to be a phishing attempt.\n\n' +
                    `<b>Risk Level:</b> ${scanResult.risk}\n` +
                    `<b>Confidence:</b> ${Math.round(scanResult.confidence * 100)}%\n\n` +
                    '<b>Warning signs:</b>\n' +
                    scanResult.reasons.slice(0, 3).map(r => `• ${r}`).join('\n')
                );
            } else if (scanResult.risk === 'MEDIUM') {
                await sendTelegramMessage(chatId,
                    '⚠️ <b>Suspicious Content Detected</b>\n\n' +
                    'This message has some characteristics of phishing.\n' +
                    'Please verify the sender before clicking any links.'
                );
            }
        }

        res.json({ ok: true });

    } catch (error) {
        console.error('[Telegram] Webhook error:', error);
        // Return 200 to prevent Telegram from retrying
        res.json({ ok: true });
    }
});

// ============================================
// USER LINKING ENDPOINTS
// ============================================

/**
 * POST /api/telegram/link
 * Generate a linking code for the authenticated user
 * 
 * Response:
 *   - code: string (e.g., "TG-1234")
 *   - expiresAt: ISO timestamp
 */
router.post('/link', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const { code, expiresAt } = await generateLinkingCode(userId);

        res.json({
            success: true,
            data: {
                code,
                expiresAt: expiresAt.toISOString(),
                instructions: `Send "/link ${code}" to the PhishGuard Telegram bot to complete linking.`
            }
        });

    } catch (error) {
        console.error('[Telegram] Link generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate linking code'
        });
    }
});

/**
 * GET /api/telegram/status
 * Check if the user has a linked Telegram chat
 * 
 * Response:
 *   - linked: boolean
 *   - chatId: string (if linked)
 */
router.get('/status', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const status = await getUserLinkStatus(userId);

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('[Telegram] Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check link status'
        });
    }
});

/**
 * DELETE /api/telegram/unlink
 * Remove the Telegram link for the authenticated user
 */
router.delete('/unlink', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const success = await unlinkUserChat(userId);

        if (success) {
            res.json({
                success: true,
                message: 'Telegram account unlinked successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to unlink account'
            });
        }

    } catch (error) {
        console.error('[Telegram] Unlink error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unlink account'
        });
    }
});

export default router;
