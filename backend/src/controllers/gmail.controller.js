// Gmail Controller
// Handles Gmail OAuth connect and callback endpoints

import { generateAuthUrl, handleOAuthCallback, isGmailConnected, disconnectGmail } from '../services/gmail.service.js';

/**
 * Initiate Gmail OAuth connection
 * GET /auth/gmail/connect
 */
export async function connectGmail(req, res) {
    try {
        // Get userId from query param or authenticated user
        const userId = req.query.userId || req.user?.uid;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required. Provide via query param or authenticate first.'
            });
        }

        // Generate OAuth URL and redirect
        const authUrl = generateAuthUrl(userId);

        // Redirect to Google OAuth consent screen
        res.redirect(authUrl);
    } catch (error) {
        console.error('Failed to initiate Gmail connection:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate Gmail connection'
        });
    }
}

/**
 * Handle Gmail OAuth callback
 * GET /auth/gmail/callback
 */
export async function handleCallback(req, res) {
    try {
        const { code, state, error } = req.query;

        // Check for OAuth errors
        if (error) {
            console.error('OAuth error:', error);
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect-gmail?error=${encodeURIComponent(error)}`
            );
        }

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code not provided'
            });
        }

        // Parse state to get userId
        let userId;
        try {
            const stateData = JSON.parse(state);
            userId = stateData.userId;
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid state parameter'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID not found in state'
            });
        }

        // Exchange code for tokens and store them
        const result = await handleOAuthCallback(code, userId);

        // Redirect back to frontend with success
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?gmail_connected=true`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Failed to handle Gmail callback:', error);

        // Redirect to frontend with error
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect-gmail?error=${encodeURIComponent(error.message)}`;
        res.redirect(redirectUrl);
    }
}

/**
 * Check Gmail connection status
 * GET /auth/gmail/status
 */
export async function checkGmailStatus(req, res) {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const connected = await isGmailConnected(userId);

        res.json({
            success: true,
            data: {
                connected,
                userId
            }
        });
    } catch (error) {
        console.error('Failed to check Gmail status:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to check Gmail status'
        });
    }
}

/**
 * Disconnect Gmail account
 * POST /auth/gmail/disconnect
 */
export async function handleDisconnect(req, res) {
    try {
        const userId = req.user?.uid;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        await disconnectGmail(userId);

        res.json({
            success: true,
            message: 'Gmail disconnected successfully'
        });
    } catch (error) {
        console.error('Failed to disconnect Gmail:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to disconnect Gmail'
        });
    }
}
