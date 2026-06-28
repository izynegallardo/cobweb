import { loginWithGoogle, loginWithYahoo, hasUsername } from '@/services/auth'

export default async function Events() {
    try {
        setupProviders()
    } catch (error) {
        console.error('Login Event:', error)
    }
}

function setupProviders() {
    const providers = [
        { id: 'google-btn', login: loginWithGoogle },
        { id: 'yahoo-btn', login: loginWithYahoo },
    ]

    providers.forEach(({ id, login }) => {
        document
            .querySelector(`#${id}`)
            ?.addEventListener('click', () => handleProviderLogin(id, login))
    })
}

async function handleProviderLogin(btnId, loginFn) {
    const btn = document.querySelector(`#${btnId}`)
    if (!btn) return

    const originalHTML = btn.innerHTML
    btn.disabled = true
    btn.textContent = 'Signing in...'

    try {
        const user = await loginFn()
        const ready = await hasUsername(user.uid)
        window.app.pushRoute(ready ? '/dashboard' : '/setup')
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            window.dialog.show('Sign-in failed. Please try again.', 'error')
        }
        console.error('Provider login:', error)
    } finally {
        btn.disabled = false
        btn.innerHTML = originalHTML
    }
}
