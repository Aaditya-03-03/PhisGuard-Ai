// Gmail Routes
// Handles email fetching from Gmail API

import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';
import { fetchInboxEmails, isGmailConnected } from '../services/gmail.service.js';

const router = Router();

// All Gmail routes require authentication
router.use(verifyFirebaseToken);

/**
 * GET /gmail/emails
 * Fetch emails from user's Gmail inbox
 * Query params:
 *   - limit: Maximum number of emails (default: 10, max: 50)
 *   - query: Gmail search query (default: 'in:inbox')
 */
router.get('/emails', async (req, res) => {
    try {
        const userId = req.user.uid;

        // Check if Gmail is connected
        const connected = await isGmailConnected(userId);
        if (!connected) {
            return res.status(400).json({
                success: false,
                error: 'Gmail not connected. Please connect your Gmail account first.',
                code: 'GMAIL_NOT_CONNECTED'
            });
        }

        // Parse query params
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const query = req.query.query || 'in:inbox';

        // Fetch emails
        const emails = await fetchInboxEmails(userId, limit, query);

        // Return simplified email data (without full body for list view)
        const emailList = emails.map(email => ({
            id: email.gmailId,
            messageId: email.messageId,
            threadId: email.threadId,
            subject: email.subject,
            sender: email.sender,
            senderName: email.senderName,
            snippet: email.snippet,
            receivedAt: email.receivedAt,
            urlCount: email.urls?.length || 0,
            labelIds: email.labelIds
        }));

        res.json({
            success: true,
            data: {
                count: emailList.length,
                emails: emailList
            }
        });
    } catch (error) {
        console.error('Failed to fetch emails:', error);

        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            return res.status(401).json({
                success: false,
                error: 'Gmail access expired. Please reconnect your Gmail account.',
                code: 'GMAIL_TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch emails'
        });
    }
});

/**
 * GET /gmail/emails/:id
 * Get a specific email by Gmail ID with full details
 */
router.get('/emails/:id', async (req, res) => {
    try {
        const userId = req.user.uid;
        const emailId = req.params.id;

        // Check if Gmail is connected
        const connected = await isGmailConnected(userId);
        if (!connected) {
            return res.status(400).json({
                success: false,
                error: 'Gmail not connected',
                code: 'GMAIL_NOT_CONNECTED'
            });
        }

        // Fetch all recent emails and find by ID
        const emails = await fetchInboxEmails(userId, 100, 'in:inbox');
        const email = emails.find(e =>
            e.gmailId === emailId ||
            e.messageId === emailId ||
            e.id === emailId
        );

        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Email not found'
            });
        }

        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        console.error('Failed to fetch email:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch email'
        });
    }
});

export default router;
