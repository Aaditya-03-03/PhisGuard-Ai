/**
 * PhishGuard API Service
 * Handles all communication with the backend API using Firebase Auth tokens
 */

import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================
// Types
// ============================================

export interface Email {
    id: string;
    messageId?: string;
    gmailId?: string;
    subject: string;
    sender: string;
    senderName: string;
    snippet?: string;
    urls?: string[];
    phishingScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';
    flags: string[];
    urlCount: number;
    receivedAt: string;
    processedAt?: string;
}

export interface EmailStats {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
}

export interface ScanResult {
    scannedCount: number;
    scannedAt: string;
    summary: {
        total: number;
        high: number;
        medium: number;
        low: number;
    };
    results: Email[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get Firebase ID token for authenticated requests
 */
async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch (error) {
        console.error('Failed to get ID token:', error);
        return null;
    }
}

/**
 * Make authenticated API request with Bearer token
 */
async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const token = await getIdToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

/**
 * Make public API request (no auth required)
 */
async function fetchPublic<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

// ============================================
// Gmail OAuth API
// ============================================

/**
 * Get Gmail OAuth connect URL
 * @param userId - Firebase user ID
 */
export function getGmailConnectUrl(userId: string): string {
    return `${API_URL}/auth/gmail/connect?userId=${encodeURIComponent(userId)}`;
}

/**
 * Check if Gmail is connected for the current user
 */
export async function checkGmailStatus(): Promise<{ connected: boolean; userId?: string }> {
    const response = await fetchWithAuth<{ connected: boolean; userId: string }>('/auth/gmail/status');
    if (response.success && response.data) {
        return response.data;
    }
    return { connected: false };
}

/**
 * Disconnect Gmail for the current user
 */
export async function disconnectGmail(): Promise<boolean> {
    const response = await fetchWithAuth<void>('/auth/gmail/disconnect', {
        method: 'POST',
    });
    return response.success;
}

// ============================================
// Scan API
// ============================================

/**
 * Scan inbox for phishing emails
 */
export async function scanInbox(maxEmails: number = 100): Promise<ScanResult | null> {
    const response = await fetchWithAuth<ScanResult>('/scan/inbox', {
        method: 'POST',
        body: JSON.stringify({ maxEmails }),
    });

    if (response.success && response.data) {
        return response.data;
    }

    // Handle specific error codes
    if (response.code === 'GMAIL_NOT_CONNECTED') {
        throw new Error('Gmail not connected. Please connect your Gmail account first.');
    }
    if (response.code === 'GMAIL_TOKEN_EXPIRED') {
        throw new Error('Gmail access expired. Please reconnect your Gmail account.');
    }

    throw new Error(response.error || 'Failed to scan inbox');
}

/**
 * Get latest scan results
 */
export async function getLatestScan(): Promise<ScanResult | null> {
    const response = await fetchWithAuth<ScanResult>('/scan/latest');
    return response.success ? response.data || null : null;
}

/**
 * Get scan history
 */
export async function getScanHistory(limit: number = 10): Promise<ScanResult[]> {
    const response = await fetchWithAuth<ScanResult[]>(`/scan/history?limit=${limit}`);
    return response.success ? response.data || [] : [];
}

// ============================================
// Email API
// ============================================

/**
 * Fetch emails from Gmail
 */
export async function getGmailEmails(limit: number = 20): Promise<Email[]> {
    const response = await fetchWithAuth<{ count: number; emails: Email[] }>(`/gmail/emails?limit=${limit}`);
    return response.success && response.data ? response.data.emails : [];
}

/**
 * Fetch email statistics from latest scan
 */
export async function getEmailStats(): Promise<EmailStats> {
    const defaultStats = { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };

    const latestScan = await getLatestScan();
    if (latestScan && latestScan.summary) {
        return {
            total: latestScan.summary.total,
            highRisk: latestScan.summary.high,
            mediumRisk: latestScan.summary.medium,
            lowRisk: latestScan.summary.low,
        };
    }

    return defaultStats;
}

/**
 * Get emails from latest scan results
 */
export async function getEmails(limit: number = 20): Promise<Email[]> {
    const latestScan = await getLatestScan();
    if (latestScan && latestScan.results) {
        return latestScan.results.slice(0, limit);
    }
    return [];
}

/**
 * Get emails filtered by risk level from latest scan
 */
export async function getEmailsByRisk(level: 'low' | 'medium' | 'high', limit: number = 50): Promise<Email[]> {
    const latestScan = await getLatestScan();
    if (latestScan && latestScan.results) {
        return latestScan.results
            .filter(email => email.riskLevel.toLowerCase() === level)
            .slice(0, limit);
    }
    return [];
}

// ============================================
// Health Check
// ============================================

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    const response = await fetchPublic<{ status: string }>('/health');
    return response.success && response.data?.status === 'healthy';
}

