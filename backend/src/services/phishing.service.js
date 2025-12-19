// Phishing Detection Service
// Rule-based phishing analysis for email content

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
 * @param {string[]} urls - Array of URLs to analyze
 * @returns {Object} { suspiciousUrls, score }
 */
function analyzeUrls(urls) {
    const suspiciousUrls = [];
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

        // Check for excessively long URLs
        if (url.length > 200) {
            isSuspicious = true;
        }

        // Check for multiple subdomains
        const subdomainCount = (url.match(/\./g) || []).length;
        if (subdomainCount > 4) {
            isSuspicious = true;
        }

        if (isSuspicious) {
            suspiciousUrls.push(url);
            suspicionCount++;
        }
    }

    const score = urls.length > 0
        ? Math.min(suspicionCount / urls.length, 1) * 100
        : 0;

    return { suspiciousUrls, score };
}

/**
 * Analyze email content for phishing keywords
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Object} { foundKeywords, score }
 */
function analyzeKeywords(subject, body) {
    const content = `${subject} ${body}`.toLowerCase();
    const foundKeywords = [];

    for (const keyword of PHISHING_KEYWORDS) {
        if (content.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
        }
    }

    const score = Math.min(foundKeywords.length * 10, 100);

    return { foundKeywords, score };
}

/**
 * Analyze sender for phishing indicators
 * @param {string} sender - Sender email address
 * @returns {Object} { isSuspicious, reason, score }
 */
function analyzeSender(sender) {
    const senderLower = sender.toLowerCase();
    let score = 0;
    let reason;

    // Check for display name spoofing
    for (const domain of COMMONLY_SPOOFED_DOMAINS) {
        if (senderLower.includes(domain)) {
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

    // Check for numbers in domain
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
 * @param {Object} email - Email object with subject, body, sender, urls
 * @returns {Object} Phishing analysis result
 */
export function analyzeEmail(email) {
    const urls = email.urls || [];
    const urlAnalysis = analyzeUrls(urls);
    const keywordAnalysis = analyzeKeywords(email.subject || '', email.body || '');
    const senderAnalysis = analyzeSender(email.sender || '');

    // Calculate weighted final score
    const weightedScore = (
        urlAnalysis.score * 0.35 +
        keywordAnalysis.score * 0.35 +
        senderAnalysis.score * 0.30
    );

    // Normalize to 0-1 range
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);

    // Determine risk level
    let riskLevel;
    if (normalizedScore >= 0.7) {
        riskLevel = 'HIGH';
    } else if (normalizedScore >= 0.4) {
        riskLevel = 'MEDIUM';
    } else {
        riskLevel = 'LOW';
    }

    // Compile all flags
    const flags = [];

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
 * @param {Object} email - Email object
 * @returns {boolean} True if email shows phishing signs
 */
export function quickPhishingCheck(email) {
    const content = `${email.subject || ''} ${email.body || ''}`.toLowerCase();

    const hasPhishingKeywords = PHISHING_KEYWORDS.some(keyword =>
        content.includes(keyword.toLowerCase())
    );

    const hasSuspiciousUrls = (email.urls || []).some(url => {
        const urlLower = url.toLowerCase();
        return SUSPICIOUS_TLDS.some(tld => urlLower.includes(tld)) ||
            /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
    });

    return hasPhishingKeywords || hasSuspiciousUrls;
}
