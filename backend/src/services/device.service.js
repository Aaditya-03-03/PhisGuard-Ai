// ============================================
// ESP32 DEVICE SERVICE
// PhisGuard-AI - IoT Integration Layer
// ============================================
//
// RESPONSIBILITIES:
// - Pairing token generation and validation (5-min TTL, single-use)
// - Device registration with hashed secrets
// - Command processing with strict allowlist
// - Command logging for audit trail
//
// SECURITY:
// - Tokens are crypto-random and single-use
// - Device secrets are HMAC-SHA256 hashed before storage
// - Only allowlisted commands are accepted
// ============================================

import crypto from 'crypto';
import { getFirestoreDb } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { hashDeviceSecret, isDeviceOnline } from '../middlewares/deviceAuth.middleware.js';
import { fetchInboxEmails, parseGmailMessage } from './gmail.service.js';

// Firestore collections
const DEVICES_COLLECTION = 'devices';
const PAIRING_TOKENS_COLLECTION = 'pairing_tokens';
const DEVICE_LOGS_COLLECTION = 'device_logs';

// Pairing token TTL: 5 minutes (in milliseconds)
const PAIRING_TOKEN_TTL_MS = 5 * 60 * 1000;

// ============================================
// COMMAND ALLOWLIST
// SECURITY: Only these commands are accepted
// ============================================
const ALLOWED_COMMANDS = ['READ_MAIL', 'DELETE_MAIL', 'SENDER_INFO'];

/**
 * Validate if a command is in the allowlist
 * SECURITY: Prevents command injection attacks
 * 
 * @param {string} command - Command to validate
 * @returns {boolean} True if command is allowed
 */
export function isValidCommand(command) {
    return ALLOWED_COMMANDS.includes(command?.toUpperCase());
}

// ============================================
// PAIRING TOKEN MANAGEMENT
// ============================================

/**
 * Generate a cryptographically secure pairing token
 * 
 * TOKEN PROPERTIES:
 * - 32-byte random value (hex encoded = 64 chars)
 * - 5-minute TTL
 * - Single-use (deleted after successful registration)
 * 
 * @param {string} userId - Firebase UID of the requesting user
 * @returns {Promise<Object>} Token object with value and expiry
 */
export async function generatePairingToken(userId) {
    const db = getFirestoreDb();

    // Generate 32-byte crypto-random token
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = new Date(now + PAIRING_TOKEN_TTL_MS);

    const tokenData = {
        token: tokenValue,
        userId: userId,
        createdAt: db ? FieldValue.serverTimestamp() : new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        used: false  // SECURITY: Track if token has been used
    };

    if (!db) {
        // Development mode - return without storing
        console.log('[DEV MODE] Generated pairing token for user:', userId);
        return { token: tokenValue, expiresAt: expiresAt.toISOString() };
    }

    // Store token in Firestore
    await db.collection(PAIRING_TOKENS_COLLECTION).doc(tokenValue).set(tokenData);
    console.log(`✅ Pairing token generated for user: ${userId} (expires in 5 min)`);

    return { token: tokenValue, expiresAt: expiresAt.toISOString() };
}

/**
 * Validate and consume a pairing token
 * 
 * SECURITY CHECKS:
 * - Token exists in database
 * - Token has not expired
 * - Token has not been used before
 * 
 * @param {string} tokenValue - The pairing token to validate
 * @returns {Promise<Object|null>} Token data if valid, null otherwise
 */
export async function validatePairingToken(tokenValue) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode - accept any token
        console.warn('[DEV MODE] Skipping token validation');
        return { userId: 'dev-user-123', token: tokenValue };
    }

    const tokenDoc = await db.collection(PAIRING_TOKENS_COLLECTION).doc(tokenValue).get();

    if (!tokenDoc.exists) {
        console.warn('Pairing token not found:', tokenValue.substring(0, 8) + '...');
        return null;
    }

    const tokenData = tokenDoc.data();

    // SECURITY: Check if token has been used
    if (tokenData.used) {
        console.warn('Pairing token already used:', tokenValue.substring(0, 8) + '...');
        return null;
    }

    // SECURITY: Check if token has expired
    const expiresAt = new Date(tokenData.expiresAt);
    if (Date.now() > expiresAt.getTime()) {
        console.warn('Pairing token expired:', tokenValue.substring(0, 8) + '...');
        // Clean up expired token
        await db.collection(PAIRING_TOKENS_COLLECTION).doc(tokenValue).delete();
        return null;
    }

    // Mark token as used (before registration completes)
    await db.collection(PAIRING_TOKENS_COLLECTION).doc(tokenValue).update({
        used: true
    });

    return tokenData;
}

/**
 * Delete pairing token after successful device registration
 * 
 * @param {string} tokenValue - The token to delete
 */
export async function deletePairingToken(tokenValue) {
    const db = getFirestoreDb();
    if (!db) return;

    await db.collection(PAIRING_TOKENS_COLLECTION).doc(tokenValue).delete();
    console.log('✅ Pairing token deleted after successful registration');
}

// ============================================
// DEVICE REGISTRATION
// ============================================

/**
 * Register a new ESP32 device for a user
 * 
 * SECURITY:
 * - Device secret is HMAC-SHA256 hashed before storage
 * - Pairing token is consumed and deleted
 * 
 * @param {string} deviceId - Unique device identifier
 * @param {string} userId - Firebase UID of device owner
 * @param {string} deviceSecret - Plaintext secret from device
 * @param {string} deviceName - Optional friendly name
 * @returns {Promise<Object>} Registration result
 */
export async function registerDevice(deviceId, userId, deviceSecret, deviceName = 'ESP32 Device') {
    const db = getFirestoreDb();

    // SECURITY: Hash the device secret before storage
    const secretHash = hashDeviceSecret(deviceId, deviceSecret);

    const deviceData = {
        deviceId: deviceId,
        userId: userId,
        deviceName: deviceName,
        secretHash: secretHash,  // SECURITY: Only store hash, never plaintext
        status: 'online',
        lastSeen: db ? FieldValue.serverTimestamp() : new Date().toISOString(),
        createdAt: db ? FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (!db) {
        console.log('[DEV MODE] Registered device:', deviceId);
        return { success: true, deviceId, message: 'Device registered (dev mode)' };
    }

    // Check if device already exists
    const existingDevice = await db.collection(DEVICES_COLLECTION).doc(deviceId).get();
    if (existingDevice.exists) {
        // Update existing device (re-pairing)
        await db.collection(DEVICES_COLLECTION).doc(deviceId).update({
            userId: userId,
            secretHash: secretHash,
            deviceName: deviceName,
            status: 'online',
            lastSeen: FieldValue.serverTimestamp()
        });
        console.log(`✅ Device re-paired: ${deviceId}`);
        return { success: true, deviceId, message: 'Device re-paired successfully' };
    }

    // Create new device
    await db.collection(DEVICES_COLLECTION).doc(deviceId).set(deviceData);
    console.log(`✅ New device registered: ${deviceId} for user: ${userId}`);

    return { success: true, deviceId, message: 'Device registered successfully' };
}

/**
 * Get device status for a user
 * 
 * @param {string} userId - Firebase UID of device owner
 * @returns {Promise<Object>} Device status
 */
export async function getDeviceStatus(userId) {
    const db = getFirestoreDb();

    if (!db) {
        return { connected: false, status: 'unknown', lastSeen: null };
    }

    // Query for devices belonging to this user
    const devicesQuery = await db.collection(DEVICES_COLLECTION)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (devicesQuery.empty) {
        return { connected: false, status: 'not_registered', lastSeen: null };
    }

    const deviceData = devicesQuery.docs[0].data();
    const online = isDeviceOnline(deviceData);

    return {
        connected: true,
        deviceId: deviceData.deviceId,
        deviceName: deviceData.deviceName,
        status: online ? 'online' : 'offline',
        lastSeen: deviceData.lastSeen?.toDate?.()?.toISOString() || deviceData.lastSeen
    };
}

// ============================================
// COMMAND PROCESSING
// ============================================

/**
 * Process a voice command from ESP32 device
 * 
 * COMMAND MAPPING:
 * - READ_MAIL: Fetch and summarize latest email
 * - DELETE_MAIL: Move latest email to trash
 * - SENDER_INFO: Get sender details of latest email
 * 
 * @param {string} deviceId - Device identifier
 * @param {string} userId - Device owner's Firebase UID
 * @param {string} command - Voice command intent
 * @returns {Promise<Object>} Command result with text response
 */
export async function processDeviceCommand(deviceId, userId, command) {
    const normalizedCommand = command?.toUpperCase();

    // SECURITY: Validate command against allowlist
    if (!isValidCommand(normalizedCommand)) {
        await logDeviceCommand(deviceId, userId, command, false, 'Invalid command');
        return {
            success: false,
            response: 'Unknown command. Try: read mail, delete mail, or sender info.',
            error: 'INVALID_COMMAND'
        };
    }

    try {
        let response;

        switch (normalizedCommand) {
            case 'READ_MAIL':
                response = await handleReadMail(userId);
                break;

            case 'DELETE_MAIL':
                response = await handleDeleteMail(userId);
                break;

            case 'SENDER_INFO':
                response = await handleSenderInfo(userId);
                break;

            default:
                response = { success: false, text: 'Command not implemented' };
        }

        // Log successful command
        await logDeviceCommand(deviceId, userId, normalizedCommand, response.success, response.text);

        return {
            success: response.success,
            response: response.text,
            data: response.data
        };

    } catch (error) {
        console.error(`Command ${normalizedCommand} failed:`, error.message);
        await logDeviceCommand(deviceId, userId, normalizedCommand, false, error.message);

        return {
            success: false,
            response: 'Sorry, I could not complete that action. Please try again.',
            error: error.message
        };
    }
}

/**
 * Handle READ_MAIL command
 * Fetches and summarizes the latest email
 */
async function handleReadMail(userId) {
    const emails = await fetchInboxEmails(userId, 1);

    if (!emails || emails.length === 0) {
        return { success: true, text: 'You have no new emails.' };
    }

    const email = emails[0];
    const senderName = email.senderName || email.sender.split('@')[0];
    const subject = email.subject || 'No subject';

    // Create a short, speakable summary
    const text = `Latest email from ${senderName}. Subject: ${subject}.`;

    return {
        success: true,
        text: text,
        data: { emailId: email.gmailId, sender: email.sender, subject }
    };
}

/**
 * Handle DELETE_MAIL command
 * Moves the latest email to trash (reversible)
 */
async function handleDeleteMail(userId) {
    // Import trashEmail dynamically to avoid circular dependency
    const { trashEmail } = await import('./gmail.service.js');

    const emails = await fetchInboxEmails(userId, 1);

    if (!emails || emails.length === 0) {
        return { success: true, text: 'No emails to delete.' };
    }

    const email = emails[0];
    await trashEmail(userId, email.gmailId);

    return {
        success: true,
        text: `Email from ${email.senderName || email.sender} moved to trash.`,
        data: { emailId: email.gmailId, action: 'trashed' }
    };
}

/**
 * Handle SENDER_INFO command
 * Returns detailed sender information for latest email
 */
async function handleSenderInfo(userId) {
    const emails = await fetchInboxEmails(userId, 1);

    if (!emails || emails.length === 0) {
        return { success: true, text: 'No emails found.' };
    }

    const email = emails[0];
    const senderName = email.senderName || 'Unknown';
    const senderEmail = email.sender;
    const domain = senderEmail.split('@')[1] || 'unknown domain';

    const text = `Sender: ${senderName}. Email: ${senderEmail}. Domain: ${domain}.`;

    return {
        success: true,
        text: text,
        data: { senderName, senderEmail, domain }
    };
}

// ============================================
// COMMAND LOGGING
// ============================================

/**
 * Log a device command for audit trail
 * 
 * @param {string} deviceId - Device identifier
 * @param {string} userId - Device owner's Firebase UID
 * @param {string} command - Command that was executed
 * @param {boolean} success - Whether command succeeded
 * @param {string} response - Response text sent to device
 */
async function logDeviceCommand(deviceId, userId, command, success, response) {
    const db = getFirestoreDb();

    const logData = {
        deviceId: deviceId,
        userId: userId,
        command: command,
        success: success,
        response: response?.substring(0, 500),  // Limit response length
        timestamp: db ? FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (!db) {
        console.log('[DEV MODE] Command logged:', command, success ? '✅' : '❌');
        return;
    }

    await db.collection(DEVICE_LOGS_COLLECTION).add(logData);
}

/**
 * Get recent command logs for a device
 * 
 * @param {string} userId - Device owner's Firebase UID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of command log entries
 */
export async function getDeviceCommandLogs(userId, limit = 20) {
    const db = getFirestoreDb();

    if (!db) {
        return [];
    }

    const logsQuery = await db.collection(DEVICE_LOGS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

    return logsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    }));
}

// ============================================
// HEARTBEAT
// ============================================

/**
 * Update device heartbeat
 * Called by lightweight heartbeat endpoint
 * 
 * @param {string} deviceId - Device identifier
 * @returns {Promise<Object>} Heartbeat result
 */
export async function updateDeviceHeartbeat(deviceId) {
    const db = getFirestoreDb();

    if (!db) {
        return { success: true, timestamp: new Date().toISOString() };
    }

    await db.collection(DEVICES_COLLECTION).doc(deviceId).update({
        lastSeen: FieldValue.serverTimestamp(),
        status: 'online'
    });

    return { success: true, timestamp: new Date().toISOString() };
}
