import type { EmailInput, PhishingAnalysis } from '../types/email.js';

// Suspicious keywords commonly found in phishing emails
const PHISHING_KEYWORDS = [
    'urgent', 'immediately', 'verify', 'confirm', 'account',
    'suspended', 'locked', 'password', 'security', 'alert',
    'unauthorized', 'click here', 'act now', 'expire', 'limited time',
    'winner', 'congratulations', 'prize', 'lottery', 'inheritance',
    'bank', 'transfer', 'wire', 'million', 'dollars',
    'update your', 'confirm your', 'verify your', 'validate',
    'unusual activity', 'suspicious activity', 'compromised',
    'free', 'gift', 'offer', 'deal', 'discount',
    'social security', 'tax refund', 'irs', 'government'
];

// Suspicious TLDs often used in phishing
const SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.club', '.work', '.click', '.link', '.info',
    '.loan', '.online', '.site', '.website', '.space', '.win',
    '.bid', '.stream', '.download', '.gq', '.ml', '.cf', '.tk', '.ga'
];

// Legitimate domains that are often spoofed
const COMMONLY_SPOOFED_DOMAINS = [
    'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
    'netflix', 'bank', 'chase', 'wellsfargo', 'citibank', 'usps',
    'fedex', 'ups', 'dhl', 'irs', 'gov', 'dropbox', 'linkedin'
];

/**
 * Analyze URLs for phishing indicators
 */
function analyzeUrls(urls: string[]): { suspiciousUrls: string[]; score: number } {
    const suspiciousUrls: string[] = [];
    let suspicionCount = 0;

    for (const url of urls) {
        const urlLower = url.toLowerCase();
        let isSuspicious = false;

        // Check for IP addresses in URL
        if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
            isSuspicious = true;
        }

        // Check for suspicious TLDs
        for (const tld of SUSPICIOUS_TLDS) {
            if (urlLower.includes(tld)) {
                isSuspicious = true;
                break;
            }
        }

        // Check for spoofed domains (typosquatting)
        for (const domain of COMMONLY_SPOOFED_DOMAINS) {
            // Look for misspellings or similar domains
            if (urlLower.includes(domain) && !urlLower.includes(`${domain}.com`)) {
                // Might be a fake domain like paypa1.com, amaz0n.com
                if (/[0-9]/.test(urlLower.split(domain)[0]?.slice(-1) || '') ||
                    /[0-9]/.test(urlLower.split(domain)[1]?.slice(0, 1) || '')) {
                    isSuspicious = true;
                }
            }
        }

        // Check for suspicious patterns
        if (urlLower.includes('login') && urlLower.includes('secure')) {
            isSuspicious = true;
        }

        // Check for excessively long URLs (often used to hide malicious parts)
        if (url.length > 200) {
            isSuspicious = true;
        }

        // Check for multiple subdomains (common in phishing)
        const subdomainCount = (url.match(/\./g) || []).length;
        if (subdomainCount > 4) {
            isSuspicious = true;
        }

        if (isSuspicious) {
            suspiciousUrls.push(url);
            suspicionCount++;
        }
    }

    // Calculate score based on suspicious URL ratio
    const score = urls.length > 0
        ? Math.min(suspicionCount / urls.length, 1) * 100
        : 0;

    return { suspiciousUrls, score };
}

/**
 * Analyze email content for phishing keywords
 */
function analyzeKeywords(subject: string, body: string): { foundKeywords: string[]; score: number } {
    const content = `${subject} ${body}`.toLowerCase();
    const foundKeywords: string[] = [];

    for (const keyword of PHISHING_KEYWORDS) {
        if (content.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
        }
    }

    // Score based on keyword density
    const score = Math.min(foundKeywords.length * 10, 100);

    return { foundKeywords, score };
}

/**
 * Analyze sender for phishing indicators
 */
function analyzeSender(sender: string): { isSuspicious: boolean; reason?: string; score: number } {
    const senderLower = sender.toLowerCase();
    let score = 0;
    let reason: string | undefined;

    // Check for display name spoofing (common names in malicious emails)
    for (const domain of COMMONLY_SPOOFED_DOMAINS) {
        if (senderLower.includes(domain)) {
            // Check if the domain doesn't match the claimed sender
            if (!senderLower.includes(`@${domain}.com`) &&
                !senderLower.includes(`@${domain}.org`)) {
                score = 70;
                reason = `Sender claims to be from ${domain} but email domain doesn't match`;
                break;
            }
        }
    }

    // Check for suspicious email patterns
    if (/^[a-z0-9]{10,}@/.test(senderLower)) {
        score = Math.max(score, 40);
        reason = reason || 'Sender has suspicious random-looking email address';
    }

    // Check for numbers in domain that might indicate typosquatting
    const domain = senderLower.split('@')[1] || '';
    if (/\d/.test(domain.split('.')[0] || '')) {
        score = Math.max(score, 60);
        reason = reason || 'Domain contains suspicious numbers';
    }

    return {
        isSuspicious: score > 30,
        reason,
        score
    };
}

/**
 * Main phishing detection function
 * Analyzes email content and returns a comprehensive phishing assessment
 */
export function analyzeEmail(email: EmailInput): PhishingAnalysis {
    const urlAnalysis = analyzeUrls(email.urls);
    const keywordAnalysis = analyzeKeywords(email.subject, email.body);
    const senderAnalysis = analyzeSender(email.sender);

    // Calculate weighted final score
    const weightedScore = (
        urlAnalysis.score * 0.35 +
        keywordAnalysis.score * 0.35 +
        senderAnalysis.score * 0.30
    );

    // Normalize to 0-1 range
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (normalizedScore >= 0.7) {
        riskLevel = 'high';
    } else if (normalizedScore >= 0.4) {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    // Compile all flags
    const flags: string[] = [];

    if (urlAnalysis.suspiciousUrls.length > 0) {
        flags.push(`${urlAnalysis.suspiciousUrls.length} suspicious URL(s) detected`);
    }

    if (keywordAnalysis.foundKeywords.length > 0) {
        flags.push(`Phishing keywords found: ${keywordAnalysis.foundKeywords.slice(0, 5).join(', ')}`);
    }

    if (senderAnalysis.isSuspicious && senderAnalysis.reason) {
        flags.push(senderAnalysis.reason);
    }

    return {
        score: normalizedScore,
        riskLevel,
        flags,
        details: {
            urlAnalysis,
            keywordAnalysis,
            senderAnalysis
        }
    };
}

/**
 * Quick check if email needs detailed analysis
 */
export function quickPhishingCheck(email: EmailInput): boolean {
    const content = `${email.subject} ${email.body}`.toLowerCase();

    // Quick keyword check
    const hasPhishingKeywords = PHISHING_KEYWORDS.some(keyword =>
        content.includes(keyword.toLowerCase())
    );

    // Quick URL check
    const hasSuspiciousUrls = email.urls.some(url => {
        const urlLower = url.toLowerCase();
        return SUSPICIOUS_TLDS.some(tld => urlLower.includes(tld)) ||
            /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
    });

    return hasPhishingKeywords || hasSuspiciousUrls;
}
