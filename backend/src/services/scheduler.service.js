// Auto-Scan Scheduler Service
// Handles background email scanning using node-cron

import cron from 'node-cron';
import { getFirestoreDb } from '../config/firebase.js';
import { fetchInboxEmails, isGmailConnected } from './gmail.service.js';
import { analyzeEmail } from './phishing.service.js';
import { FieldValue } from 'firebase-admin/firestore';

const SCAN_RESULTS_COLLECTION = 'scanResults';
const USER_SETTINGS_COLLECTION = 'userSettings';

// Track active cron jobs
let schedulerJob = null;
let isRunning = false;

/**
 * Get user's auto-scan settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Auto-scan settings
 */
export async function getAutoScanSettings(userId) {
    const db = getFirestoreDb();

    const defaultSettings = {
        autoScanEnabled: true,
        autoScanInterval: 15, // minutes
        lastAutoScan: null
    };

    if (!db) {
        // Development mode - return defaults
        return defaultSettings;
    }

    try {
        const doc = await db.collection(USER_SETTINGS_COLLECTION).doc(userId).get();
        if (doc.exists) {
            return { ...defaultSettings, ...doc.data() };
        }
        return defaultSettings;
    } catch (error) {
        console.error('Failed to get auto-scan settings:', error);
        return defaultSettings;
    }
}

/**
 * Update user's auto-scan settings
 * @param {string} userId - User ID
 * @param {Object} settings - Settings to update
 */
export async function updateAutoScanSettings(userId, settings) {
    const db = getFirestoreDb();

    if (!db) {
        console.log('[DEV MODE] Would update auto-scan settings for:', userId);
        return true;
    }

    try {
        await db.collection(USER_SETTINGS_COLLECTION).doc(userId).set({
            ...settings,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Failed to update auto-scan settings:', error);
        return false;
    }
}

/**
 * Perform auto-scan for a specific user
 * @param {string} userId - User ID
 */
async function performAutoScan(userId) {
    try {
        // Check if Gmail is connected
        const connected = await isGmailConnected(userId);
        if (!connected) {
            console.log(`[Auto-Scan] User ${userId} - Gmail not connected, skipping`);
            return null;
        }

        // Fetch emails (limit to 500 for auto-scan)
        const emails = await fetchInboxEmails(userId, 500, 'in:inbox');

        if (emails.length === 0) {
            console.log(`[Auto-Scan] User ${userId} - No new emails found`);
            return null;
        }

        // Analyze each email
        const scanResults = emails.map(email => {
            const analysis = analyzeEmail(email);
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

        // Store emails prioritized by risk - HIGH risk ALWAYS stored
        const highRisk = scanResults.filter(r => r.riskLevel === 'HIGH');
        const mediumRisk = scanResults.filter(r => r.riskLevel === 'MEDIUM').slice(0, 100);
        const lowRisk = scanResults.filter(r => r.riskLevel === 'LOW').slice(0, 50);
        const resultsToStore = [...highRisk, ...mediumRisk, ...lowRisk];

        const scanRecord = {
            userId,
            scannedAt: new Date().toISOString(),
            emailCount: emails.length,
            summary,
            results: resultsToStore,
            isAutoScan: true
        };

        // Save to Firestore
        await saveScanResults(userId, scanRecord);

        // Update last auto-scan time
        await updateAutoScanSettings(userId, {
            lastAutoScan: new Date().toISOString()
        });

        console.log(`[Auto-Scan] User ${userId} - Scanned ${emails.length} emails: ${summary.high} high, ${summary.medium} medium, ${summary.low} low`);

        return scanRecord;
    } catch (error) {
        console.error(`[Auto-Scan] User ${userId} - Error:`, error.message);
        return null;
    }
}

/**
 * Save scan results to Firestore
 */
async function saveScanResults(userId, scanRecord) {
    const db = getFirestoreDb();

    if (!db) {
        console.log(`[DEV MODE] Would save auto-scan results for user: ${userId}`);
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
 * Get all users with auto-scan enabled
 */
async function getUsersWithAutoScan() {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode - return empty
        console.log('[DEV MODE] No users to auto-scan');
        return [];
    }

    try {
        const snapshot = await db.collection(USER_SETTINGS_COLLECTION)
            .where('autoScanEnabled', '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Failed to get users with auto-scan:', error);
        return [];
    }
}

/**
 * Run auto-scan for all eligible users
 */
async function runAutoScanJob() {
    if (isRunning) {
        console.log('[Auto-Scan] Previous job still running, skipping...');
        return;
    }

    isRunning = true;
    console.log('[Auto-Scan] Starting scheduled scan job...');

    try {
        const users = await getUsersWithAutoScan();
        console.log(`[Auto-Scan] Found ${users.length} users with auto-scan enabled`);

        for (const user of users) {
            await performAutoScan(user.userId);
            // Small delay between users to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('[Auto-Scan] Job completed successfully');
    } catch (error) {
        console.error('[Auto-Scan] Job failed:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Start the auto-scan scheduler
 * Runs every 15 minutes by default
 */
export function startScheduler() {
    if (schedulerJob) {
        console.log('[Scheduler] Already running');
        return;
    }

    // Run every 5 minutes (*/5 * * * *)
    schedulerJob = cron.schedule('*/5 * * * *', () => {
        runAutoScanJob();
    });

    console.log('✅ Auto-scan scheduler started (runs every 5 minutes)');

    // Also run immediately on start (with delay)
    setTimeout(() => {
        console.log('[Auto-Scan] Running initial scan...');
        runAutoScanJob();
    }, 10000); // 10 second delay after startup
}

/**
 * Stop the auto-scan scheduler
 */
export function stopScheduler() {
    if (schedulerJob) {
        schedulerJob.stop();
        schedulerJob = null;
        console.log('[Scheduler] Stopped');
    }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
    return {
        running: schedulerJob !== null,
        jobInProgress: isRunning
    };
}

/**
 * Manually trigger auto-scan for a user
 */
export async function triggerAutoScan(userId) {
    return await performAutoScan(userId);
}
