import styles from './component.module.css'

export default function Header(root) {
    root.innerHTML = `
        <div class='${styles['header-content']}'>
            <p>Home Header Component</p>
        </div>
        <div class='ticks'></div>
    `
    root.className = styles['header']
}
