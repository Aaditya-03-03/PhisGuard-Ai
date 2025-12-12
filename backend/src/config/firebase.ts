import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;
let firebaseInitialized = false;

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
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
 */
export function initializeFirebase(): Firestore | null {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    if (!isFirebaseConfigured()) {
        console.warn('⚠️  Firebase not configured. Running in development mode without database.');
        console.warn('   To enable Firebase, update the .env file with your credentials.');
        return null;
    }

    // Check if already initialized
    if (getApps().length > 0) {
        firestoreInstance = getFirestore();
        firebaseInitialized = true;
        return firestoreInstance;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    try {
        const serviceAccount: ServiceAccount = {
            projectId: projectId!,
            clientEmail: clientEmail!,
            privateKey: privateKey!,
        };

        initializeApp({
            credential: cert(serviceAccount),
        });

        firestoreInstance = getFirestore();
        firebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');
        return firestoreInstance;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error);
        return null;
    }
}

/**
 * Get the Firestore instance
 * Returns null if Firebase is not configured
 */
export function getFirestoreDb(): Firestore | null {
    if (!firestoreInstance && !firebaseInitialized) {
        return initializeFirebase();
    }
    return firestoreInstance;
}

/**
 * Check if Firebase is ready for use
 */
export function isFirebaseReady(): boolean {
    return firestoreInstance !== null;
}
