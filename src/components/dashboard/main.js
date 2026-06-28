import styles from './component.module.css'
import CobwebLightLogo from '@/assets/cobweb-light.svg'

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
                        <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'/><path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'/></svg>
                        <span>Links</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='analytics'>
                        <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><line x1='18' y1='20' x2='18' y2='10'/><line x1='12' y1='20' x2='12' y2='4'/><line x1='6' y1='20' x2='6' y2='14'/></svg>
                        <span>Analytics</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='appearance'>
                        <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='5'/></svg>
                        <span>Appearance</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='messages'>
                        <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg>
                        <span>Messages</span>
                        <span class='${styles['badge']}'>1</span>
                    </a>
                    <a href='#' class='${styles['nav-item']}' data-view='settings'>
                        <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/></svg>
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
                                <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg> 
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
