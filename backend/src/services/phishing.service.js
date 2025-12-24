// PhishGuard AI - Phishing Detection Service v2.0
// Enhanced rule-based phishing analysis for email content
// Preserves all existing logic while adding advanced detection capabilities

// ============================================
// EXISTING KEYWORDS (PRESERVED)
// ============================================
const PHISHING_KEYWORDS_LEGACY = [
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

// ============================================
// ENHANCED KEYWORD INTELLIGENCE (100+ KEYWORDS)
// Categorized for better detection and explanation
// ============================================

const KEYWORD_CATEGORIES = {
    // Category A: URGENCY & PRESSURE
    urgency: {
        keywords: [
            'urgent', 'immediately', 'act now', 'final notice', 'last chance',
            'expires today', 'respond now', 'do not ignore', 'warning',
            'account will be closed', 'action required', 'time sensitive',
            'within 24 hours', 'within 48 hours', 'deadline', 'asap',
            'right away', 'don\'t delay', 'limited time', 'hurry',
            'before it\'s too late', 'must act', 'immediate action'
        ],
        weight: 1.2,
        description: 'Urgent language creating pressure'
    },

    // Category B: ACCOUNT & SECURITY THREATS
    accountThreats: {
        keywords: [
            'account suspended', 'account locked', 'unusual activity',
            'unauthorized access', 'security alert', 'verify identity',
            'confirm account', 'restore access', 'account compromised',
            'account disabled', 'account restricted', 'login attempt',
            'suspicious login', 'account verification', 'identity verification',
            'account closure', 'account termination', 'access denied',
            'security breach', 'data breach', 'account frozen'
        ],
        weight: 1.3,
        description: 'Account security threat language'
    },

    // Category C: CREDENTIAL THEFT
    credentialTheft: {
        keywords: [
            'password', 'otp', 'verification code', 'reset password',
            'security code', '2fa', 'authentication required', 'pin',
            'login credentials', 'username', 'secret code', 'access code',
            'temporary password', 'one-time password', 'security question',
            'confirm password', 'update password', 'change password',
            'enter credentials', 'sign in details'
        ],
        weight: 1.4,
        description: 'Attempt to steal credentials'
    },

    // Category D: FINANCIAL & BANKING
    financial: {
        keywords: [
            'bank alert', 'payment failed', 'refund pending', 'credit card',
            'debit card', 'billing issue', 'upi blocked', 'transaction blocked',
            'tax refund', 'wire transfer', 'money transfer', 'bank account',
            'payment declined', 'invoice attached', 'outstanding balance',
            'overdue payment', 'payment confirmation', 'transaction failed',
            'fund transfer', 'account balance', 'financial statement',
            'credit limit', 'loan approved', 'investment opportunity'
        ],
        weight: 1.3,
        description: 'Financial/banking related threat'
    },

    // Category E: SOCIAL ENGINEERING
    socialEngineering: {
        keywords: [
            'official notice', 'customer support', 'service team',
            'security department', 'fraud prevention', 'technical support',
            'help desk', 'it department', 'account team', 'billing department',
            'verification team', 'security team', 'compliance team',
            'from the desk of', 'on behalf of', 'authorized representative'
        ],
        weight: 1.1,
        description: 'Social engineering tactics'
    },

    // Category F: REWARDS & SCAMS
    rewardsScams: {
        keywords: [
            'winner', 'congratulations', 'prize', 'lottery', 'inheritance',
            'claim reward', 'bonus credited', 'you have won', 'lucky winner',
            'cash prize', 'free money', 'gift card', 'reward points',
            'exclusive offer', 'special promotion', 'selected winner',
            'jackpot', 'sweepstakes', 'unclaimed funds', 'beneficiary'
        ],
        weight: 1.5,
        description: 'Reward/lottery scam indicators'
    },

    // Category G: GOVERNMENT & LEGAL
    governmentLegal: {
        keywords: [
            'income tax', 'irs', 'gst', 'legal action', 'aadhaar update',
            'pan suspended', 'kyc pending', 'government notice', 'court order',
            'legal notice', 'tax department', 'revenue service', 'customs',
            'immigration', 'social security', 'medicare', 'penalty notice',
            'compliance required', 'regulatory action', 'audit notice'
        ],
        weight: 1.4,
        description: 'Fake government/legal notice'
    },

    // Category H: DELIVERY & BRAND IMPERSONATION
    deliveryBrand: {
        keywords: [
            'package delivery', 'shipment delayed', 'fedex', 'dhl', 'ups',
            'usps', 'india post', 'delivery failed', 'parcel pending',
            'tracking number', 'customs clearance', 'delivery attempt',
            'shipping confirmation', 'order confirmation', 'dispatch notice',
            'return to sender', 'address verification', 'delivery charge'
        ],
        weight: 1.2,
        description: 'Delivery/shipping scam'
    }
};

// Flatten all keywords for quick lookup (includes legacy + new)
const ALL_PHISHING_KEYWORDS = [
    ...PHISHING_KEYWORDS_LEGACY,
    ...Object.values(KEYWORD_CATEGORIES).flatMap(cat => cat.keywords)
];
// Remove duplicates
const UNIQUE_KEYWORDS = [...new Set(ALL_PHISHING_KEYWORDS.map(k => k.toLowerCase()))];

// ============================================
// EXISTING SUSPICIOUS TLDS (PRESERVED)
// ============================================
const SUSPICIOUS_TLDS = [
    '.xyz', '.top', '.club', '.work', '.click', '.link', '.info',
    '.loan', '.online', '.site', '.website', '.space', '.win',
    '.bid', '.stream', '.download', '.gq', '.ml', '.cf', '.tk', '.ga'
];

// ============================================
// NEW: URL SHORTENERS TO DETECT
// ============================================
const URL_SHORTENERS = [
    'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'rb.gy', 'shorturl.at',
    'goo.gl', 'ow.ly', 'buff.ly', 'adf.ly', 'tiny.cc', 'short.io',
    'cutt.ly', 'rebrand.ly', 'bl.ink', 'soo.gd', 'v.gd', 'clck.ru'
];

// ============================================
// NEW: REDIRECT/OBFUSCATION PATTERNS
// ============================================
const REDIRECT_PATTERNS = [
    '?url=', 'redirect=', 'next=', 'goto=', 'return=', 'returnurl=',
    'redirecturl=', 'destination=', 'target=', 'link=', 'go=', 'out='
];

// ============================================
// EXISTING COMMONLY SPOOFED DOMAINS (PRESERVED + ENHANCED)
// ============================================
const COMMONLY_SPOOFED_DOMAINS = [
    'paypal', 'amazon', 'apple', 'microsoft', 'google', 'facebook',
    'netflix', 'bank', 'chase', 'wellsfargo', 'citibank', 'usps',
    'fedex', 'ups', 'dhl', 'irs', 'gov', 'dropbox', 'linkedin',
    // New additions
    'instagram', 'twitter', 'whatsapp', 'telegram', 'spotify',
    'adobe', 'zoom', 'slack', 'salesforce', 'shopify', 'stripe',
    'coinbase', 'binance', 'steam', 'epic', 'playstation', 'xbox',
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'paytm', 'phonepe', 'gpay'
];

// Official domains for brand verification
const OFFICIAL_DOMAINS = {
    'paypal': ['paypal.com', 'paypal.me'],
    'amazon': ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de'],
    'apple': ['apple.com', 'icloud.com'],
    'microsoft': ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com'],
    'google': ['google.com', 'gmail.com', 'googlemail.com'],
    'facebook': ['facebook.com', 'fb.com', 'meta.com'],
    'netflix': ['netflix.com'],
    'instagram': ['instagram.com'],
    'twitter': ['twitter.com', 'x.com'],
    'linkedin': ['linkedin.com'],
    'dropbox': ['dropbox.com'],
    'spotify': ['spotify.com'],
    'adobe': ['adobe.com'],
    'zoom': ['zoom.us'],
    'slack': ['slack.com']
};

// ============================================
// CRITICAL KEYWORD COMBINATIONS
// ============================================
const CRITICAL_COMBINATIONS = [
    { triggers: ['verify', 'account'], bonus: 30 },
    { triggers: ['confirm', 'account'], bonus: 30 },
    { triggers: ['update', 'account'], bonus: 30 },
    { triggers: ['verify', 'password'], bonus: 30 },
    { triggers: ['confirm', 'password'], bonus: 30 },
    { triggers: ['update', 'password'], bonus: 30 },
    { triggers: ['verify', 'payment'], bonus: 30 },
    { triggers: ['confirm', 'payment'], bonus: 30 },
    { triggers: ['urgent', 'login'], bonus: 30 },
    { triggers: ['immediately', 'login'], bonus: 30 },
    { triggers: ['urgent', 'action required'], bonus: 30 },
    { triggers: ['immediately', 'action required'], bonus: 30 },
    { triggers: ['security alert', 'click'], bonus: 30 },
    { triggers: ['unusual activity', 'click'], bonus: 30 },
    { triggers: ['security alert', 'link'], bonus: 30 },
    { triggers: ['unusual activity', 'link'], bonus: 30 },
    { triggers: ['suspended', 'verify'], bonus: 25 },
    { triggers: ['locked', 'confirm'], bonus: 25 },
    { triggers: ['expire', 'immediately'], bonus: 25 }
];

// ============================================
// ENHANCED URL ANALYSIS
// ============================================
function analyzeUrls(urls, riskReasons) {
    const suspiciousUrls = [];
    let totalScore = 0;

    for (const url of urls) {
        const urlLower = url.toLowerCase();
        let urlScore = 0;

        // EXISTING: Check for IP addresses in URL
        if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
            urlScore += 50;
            riskReasons.push('URL contains IP address instead of domain name');
        }

        // EXISTING: Check for suspicious TLDs
        for (const tld of SUSPICIOUS_TLDS) {
            if (urlLower.endsWith(tld) || urlLower.includes(tld + '/')) {
                urlScore += 30;
                riskReasons.push(`Suspicious top-level domain detected: ${tld}`);
                break;
            }
        }

        // EXISTING: Check for spoofed domains (typosquatting)
        for (const domain of COMMONLY_SPOOFED_DOMAINS) {
            if (urlLower.includes(domain) && !urlLower.includes(`${domain}.com`)) {
                if (/[0-9]/.test(urlLower.split(domain)[0]?.slice(-1) || '') ||
                    /[0-9]/.test(urlLower.split(domain)[1]?.slice(0, 1) || '')) {
                    urlScore += 60;
                    riskReasons.push(`Possible typosquatting of ${domain} detected`);
                }
            }
        }

        // EXISTING: Check for suspicious patterns
        if (urlLower.includes('login') && urlLower.includes('secure')) {
            urlScore += 25;
            riskReasons.push('URL contains suspicious login + secure pattern');
        }

        // EXISTING: Check for excessively long URLs
        if (url.length > 200) {
            urlScore += 20;
            riskReasons.push('Excessively long URL detected (possible obfuscation)');
        }

        // EXISTING: Check for multiple subdomains
        const subdomainCount = (url.match(/\./g) || []).length;
        if (subdomainCount > 4) {
            urlScore += 25;
            riskReasons.push('URL has too many subdomains');
        }

        // NEW: URL Shortener Detection (+40 points)
        for (const shortener of URL_SHORTENERS) {
            if (urlLower.includes(shortener)) {
                urlScore += 40;
                riskReasons.push(`URL shortener detected: ${shortener}`);
                break;
            }
        }

        // NEW: HTTPS Security Mismatch (+25 points)
        const securityKeywords = ['login', 'secure', 'verify', 'account', 'password', 'signin'];
        const hasSecurityKeyword = securityKeywords.some(kw => urlLower.includes(kw));
        if (hasSecurityKeyword && !urlLower.startsWith('https://')) {
            urlScore += 25;
            riskReasons.push('Sensitive action URL not using HTTPS');
        }

        // NEW: Redirect/Obfuscation Patterns (+20 points)
        for (const pattern of REDIRECT_PATTERNS) {
            if (urlLower.includes(pattern)) {
                urlScore += 20;
                riskReasons.push(`URL contains redirect parameter: ${pattern}`);
                break;
            }
        }

        // NEW: Encoded characters in URL
        if (/%[0-9A-Fa-f]{2}/.test(url) && url.split('%').length > 4) {
            urlScore += 15;
            riskReasons.push('URL contains excessive encoded characters');
        }

        // NEW: @ symbol in URL (credential injection attempt)
        if (urlLower.includes('@') && urlLower.includes('http')) {
            urlScore += 35;
            riskReasons.push('URL contains @ symbol (possible credential injection)');
        }

        if (urlScore > 0) {
            suspiciousUrls.push(url);
        }
        totalScore += urlScore;
    }

    // Calculate average score and clamp to 0-100
    const finalScore = urls.length > 0
        ? Math.min(Math.max(totalScore / Math.max(urls.length, 1), 0), 100)
        : 0;

    return { suspiciousUrls, score: finalScore };
}

// ============================================
// ENHANCED KEYWORD ANALYSIS
// ============================================
function analyzeKeywords(subject, body, riskReasons) {
    const content = `${subject || ''} ${body || ''}`.toLowerCase();
    const foundKeywords = [];
    const matchedCategories = new Set();
    let totalScore = 0;

    // Check each category
    for (const [categoryName, category] of Object.entries(KEYWORD_CATEGORIES)) {
        for (const keyword of category.keywords) {
            if (content.includes(keyword.toLowerCase())) {
                foundKeywords.push(keyword);
                matchedCategories.add(categoryName);
                // Base score: +8 points per keyword (with category weight)
                totalScore += 8 * category.weight;
            }
        }
    }

    // Also check legacy keywords not in categories
    for (const keyword of PHISHING_KEYWORDS_LEGACY) {
        if (content.includes(keyword.toLowerCase()) && !foundKeywords.includes(keyword)) {
            foundKeywords.push(keyword);
            totalScore += 8;
        }
    }

    // Multi-category bonus: +20 if keywords from 2+ categories
    if (matchedCategories.size >= 2) {
        totalScore += 20;
        riskReasons.push(`Phishing indicators from ${matchedCategories.size} different categories`);
    }

    // Check for critical combinations (+30 bonus each)
    for (const combo of CRITICAL_COMBINATIONS) {
        const allTriggersFound = combo.triggers.every(trigger =>
            content.includes(trigger.toLowerCase())
        );
        if (allTriggersFound) {
            totalScore += combo.bonus;
            riskReasons.push(`Critical keyword combination detected: "${combo.triggers.join('" + "')}"`);
        }
    }

    // Add specific risk reasons for matched categories
    for (const categoryName of matchedCategories) {
        const category = KEYWORD_CATEGORIES[categoryName];
        riskReasons.push(category.description);
    }

    // Add general keyword warning
    if (foundKeywords.length > 0 && foundKeywords.length <= 5) {
        riskReasons.push(`Phishing keywords found: ${foundKeywords.slice(0, 5).join(', ')}`);
    } else if (foundKeywords.length > 5) {
        riskReasons.push(`Multiple phishing keywords detected (${foundKeywords.length} total)`);
    }

    // Clamp score to 0-100
    const finalScore = Math.min(Math.max(totalScore, 0), 100);

    return { foundKeywords, score: finalScore, matchedCategories: Array.from(matchedCategories) };
}

// ============================================
// ENHANCED SENDER ANALYSIS
// ============================================
function analyzeSender(sender, riskReasons) {
    const senderLower = (sender || '').toLowerCase();
    let score = 0;
    let reason;

    // Extract display name and email parts
    const displayNameMatch = senderLower.match(/^(.+?)\s*<(.+?)>$/);
    const displayName = displayNameMatch ? displayNameMatch[1].trim() : '';
    const emailPart = displayNameMatch ? displayNameMatch[2].trim() : senderLower;
    const emailDomain = emailPart.split('@')[1] || '';

    // NEW: Display Name Spoofing Detection (+40 points)
    for (const brand of COMMONLY_SPOOFED_DOMAINS) {
        if (displayName.includes(brand)) {
            // Check if email domain matches official domains
            const officialDomains = OFFICIAL_DOMAINS[brand] || [`${brand}.com`];
            const isOfficial = officialDomains.some(d => emailDomain.includes(d));

            if (!isOfficial) {
                score += 40;
                reason = `Display name claims "${brand}" but email domain "${emailDomain}" doesn't match`;
                riskReasons.push(`Sender display name spoofing: claims to be ${brand}`);
                break;
            }
        }
    }

    // EXISTING: Check for display name spoofing in email address
    for (const domain of COMMONLY_SPOOFED_DOMAINS) {
        if (senderLower.includes(domain)) {
            if (!senderLower.includes(`@${domain}.com`) &&
                !senderLower.includes(`@${domain}.org`) &&
                !senderLower.includes(`@${domain}.net`)) {
                score = Math.max(score, 70);
                reason = reason || `Sender claims to be from ${domain} but email domain doesn't match`;
                if (!riskReasons.some(r => r.includes('spoofing'))) {
                    riskReasons.push(`Sender domain impersonation detected: ${domain}`);
                }
            }
        }
    }

    // EXISTING: Check for suspicious email patterns (random-looking)
    if (/^[a-z0-9]{10,}@/.test(emailPart)) {
        score = Math.max(score, 40);
        reason = reason || 'Sender has suspicious random-looking email address';
        riskReasons.push('Suspicious auto-generated sender email address');
    }

    // EXISTING: Check for numbers in domain
    const domainName = emailDomain.split('.')[0] || '';
    if (/\d/.test(domainName) && domainName.length > 3) {
        score = Math.max(score, 50);
        reason = reason || 'Domain contains suspicious numbers';
        riskReasons.push('Sender domain contains suspicious numbers');
    }

    // NEW: Check for misspelled common domains
    const commonDomains = ['gmail', 'yahoo', 'outlook', 'hotmail'];
    for (const common of commonDomains) {
        // Check for typos like "gmial", "yaho", "outloок" (cyrillic)
        if (emailDomain.includes(common.slice(0, 3)) &&
            !emailDomain.includes(`${common}.com`) &&
            !emailDomain.includes(`${common}.co`)) {
            const similarity = calculateSimilarity(domainName, common);
            if (similarity > 0.6 && similarity < 1) {
                score = Math.max(score, 45);
                riskReasons.push(`Possible typosquatting of ${common}.com domain`);
            }
        }
    }

    // NEW: Check for suspicious TLD in sender domain
    for (const tld of SUSPICIOUS_TLDS) {
        if (emailDomain.endsWith(tld.slice(1))) { // Remove leading dot
            score = Math.max(score, 35);
            riskReasons.push(`Sender uses suspicious domain TLD: ${tld}`);
            break;
        }
    }

    // Clamp score to 0-100
    const finalScore = Math.min(Math.max(score, 0), 100);

    return {
        isSuspicious: finalScore > 30,
        reason,
        score: finalScore
    };
}

// Helper: Calculate string similarity (Levenshtein-based)
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

// ============================================
// MAIN PHISHING DETECTION FUNCTION
// (PRESERVED STRUCTURE + ENHANCED)
// ============================================
/**
 * Main phishing detection function
 * Analyzes email content and returns a comprehensive phishing assessment
 * @param {Object} email - Email object with subject, body, sender, urls
 * @returns {Object} Phishing analysis result with riskReasons
 */
export function analyzeEmail(email) {
    // Initialize risk reasons array (NEW)
    const riskReasons = [];

    const urls = email.urls || [];
    const urlAnalysis = analyzeUrls(urls, riskReasons);
    const keywordAnalysis = analyzeKeywords(email.subject || '', email.body || '', riskReasons);
    const senderAnalysis = analyzeSender(email.sender || '', riskReasons);

    // PRESERVED: Calculate weighted final score (same formula)
    const weightedScore = (
        urlAnalysis.score * 0.35 +
        keywordAnalysis.score * 0.35 +
        senderAnalysis.score * 0.30
    );

    // PRESERVED: Normalize to 0-1 range
    const normalizedScore = Math.min(Math.max(weightedScore / 100, 0), 1);

    // PRESERVED: Determine risk level (same thresholds)
    let riskLevel;
    if (normalizedScore >= 0.7) {
        riskLevel = 'HIGH';
    } else if (normalizedScore >= 0.4) {
        riskLevel = 'MEDIUM';
    } else {
        riskLevel = 'LOW';
    }

    // PRESERVED: Compile all flags (backward compatibility)
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

    // Remove duplicate risk reasons
    const uniqueRiskReasons = [...new Set(riskReasons)];

    return {
        // PRESERVED fields
        score: normalizedScore,
        riskLevel,
        flags,
        details: {
            urlAnalysis: {
                suspiciousUrls: urlAnalysis.suspiciousUrls,
                score: urlAnalysis.score
            },
            keywordAnalysis: {
                foundKeywords: keywordAnalysis.foundKeywords,
                score: keywordAnalysis.score,
                matchedCategories: keywordAnalysis.matchedCategories
            },
            senderAnalysis
        },
        // NEW field: Human-readable risk explanations
        riskReasons: uniqueRiskReasons
    };
}

// ============================================
// QUICK CHECK FUNCTION (PRESERVED + ENHANCED)
// ============================================
/**
 * Quick check if email needs detailed analysis
 * @param {Object} email - Email object
 * @returns {boolean} True if email shows phishing signs
 */
export function quickPhishingCheck(email) {
    const content = `${email.subject || ''} ${email.body || ''}`.toLowerCase();

    // PRESERVED: Check for phishing keywords
    const hasPhishingKeywords = UNIQUE_KEYWORDS.some(keyword =>
        content.includes(keyword)
    );

    // PRESERVED: Check for suspicious URLs
    const hasSuspiciousUrls = (email.urls || []).some(url => {
        const urlLower = url.toLowerCase();
        return SUSPICIOUS_TLDS.some(tld => urlLower.includes(tld)) ||
            /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url);
    });

    // NEW: Check for URL shorteners
    const hasUrlShorteners = (email.urls || []).some(url => {
        const urlLower = url.toLowerCase();
        return URL_SHORTENERS.some(shortener => urlLower.includes(shortener));
    });

    return hasPhishingKeywords || hasSuspiciousUrls || hasUrlShorteners;
}

// ============================================
// UTILITY EXPORTS
// ============================================
export const DETECTION_VERSION = '2.0.0';
export const TOTAL_KEYWORDS = UNIQUE_KEYWORDS.length;
export const KEYWORD_CATEGORIES_COUNT = Object.keys(KEYWORD_CATEGORIES).length;
