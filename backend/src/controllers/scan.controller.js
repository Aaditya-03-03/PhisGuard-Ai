// Scan Controller
// Handles inbox scanning for phishing detection

import { fetchInboxEmails, isGmailConnected } from '../services/gmail.service.js';
import { analyzeEmail } from '../services/phishing.service.js';
import { getFirestoreDb } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const SCAN_RESULTS_COLLECTION = 'scanResults';

// In-memory storage for development mode
const devScanStorage = new Map();

/**
 * Scan user's inbox for phishing emails
 * POST /scan/inbox
 */
export async function scanInbox(req, res) {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Check if Gmail is connected
        const connected = await isGmailConnected(userId);
        if (!connected) {
            return res.status(400).json({
                success: false,
                error: 'Gmail not connected. Please connect your Gmail account first.',
                code: 'GMAIL_NOT_CONNECTED'
            });
        }

        // Get scan parameters from request body
        const { maxEmails = 10, query = 'in:inbox' } = req.body;

        // Limit to prevent abuse (max 100)
        const limitedMaxEmails = Math.min(maxEmails, 100);

        console.log(`Starting inbox scan for user ${userId}, fetching ${limitedMaxEmails} emails...`);

        // Fetch emails from Gmail
        const emails = await fetchInboxEmails(userId, limitedMaxEmails, query);

        if (emails.length === 0) {
            return res.json({
                success: true,
                message: 'No emails found to scan',
                data: {
                    scannedCount: 0,
                    results: [],
                    summary: {
                        total: 0,
                        high: 0,
                        medium: 0,
                        low: 0
                    }
                }
            });
        }

        // Analyze each email for phishing
        const scanResults = emails.map(email => {
            const analysis = analyzeEmail(email);

            return {
                id: email.gmailId || email.messageId,
                emailId: email.gmailId,
                messageId: email.messageId,
                subject: (email.subject || '').substring(0, 200), // Truncate long subjects
                sender: email.sender,
                senderName: email.senderName,
                receivedAt: email.receivedAt,
                snippet: (email.snippet || '').substring(0, 150), // Truncate snippets
                urlCount: email.urls?.length || 0,
                riskLevel: analysis.riskLevel,
                phishingScore: analysis.score,
                flags: analysis.flags?.slice(0, 5) || [] // Limit to 5 flags
                // Note: We don't store 'details' to save space
            };
        });

        // Calculate summary
        const summary = {
            total: scanResults.length,
            high: scanResults.filter(r => r.riskLevel === 'HIGH').length,
            medium: scanResults.filter(r => r.riskLevel === 'MEDIUM').length,
            low: scanResults.filter(r => r.riskLevel === 'LOW').length
        };

        // Store only summary + limited results in Firestore (to stay under 1MB limit)
        // Keep only high/medium risk emails in storage, or up to 50 total
        const resultsToStore = scanResults
            .filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM')
            .concat(scanResults.filter(r => r.riskLevel === 'LOW').slice(0, 20))
            .slice(0, 50);

        const scanRecord = {
            userId,
            scannedAt: new Date().toISOString(),
            emailCount: emails.length,
            summary,
            results: resultsToStore
        };

        await saveScanResults(userId, scanRecord);

        console.log(`Scan complete: ${summary.total} emails - ${summary.high} high, ${summary.medium} medium, ${summary.low} low risk`);

        res.json({
            success: true,
            message: `Scanned ${emails.length} emails successfully`,
            data: {
                scannedCount: emails.length,
                scannedAt: scanRecord.scannedAt,
                summary,
                results: scanResults
            }
        });
    } catch (error) {
        console.error('Failed to scan inbox:', error);

        // Handle specific errors
        if (error.message?.includes('Gmail not connected')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                code: 'GMAIL_NOT_CONNECTED'
            });
        }

        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            return res.status(401).json({
                success: false,
                error: 'Gmail access expired. Please reconnect your Gmail account.',
                code: 'GMAIL_TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to scan inbox'
        });
    }
}

/**
 * Get scan history for user
 * GET /scan/history
 */
export async function getScanHistory(req, res) {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const limit = parseInt(req.query.limit) || 10;
        const history = await getUserScanHistory(userId, limit);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Failed to get scan history:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get scan history'
        });
    }
}

/**
 * Get latest scan results
 * GET /scan/latest
 */
export async function getLatestScan(req, res) {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const history = await getUserScanHistory(userId, 1);

        if (history.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No scan history found'
            });
        }

        res.json({
            success: true,
            data: history[0]
        });
    } catch (error) {
        console.error('Failed to get latest scan:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get latest scan'
        });
    }
}

/**
 * Save scan results to Firestore
 * @param {string} userId - User ID
 * @param {Object} scanRecord - Scan record to save
 */
async function saveScanResults(userId, scanRecord) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        const userScans = devScanStorage.get(userId) || [];
        userScans.unshift({ id: `dev-${Date.now()}`, ...scanRecord });
        devScanStorage.set(userId, userScans.slice(0, 20)); // Keep last 20
        console.log(`[DEV MODE] Saved scan results for user: ${userId}`);
        return;
    }

    await db.collection(SCAN_RESULTS_COLLECTION)
        .doc(userId)
        .collection('scans')
        .add({
            ...scanRecord,
            createdAt: FieldValue.serverTimestamp()
        });
}

/**
 * Get user's scan history from Firestore
 * @param {string} userId - User ID
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>} Scan history
 */
async function getUserScanHistory(userId, limit = 10) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        const userScans = devScanStorage.get(userId) || [];
        return userScans.slice(0, limit);
    }

    const snapshot = await db.collection(SCAN_RESULTS_COLLECTION)
        .doc(userId)
        .collection('scans')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}
