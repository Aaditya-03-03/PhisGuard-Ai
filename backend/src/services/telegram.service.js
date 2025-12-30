// ============================================
// TELEGRAM BOT SERVICE
// Handles Telegram Bot API integration
// ============================================
//
// RESPONSIBILITIES:
// - Linking code generation and validation
// - Chat-to-user mapping
// - Webhook request validation
// - Message processing

import crypto from 'crypto';
import { getFirestoreDb as getFirestore } from '../config/firebase.js';

// ============================================
// CONSTANTS
// ============================================

const LINKING_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LINKING_CODE_PREFIX = 'TG-';

// ============================================
// WEBHOOK SECURITY
// ============================================

/**
 * Validate Telegram webhook request secret
 * 
 * @param {string} headerSecret - Value from X-Telegram-Bot-Api-Secret-Token header
 * @returns {boolean} True if valid
 */
export function validateWebhookSecret(headerSecret) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // If no secret configured, reject in production
    if (!expectedSecret) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Telegram] TELEGRAM_WEBHOOK_SECRET not configured in production!');
            return false;
        }
        // Allow in development without secret
        console.warn('[Telegram] No webhook secret configured, allowing in development');
        return true;
    }

    if (!headerSecret) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSecret),
            Buffer.from(headerSecret)
        );
    } catch {
        return false;
    }
}

// ============================================
// LINKING CODE MANAGEMENT
// ============================================

/**
 * Generate a short-lived linking code for a user
 * 
 * @param {string} userId - Firebase UID
 * @returns {Promise<{code: string, expiresAt: Date}>} Linking code and expiry
 */
export async function generateLinkingCode(userId) {
    if (!userId) {
        throw new Error('userId is required');
    }

    const db = getFirestore();
    if (!db) {
        throw new Error('Firestore not available');
    }

    // Generate 4-digit random code
    const randomPart = crypto.randomInt(1000, 9999);
    const code = `${LINKING_CODE_PREFIX}${randomPart}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LINKING_CODE_TTL_MS);

    // Delete any existing codes for this user
    const existingCodes = await db.collection('telegram_linking_codes')
        .where('userId', '==', userId)
        .get();

    const batch = db.batch();
    existingCodes.docs.forEach(doc => batch.delete(doc.ref));

    // Create new code
    const codeRef = db.collection('telegram_linking_codes').doc(code);
    batch.set(codeRef, {
        userId,
        createdAt: now,
        expiresAt
    });

    await batch.commit();

    console.log(`[Telegram] Generated linking code ${code} for user ${userId}`);

    return { code, expiresAt };
}

/**
 * Validate and consume a linking code
 * Links the Telegram chat to the user account
 * 
 * @param {string} code - Linking code (e.g., "TG-1234")
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export async function validateLinkingCode(code, chatId) {
    if (!code || !chatId) {
        return { success: false, error: 'Code and chatId are required' };
    }

    const db = getFirestore();
    if (!db) {
        return { success: false, error: 'Database not available' };
    }

    // Normalize code
    const normalizedCode = code.toUpperCase().trim();

    try {
        const codeDoc = await db.collection('telegram_linking_codes').doc(normalizedCode).get();

        if (!codeDoc.exists) {
            console.log(`[Telegram] Invalid linking code: ${normalizedCode}`);
            return { success: false, error: 'Invalid or expired code' };
        }

        const codeData = codeDoc.data();
        const now = new Date();
        const expiresAt = codeData.expiresAt?.toDate() || new Date(0);

        // Check TTL strictly
        if (now > expiresAt) {
            console.log(`[Telegram] Expired linking code: ${normalizedCode}`);
            // Delete expired code
            await db.collection('telegram_linking_codes').doc(normalizedCode).delete();
            return { success: false, error: 'Code has expired' };
        }

        const userId = codeData.userId;

        // Check if this chat is already linked to a different user
        const existingLink = await db.collection('telegram_links').doc(String(chatId)).get();
        if (existingLink.exists && existingLink.data().userId !== userId) {
            return { success: false, error: 'This chat is already linked to another account' };
        }

        // Create the link and delete the code atomically
        const batch = db.batch();

        batch.set(db.collection('telegram_links').doc(String(chatId)), {
            userId,
            linkedAt: now
        });

        batch.delete(db.collection('telegram_linking_codes').doc(normalizedCode));

        await batch.commit();

        console.log(`[Telegram] Linked chat ${chatId} to user ${userId}`);

        return { success: true, userId };
    } catch (error) {
        console.error('[Telegram] Error validating linking code:', error);
        return { success: false, error: 'Internal error' };
    }
}

/**
 * Get the user ID linked to a Telegram chat
 * 
 * @param {string|number} chatId - Telegram chat ID
 * @returns {Promise<string|null>} User ID or null if not linked
 */
export async function getChatUserId(chatId) {
    if (!chatId) return null;

    const db = getFirestore();
    if (!db) return null;

    try {
        const linkDoc = await db.collection('telegram_links').doc(String(chatId)).get();

        if (!linkDoc.exists) {
            return null;
        }

        return linkDoc.data().userId;
    } catch (error) {
        console.error('[Telegram] Error getting chat user:', error);
        return null;
    }
}

/**
 * Check if a user has a linked Telegram chat
 * 
 * @param {string} userId - Firebase UID
 * @returns {Promise<{linked: boolean, chatId?: string}>}
 */
export async function getUserLinkStatus(userId) {
    if (!userId) {
        return { linked: false };
    }

    const db = getFirestore();
    if (!db) {
        return { linked: false };
    }

    try {
        const links = await db.collection('telegram_links')
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (links.empty) {
            return { linked: false };
        }

        const chatId = links.docs[0].id;
        return { linked: true, chatId };
    } catch (error) {
        console.error('[Telegram] Error checking link status:', error);
        return { linked: false };
    }
}

/**
 * Unlink a user's Telegram chat
 * 
 * @param {string} userId - Firebase UID
 * @returns {Promise<boolean>} True if unlinked successfully
 */
export async function unlinkUserChat(userId) {
    if (!userId) return false;

    const db = getFirestore();
    if (!db) return false;

    try {
        const links = await db.collection('telegram_links')
            .where('userId', '==', userId)
            .get();

        if (links.empty) {
            return true; // Already not linked
        }

        const batch = db.batch();
        links.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        console.log(`[Telegram] Unlinked chat for user ${userId}`);
        return true;
    } catch (error) {
        console.error('[Telegram] Error unlinking chat:', error);
        return false;
    }
}

// ============================================
// MESSAGE PROCESSING
// ============================================

/**
 * Parse a Telegram update object
 * 
 * @param {Object} update - Telegram update object
 * @returns {Object|null} Parsed message info or null
 */
export function parseTelegramUpdate(update) {
    if (!update) return null;

    // Handle regular messages
    const message = update.message || update.edited_message;
    if (!message) return null;

    const chat = message.chat;
    if (!chat) return null;

    // Extract text content
    const text = message.text || message.caption || '';

    return {
        chatId: chat.id,
        chatType: chat.type, // 'private', 'group', 'supergroup', 'channel'
        messageId: message.message_id,
        text,
        from: message.from,
        date: new Date(message.date * 1000)
    };
}

/**
 * Check if a message is a linking command
 * 
 * @param {string} text - Message text
 * @returns {{isCommand: boolean, code?: string}}
 */
export function parseLinkCommand(text) {
    if (!text) return { isCommand: false };

    const trimmed = text.trim();

    // Check for /link command
    const linkMatch = trimmed.match(/^\/link\s+(TG-\d{4})$/i);
    if (linkMatch) {
        return { isCommand: true, code: linkMatch[1].toUpperCase() };
    }

    return { isCommand: false };
}

/**
 * Send a message via Telegram Bot API
 * 
 * @param {string|number} chatId - Chat to send to
 * @param {string} text - Message text
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function sendTelegramMessage(chatId, text) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error('[Telegram] Bot token not configured');
        return false;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();
        if (!result.ok) {
            console.error('[Telegram] Failed to send message:', result.description);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[Telegram] Error sending message:', error);
        return false;
    }
}
