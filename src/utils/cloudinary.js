/**
 * Builds an optimized delivery URL for a Cloudinary-hosted avatar by
 * injecting f_auto (best format per browser), q_auto (best quality/size
 * tradeoff), and a fixed width transformation right after `/upload/`.
 *
 * Only touches genuine Cloudinary URLs. Anything else — ui-avatars.com
 * fallbacks, blob:/data: URLs (local file previews), or leftover
 * googleusercontent.com OAuth photos — is returned unchanged, so this is
 * safe to call on any photoURL without pre-checking its source.
 *
 * The raw `secure_url` stays untouched in Firestore; transformation is
 * applied only at render time, so the strategy can change later without
 * a data migration.
 *
 * @param {string} url - the stored Cloudinary secure_url (or any URL)
 * @param {number} width - target display width in px (pass the 2x/retina
 *                          size, e.g. 64 for a 32px avatar)
 * @returns {string} the transformed URL, or the original if not Cloudinary
 */
export function getOptimizedAvatarUrl(url, width) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
        return url
    }

    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}
