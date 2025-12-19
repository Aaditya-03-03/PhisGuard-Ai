// Firebase Authentication Middleware
// Verifies Firebase ID tokens from Authorization header

import { getFirebaseAuth } from '../config/firebase.js';

/**
 * Middleware to verify Firebase ID token
 * Extracts user info and attaches to request object
 * 
 * Expected header format: Authorization: Bearer <firebase_id_token>
 */
export async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header. Use: Bearer <token>'
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({
            success: false,
            error: 'No token provided'
        });
    }

    try {
        const auth = getFirebaseAuth();

        if (!auth) {
            // Development mode - allow with mock user
            console.warn('⚠️  Firebase Auth not configured. Using mock user for development.');
            req.user = {
                uid: 'dev-user-123',
                email: 'dev@example.com',
                name: 'Development User'
            };
            return next();
        }

        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || null,
            name: decodedToken.name || null,
            picture: decodedToken.picture || null,
            emailVerified: decodedToken.email_verified || false
        };

        next();
    } catch (error) {
        console.error('Firebase token verification failed:', error.message);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please sign in again.'
            });
        }

        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token format'
            });
        }

        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Useful for endpoints that work with or without authentication
 */
export async function optionalFirebaseAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    // If token is provided, verify it
    return verifyFirebaseToken(req, res, next);
}
