/**
 * Builds icon URLs for a given link URL.
 * Returns primary (logo.dev) and fallback (Google favicon) sources.
 * Returns null if the URL cannot be parsed.
 *
 * @param {string} url
 * @returns {{ primary: string, fallback: string } | null}
 */
export function getLinkIconUrl(url) {
    const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_PK_TOKEN
    try {
        const domain = new URL(url).hostname.replace(/^www\./, '')
        return {
            primary: `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&format=webp&retina=true`,
            fallback: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        }
    } catch {
        return null
    }
}
