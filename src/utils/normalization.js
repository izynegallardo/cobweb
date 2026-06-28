/**
 * Ensures a URL string has an explicit protocol scheme.
 * If the user omits the protocol (e.g. "example.com" or "www.youtube.com/@me"),
 * https:// is automatically prepended.
 * Already-valid schemes (http, https, ftp, mailto, tel, etc.) are passed through unchanged.
 *
 * @param {string} rawUrl
 * @returns {string}
 */
export function normalizeUrl(rawUrl) {
    const url = rawUrl.trim()
    if (!url) return url
    // RFC-compliant: match any scheme letter followed by letters, digits, +, -, or .
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) return url
    return `https://${url}`
}
