import styles from './component.module.css'
import CobwebLightLogo from '@/assets/cobweb-light.svg'
import LinkLogo from '@/assets/icons/link.svg?raw'
import AnalyticsLogo from '@/assets/icons/analytics.svg?raw'
import ThemeLogo from '@/assets/icons/theme.svg?raw'
import MessagesLogo from '@/assets/icons/messages.svg?raw'
import SettingsLogo from '@/assets/icons/settings.svg?raw'
import PreviewLogo from '@/assets/icons/preview.svg?raw'

export default function Main(root) {
    root.innerHTML = `
        <div class='${styles['dashboard']}'>

            <aside class='${styles['sidebar']}'>
                <div class='${styles['sidebar-brand']}'>
                    <div class='${styles['brand-avatar']}'>
                        <img
                            class='${styles['brand-avatar']}'
                            src="${CobwebLightLogo}"
                            alt='Cobweb'
                        />
                    </div>
                    <span class='${styles['brand-name']}'>Cobweb</span>
                </div>

                <nav class='${styles['nav']}'>
                    <a href='#' class='${styles['nav-item']} ${styles['active']}' data-view='links'>
                        ${LinkLogo}
                        <span>Links</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='analytics' aria-disabled='true'>
                        ${AnalyticsLogo}
                        <span>Analytics</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='theme' aria-disabled='true'>
                        ${ThemeLogo}
                        <span>Theme</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='messages' aria-disabled='true'>
                        ${MessagesLogo}
                        <span>Messages</span>
                        
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='settings' aria-disabled='true'>
                        ${SettingsLogo}
                        <span>Settings</span>
                    </a>
                </nav>

                <div class='${styles['sidebar-footer']}'>
                    <a href='/me' class='${styles['btn-link']}'>
                        <div class='${styles['user-card']}'>
                            <div data-user-avatar class='${styles['user-avatar']}'></div>
                            <div class='${styles['user-info']}'>
                                <span data-username class='${styles['user-name']}'>@username</span>
                                <span class='${styles['user-plan']}'>Free plan</span>
                            </div>
                        </div>
                    </a>
                </div>
            </aside>

            <div class='${styles['content']}'>
                <div class='${styles['content-header']}'>
                    <h2 class='${styles['content-title']}'>My links</h2>
                    <div class='${styles['content-actions']}'>
                            <button type='button' class='${styles['btn-preview']}'>
                                ${PreviewLogo}
                                Preview
                            </button>
                        <button type='button' class='${styles['btn-add']}'>
                            + Add link
                        </button>
                    </div>
                </div>

                <div class='${styles['links-list']}' id='links-list'>
                    
                </div>
            </div>

        </div>
    `
    root.className = styles['main']
}
