import { auth } from '@/utils/firebase'
import { hasUsername, isUsernameTaken, createUser } from '@/services/auth'
import { uploadAvatarFromURL } from '@/services/users'
import { isValidUsername } from '@/utils/validation'
import { UsernameTakenError } from '@/utils/errors'

export default async function Events() {
    const user = auth.currentUser

    if (!user) {
        window.app.pushRoute('/login')
        return
    }

    if (await hasUsername(user.uid)) {
        window.app.pushRoute('/dashboard')
        return
    }

    const form = document.querySelector('#setup-form')
    const errorMsg = document.querySelector('#username-error')
    const submitBtn = form?.querySelector('button[type="submit"]')

    if (!form) return

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        errorMsg.textContent = ''

        const originalBtnText = submitBtn?.textContent
        if (submitBtn) {
            submitBtn.disabled = true
            submitBtn.textContent = 'Creating your account...'
        }

        try {
            const formData = new FormData(form)
            const username = (formData.get('username') || '').trim().toLowerCase()

            if (!isValidUsername(username)) {
                errorMsg.textContent = '3-20 characters. Letters, numbers, and underscores only.'
                return
            }

            // Fast-path UX check. Not authoritative — createUser() re-checks
            // availability inside a transaction, so a concurrent claim between
            // this check and the write below still fails safely.
            if (await isUsernameTaken(username)) {
                errorMsg.textContent = 'Username is already taken.'
                return
            }

            // Re-host the OAuth provider photo on Cloudinary so the public
            // link page can display it without Google's session restriction.
            // Falls back to null (no photo) if the fetch/upload fails.
            const photoURL = user.photoURL
                ? (await uploadAvatarFromURL(user.photoURL)) ?? null
                : null

            await createUser(user.uid, {
                email: user.email,
                displayName: user.displayName || username,
                username,
                photoURL,
            })

            // Guard: if the user navigated away while createUser() was in
            // flight, the form is now detached — skip the redirect entirely.
            // The account was created successfully; they'll be routed to
            // /dashboard automatically on their next visit via hasUsername().
            if (!form.isConnected) return

            window.app.pushRoute('/dashboard')
        } catch (err) {
            if (err instanceof UsernameTakenError) {
                errorMsg.textContent = 'Username is already taken.'
            } else {
                window.dialog.show('Something went wrong. Please try again.', 'error')
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false
                submitBtn.textContent = originalBtnText
            }
        }
    })
}
