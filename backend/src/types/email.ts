// Email data types for the phishing detection system

export interface EmailInput {
    messageId: string;
    subject: string;
    sender: string;
    senderName?: string;
    body: string;
    htmlBody?: string;
    urls: string[];
    receivedAt: string;
}

export interface EncryptedField {
    ciphertext: string;
    iv: string;
    authTag: string;
}

export interface ProcessedEmail {
    hashedMessageId: string;
    encryptedSubject: EncryptedField;
    encryptedSender: EncryptedField;
    encryptedSenderName: EncryptedField;
    encryptedUrls: EncryptedField;
    phishingScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
    urlCount: number;
    receivedAt: string;
    processedAt: string;
    createdAt: FirebaseFirestore.Timestamp | Date;
}

export interface PhishingAnalysis {
    score: number;
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
    details: {
        urlAnalysis: {
            suspiciousUrls: string[];
            score: number;
        };
        keywordAnalysis: {
            foundKeywords: string[];
            score: number;
        };
        senderAnalysis: {
            isSuspicious: boolean;
            reason?: string;
            score: number;
        };
    };
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ProcessEmailResponse {
    hashedMessageId: string;
    phishingScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
}
