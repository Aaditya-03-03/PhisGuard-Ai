/**
 * PhishGuard API Service
 * Handles all communication with the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// Email types
export interface Email {
    id: string;
    subject: string;
    sender: string;
    senderName: string;
    urls: string[];
    phishingScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
    urlCount: number;
    receivedAt: string;
    processedAt: string;
}

export interface EmailStats {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                ...options?.headers,
            },
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
 * Fetch recent emails for dashboard
 */
export async function getEmails(limit: number = 20): Promise<Email[]> {
    const response = await fetchApi<Email[]>(`/api/emails?limit=${limit}`);
    return response.success ? response.data || [] : [];
}

/**
 * Fetch email statistics
 */
export async function getEmailStats(): Promise<EmailStats> {
    const response = await fetchApi<EmailStats>('/api/emails/stats');
    return response.success ? response.data || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 } : { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
}

/**
 * Fetch emails by risk level
 */
export async function getEmailsByRisk(level: 'low' | 'medium' | 'high', limit: number = 50): Promise<Email[]> {
    const response = await fetchApi<Email[]>(`/api/emails/risk/${level}?limit=${limit}`);
    return response.success ? response.data || [] : [];
}

/**
 * Analyze an email without storing
 */
export async function analyzeEmail(email: {
    subject?: string;
    body?: string;
    sender?: string;
    urls?: string[];
}): Promise<{ score: number; riskLevel: string; flags: string[] } | null> {
    const response = await fetchApi<{ score: number; riskLevel: string; flags: string[] }>('/api/analyze-email', {
        method: 'POST',
        body: JSON.stringify(email),
    });
    return response.success ? response.data || null : null;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}
