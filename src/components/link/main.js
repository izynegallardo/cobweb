import styles from './component.module.css'
import PenIcon from '@/assets/icons/pen.svg?raw'

export default function Main(root) {
    root.innerHTML = `
        <section id='${styles['user-link']}'>
            <div class='${styles['user-link-content']}'>

                <div class='${styles['zone-top']}'>
                    <div class="${styles['avatar-wrap']}">
                        <img class="${styles['avatar']}" id="avatar-preview" src="" alt="Profile picture" />
                        <button type="button" class="${styles['edit-btn']}" aria-label="Edit profile picture">
                            ${PenIcon}
                        </button>
                    </div>
                    <div class='${styles['names']}'>
                        <h1 class='${styles['fullname']}'>Your Name</h1>
                        <p class='${styles['username']}'>@username</p>
                        <p class='${styles['bio']}'>A short bio goes here.</p>
                    </div>
                </div>

                <div class='${styles['zone-middle']}'>
                    <div class='${styles['social-row']}'></div>
                    <div class='${styles['chain-link']}'></div>
                </div>

                <div class='${styles['zone-bottom']}'>
                    <p class='${styles['credits']}'>made with cobweb</p>
                </div>

            </div>
        </section>
    `
    root.className = styles['main']
}
