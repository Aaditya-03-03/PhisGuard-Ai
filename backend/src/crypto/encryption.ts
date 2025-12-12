import crypto from 'crypto';
import type { EncryptedField } from '../types/email.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment variable
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
    const keyHex = process.env.AES_ENCRYPTION_KEY;

    if (!keyHex) {
        throw new Error('AES_ENCRYPTION_KEY environment variable is not set');
    }

    if (keyHex.length !== 64) {
        throw new Error('AES_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns the ciphertext, IV, and authentication tag
 */
export function encrypt(plaintext: string): EncryptedField {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
        ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
}

/**
 * Decrypt a ciphertext using AES-256-GCM
 * Requires the IV and authentication tag from encryption
 */
export function decrypt(encryptedData: EncryptedField): string {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString('utf8');
}

/**
 * Encrypt an array of strings (e.g., URLs)
 */
export function encryptArray(items: string[]): EncryptedField {
    const jsonString = JSON.stringify(items);
    return encrypt(jsonString);
}

/**
 * Decrypt an encrypted array back to string array
 */
export function decryptArray(encryptedData: EncryptedField): string[] {
    const jsonString = decrypt(encryptedData);
    return JSON.parse(jsonString);
}

/**
 * Generate a new random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}
