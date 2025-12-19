// Auth Routes
// Handles Gmail OAuth authentication flow

import { Router } from 'express';
import {
    connectGmail,
    handleCallback,
    checkGmailStatus,
    handleDisconnect
} from '../controllers/gmail.controller.js';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth.middleware.js';

const router = Router();

/**
 * GET /auth/gmail/connect
 * Initiates Gmail OAuth flow
 * Can pass userId as query param or use Firebase auth
 */
router.get('/gmail/connect', connectGmail);

/**
 * GET /auth/gmail/callback
 * Handles OAuth callback from Google
 * Exchanges code for tokens and stores them
 */
router.get('/gmail/callback', handleCallback);

/**
 * GET /auth/gmail/status
 * Check if Gmail is connected for the authenticated user
 * Requires: Firebase ID token
 */
router.get('/gmail/status', verifyFirebaseToken, checkGmailStatus);

/**
 * POST /auth/gmail/disconnect
 * Disconnect Gmail and remove stored tokens
 * Requires: Firebase ID token
 */
router.post('/gmail/disconnect', verifyFirebaseToken, handleDisconnect);

export default router;
