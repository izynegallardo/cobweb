export function isValidSize(file) {
    const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024

    if (file.size > MAX_SIZE_IN_BYTES) {
        window.dialog.show('File is too large. Maximum size allowed is 5MB.', 'error')
        return false
    }

    return true
}

// Single source of truth for username format — used by setup, the profile
// editor, and Firestore doc IDs (usernames/{username}). Lowercase only since
// usernames are always normalised to lowercase before being persisted.
export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

/**
 * Normalises a raw username input (trim + lowercase) and checks it against
 * USERNAME_REGEX. Does NOT check availability — pair with isUsernameTaken().
 *
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
    if (!username) return false
    return USERNAME_REGEX.test(username.trim().toLowerCase())
}

export function isValidPassword(password) {
    if (!password) return false
    return (
        /[A-Z]/.test(password) &&
        /[^0-9A-Za-z]/.test(password) &&
        /[0-9]/.test(password) &&
        password.length >= 8
    )
}
