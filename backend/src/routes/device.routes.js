// ============================================
// ESP32 DEVICE ROUTES
// PhisGuard-AI - IoT Integration Layer
// ============================================
//
// ENDPOINTS:
// POST /api/device/pair     - Generate pairing token (user auth)
// POST /api/device/register - Complete device pairing (device auth)
// POST /api/device/command  - Process voice commands (device auth)
// POST /api/device/heartbeat - Lightweight status ping (device auth)
// GET  /api/device/status   - Get device status (user auth)
// GET  /api/device/logs     - Get command history (user auth)
//
// RATE LIMITING:
// - /command: 30 req/min (prevents command flooding)
// - /heartbeat: 60 req/min (allows frequent pings)
// - /register: 5 req/15min (prevents brute force)
// ============================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';
import { verifyDeviceAuth } from '../middlewares/deviceAuth.middleware.js';
import {
    generatePairingToken,
    validatePairingToken,
    deletePairingToken,
    registerDevice,
    getDeviceStatus,
    processDeviceCommand,
    updateDeviceHeartbeat,
    getDeviceCommandLogs,
    isValidCommand
} from '../services/device.service.js';

const router = Router();

// ============================================
// RATE LIMITERS
// Prevents abuse and DoS attacks
// ============================================

// Command rate limiter: 30 requests per minute
const commandLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        error: 'Too many commands. Please wait before sending more.',
        retryAfter: 60
    }
});

// Heartbeat rate limiter: 60 requests per minute
const heartbeatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        error: 'Too many heartbeats.',
        retryAfter: 60
    }
});

// Registration rate limiter: 5 attempts per 15 minutes
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many registration attempts. Please wait 15 minutes.',
        retryAfter: 900
    }
});

// ============================================
// USER-AUTHENTICATED ENDPOINTS
// Requires Firebase ID token
// ============================================

/**
 * POST /api/device/pair
 * Generate a one-time pairing token for device registration
 * 
 * Auth: Firebase ID token required
 * Returns: { token, expiresAt }
 * 
 * TOKEN PROPERTIES:
 * - 64 character hex string
 * - 5 minute TTL
 * - Single use (deleted after registration)
 */
router.post('/pair', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const { token, expiresAt } = await generatePairingToken(userId);

        res.json({
            success: true,
            data: {
                token: token,
                expiresAt: expiresAt,
                message: 'Enter this token on your ESP32 device within 5 minutes.'
            }
        });
    } catch (error) {
        console.error('Failed to generate pairing token:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate pairing token'
        });
    }
});

/**
 * GET /api/device/status
 * Get the current status of user's registered device
 * 
 * Auth: Firebase ID token required
 * Returns: { connected, status, lastSeen, deviceName }
 */
router.get('/status', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const status = await getDeviceStatus(userId);

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Failed to get device status:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get device status'
        });
    }
});

/**
 * GET /api/device/logs
 * Get recent command history for user's device
 * 
 * Auth: Firebase ID token required
 * Query: ?limit=20 (default)
 * Returns: Array of command log entries
 */
router.get('/logs', verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const logs = await getDeviceCommandLogs(userId, limit);

        res.json({
            success: true,
            data: {
                count: logs.length,
                logs: logs
            }
        });
    } catch (error) {
        console.error('Failed to get command logs:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get command logs'
        });
    }
});

// ============================================
// DEVICE-AUTHENTICATED ENDPOINTS
// Requires X-Device-Id and X-Device-Secret headers
// ============================================

/**
 * POST /api/device/register
 * Complete device registration using pairing token
 * 
 * Auth: X-Device-Id and X-Device-Secret headers
 * Body: { pairingToken, deviceName? }
 * 
 * SECURITY:
 * - Validates pairing token is not expired/used
 * - Hashes device secret before storage
 * - Deletes pairing token after success (hardened with try/finally)
 * - Prevents device re-registration to different users
 */
router.post('/register', registerLimiter, async (req, res) => {
    // Track pairing token for guaranteed deletion
    let pairingTokenToDelete = null;

    try {
        // REFINEMENT 1: Normalize headers for ESP32 compatibility
        // Accepts both lowercase and proper-case header names
        const deviceId = req.headers['x-device-id'] || req.headers['X-Device-Id'];
        const deviceSecret = req.headers['x-device-secret'] || req.headers['X-Device-Secret'];
        const { pairingToken, deviceName } = req.body;

        // Validate required fields
        if (!deviceId || !deviceSecret) {
            return res.status(401).json({
                success: false,
                error: 'Missing X-Device-Id or X-Device-Secret headers'
            });
        }

        if (!pairingToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing pairingToken in request body'
            });
        }

        // Validate pairing token
        const tokenData = await validatePairingToken(pairingToken);

        if (!tokenData) {
            return res.status(403).json({
                success: false,
                error: 'Invalid, expired, or already used pairing token'
            });
        }

        // Mark token for deletion (will be deleted in finally block)
        pairingTokenToDelete = pairingToken;

        // REFINEMENT 3: Prevent device re-registration to different users
        // SECURITY RATIONALE: A device should only be bound to one user at a time.
        // Allowing re-registration could enable device hijacking attacks where an
        // attacker with physical access registers someone else's device to their account.
        const { getFirestoreDb } = await import('../config/firebase.js');
        const db = getFirestoreDb();

        if (db) {
            const existingDevice = await db.collection('devices').doc(deviceId).get();
            if (existingDevice.exists) {
                const existingData = existingDevice.data();
                // Only reject if device belongs to a DIFFERENT user
                if (existingData.userId && existingData.userId !== tokenData.userId) {
                    return res.status(409).json({
                        success: false,
                        error: 'Device already registered to another user. Contact support to transfer ownership.'
                    });
                }
            }
        }

        // Register the device
        const result = await registerDevice(
            deviceId,
            tokenData.userId,
            deviceSecret,
            deviceName
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Device registration failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Device registration failed'
        });
    } finally {
        // REFINEMENT 2: Hardened token deletion
        // Always attempt to delete pairing token, even if registration fails
        // This prevents token reuse in edge cases
        if (pairingTokenToDelete) {
            try {
                await deletePairingToken(pairingTokenToDelete);
            } catch (deleteError) {
                // Log but don't fail - token will expire naturally if deletion fails
                console.warn('Warning: Failed to delete pairing token:', deleteError.message);
            }
        }
    }
});

/**
 * POST /api/device/command
 * Process a voice command from ESP32 device
 * 
 * Auth: Device authentication via middleware
 * Body: { command, timestamp? }
 * 
 * ALLOWED COMMANDS:
 * - READ_MAIL: Read latest email
 * - DELETE_MAIL: Move latest email to trash
 * - SENDER_INFO: Get sender details
 * 
 * SECURITY: Commands not in allowlist are rejected
 */
router.post('/command', commandLimiter, verifyDeviceAuth, async (req, res) => {
    try {
        const { command, timestamp } = req.body;
        const { deviceId, userId } = req.device;

        // Validate command is provided
        if (!command) {
            return res.status(400).json({
                success: false,
                error: 'Missing command in request body'
            });
        }

        // SECURITY: Validate command against allowlist
        if (!isValidCommand(command)) {
            return res.status(400).json({
                success: false,
                error: `Invalid command: ${command}. Allowed: READ_MAIL, DELETE_MAIL, SENDER_INFO`
            });
        }

        // Process the command
        const result = await processDeviceCommand(deviceId, userId, command);

        res.json({
            success: result.success,
            data: {
                response: result.response,
                command: command.toUpperCase(),
                timestamp: new Date().toISOString(),
                ...result.data
            }
        });
    } catch (error) {
        console.error('Command processing failed:', error.message);

        // Handle Gmail rate limiting
        if (error.code === 429 || error.message?.includes('rate limit')) {
            return res.status(429).json({
                success: false,
                error: 'Service temporarily unavailable. Try again later.',
                retryAfter: 60
            });
        }

        res.status(500).json({
            success: false,
            error: 'Command processing failed'
        });
    }
});

/**
 * POST /api/device/heartbeat
 * Lightweight endpoint to update device online status
 * 
 * Auth: Device authentication via middleware
 * Body: (none required)
 * 
 * PERFORMANCE:
 * - No Gmail API calls
 * - Only updates lastSeen timestamp
 * - Optimized for ESP32 RTOS constraints
 */
router.post('/heartbeat', heartbeatLimiter, verifyDeviceAuth, async (req, res) => {
    try {
        const { deviceId } = req.device;

        const result = await updateDeviceHeartbeat(deviceId);

        res.json({
            success: true,
            data: {
                timestamp: result.timestamp
            }
        });
    } catch (error) {
        console.error('Heartbeat update failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Heartbeat update failed'
        });
    }
});

export default router;
