// ============================================
// MESSAGE SCAN SERVICE
// Unified platform-agnostic phishing detection
// ============================================
//
// This service provides a single interface for scanning messages
// from any platform (Gmail, WhatsApp, Telegram).
// 
// RESPONSIBILITIES:
// - Accept messages from any platform
// - Run content through phishing detection
// - Store results in Firestore
// - Trigger ESP32 alerts for HIGH risk

import { getFirestoreDb as getFirestore } from '../config/firebase.js';
import { analyzeEmail } from './phishing.service.js';

// ============================================
// TYPES
// ============================================

/**
 * @typedef {'gmail' | 'whatsapp' | 'telegram'} Platform
 */

/**
 * @typedef {Object} ScanRequest
 * @property {Platform} platform - Source platform
 * @property {string} content - Message content to scan
 * @property {string} userId - Firebase UID of the user
 * @property {Object} [metadata] - Optional platform-specific metadata
 */

/**
 * @typedef {Object} ScanResult
 * @property {string} id - Result document ID
 * @property {Platform} platform - Source platform
 * @property {string} content - Scanned content
 * @property {'LOW' | 'MEDIUM' | 'HIGH'} risk - Risk level
 * @property {number} confidence - Confidence score (0-1)
 * @property {string[]} reasons - Human-readable risk reasons
 * @property {Date} createdAt - Timestamp
 */

// ============================================
// MAIN SCAN FUNCTION
// ============================================

/**
 * Scan a message for phishing indicators
 * Platform-agnostic: works for email, WhatsApp, and Telegram
 * 
 * @param {ScanRequest} request - Scan request object
 * @returns {Promise<ScanResult>} Scan result with risk assessment
 */
export async function scanMessage({ platform, content, userId, metadata = {} }) {
    // Validate inputs
    if (!platform || !['gmail', 'whatsapp', 'telegram'].includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
    }

    if (!content || typeof content !== 'string') {
        throw new Error('Content is required and must be a string');
    }

    if (!userId) {
        throw new Error('userId is required');
    }

    console.log(`[MessageScan] Scanning ${platform} message for user ${userId}`);

    // Prepare content for analysis
    // The phishing detector expects an email-like object
    // We adapt the message content to this format
    const analysisInput = {
        subject: metadata.subject || '',
        body: content,
        sender: metadata.sender || '',
        urls: extractUrls(content)
    };

    // Run through phishing detection
    const analysis = analyzeEmail(analysisInput);

    // Prepare result object
    const result = {
        userId,
        platform,
        content: truncateContent(content, 5000), // Limit stored content size
        risk: analysis.riskLevel,
        confidence: analysis.score,
        reasons: analysis.riskReasons || [],
        flags: analysis.flags || [],
        metadata: {
            ...metadata,
            urlCount: analysisInput.urls.length,
            detectionVersion: '2.0.0'
        },
        createdAt: new Date()
    };

    // Store in Firestore
    const db = getFirestore();
    if (db) {
        try {
            const docRef = await db.collection('phishing_results').add({
                ...result,
                createdAt: new Date()
            });
            result.id = docRef.id;
            console.log(`[MessageScan] Stored result ${docRef.id} with risk: ${result.risk}`);
        } catch (error) {
            console.error('[MessageScan] Failed to store result:', error);
            // Continue without storing - don't fail the scan
        }
    }

    // Trigger ESP32 alert for high-risk messages
    if (result.risk === 'HIGH') {
        await triggerPhishingAlert(userId, platform, result);
    }

    return result;
}

// ============================================
// ESP32 ALERT INTEGRATION
// ============================================

/**
 * Trigger ESP32 device alert for high-risk phishing detection
 * 
 * @param {string} userId - User's Firebase UID
 * @param {Platform} platform - Source platform
 * @param {Object} scanResult - The scan result
 */
async function triggerPhishingAlert(userId, platform, scanResult) {
    console.log(`[MessageScan] Triggering HIGH RISK alert for ${platform}`);

    const db = getFirestore();
    if (!db) {
        console.warn('[MessageScan] Firestore not available, skipping alert');
        return;
    }

    try {
        // Find user's registered device
        const devicesSnapshot = await db.collection('devices')
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (devicesSnapshot.empty) {
            console.log('[MessageScan] No active device found for user, skipping alert');
            return;
        }

        const device = devicesSnapshot.docs[0];
        const deviceId = device.id;

        // Platform-specific alert message
        const platformNames = {
            gmail: 'Email',
            whatsapp: 'WhatsApp',
            telegram: 'Telegram'
        };

        const alertPayload = {
            type: 'PHISHING_ALERT',
            platform: platform,
            risk: 'HIGH',
            message: `High-risk phishing detected on ${platformNames[platform]}`,
            timestamp: new Date().toISOString(),
            resultId: scanResult.id || null
        };

        // Queue alert for device
        await db.collection('device_alerts').add({
            deviceId,
            userId,
            alert: alertPayload,
            delivered: false,
            createdAt: new Date()
        });

        console.log(`[MessageScan] Alert queued for device ${deviceId}`);
    } catch (error) {
        console.error('[MessageScan] Failed to trigger alert:', error);
        // Don't throw - alert failure shouldn't break the scan
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract URLs from text content
 * 
 * @param {string} text - Text to extract URLs from
 * @returns {string[]} Array of URLs found
 */
function extractUrls(text) {
    if (!text) return [];

    // Regex to match URLs
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const matches = text.match(urlRegex) || [];

    // Deduplicate
    return [...new Set(matches)];
}

/**
 * Truncate content to a maximum length
 * 
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content
 */
function truncateContent(content, maxLength) {
    if (!content || content.length <= maxLength) {
        return content;
    }
    return content.substring(0, maxLength) + '... [truncated]';
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get scan results for a user filtered by platform
 * 
 * @param {string} userId - Firebase UID
 * @param {Platform} [platform] - Optional platform filter
 * @param {number} [limit=50] - Maximum results
 * @returns {Promise<ScanResult[]>} Array of scan results
 */
export async function getResultsByPlatform(userId, platform = null, limit = 50) {
    const db = getFirestore();
    if (!db) {
        console.warn('[MessageScan] Firestore not available');
        return [];
    }

    try {
        let query = db.collection('phishing_results')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (platform) {
            query = db.collection('phishing_results')
                .where('userId', '==', userId)
                .where('platform', '==', platform)
                .orderBy('createdAt', 'desc')
                .limit(limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
    } catch (error) {
        console.error('[MessageScan] Failed to query results:', error);
        return [];
    }
}

/**
 * Get stats for a user's scan results by platform
 * 
 * @param {string} userId - Firebase UID
 * @param {Platform} [platform] - Optional platform filter
 * @returns {Promise<Object>} Stats object
 */
export async function getStatsByPlatform(userId, platform = null) {
    const results = await getResultsByPlatform(userId, platform, 1000);

    return {
        total: results.length,
        high: results.filter(r => r.risk === 'HIGH').length,
        medium: results.filter(r => r.risk === 'MEDIUM').length,
        low: results.filter(r => r.risk === 'LOW').length
    };
}
