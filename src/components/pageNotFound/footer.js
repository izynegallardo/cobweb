import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb-light.svg'

export default function Footer(root) {
    root.innerHTML = `
        <section class='${styles['page-footer']}' id='main-footer'>
            <div class='${styles['footer-container']}'>

                <div class='${styles['footer-logo']}' role='button'>
                <h2 class="${styles['logo-text']}">
                    <span class="${styles['desktop-letter']}">C</span>

                    <span class="${styles['logo-o']}">
                    <img
                        class="${styles['logo-icon']}"
                        src="${CobwebLogo}"
                        alt="Cobweb Logo"
                    />
                    </span>

                    <span class="${styles['desktop-letter']}">bweb</span>
                </h2>
                </div>
            </div>
        </section> 
    `
    root.className = styles['footer']
}
