import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb.svg'

const GOOGLE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
</svg>`

const MICROSOFT_ICON = `<svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
</svg>`

const YAHOO_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#6001D2"/>
    <path d="M8 6l4 7 4-7h-2.5L12 9.5 10.5 6H8zm3 8v4h2v-4l-1-1.8L10 14z" fill="white"/>
</svg>`

export default function Main(root) {
    root.innerHTML = `
        <section class='${styles['center']}'>
            <div class='${styles['card']}'>
                <div class='${styles['card-header']}'>
                    <h2 class='${styles['logo-text']} ${styles['headline']}'>
                        <span class='${styles['desktop-letter']}'>C</span>
                        <span class='${styles['logo-o']}'>
                            <img
                                class='${styles['logo-icon']}'
                                src="${CobwebLogo}"
                                alt='o'
                            />
                        </span>
                        <span class='${styles['desktop-letter']}'>bweb</span>
                    </h2>
                    <p class='${styles['card-subtitle']}'>All your links, in one page.</p>
                </div>

                <div class='${styles['providers']}'>
                    <button id='google-btn' class='${styles['provider-btn']}'>
                        ${GOOGLE_ICON}
                        Continue with Google
                    </button>
                    <button id='microsoft-btn' class='${styles['provider-btn']}'>
                        ${MICROSOFT_ICON}
                        Continue with Microsoft
                    </button>
                    <button id='yahoo-btn' class='${styles['provider-btn']}'>
                        ${YAHOO_ICON}
                        Continue with Yahoo
                    </button>
                </div>

                <div class='${styles['login-link']}'>
                    Have an account already? <a href="/auth" class='${styles['link']}'>Log in</a>
                </div>
            </div>
        </section>
    `
    root.className = styles['main']
}
