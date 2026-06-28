import styles from './component.module.css'

export default function Header(root) {
    root.innerHTML = `
    <header class="${styles['app-header']}" id="main-header">
      <div class="${styles['header-container']}">

        <div class="${styles['header-logo']}">
          <a href="/" class="${styles['logo-link']}">
            <h2 class="${styles['logo-text']}">Return</h2>
          </a>
        </div>


      </div>
    </header>
  `
}
