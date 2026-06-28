import styles from './component.module.css'

export default function Main(root) {
    root.innerHTML = `
        <section id='${styles['user-link']}'>
            <div class='${styles['user-link-content']}'>

                <div class='${styles['zone-top']}'>
                    <div class="${styles['avatar-wrap']}">
                        <img class="${styles['avatar']}" id="avatar-preview" src="" alt="Profile picture" />
                        <button type="button" class="${styles['edit-btn']}" aria-label="Edit profile picture">
                            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="16" height="16" fill="white">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
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
