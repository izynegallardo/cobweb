import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb.svg'

export default function Main(root) {
    root.innerHTML = `
        <section class='${styles['center']}'>
            <div class='${styles['card']}'>
                <div class='${styles['card-header']}'>
                    <h2 class='${styles['logo-text']} ${styles['headline']}'>
                        <span class='${styles['desktop-letter']}'>C</span>
                        <span class='${styles['logo-o']}'>
                            <img class='${styles['logo-icon']}' src="${CobwebLogo}" alt='o' />
                        </span>
                        <span class='${styles['desktop-letter']}'>bweb</span>
                    </h2>
                    <p class='${styles['card-subtitle']}'>One last step. Pick your username.</p>
                </div>

                <form id='setup-form' class='${styles['form']}'>
                    <div class='${styles['form-group']}'>
                        <input
                            type="text"
                            class='${styles['form-input']}'
                            placeholder="Username"
                            id="username"
                            name="username"
                            autocomplete="off"
                            required
                        />
                    </div>
                    <p id='username-error' class='${styles['error-msg']}'></p>
                    <button type="submit" class='${styles['submit-btn']}'>Continue</button>
                </form>
            </div>
        </section>
    `
    root.className = styles['main']
}
