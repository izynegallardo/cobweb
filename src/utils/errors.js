/**
 * Thrown when a username is already reserved by another account.
 *
 * Used by createUser() and updateUsername() — both of which re-check
 * availability inside a Firestore transaction — so callers can distinguish
 * a "username taken" outcome from a generic network or Firestore failure
 * and surface the right error message without inspecting error strings.
 */
export class UsernameTakenError extends Error {
    constructor(username) {
        super(`Username "${username}" is already taken.`)
        this.name = 'UsernameTakenError'
        this.username = username
    }
}
