import { getFirestoreDb, isFirebaseReady } from '../config/firebase.js';
import type { ProcessedEmail } from '../types/email.js';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'emails';

// In-memory storage for development mode (when Firebase is not configured)
const inMemoryStorage: Map<string, ProcessedEmail & { id: string }> = new Map();

/**
 * Save a processed email to Firestore (or in-memory storage in dev mode)
 */
export async function saveProcessedEmail(email: ProcessedEmail): Promise<string> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode: use in-memory storage
        const id = `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        inMemoryStorage.set(id, { ...email, id });
        console.log(`[DEV MODE] Saved email to in-memory storage: ${id}`);
        return id;
    }

    const docRef = await db.collection(COLLECTION_NAME).add({
        ...email,
        createdAt: FieldValue.serverTimestamp()
    });

    return docRef.id;
}

/**
 * Check if an email with the given hashed message ID already exists
 */
export async function emailExists(hashedMessageId: string): Promise<boolean> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode: check in-memory storage
        for (const email of inMemoryStorage.values()) {
            if (email.hashedMessageId === hashedMessageId) {
                return true;
            }
        }
        return false;
    }

    const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('hashedMessageId', '==', hashedMessageId)
        .limit(1)
        .get();

    return !snapshot.empty;
}

/**
 * Get email by hashed message ID
 */
export async function getEmailByHashedId(hashedMessageId: string): Promise<ProcessedEmail | null> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        for (const email of inMemoryStorage.values()) {
            if (email.hashedMessageId === hashedMessageId) {
                return email;
            }
        }
        return null;
    }

    const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('hashedMessageId', '==', hashedMessageId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as ProcessedEmail;
}

/**
 * Get recent emails with pagination
 */
export async function getRecentEmails(
    limit: number = 20,
    startAfter?: string
): Promise<ProcessedEmail[]> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        const emails = Array.from(inMemoryStorage.values())
            .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
            .slice(0, limit);
        return emails;
    }

    let query = db
        .collection(COLLECTION_NAME)
        .orderBy('processedAt', 'desc')
        .limit(limit);

    if (startAfter) {
        const startDoc = await db.collection(COLLECTION_NAME).doc(startAfter).get();
        if (startDoc.exists) {
            query = query.startAfter(startDoc);
        }
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessedEmail));
}

/**
 * Get emails by risk level
 */
export async function getEmailsByRiskLevel(
    riskLevel: 'low' | 'medium' | 'high',
    limit: number = 50
): Promise<ProcessedEmail[]> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        return Array.from(inMemoryStorage.values())
            .filter(email => email.riskLevel === riskLevel)
            .slice(0, limit);
    }

    const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('riskLevel', '==', riskLevel)
        .orderBy('processedAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcessedEmail));
}

/**
 * Get email statistics
 */
export async function getEmailStats(): Promise<{
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
}> {
    const db = getFirestoreDb();

    if (!db) {
        // Development mode
        const emails = Array.from(inMemoryStorage.values());
        return {
            total: emails.length,
            highRisk: emails.filter(e => e.riskLevel === 'high').length,
            mediumRisk: emails.filter(e => e.riskLevel === 'medium').length,
            lowRisk: emails.filter(e => e.riskLevel === 'low').length
        };
    }

    const collection = db.collection(COLLECTION_NAME);

    const [totalSnap, highSnap, mediumSnap, lowSnap] = await Promise.all([
        collection.count().get(),
        collection.where('riskLevel', '==', 'high').count().get(),
        collection.where('riskLevel', '==', 'medium').count().get(),
        collection.where('riskLevel', '==', 'low').count().get()
    ]);

    return {
        total: totalSnap.data().count,
        highRisk: highSnap.data().count,
        mediumRisk: mediumSnap.data().count,
        lowRisk: lowSnap.data().count
    };
}

/**
 * Delete an email by document ID
 */
export async function deleteEmail(docId: string): Promise<void> {
    const db = getFirestoreDb();

    if (!db) {
        inMemoryStorage.delete(docId);
        return;
    }

    await db.collection(COLLECTION_NAME).doc(docId).delete();
}

/**
 * Get all emails from in-memory storage (dev mode only)
 */
export function getInMemoryEmails(): ProcessedEmail[] {
    return Array.from(inMemoryStorage.values());
}
