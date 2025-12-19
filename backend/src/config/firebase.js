// Firebase Admin SDK Configuration
// Initializes Firebase Admin for authentication and Firestore access

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let firestoreInstance = null;
let authInstance = null;
let firebaseInitialized = false;

/**
 * Check if Firebase is properly configured via environment variables
 */
export function isFirebaseConfigured() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    return !!(
        projectId &&
        clientEmail &&
        privateKey &&
        !projectId.includes('your-') &&
        !privateKey.includes('YOUR_PRIVATE_KEY')
    );
}

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for credentials
 * @returns {Object|null} Object containing db and auth, or null if not configured
 */
export function initializeFirebase() {
    if (firestoreInstance && authInstance) {
        return { db: firestoreInstance, auth: authInstance };
    }

    if (!isFirebaseConfigured()) {
        console.warn('⚠️  Firebase not configured. Running in development mode without database.');
        console.warn('   To enable Firebase, update the .env file with your credentials.');
        return null;
    }

    // Check if already initialized
    if (getApps().length > 0) {
        firestoreInstance = getFirestore();
        authInstance = getAuth();
        firebaseInitialized = true;
        return { db: firestoreInstance, auth: authInstance };
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    try {
        const serviceAccount = {
            projectId,
            clientEmail,
            privateKey,
        };

        initializeApp({
            credential: cert(serviceAccount),
        });

        firestoreInstance = getFirestore();
        // Enable ignoreUndefinedProperties to handle undefined values in documents
        firestoreInstance.settings({ ignoreUndefinedProperties: true });

        authInstance = getAuth();
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
        return { db: firestoreInstance, auth: authInstance };
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error);
        return null;
    }
}

/**
 * Get the Firestore instance
 * @returns {Firestore|null}
 */
export function getFirestoreDb() {
    if (!firestoreInstance && !firebaseInitialized) {
        const result = initializeFirebase();
        return result?.db || null;
    }
    return firestoreInstance;
}

/**
 * Get the Firebase Auth instance
 * @returns {Auth|null}
 */
export function getFirebaseAuth() {
    if (!authInstance && !firebaseInitialized) {
        const result = initializeFirebase();
        return result?.auth || null;
    }
    return authInstance;
}

/**
 * Check if Firebase is ready for use
 * @returns {boolean}
 */
export function isFirebaseReady() {
    return firestoreInstance !== null && authInstance !== null;
}
