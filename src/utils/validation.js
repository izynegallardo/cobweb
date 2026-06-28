export function isValidSize(file) {
    const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024

    if (file.size > MAX_SIZE_IN_BYTES) {
        window.dialog.show('File is too large. Maximum size allowed is 5MB.', 'error')
        return false
    }

    return true
}

export function isValidUsername(username) {
    const validUsernameRegex = /^[0-9A-Za-z]{3,16}$/

    if (!username) return false

    const cleanUsername = username.trim()

    if (!validUsernameRegex.test(cleanUsername)) {
        return false
    }

    return true
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
