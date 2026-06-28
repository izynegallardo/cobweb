export default function Layout(root) {
    root.innerHTML = `
        <header id='header'></header>
        <main id='main'></main>
        <footer id='footer'></footer>
    `

    return {
        header: document.querySelector('#header'),
        main: document.querySelector('#main'),
        footer: document.querySelector('#footer'),
    }
}
