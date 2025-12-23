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
        const limitedMaxEmails = Math.min(maxEmails, 500);

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

            // For HIGH risk emails, store more content
            const isHighRisk = analysis.riskLevel === 'HIGH';

            return {
                id: email.gmailId || email.messageId,
                emailId: email.gmailId,
                gmailId: email.gmailId,
                messageId: email.messageId,
                subject: (email.subject || '').substring(0, 200),
                sender: email.sender,
                senderName: email.senderName,
                receivedAt: email.receivedAt,
                // Store full body for HIGH risk, or longer snippet for others
                body: isHighRisk ? (email.body || '').substring(0, 2000) : null,
                snippet: (email.snippet || email.body || '').substring(0, 500),
                urlCount: email.urls?.length || 0,
                urls: isHighRisk ? email.urls?.slice(0, 10) : [],
                riskLevel: analysis.riskLevel,
                phishingScore: analysis.score,
                flags: analysis.flags?.slice(0, 5) || []
            };
        });

        // Calculate summary
        const summary = {
            total: scanResults.length,
            high: scanResults.filter(r => r.riskLevel === 'HIGH').length,
            medium: scanResults.filter(r => r.riskLevel === 'MEDIUM').length,
            low: scanResults.filter(r => r.riskLevel === 'LOW').length
        };

        // Store emails prioritized by risk - HIGH risk ALWAYS stored, then MEDIUM, then LOW
        // This ensures high-risk threats are never truncated
        const highRisk = scanResults.filter(r => r.riskLevel === 'HIGH');
        const mediumRisk = scanResults.filter(r => r.riskLevel === 'MEDIUM').slice(0, 100);
        const lowRisk = scanResults.filter(r => r.riskLevel === 'LOW').slice(0, 50);

        // Combine: all HIGH + up to 100 MEDIUM + up to 50 LOW
        const resultsToStore = [...highRisk, ...mediumRisk, ...lowRisk];

        console.log(`Storing: ${highRisk.length} high, ${mediumRisk.length} medium, ${lowRisk.length} low = ${resultsToStore.length} total`);

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
 * Save scan results to Firestore (CUMULATIVE - merges with existing emails)
 * New emails are added to the existing collection, duplicates are updated
 * @param {string} userId - User ID
 * @param {Object} scanRecord - Scan record to save
 */
async function saveScanResults(userId, scanRecord) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode - cumulative storage
        let userScans = devScanStorage.get(userId) || { emails: [] };

        // Create a map of existing emails
        const emailMap = new Map();
        userScans.emails.forEach(email => {
            if (email.gmailId) {
                emailMap.set(email.gmailId, email);
            }
        });

        // Add/update new results
        for (const result of scanRecord.results) {
            if (result.gmailId) {
                emailMap.set(result.gmailId, result);
            }
        }

        // Convert back to sorted array
        const allEmails = Array.from(emailMap.values())
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

        devScanStorage.set(userId, {
            emails: allEmails,
            lastScannedAt: scanRecord.scannedAt,
            summary: {
                total: allEmails.length,
                high: allEmails.filter(e => e.riskLevel === 'HIGH').length,
                medium: allEmails.filter(e => e.riskLevel === 'MEDIUM').length,
                low: allEmails.filter(e => e.riskLevel === 'LOW').length
            }
        });
        console.log(`[DEV MODE] Saved ${allEmails.length} cumulative emails for user: ${userId}`);
        return;
    }

    const userDocRef = db.collection(SCAN_RESULTS_COLLECTION).doc(userId);

    // Get existing emails
    const existingDoc = await userDocRef.get();
    let existingEmails = [];

    if (existingDoc.exists) {
        existingEmails = existingDoc.data().emails || [];
    }

    // Create a map of existing emails by gmailId for quick lookup
    const emailMap = new Map();
    existingEmails.forEach(email => {
        if (email.gmailId) {
            emailMap.set(email.gmailId, email);
        }
    });

    // Add/update new scan results
    let newCount = 0;
    let updatedCount = 0;

    for (const result of scanRecord.results) {
        if (result.gmailId) {
            if (emailMap.has(result.gmailId)) {
                emailMap.set(result.gmailId, result);
                updatedCount++;
            } else {
                emailMap.set(result.gmailId, result);
                newCount++;
            }
        }
    }

    // Convert map back to array and sort by receivedAt (newest first)
    const allEmails = Array.from(emailMap.values())
        .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

    // Recalculate summary for ALL emails
    const totalSummary = {
        total: allEmails.length,
        high: allEmails.filter(e => e.riskLevel === 'HIGH').length,
        medium: allEmails.filter(e => e.riskLevel === 'MEDIUM').length,
        low: allEmails.filter(e => e.riskLevel === 'LOW').length
    };

    // Save the cumulative results
    await userDocRef.set({
        userId,
        lastScannedAt: new Date().toISOString(),
        lastScanNewCount: scanRecord.emailCount,
        totalEmailCount: allEmails.length,
        summary: totalSummary,
        emails: allEmails,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[Save] User ${userId} - Added ${newCount} new, updated ${updatedCount}, total ${allEmails.length} emails`);
}

/**
 * Get user's cumulative scan results from Firestore
 * @param {string} userId - User ID
 * @param {number} limit - Max emails to return (not used for cumulative, kept for compatibility)
 * @returns {Promise<Array>} Array containing the scan data
 */
async function getUserScanHistory(userId, limit = 10) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode - return cumulative data
        const userData = devScanStorage.get(userId);
        if (!userData || !userData.emails) {
            return [];
        }
        return [{
            id: 'cumulative',
            scannedAt: userData.lastScannedAt,
            summary: userData.summary,
            results: userData.emails.slice(0, limit * 50), // Return more emails
            emailCount: userData.emails.length
        }];
    }

    // Get the cumulative document
    const userDoc = await db.collection(SCAN_RESULTS_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
        return [];
    }

    const data = userDoc.data();

    return [{
        id: 'cumulative',
        scannedAt: data.lastScannedAt,
        summary: data.summary,
        results: data.emails || [],
        emailCount: data.totalEmailCount || 0
    }];
}
