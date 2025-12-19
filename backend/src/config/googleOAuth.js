// Google OAuth2 Configuration for Gmail API
// Handles OAuth client setup and token management

import { google } from 'googleapis';

// Gmail API scopes required for reading emails
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels'
];

/**
 * Create and configure OAuth2 client
 * @returns {OAuth2Client} Configured OAuth2 client
 */
export function createOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/gmail/callback';

    if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the OAuth2 authorization URL
 * @param {string} userId - User ID to include in state for callback
 * @returns {string} Authorization URL to redirect user to
 */
export function getAuthUrl(userId) {
    const oauth2Client = createOAuth2Client();

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required to get refresh_token
        scope: SCOPES,
        prompt: 'consent', // Force consent screen to ensure refresh_token is returned
        state: JSON.stringify({ userId }) // Pass userId through OAuth flow
    });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from callback
 * @returns {Promise<Object>} Token object containing access_token, refresh_token, expiry_date
 */
export async function exchangeCodeForTokens(code) {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Create an authenticated OAuth2 client with existing tokens
 * @param {Object} tokens - Token object with access_token, refresh_token, expiry_date
 * @returns {OAuth2Client} Authenticated OAuth2 client
 */
export function createAuthenticatedClient(tokens) {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
}

/**
 * Refresh the access token if expired
 * @param {OAuth2Client} oauth2Client - OAuth2 client with credentials set
 * @returns {Promise<Object|null>} New tokens if refreshed, null if not needed
 */
export async function refreshTokenIfNeeded(oauth2Client) {
    const credentials = oauth2Client.credentials;

    // Check if token is expired or about to expire (within 5 minutes)
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isExpired = credentials.expiry_date &&
        (credentials.expiry_date - Date.now()) < expiryBuffer;

    if (isExpired && credentials.refresh_token) {
        const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
        return newCredentials;
    }

    return null;
}

export { SCOPES };
