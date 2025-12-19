// Email Parser Utility
// Helpers for parsing and extracting data from email content

/**
 * Extract URLs from text content
 * Handles both plain text and HTML
 * @param {string} text - Text content to search
 * @returns {string[]} Array of unique URLs found
 */
export function extractUrls(text) {
    if (!text) return [];

    // URL matching regex - handles most common URL formats
    const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
    const matches = text.match(urlRegex) || [];

    // Clean and deduplicate URLs
    const uniqueUrls = [...new Set(
        matches.map(url => {
            // Remove trailing punctuation that might be attached
            return url.replace(/[.,;:!?)}\]]+$/, '');
        })
    )];

    return uniqueUrls;
}

/**
 * Extract URLs from href attributes in HTML
 * @param {string} html - HTML content
 * @returns {string[]} Array of unique URLs from href attributes
 */
export function extractHrefUrls(html) {
    if (!html) return [];

    // Match href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    const urls = [];
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
        const url = match[1];
        if (url && url.startsWith('http')) {
            urls.push(url);
        }
    }

    return [...new Set(urls)];
}

/**
 * Decode base64url encoded string (Gmail format)
 * @param {string} data - Base64url encoded string
 * @returns {string} Decoded string
 */
export function decodeBase64Url(data) {
    if (!data) return '';

    try {
        // Replace URL-safe characters with standard base64
        const base64 = data
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
        console.error('Failed to decode base64:', error.message);
        return '';
    }
}

/**
 * Strip HTML tags and return plain text
 * @param {string} html - HTML content
 * @returns {string} Plain text content
 */
export function stripHtmlTags(html) {
    if (!html) return '';

    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style blocks
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script blocks
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/gi, ' ') // Replace &nbsp;
        .replace(/&amp;/gi, '&') // Replace &amp;
        .replace(/&lt;/gi, '<') // Replace &lt;
        .replace(/&gt;/gi, '>') // Replace &gt;
        .replace(/&quot;/gi, '"') // Replace &quot;
        .replace(/&#39;/gi, "'") // Replace &#39;
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
}

/**
 * Parse email address from "Name <email@domain.com>" format
 * @param {string} fromHeader - From header value
 * @returns {Object} { name, email }
 */
export function parseEmailAddress(fromHeader) {
    if (!fromHeader) {
        return { name: '', email: '' };
    }

    // Match "Name <email>" format
    const match = fromHeader.match(/^(.+?)\s*<(.+?)>$/);

    if (match) {
        return {
            name: match[1].replace(/"/g, '').trim(),
            email: match[2].trim()
        };
    }

    // Just email address
    return {
        name: '',
        email: fromHeader.trim()
    };
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }

    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if a URL is potentially dangerous
 * Basic heuristic checks
 * @param {string} url - URL to check
 * @returns {Object} { dangerous, reasons }
 */
export function checkUrlDanger(url) {
    const reasons = [];
    const urlLower = url.toLowerCase();

    // Check for IP address (often used in phishing)
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
        reasons.push('URL uses IP address instead of domain');
    }

    // Check for suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.club', '.work', '.click', '.link', '.tk', '.ml', '.ga', '.cf'];
    for (const tld of suspiciousTlds) {
        if (urlLower.includes(tld)) {
            reasons.push(`Uses suspicious TLD: ${tld}`);
            break;
        }
    }

    // Check for excessively long URLs
    if (url.length > 200) {
        reasons.push('Unusually long URL');
    }

    // Check for many subdomains
    const dotCount = (url.match(/\./g) || []).length;
    if (dotCount > 4) {
        reasons.push('Contains many subdomains');
    }

    // Check for common phishing patterns
    if (urlLower.includes('login') && urlLower.includes('secure') && urlLower.includes('update')) {
        reasons.push('Contains common phishing keywords');
    }

    return {
        dangerous: reasons.length > 0,
        reasons
    };
}
