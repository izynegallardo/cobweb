import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb-light.svg'

export default function Main(root) {
    root.innerHTML = `
        <section id='${styles['center']}'>
            <div>
                <img
                    class="${styles['logo-icon-large']}"
                    src="${CobwebLogo}"
                    alt="Cobweb Logo"
                />
            </div>
            <div class='${styles['message']}'>
                <h1 class="${styles['headline']}">Uh oh. This page does not exist.</h1>
                <p class="${styles['cta']}">
                    Head to back our
                    <a href='/' class='${styles['link']}'>
                        homepage
                    </a>
                    or get started
                    <a href='/auth' class='${styles['link']}'>
                        here
                    </a>. 
                </p>
            </div>

            <div class='${styles['page-footer']}' id='main-footer'>
                <div class='${styles['footer-container']}'>
                    <div class='${styles['footer-logo']}'>
                        <h2 class="${styles['logo-text']}">
                            <span class="${styles['desktop-letter']}">C</span>
                            <span class="${styles['logo-o']}">
                                <img
                                    class="${styles['logo-icon']}"
                                    src="${CobwebLogo}"
                                    alt="o"
                                />
                            </span>
                            <span class="${styles['desktop-letter']}">bweb</span>
                        </h2>
                    </div>
                </div>
            </div>
        </section>
    `
    root.className = styles['main']
}
