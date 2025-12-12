import crypto from 'crypto';

/**
 * Hash a message ID using SHA-256
 * Used to create a unique, irreversible identifier for emails
 */
export function hashMessageId(messageId: string): string {
    return crypto
        .createHash('sha256')
        .update(messageId)
        .digest('hex');
}

/**
 * Hash any string using SHA-256
 */
export function sha256(input: string): string {
    return crypto
        .createHash('sha256')
        .update(input)
        .digest('hex');
}

/**
 * Create a HMAC signature for verification
 */
export function createHmacSignature(data: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}

/**
 * Verify a HMAC signature
 */
export function verifyHmacSignature(
    data: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = createHmacSignature(data, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}
