// Gmail Service
// Handles Gmail API interactions, token storage, and email fetching

import { google } from 'googleapis';
import { getFirestoreDb } from '../config/firebase.js';
import {
    createOAuth2Client,
    getAuthUrl,
    exchangeCodeForTokens,
    createAuthenticatedClient,
    refreshTokenIfNeeded
} from '../config/googleOAuth.js';
import { FieldValue } from 'firebase-admin/firestore';

const TOKENS_COLLECTION = 'gmailTokens';

// In-memory token storage for development mode
const devTokenStorage = new Map();

/**
 * Generate Gmail OAuth authorization URL
 * @param {string} userId - User's Firebase UID
 * @returns {string} Authorization URL
 */
export function generateAuthUrl(userId) {
    return getAuthUrl(userId);
}

/**
 * Handle OAuth callback and store tokens
 * @param {string} code - Authorization code from Google
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object>} Stored token info
 */
export async function handleOAuthCallback(code, userId) {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens in Firestore
    await saveUserTokens(userId, tokens);

    return {
        success: true,
        message: 'Gmail connected successfully',
        hasRefreshToken: !!tokens.refresh_token
    };
}

/**
 * Save user's Gmail tokens to Firestore
 * @param {string} userId - User's Firebase UID
 * @param {Object} tokens - Token object from Google
 */
export async function saveUserTokens(userId, tokens) {
    const db = getFirestoreDb();

    const tokenData = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        updatedAt: db ? FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (!db) {
        // Development mode
        devTokenStorage.set(userId, tokenData);
        console.log(`[DEV MODE] Saved Gmail tokens for user: ${userId}`);
        return;
    }

    await db.collection(TOKENS_COLLECTION).doc(userId).set(tokenData, { merge: true });
    console.log(`✅ Gmail tokens saved for user: ${userId}`);
}

/**
 * Get user's stored Gmail tokens
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object|null>} Token object or null if not found
 */
export async function getUserTokens(userId) {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        return devTokenStorage.get(userId) || null;
    }

    const doc = await db.collection(TOKENS_COLLECTION).doc(userId).get();

    if (!doc.exists) {
        return null;
    }

    return doc.data();
}

/**
 * Check if user has connected Gmail
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<boolean>}
 */
export async function isGmailConnected(userId) {
    const tokens = await getUserTokens(userId);
    return tokens !== null && !!tokens.accessToken;
}

/**
 * Get authenticated Gmail API client for a user
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object>} Gmail API client
 */
export async function getGmailClient(userId) {
    const storedTokens = await getUserTokens(userId);

    if (!storedTokens) {
        throw new Error('Gmail not connected. Please connect your Gmail account first.');
    }

    // Reconstruct token object
    const tokens = {
        access_token: storedTokens.accessToken,
        refresh_token: storedTokens.refreshToken,
        expiry_date: storedTokens.expiryDate,
        token_type: storedTokens.tokenType,
        scope: storedTokens.scope
    };

    const oauth2Client = createAuthenticatedClient(tokens);

    // Check and refresh token if needed
    const newTokens = await refreshTokenIfNeeded(oauth2Client);
    if (newTokens) {
        // Save the refreshed tokens
        await saveUserTokens(userId, newTokens);
        oauth2Client.setCredentials(newTokens);
    }

    return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Fetch emails from user's inbox
 * @param {string} userId - User's Firebase UID
 * @param {number} maxResults - Maximum number of emails to fetch (default: 10)
 * @param {string} query - Gmail search query (default: inbox emails)
 * @returns {Promise<Array>} Array of parsed email objects
 */
export async function fetchInboxEmails(userId, maxResults = 10, query = 'in:inbox') {
    const gmail = await getGmailClient(userId);

    // Get list of messages
    const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
        return [];
    }

    // Fetch full message details for each
    const emailPromises = messages.map(async (msg) => {
        const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
        });
        return parseGmailMessage(fullMessage.data);
    });

    return Promise.all(emailPromises);
}

/**
 * Parse Gmail message into a standardized format
 * @param {Object} message - Raw Gmail message object
 * @returns {Object} Parsed email object
 */
export function parseGmailMessage(message) {
    const headers = message.payload?.headers || [];

    // Extract headers
    const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
    };

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    const date = getHeader('Date');
    const messageId = getHeader('Message-ID') || message.id;

    // Extract sender name and email
    const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from];
    const senderName = senderMatch[1]?.replace(/"/g, '').trim() || '';
    const senderEmail = senderMatch[2]?.trim() || from;

    // Extract body
    const { textBody, htmlBody } = extractBody(message.payload);

    // Extract URLs from body
    const urls = extractUrls(textBody + ' ' + htmlBody);

    return {
        messageId,
        gmailId: message.id,
        threadId: message.threadId,
        subject,
        sender: senderEmail,
        senderName,
        to,
        body: textBody,
        htmlBody,
        urls,
        receivedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        snippet: message.snippet || '',
        labelIds: message.labelIds || []
    };
}

/**
 * Extract plain text and HTML body from message payload
 * @param {Object} payload - Gmail message payload
 * @returns {Object} { textBody, htmlBody }
 */
function extractBody(payload) {
    let textBody = '';
    let htmlBody = '';

    if (!payload) {
        return { textBody, htmlBody };
    }

    // Check for simple body
    if (payload.body?.data) {
        const decoded = decodeBase64Url(payload.body.data);
        if (payload.mimeType === 'text/plain') {
            textBody = decoded;
        } else if (payload.mimeType === 'text/html') {
            htmlBody = decoded;
        }
    }

    // Check for multipart content
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                textBody = decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/html' && part.body?.data) {
                htmlBody = decodeBase64Url(part.body.data);
            } else if (part.parts) {
                // Nested multipart
                const nested = extractBody(part);
                if (!textBody) textBody = nested.textBody;
                if (!htmlBody) htmlBody = nested.htmlBody;
            }
        }
    }

    // If only HTML, strip tags for text version
    if (!textBody && htmlBody) {
        textBody = htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return { textBody, htmlBody };
}

/**
 * Decode base64url encoded string
 * @param {string} data - Base64url encoded string
 * @returns {string} Decoded string
 */
function decodeBase64Url(data) {
    try {
        // Replace URL-safe characters
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
        console.error('Failed to decode base64:', error.message);
        return '';
    }
}

/**
 * Extract URLs from text content
 * @param {string} text - Text content to search
 * @returns {string[]} Array of unique URLs
 */
function extractUrls(text) {
    if (!text) return [];

    // Regex to match URLs
    const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
    const matches = text.match(urlRegex) || [];

    // Clean and deduplicate
    const uniqueUrls = [...new Set(
        matches.map(url => url.replace(/[.,;:!?)}\]]+$/, '')) // Remove trailing punctuation
    )];

    return uniqueUrls;
}

/**
 * Disconnect Gmail (remove stored tokens)
 * @param {string} userId - User's Firebase UID
 */
export async function disconnectGmail(userId) {
    const db = getFirestoreDb();

    if (!db) {
        devTokenStorage.delete(userId);
        console.log(`[DEV MODE] Removed Gmail tokens for user: ${userId}`);
        return;
    }

    await db.collection(TOKENS_COLLECTION).doc(userId).delete();
    console.log(`✅ Gmail disconnected for user: ${userId}`);
}
