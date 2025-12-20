// Auto-Scan Routes
// Handles auto-scan settings and status

import express from 'express';
import { verifyFirebaseToken as authMiddleware } from '../middlewares/firebaseAuth.middleware.js';
import {
    getAutoScanSettings,
    updateAutoScanSettings,
    getSchedulerStatus,
    triggerAutoScan
} from '../services/scheduler.service.js';

const router = express.Router();

/**
 * @route GET /autoscan/status
 * @description Get scheduler status
 * @access Public
 */
router.get('/status', (req, res) => {
    const status = getSchedulerStatus();
    res.json({
        success: true,
        data: status
    });
});

/**
 * @route GET /autoscan/settings
 * @description Get user's auto-scan settings
 * @access Private
 */
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const settings = await getAutoScanSettings(userId);
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Failed to get auto-scan settings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route PUT /autoscan/settings
 * @description Update user's auto-scan settings
 * @access Private
 */
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { autoScanEnabled, autoScanInterval } = req.body;

        // Validate interval
        const validIntervals = [5, 15, 30, 60];
        if (autoScanInterval !== undefined && !validIntervals.includes(autoScanInterval)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid interval. Must be 5, 15, 30, or 60 minutes'
            });
        }

        const success = await updateAutoScanSettings(userId, {
            autoScanEnabled: autoScanEnabled ?? true,
            autoScanInterval: autoScanInterval ?? 15
        });

        if (success) {
            const updatedSettings = await getAutoScanSettings(userId);
            res.json({
                success: true,
                message: 'Auto-scan settings updated',
                data: updatedSettings
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update settings'
            });
        }
    } catch (error) {
        console.error('Failed to update auto-scan settings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route POST /autoscan/trigger
 * @description Manually trigger an auto-scan for the current user
 * @access Private
 */
router.post('/trigger', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        res.json({
            success: true,
            message: 'Auto-scan triggered. Results will be available shortly.'
        });

        // Trigger scan in background (don't await)
        triggerAutoScan(userId).catch(err => {
            console.error('Background auto-scan failed:', err);
        });
    } catch (error) {
        console.error('Failed to trigger auto-scan:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
