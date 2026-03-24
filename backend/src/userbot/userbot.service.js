import { NewMessage } from 'telegram/events/index.js';
import { getFirestoreDb } from '../config/firebase.js';
import { scanMessage } from '../services/message-scan.service.js';
import crypto from 'crypto';

// States & Backpressure
const messageQueue = [];
let isProcessingQueue = false;
const MAX_QUEUE_SIZE = 50;
const RATE_LIMIT_MS = 1000; // 1 message per second

// Caches for deduplication
const processedMessageIds = new Set();
const recentAlertHashes = new Set();

// Memory cleanup (60s TTL)
setInterval(() => {
    processedMessageIds.clear();
    recentAlertHashes.clear();
}, 60 * 1000);

/**
 * Get userId from session mapped in Firestore telegram_userbot_sessions
 */
async function getUserIdBySession(sessionId) {
    if (!sessionId) return null;
    
    // Hash session to avoid storing raw session string as Document ID
    const sessionHash = crypto.createHash('sha256').update(sessionId).digest('hex');
    const db = getFirestoreDb();
    
    // Fallback or dev mode check (if DB unavailable)
    if (!db) {
        console.warn('[Userbot] Firestore not available. Cannot map session to user.');
        return null;
    }
    
    try {
        const doc = await db.collection('telegram_userbot_sessions').doc(sessionHash).get();
        if (doc.exists) {
            return doc.data().userId;
        }

        // AUTO-BINDING LOGIC FOR DEV / SINGLE TENANT
        console.warn('[Userbot] No userId mapped for session. Attempting auto-binding...');
        
        // Find the first active user from recent phishing results
        const recentScans = await db.collection('phishing_results').limit(1).get();
        if (!recentScans.empty) {
            const activeUserId = recentScans.docs[0].data().userId;
            
            if (activeUserId) {
                // Permanently bind this Telegram session to this User ID
                await db.collection('telegram_userbot_sessions').doc(sessionHash).set({
                    userId: activeUserId,
                    boundAt: new Date().toISOString()
                });
                
                console.log(`✅ [Userbot] Auto-bound Telegram Session to User: ${activeUserId}`);
                return activeUserId;
            }
        }
        
        console.warn('[Userbot] Auto-bind failed: No active users found in database.');
    } catch (e) {
        console.error('[Userbot] Failed to fetch session mapping:', e.message);
    }
    
    return null;
}

/**
 * Attaches the message listener to the authenticated GramJS client
 */
export function startUserbotListener(client, sessionId) {
    client.addEventHandler(async (event) => {
        try {
            const message = event.message;
            if (!message) return;

            // 1. Direction/Origin: Ignore outgoing
            if (message.out) return;

            // 2. Context: Ignore groups and channels
            if (message.isGroup || message.isChannel) return;

            // 3. Extraction: Extract true GramJS text field
            const text = message.message;

            // 4. Content Validation
            if (!text) return;
            if (text.trim().length === 0) return;
            if (text.length > 2000) return; // Prevent bloated payloads

            // 5. Deduplication: Check ID against 60s TTL cache
            if (processedMessageIds.has(message.id)) return;
            processedMessageIds.add(message.id);

            // 6. Queue Backpressure
            if (messageQueue.length >= MAX_QUEUE_SIZE) {
                console.warn('[Userbot] Dropped (queue full)');
                return;
            }

            // Enqueue message
            messageQueue.push({ text, sessionId });
            
            // Start queue processor if idle
            processQueue();

        } catch (error) {
            // NEVER crash the observer!
            console.error('[Userbot] Event handler error:', error.message);
        }
    }, new NewMessage({ incoming: true }));

    console.log('[Userbot] Listener attached and waiting for messages...');
}

/**
 * Process queue asynchronously matching 1 msg/sec rate limit
 */
async function processQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        const item = messageQueue.shift();
        try {
            await processSingleMessage(item.text, item.sessionId);
        } catch (error) {
            console.error('[Userbot] Processing error:', error.message);
        }
        
        // Backpressure Throttle (1 msg/sec limit)
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }
    
    isProcessingQueue = false;
}

/**
 * Route message payload to existing scanMessage engine
 */
async function processSingleMessage(text, sessionId) {
    // RESOLVE USER ID (Fail-Safe requirement)
    const userId = await getUserIdBySession(sessionId);
    if (!userId) {
        console.warn('[Userbot] Skipped (invalid): No userId mapped for active session.');
        return;
    }

    // Hash text to detect repeated identical payloads
    const textHash = crypto.createHash('sha256').update(text).digest('hex');

    // Deduplicate known High-Risk payloads within 60s TTL
    if (recentAlertHashes.has(textHash)) {
        console.log('[Userbot] Skipped (duplicate): Prevented redundant ESP32 alert for repeated HIGH-risk text.');
        return;
    }

    console.log(`[Userbot] Scanning incoming private message...`);

    // 7. Processing Payload
    const result = await scanMessage({
        platform: 'telegram',
        content: text,
        userId: userId
    });

    if (result && result.risk === 'HIGH') {
        recentAlertHashes.add(textHash);
        console.log(`[Userbot] Scan result: HIGH risk detected. Alert triggered.`);
    } else if (result) {
        console.log(`[Userbot] Scan result: ${result.risk} risk.`);
    }
}
