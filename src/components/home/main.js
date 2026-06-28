import styles from './component.module.css'

export default function Main(root) {
    root.innerHTML = `
        <section id='${styles['center']}'>
            <div class='${styles['hero']}'>
                <h1 class="${styles['headline']}">All your links,<br>in one page.</h1>
                <p class="${styles['tagline']}">
                    Create your free Cobweb page and share everything
                    you create with one simple link.
                </p>
                <div class="${styles['cta']}">
                    <a href="/auth" class="${styles['btn-primary']}">Get started — it's free</a>
                </div>
            </div>
        </section>
    `
    root.className = styles['main']
}

// <a href="/login" class="${styles['btn-secondary']}">Log in</a>
