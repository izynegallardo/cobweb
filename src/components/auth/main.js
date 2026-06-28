import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb.svg'
import GoogleLogo from '@/assets/icons/google.svg?raw'
import YahooLogo from '@/assets/icons/yahoo.svg?raw'

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
                        ${GoogleLogo}
                        Continue with Google
                    </button>
                    <button id='yahoo-btn' class='${styles['provider-btn']}'>
                        ${YahooLogo}
                        Continue with Yahoo
                    </button>
                </div>

                <div class='${styles['home-link']}'>
                    <a href="/" class='${styles['link']}'>Go back to Home</a>
                </div>

            </div>
        </section>
    `
    root.className = styles['main']
}
