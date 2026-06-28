import styles from './component.module.css'

export default function Footer(root) {
    root.innerHTML = `
        <section>
            <div class='${styles['footer-container']}'>
                <p>© 2026 · Cobweb</p>
            </div>
            <div class='ticks'></div>
        </section>
        `

    root.className = styles['footer']
}
