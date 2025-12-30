// ============================================
// ESP32 DEVICE AUTHENTICATION MIDDLEWARE
// PhisGuard-AI - IoT Integration Layer
// ============================================
// 
// SECURITY FEATURES:
// - HMAC-SHA256 device secret validation
// - Timing-safe comparison (prevents timing attacks)
// - Automatic lastSeen update for heartbeat tracking
// - Separate from Firebase user authentication
//
// USAGE:
// Devices authenticate via headers:
//   X-Device-Id: <device_id>
//   X-Device-Secret: <shared_secret>
// ============================================

import crypto from 'crypto';
import { getFirestoreDb } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const DEVICES_COLLECTION = 'devices';

// Online threshold: device is "offline" if lastSeen > 2 minutes ago
export const DEVICE_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

// ============================================
// HMAC UTILITIES (Inline to avoid TS import issues)
// ============================================

/**
 * Create HMAC-SHA256 signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} Hex-encoded HMAC
 */
function createHmacSignature(data, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}

/**
 * Verify HMAC signature with timing-safe comparison
 * SECURITY: Prevents timing attacks
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} True if valid
 */
function verifyHmacSignature(data, signature, secret) {
    const expectedSignature = createHmacSignature(data, secret);
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
}

// ============================================
// HEADER NORMALIZATION
// ESP32 may send headers in different cases
// ============================================

/**
 * Normalize device headers for ESP32 compatibility
 * Accepts both lowercase and proper-case header names:
 *   - x-device-id OR X-Device-Id
 *   - x-device-secret OR X-Device-Secret
 * 
 * SECURITY: Only these exact header names are accepted
 * 
 * @param {Object} headers - Request headers object
 * @returns {Object} Normalized { deviceId, deviceSecret }
 */
function normalizeDeviceHeaders(headers) {
    // Express normalizes headers to lowercase, but check both for safety
    const deviceId = headers['x-device-id'] || headers['X-Device-Id'] || null;
    const deviceSecret = headers['x-device-secret'] || headers['X-Device-Secret'] || null;

    return { deviceId, deviceSecret };
}

/**
 * Device Authentication Middleware
 * Validates ESP32 device credentials via headers
 * 
 * SECURITY: Uses HMAC-SHA256 with timing-safe comparison
 * to prevent device spoofing and timing attacks
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {Function} next - Express next function
 */
export async function verifyDeviceAuth(req, res, next) {
    // REFINEMENT: Normalize headers for ESP32 compatibility
    const { deviceId, deviceSecret } = normalizeDeviceHeaders(req.headers);

    // Validate required headers
    if (!deviceId || !deviceSecret) {
        return res.status(401).json({
            success: false,
            error: 'Missing device credentials. Include X-Device-Id and X-Device-Secret headers.'
        });
    }

    try {
        const db = getFirestoreDb();

        if (!db) {
            // REFINEMENT: Development bypass is ONLY allowed in development environment
            // In production/staging, missing Firestore config is a critical error
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️  [DEV ONLY] Firebase not configured. Using mock device.');
                req.device = {
                    deviceId: deviceId,
                    userId: 'dev-user-123',
                    status: 'online'
                };
                return next();
            } else {
                // Non-development environment: Firestore is required
                console.error('❌ Firebase not configured in non-development environment');
                return res.status(500).json({
                    success: false,
                    error: 'Server configuration error'
                });
            }
        }

        // Fetch device document from Firestore
        const deviceDoc = await db.collection(DEVICES_COLLECTION).doc(deviceId).get();

        if (!deviceDoc.exists) {
            return res.status(403).json({
                success: false,
                error: 'Device not registered'
            });
        }

        const deviceData = deviceDoc.data();

        // SECURITY: Verify device secret using HMAC-SHA256
        // The stored secretHash is HMAC(deviceId, DEVICE_API_SECRET)
        // We verify by computing HMAC(deviceId, provided_secret) and comparing
        const expectedHash = deviceData.secretHash;
        const serverSecret = process.env.DEVICE_API_SECRET;

        if (!serverSecret) {
            console.error('DEVICE_API_SECRET environment variable not set');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // SECURITY: Timing-safe comparison prevents timing attacks
        const isValidSecret = verifyHmacSignature(deviceId, expectedHash, deviceSecret);

        if (!isValidSecret) {
            return res.status(403).json({
                success: false,
                error: 'Invalid device credentials'
            });
        }

        // Update lastSeen timestamp for heartbeat tracking
        await db.collection(DEVICES_COLLECTION).doc(deviceId).update({
            lastSeen: FieldValue.serverTimestamp(),
            status: 'online'
        });

        // Attach device info to request object
        req.device = {
            deviceId: deviceData.deviceId,
            userId: deviceData.userId,
            deviceName: deviceData.deviceName || 'ESP32 Device',
            status: 'online'
        };

        next();
    } catch (error) {
        console.error('Device authentication failed:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Device authentication failed'
        });
    }
}

/**
 * Check if a device is currently online
 * Based on lastSeen timestamp vs threshold
 * 
 * @param {Object} deviceData - Device document data
 * @returns {boolean} True if device is online
 */
export function isDeviceOnline(deviceData) {
    if (!deviceData?.lastSeen) {
        return false;
    }

    const lastSeenTime = deviceData.lastSeen.toDate?.() || new Date(deviceData.lastSeen);
    const timeSinceLastSeen = Date.now() - lastSeenTime.getTime();

    return timeSinceLastSeen < DEVICE_ONLINE_THRESHOLD_MS;
}

/**
 * Generate a hashed device secret for storage
 * SECURITY: Never store plaintext secrets
 * 
 * @param {string} deviceId - Device identifier
 * @param {string} secret - Plaintext secret from device
 * @returns {string} HMAC-SHA256 hash for storage
 */
export function hashDeviceSecret(deviceId, secret) {
    return createHmacSignature(deviceId, secret);
}
