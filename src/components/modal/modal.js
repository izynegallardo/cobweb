let _onSubmit = null

const modal = {
    element: null,

    init() {
        this.element = document.createElement('div')
        this.element.id = 'cobweb-modal'
        this.element.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button type="button" class="modal-close-btn">&times;</button>
                </div>
                <form class="modal-form">
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="modal-cancel-btn">Cancel</button>
                        <button type="submit" class="modal-submit-btn">Submit</button>
                    </div>
                </form>
            </div>
        `
        document.body.appendChild(this.element)
        this._injectStyles()
        this._bindEvents()
    },

    open({ title, body, onSubmit, submitLabel = 'Submit' }) {
        this.element.querySelector('.modal-title').textContent = title
        this.element.querySelector('.modal-body').innerHTML = body
        this.element.querySelector('.modal-submit-btn').textContent = submitLabel
        _onSubmit = onSubmit
        this.element.classList.add('visible')
        this.element.querySelector('input')?.focus()
    },

    close() {
        this.element.classList.remove('visible')
        this.element.querySelector('.modal-form').reset()
        this.element.querySelector('.modal-body').innerHTML = ''
        _onSubmit = null
    },

    _bindEvents() {
        this.element.querySelector('.modal-close-btn').addEventListener('click', () => this.close())
        this.element
            .querySelector('.modal-cancel-btn')
            .addEventListener('click', () => this.close())

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close()
        })

        this.element.querySelector('.modal-form').addEventListener('submit', async (e) => {
            e.preventDefault()
            if (!_onSubmit) return

            const submitBtn = this.element.querySelector('.modal-submit-btn')
            const label = submitBtn.textContent
            submitBtn.disabled = true
            submitBtn.textContent = 'Loading...'

            try {
                await _onSubmit(new FormData(e.target))
                this.close()
            } catch {
                // Caller handles error display; re-throwing keeps the modal open
            } finally {
                submitBtn.disabled = false
                submitBtn.textContent = label
            }
        })
    },

    _injectStyles() {
        const style = document.createElement('style')
        style.textContent = `
            #cobweb-modal {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                align-items: center;
                justify-content: center;
                z-index: 200;
            }
            #cobweb-modal.visible {
                display: flex;
            }
            #cobweb-modal .modal-box {
                background: var(--bg);
                border: 1px solid var(--border);
                border-radius: 14px;
                padding: 24px;
                width: 100%;
                max-width: 440px;
                box-sizing: border-box;
                margin: 0 16px;
            }
            #cobweb-modal .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            #cobweb-modal .modal-title {
                font-size: 16px;
                font-weight: 700;
                color: var(--text-h);
                margin: 0;
            }
            #cobweb-modal .modal-close-btn {
                background: none;
                border: none;
                font-size: 22px;
                line-height: 1;
                padding: 0;
                color: var(--text);
                cursor: pointer;
                transition: color 0.15s;
                font-family: inherit;
            }
            #cobweb-modal .modal-close-btn:hover {
                color: var(--text-h);
            }
            #cobweb-modal .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }
            #cobweb-modal .modal-cancel-btn {
                padding: 8px 16px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: transparent;
                color: var(--text-h);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: border-color 0.15s;
                font-family: inherit;
            }
            #cobweb-modal .modal-cancel-btn:hover {
                border-color: var(--accent-border);
            }
            #cobweb-modal .modal-submit-btn {
                padding: 8px 18px;
                border: none;
                border-radius: 8px;
                background: var(--text-h);
                color: var(--bg);
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.15s;
                font-family: inherit;
            }
            #cobweb-modal .modal-submit-btn:hover { opacity: 0.75; }
            #cobweb-modal .modal-submit-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* ── Form field helpers (use inside modal body) ── */
            .modal-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 16px;
            }
            .modal-field:last-child { margin-bottom: 0; }
            .modal-label {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-h);
                font-family: inherit;
            }
            .modal-input {
                padding: 9px 12px;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--code-bg);
                color: var(--text-h);
                font-size: 14px;
                outline: none;
                transition: border-color 0.15s;
                font-family: inherit;
                width: 100%;
                box-sizing: border-box;
            }
            .modal-input:focus { border-color: var(--accent-border); }
        `
        document.head.appendChild(style)
    },
}

export default modal
