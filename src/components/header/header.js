import styles from './header.module.css'
import CobwebLogo from '@/assets/cobweb.svg'

export default function Header(root) {
    root.innerHTML = `
        <header class="${styles['app-header']}" id="main-header">
            <div class="${styles['header-container']}">
                <div class="${styles['header-logo']}" role="button">
                    <a href="/" class="${styles['logo-link']}">
                        <h2 class="${styles['logo-text']}">
                            <span class="${styles['desktop-letter']}">C</span>
                            <span class="${styles['logo-o']}">
                                <img class="${styles['logo-icon']}" src="${CobwebLogo}" alt="o" />
                            </span>
                            <span class="${styles['desktop-letter']}">bweb</span>
                        </h2>
                    </a>
                </div>
                <div>
                    <nav class="${styles['header-nav']}">
                        <ul class="${styles['nav-list']}">
                            <li>
                                <a href="/auth" class="${styles['nav-link']}">
                                    <span class="${styles['nav-label']}">Login</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    `

    root.className = styles['header']
}
