import { auth } from '@/utils/firebase'
import { hasUsername, isUsernameTaken, createUser } from '@/services/auth'
import { uploadAvatarFromURL } from '@/services/users'

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

            if (!/^[a-z0-9_]{3,20}$/.test(username)) {
                errorMsg.textContent = '3-20 characters. Letters, numbers, and underscores only.'
                return
            }

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
            window.app.pushRoute('/dashboard')
        } catch (err) {
            window.dialog.show('Something went wrong. Please try again.', 'error')
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false
                submitBtn.textContent = originalBtnText
            }
        }
    })
}
