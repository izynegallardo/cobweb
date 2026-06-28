const COLORS = {
    success: '#22c55e',
    info: '#0088cc',
    warning: '#f59e0b',
    error: '#ef4444',
}

let timer = null

const dialog = {
    element: null,

    init() {
        this.element = document.createElement('div')
        this.element.id = 'cobweb-dialog'
        this.element.innerHTML = `
            <div class="dialog-inner">
                <span class="dialog-msg"></span>
                <button class="dialog-close">&times;</button>
            </div>
        `
        document.body.appendChild(this.element)
        this._injectStyles()
        this.element.querySelector('.dialog-close').addEventListener('click', () => this.hide())
    },

    show(message, type = 'info', duration = 4000) {
        const inner = this.element.querySelector('.dialog-inner')
        this.element.querySelector('.dialog-msg').textContent = message
        inner.style.borderLeftColor = COLORS[type] ?? COLORS.info
        this.element.classList.add('visible')

        clearTimeout(timer)
        if (duration > 0) {
            timer = setTimeout(() => this.hide(), duration)
        }
    },

    hide() {
        clearTimeout(timer)
        this.element?.classList.remove('visible')
    },

    _injectStyles() {
        const style = document.createElement('style')
        style.textContent = `
            #cobweb-dialog {
                position: fixed;
                top: 24px;
                left: 90%;
                transform: translateX(-50%) translateY(-8px);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease, transform 0.25s ease;
            }
            #cobweb-dialog.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
                pointer-events: all;
            }
            #cobweb-dialog .dialog-inner {
                display: flex;
                align-items: center;
                gap: 12px;
                background: var(--bg);
                border-left: 4px solid;
                border-radius: 8px;
                padding: 14px 18px;
                min-width: 280px;
                max-width: 400px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                font-size: 14px;
                font-family: inherit;
            }
            #cobweb-dialog .dialog-msg {
                flex: 1;
                color: var(--text-h);
                line-height: 1.4;
            }
            #cobweb-dialog .dialog-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: var(--text);
                padding: 0;
                line-height: 1;
                transition: color 0.15s ease;
            }
            #cobweb-dialog .dialog-close:hover {
                color: var(--text-h);
            }

            @media (max-width: 768px) {
                #cobweb-dialog {
                    left: 50%;
                }                
            }
        `
        document.head.appendChild(style)
    },
}

export default dialog
