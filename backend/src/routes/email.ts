import { Router, type Request, type Response } from 'express';
import type { EmailInput, ProcessEmailResponse, ApiResponse } from '../types/email.js';
import { encrypt, encryptArray } from '../crypto/encryption.js';
import { hashMessageId } from '../crypto/hashing.js';
import { analyzeEmail } from '../services/phishingDetector.js';
import { saveProcessedEmail, emailExists, getRecentEmails, getEmailStats, getEmailsByRiskLevel } from '../services/firestore.js';
import { apiKeyAuth } from '../middleware/auth.js';
import { decrypt, decryptArray } from '../crypto/encryption.js';

const router = Router();

// Apply API key authentication to all email routes
router.use(apiKeyAuth);

/**
 * POST /api/process-email
 * Main endpoint for processing incoming emails from n8n
 */
router.post('/process-email', async (req: Request, res: Response) => {
    try {
        const emailInput = req.body as EmailInput;

        // Validate required fields
        if (!emailInput.messageId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: messageId'
            } as ApiResponse);
        }

        if (!emailInput.subject && !emailInput.body) {
            return res.status(400).json({
                success: false,
                error: 'Email must have at least a subject or body'
            } as ApiResponse);
        }

        // Hash the message ID
        const hashedMessageId = hashMessageId(emailInput.messageId);

        // Check for duplicate
        const exists = await emailExists(hashedMessageId);
        if (exists) {
            return res.status(409).json({
                success: false,
                error: 'Email already processed',
                data: { hashedMessageId }
            } as ApiResponse);
        }

        // Analyze for phishing
        const analysis = analyzeEmail(emailInput);

        // Encrypt sensitive fields
        const encryptedSubject = encrypt(emailInput.subject || '');
        const encryptedSender = encrypt(emailInput.sender || '');
        const encryptedSenderName = encrypt(emailInput.senderName || '');
        const encryptedUrls = encryptArray(emailInput.urls || []);

        // Prepare processed email for storage
        const processedEmail = {
            hashedMessageId,
            encryptedSubject,
            encryptedSender,
            encryptedSenderName,
            encryptedUrls,
            phishingScore: analysis.score,
            riskLevel: analysis.riskLevel,
            flags: analysis.flags,
            urlCount: emailInput.urls?.length || 0,
            receivedAt: emailInput.receivedAt || new Date().toISOString(),
            processedAt: new Date().toISOString(),
            createdAt: new Date()
        };

        // Save to Firestore
        const docId = await saveProcessedEmail(processedEmail);

        // Return response
        const response: ApiResponse<ProcessEmailResponse> = {
            success: true,
            message: 'Email processed successfully',
            data: {
                hashedMessageId,
                phishingScore: analysis.score,
                riskLevel: analysis.riskLevel,
                flags: analysis.flags
            }
        };

        console.log(`Processed email ${hashedMessageId.substring(0, 8)}... Risk: ${analysis.riskLevel}`);

        return res.status(201).json(response);
    } catch (error) {
        console.error('Error processing email:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process email'
        } as ApiResponse);
    }
});

/**
 * POST /api/analyze-email
 * Analyze email without storing (for testing)
 */
router.post('/analyze-email', async (req: Request, res: Response) => {
    try {
        const emailInput = req.body as EmailInput;

        if (!emailInput.subject && !emailInput.body) {
            return res.status(400).json({
                success: false,
                error: 'Email must have at least a subject or body'
            } as ApiResponse);
        }

        const analysis = analyzeEmail(emailInput);

        return res.json({
            success: true,
            data: analysis
        } as ApiResponse);
    } catch (error) {
        console.error('Error analyzing email:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to analyze email'
        } as ApiResponse);
    }
});

/**
 * GET /api/emails
 * Get recent emails for dashboard
 */
router.get('/emails', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const emails = await getRecentEmails(limit);

        // Decrypt sensitive fields for display
        const decryptedEmails = emails.map(email => ({
            id: (email as any).id,
            subject: decrypt(email.encryptedSubject),
            sender: decrypt(email.encryptedSender),
            senderName: decrypt(email.encryptedSenderName),
            urls: decryptArray(email.encryptedUrls),
            phishingScore: email.phishingScore,
            riskLevel: email.riskLevel,
            flags: email.flags,
            urlCount: email.urlCount,
            receivedAt: email.receivedAt,
            processedAt: email.processedAt
        }));

        return res.json({
            success: true,
            data: decryptedEmails
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch emails'
        } as ApiResponse);
    }
});

/**
 * GET /api/emails/stats
 * Get email statistics for dashboard
 */
router.get('/emails/stats', async (req: Request, res: Response) => {
    try {
        const stats = await getEmailStats();

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch stats'
        } as ApiResponse);
    }
});

/**
 * GET /api/emails/risk/:level
 * Get emails filtered by risk level
 */
router.get('/emails/risk/:level', async (req: Request, res: Response) => {
    try {
        const level = req.params.level as 'low' | 'medium' | 'high';

        if (!['low', 'medium', 'high'].includes(level)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid risk level. Must be low, medium, or high'
            } as ApiResponse);
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const emails = await getEmailsByRiskLevel(level, limit);

        // Decrypt sensitive fields
        const decryptedEmails = emails.map(email => ({
            id: (email as any).id,
            subject: decrypt(email.encryptedSubject),
            sender: decrypt(email.encryptedSender),
            senderName: decrypt(email.encryptedSenderName),
            urls: decryptArray(email.encryptedUrls),
            phishingScore: email.phishingScore,
            riskLevel: email.riskLevel,
            flags: email.flags,
            urlCount: email.urlCount,
            receivedAt: email.receivedAt,
            processedAt: email.processedAt
        }));

        return res.json({
            success: true,
            data: decryptedEmails
        });
    } catch (error) {
        console.error('Error fetching emails by risk level:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch emails'
        } as ApiResponse);
    }
});

export default router;
