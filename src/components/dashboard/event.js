import Sortable from 'sortablejs'
import styles from './component.module.css'
import iconDrag from '@/assets/icons/drag.svg?raw'
import iconEdit from '@/assets/icons/edit.svg?raw'
import iconTrash from '@/assets/icons/trash.svg?raw'
import iconEllipsis from '@/assets/icons/trash.svg?raw'
import { getCurrentUserProfile } from '@/services/users'
import {
    createLink,
    createLinkQueryFn,
    getLinkCount,
    updateLinkData,
    deleteLinkData,
    reorderLinks,
    subscribeToLinkClicks,
} from '@/services/dashboard'
import { createPaginator } from '@/utils/pagination'
import { showSkeleton, hideSkeleton } from '@/utils/skeleton'
import { normalizeUrl } from '@/utils/normalization'

const PAGE_SIZE = 12

// Holds the Firestore onSnapshot unsubscribe fn.
// Cleaned up each time Events() runs so we never double-attach.
let _unsubscribeClicks = null
// Holds the document-level outside-click handler for mobile menus.
let _removeOutsideClickHandler = null

export default async function Events() {
    // Tear down any listener left over from a prior dashboard visit
    _unsubscribeClicks?.()
    _unsubscribeClicks = null
    _removeOutsideClickHandler?.()
    _removeOutsideClickHandler = null

    const user = await getCurrentUserProfile()
    renderSidebarFooter(user)

    const linksList = document.getElementById('links-list')

    // Show skeleton while we wait for the count + first page from Firestore.
    // Clear the hardcoded placeholder text from main.js first.
    linksList.innerHTML = ''
    showSkeleton(linksList, 'link-list')

    // 1 Firestore read to know the total — lets us show numbered pages upfront
    const totalCount = await getLinkCount(user.uid)
    const state = { totalPages: Math.ceil(totalCount / PAGE_SIZE) || 1, totalCount }

    const paginator = createPaginator({
        pageSize: PAGE_SIZE,
        queryFn: createLinkQueryFn(user.uid, PAGE_SIZE),
    })

    const links = await paginator.nextPage()

    // Remove skeleton before rendering real cards.
    hideSkeleton(linksList)
    renderLinksAndSort(linksList, links, paginator, user, state)
    renderPaginationBar(linksList, paginator, state, user)
    createSortBar(linksList, paginator, user, state)
    handleToggleBtn(linksList, paginator, user, state)
    renderContentHeader(user, linksList, paginator, state)
    handleNavSwitch()

    // Close any open mobile action menu when the user clicks outside a link card.
    const outsideHandler = (e) => {
        if (!e.target.closest(`.${styles['link-card']}`)) {
            closeAllMenus()
        }
    }
    document.addEventListener('click', outsideHandler)
    _removeOutsideClickHandler = () => document.removeEventListener('click', outsideHandler)

    // Real-time click count updates via Firestore onSnapshot (gRPC).
    // Only 'modified' events are processed — initial ADDED events are skipped
    // since we already have the data from the first fetch above.
    _unsubscribeClicks = subscribeToLinkClicks(user.uid, (id, clickCount, isActive) => {
        // Keep in-memory cache in sync regardless of which page is visible
        paginator.updateItem(id, { clickCount })

        // Update the DOM only if this card is on the current page
        const card = linksList.querySelector(`[data-id="${id}"]`)
        if (!card) return
        const metaEl = card.querySelector(`.${styles['link-meta']}`)
        if (!metaEl) return
        metaEl.textContent = isActive ? `${clickCount} clicks` : `${clickCount} clicks · inactive`
    })
}

// ── Mobile menu helpers ───────────────────────────────────

/**
 * Closes all open mobile action menus and resets aria-expanded on their
 * trigger buttons. Safe to call even when no menus are open.
 */
function closeAllMenus() {
    document.querySelectorAll(`.${styles['link-card']}.${styles['menu-open']}`).forEach((card) => {
        card.classList.remove(styles['menu-open'])
        card.querySelector(`.${styles['btn-ellipsis']}`)?.setAttribute('aria-expanded', 'false')
    })
}

// ── Pagination ────────────────────────────────────────────

function renderPaginationBar(linksList, paginator, state, user) {
    document.getElementById('pagination-bar')?.remove()
    if (state.totalPages <= 1) return

    const bar = document.createElement('div')
    bar.id = 'pagination-bar'
    bar.className = styles['pagination-bar']

    // Previous
    const prevBtn = document.createElement('button')
    prevBtn.type = 'button'
    prevBtn.className = styles['btn-page']
    prevBtn.textContent = 'Previous'
    prevBtn.disabled = paginator.isFirstPage
    prevBtn.addEventListener('click', () => {
        const links = paginator.prevPage()
        renderLinksAndSort(linksList, links, paginator, user, state)
        renderPaginationBar(linksList, paginator, state, user)
    })
    bar.appendChild(prevBtn)

    // Numbered page buttons with ellipsis
    const pageWindow = getPaginationWindow(paginator.currentPage, state.totalPages)
    pageWindow.forEach((item) => {
        if (item === '...') {
            const ellipsis = document.createElement('span')
            ellipsis.className = styles['page-ellipsis']
            ellipsis.textContent = '...'
            bar.appendChild(ellipsis)
            return
        }

        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = styles['btn-page-num']
        btn.textContent = String(item + 1) // display as 1-based
        if (item === paginator.currentPage) {
            btn.classList.add(styles['active'])
        }
        btn.addEventListener('click', async () => {
            if (item === paginator.currentPage) return
            btn.disabled = true
            const links = await paginator.goToPage(item)
            renderLinksAndSort(linksList, links, paginator, user, state)
            renderPaginationBar(linksList, paginator, state, user)
        })
        bar.appendChild(btn)
    })

    // Next
    const nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.className = styles['btn-page']
    nextBtn.textContent = 'Next'
    nextBtn.disabled = !paginator.hasNextPage
    nextBtn.addEventListener('click', async () => {
        nextBtn.disabled = true
        const links = await paginator.nextPage()
        renderLinksAndSort(linksList, links, paginator, user, state)
        renderPaginationBar(linksList, paginator, state, user)
    })
    bar.appendChild(nextBtn)

    linksList.after(bar)
}

/**
 * Returns an ordered array of page indices (0-based) and '...' separators
 * to display in the pagination bar.
 *
 * Examples (0-based currentPage, 1-based display):
 *   currentPage=3, totalPages=12  →  [0, '...', 2, 3, 4, '...', 11]
 *   displayed as:                     1  ...   3  4  5  ...  12
 *
 *   currentPage=0, totalPages=12  →  [0, 1, '...', 11]
 *   displayed as:                     1  2  ...   12
 *
 *   totalPages <= 5               →  [0, 1, 2, 3, 4]  (all pages, no ellipsis)
 */
function getPaginationWindow(currentPage, totalPages) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, i) => i)
    }

    const pages = new Set()
    pages.add(0) // always show first
    pages.add(totalPages - 1) // always show last

    // Window: current ± 1
    const from = Math.max(0, currentPage - 1)
    const to = Math.min(totalPages - 1, currentPage + 1)
    for (let i = from; i <= to; i++) pages.add(i)

    const sorted = [...pages].sort((a, b) => a - b)
    const result = []

    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
            result.push('...')
        }
        result.push(sorted[i])
    }

    return result
}

// ── Helpers ──────────────────────────────────────────────

function renderSidebarFooter(user) {
    if (!user) return

    const avatarEl = document.querySelector('[data-user-avatar]')
    const usernameEl = document.querySelector('[data-username]')

    if (avatarEl && user.photoURL) {
        avatarEl.style.backgroundImage = `url(${user.photoURL})`
        avatarEl.style.backgroundSize = 'cover'
        avatarEl.style.backgroundPosition = 'center'
    }

    if (usernameEl && user.username) {
        usernameEl.textContent = `@${user.username}`
    }
}

function renderLinks(linksList, links, user, paginator, state) {
    try {
        if (links.length === 0) {
            linksList.innerHTML = `
                <p class="${styles['empty-state']}">
                    No links yet.
                    <button type="button" class="${styles['trigger-action']}">Add your first one.</button>
                </p>
            `
            linksList
                .querySelector(`.${styles['trigger-action']}`)
                ?.addEventListener('click', () =>
                    renderAddLinkModal(user, linksList, paginator, state),
                )

            linksList.style.justifyContent = 'center'
        } else {
            linksList.replaceChildren(...links.map(renderLinkCard))
            linksList.style.flexGrow = '1'
            linksList.style.justifyContent = 'start'
        }
    } catch (error) {
        console.error('Dashboard: failed to load links', error)
        if (linksList) linksList.innerHTML = `<p>Failed to load links.</p>`
    }
}

function handleToggleBtn(linksList, paginator, user, state) {
    linksList?.addEventListener('click', async (e) => {
        const ellipsisBtn = e.target.closest(`.${styles['btn-ellipsis']}`)
        const toggleBtn = e.target.closest(`.${styles['toggle']}`)
        const iconBtn = e.target.closest(`.${styles['btn-icon']}`)

        // ── Ellipsis: open / close the mobile action menu ──────────────
        if (ellipsisBtn) {
            const card = ellipsisBtn.closest(`.${styles['link-card']}`)
            if (!card) return
            const isOpen = card.classList.contains(styles['menu-open'])
            closeAllMenus()
            if (!isOpen) {
                card.classList.add(styles['menu-open'])
                ellipsisBtn.setAttribute('aria-expanded', 'true')
            }
            return
        }

        if (toggleBtn) {
            const { id } = toggleBtn.dataset

            // Flip visual state immediately for snappy UI feedback
            const isOn = toggleBtn.classList.contains(styles['toggle-on'])
            const nextActive = !isOn
            const card = toggleBtn.closest(`.${styles['link-card']}`)
            const metaEl = card?.querySelector(`.${styles['link-meta']}`)
            const clicks = paginator.getPageItems().find((l) => l.id === id)?.clickCount ?? 0

            // Sync ALL toggle buttons for this link (desktop row + mobile menu)
            card?.querySelectorAll(`.${styles['toggle']}[data-id="${id}"]`).forEach((t) => {
                t.classList.toggle(styles['toggle-on'], nextActive)
                t.setAttribute('aria-label', nextActive ? 'Disable link' : 'Enable link')
            })
            card?.classList.toggle(styles['inactive'], !nextActive)
            if (metaEl)
                metaEl.textContent = nextActive ? `${clicks} clicks` : `${clicks} clicks · inactive`

            try {
                await updateLinkData(user.uid, id, { isActive: nextActive })
                paginator.updateItem(id, { isActive: nextActive })
            } catch {
                // Revert all visual changes if Firestore write fails
                card?.querySelectorAll(`.${styles['toggle']}[data-id="${id}"]`).forEach((t) => {
                    t.classList.toggle(styles['toggle-on'], isOn)
                    t.setAttribute('aria-label', isOn ? 'Disable link' : 'Enable link')
                })
                card?.classList.toggle(styles['inactive'], !isOn)
                if (metaEl)
                    metaEl.textContent = isOn ? `${clicks} clicks` : `${clicks} clicks · inactive`
                window.dialog.show('Failed to update link.', 'error')
            }
        }

        if (iconBtn) {
            const { action, id } = iconBtn.dataset
            // Look up the full link object from the paginator's in-memory page —
            // zero extra Firestore reads.
            const link = paginator.getPageItems().find((l) => l.id === id)
            if (!link) return

            if (action === 'edit') renderEditLinkModal(link, user, linksList, paginator, state)
            if (action === 'delete')
                renderDeleteConfirmModal(link, user, linksList, paginator, state)
        }
    })
}

function renderLinkCard(link) {
    const meta = link.isActive
        ? `${link.clickCount ?? 0} clicks`
        : `${link.clickCount ?? 0} clicks · inactive`

    const card = document.createElement('div')
    card.className = [styles['link-card'], !link.isActive ? styles['inactive'] : '']
        .filter(Boolean)
        .join(' ')
    card.dataset.id = link.id

    card.innerHTML = `
        <button class="${styles['drag-handle']}" type="button" title="Drag to reorder">
            ${iconDrag}
        </button>
        <div class="${styles['link-thumb']}"></div>
        <div class="${styles['link-info']}">
            <span class="${styles['link-title']}"></span>
            <span class="${styles['link-url']}"></span>
            <span class="${styles['link-meta']}"></span>
        </div>
        <div class="${styles['link-actions']}">
            <button
                type="button"
                class="${styles['toggle']} ${link.isActive ? styles['toggle-on'] : ''}"
                data-id="${link.id}"
                aria-label="${link.isActive ? 'Disable link' : 'Enable link'}"
            ></button>
            <button type="button" class="${styles['btn-icon']}" data-action="edit" data-id="${link.id}" title="Edit">
                ${iconEdit}
            </button>
            <button type="button" class="${styles['btn-icon']} ${styles['btn-danger']}" data-action="delete" data-id="${link.id}" title="Delete">
                ${iconTrash}
            </button>
        </div>
        <div class="${styles['link-actions-mobile']}">
            <button
                type="button"
                class="${styles['btn-ellipsis']}"
                data-id="${link.id}"
                aria-label="More options"
                aria-expanded="false"
            >
                ${iconEllipsis}
            </button>
            <div class="${styles['link-actions-menu']}" role="menu">
                <button
                    type="button"
                    class="${styles['toggle']} ${link.isActive ? styles['toggle-on'] : ''}"
                    data-id="${link.id}"
                    aria-label="${link.isActive ? 'Disable link' : 'Enable link'}"
                ></button>
                <button type="button" class="${styles['btn-icon']}" data-action="edit" data-id="${link.id}" title="Edit">
                    ${iconEdit}
                </button>
                <button type="button" class="${styles['btn-icon']} ${styles['btn-danger']}" data-action="delete" data-id="${link.id}" title="Delete">
                    ${iconTrash}
                </button>
            </div>
        </div>
    `

    // Logo icon via DOM — never injected as HTML
    const thumbnail = card.querySelector(`.${styles['link-thumb']}`)
    thumbnail.style.background = 'none'

    if (link.icon?.primary || link.icon?.fallback) {
        const img = document.createElement('img')
        img.src = link.icon.primary || link.icon.fallback
        img.alt = ''
        img.setAttribute('aria-hidden', 'true')
        img.setAttribute('loading', 'lazy')
        img.addEventListener('error', () => {
            if (link.icon.fallback && img.src !== link.icon.fallback) {
                img.src = link.icon.fallback
            }
        })
        thumbnail.appendChild(img)
    }

    card.querySelector(`.${styles['link-title']}`).textContent = link.title
    card.querySelector(`.${styles['link-url']}`).textContent = link.url
    card.querySelector(`.${styles['link-meta']}`).textContent = meta

    return card
}

// ── Sort / Drag-and-drop ─────────────────────────────────

function showSortBar() {
    const bar = document.getElementById('sort-save-bar')
    if (bar) bar.hidden = false
}

function hideSortBar() {
    const bar = document.getElementById('sort-save-bar')
    if (bar) bar.hidden = true
}

/**
 * Renders links then wires up SortableJS and hides the save bar.
 * This is the single canonical entry point for updating the links list —
 * every former `renderLinks` call site now calls this instead.
 *
 * @param {HTMLElement} linksList
 * @param {object[]}    links      — current page items
 * @param {object}      paginator
 * @param {object}      user
 * @param {object}      state      — { totalPages }
 */
function renderLinksAndSort(linksList, links, paginator, user, state) {
    renderLinks(linksList, links, user, paginator, state)
    hideSortBar()
    if (links.length > 0) {
        initSortable(linksList)
    } else if (linksList._sortable) {
        linksList._sortable.destroy()
        linksList._sortable = null
    }
}

/**
 * Creates (or recreates) a SortableJS instance scoped to the links list.
 * Destroys any existing instance first to prevent double-attach.
 * Reveals the save bar only on `onStart` — when the user actually begins
 * dragging, not on every re-render.
 *
 * @param {HTMLElement} linksList
 */
function initSortable(linksList) {
    if (linksList._sortable) {
        linksList._sortable.destroy()
        linksList._sortable = null
    }

    linksList._sortable = new Sortable(linksList, {
        handle: `.${styles['drag-handle']}`,
        animation: 150,
        onStart: () => showSortBar(),
    })
}

/**
 * Creates the floating sort save/cancel bar once per session and appends
 * it inside the dashboard root so the CSS Module descendant rule resolves.
 * Since the bar is `position: fixed` it visually overlays the viewport
 * regardless of its DOM position.
 *
 * Cancel — re-renders from the unchanged paginator cache (zero Firestore reads),
 *           restoring the original order and reinitialising Sortable.
 * Save   — collects the current DOM order, batch-writes to Firestore,
 *           syncs the in-memory cache, and hides the bar.
 *
 * @param {HTMLElement} linksList
 * @param {object}      paginator
 * @param {object}      user
 * @param {object}      state
 */
function createSortBar(linksList, paginator, user, state) {
    // Remove any bar left over from a previous SPA navigation
    document.getElementById('sort-save-bar')?.remove()

    const bar = document.createElement('div')
    bar.id = 'sort-save-bar'
    bar.className = styles['sort-save-bar']
    bar.hidden = true

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = styles['btn-sort-cancel']
    cancelBtn.textContent = 'Cancel'

    const saveBtn = document.createElement('button')
    saveBtn.type = 'button'
    saveBtn.className = styles['btn-sort-save']
    saveBtn.textContent = 'Save order'

    cancelBtn.addEventListener('click', () => {
        // Re-render from in-memory cache — restores original order, zero reads
        renderLinksAndSort(linksList, paginator.getPageItems(), paginator, user, state)
    })

    saveBtn.addEventListener('click', async () => {
        const savedLabel = saveBtn.innerHTML
        saveBtn.disabled = true
        saveBtn.textContent = 'Saving\u2026'

        try {
            // Page-relative offset keeps order values non-overlapping across pages:
            // Page 0 → 0..PAGE_SIZE-1, Page 1 → PAGE_SIZE..2*PAGE_SIZE-1, etc.
            const pageOffset = paginator.currentPage * PAGE_SIZE
            const cards = [...linksList.querySelectorAll(`.${styles['link-card']}`)]
            const items = cards.map((card, i) => ({
                id: card.dataset.id,
                order: pageOffset + i,
            }))

            await reorderLinks(user.uid, items)

            // Sync cache so backward-navigation renders the new order immediately
            paginator.reorderCurrentPage(items)

            // Reset button before hiding so it's ready for the next drag
            saveBtn.disabled = false
            saveBtn.textContent = 'Save order'
            hideSortBar()
            window.dialog.show('Order saved.', 'success')
        } catch (error) {
            console.error('Dashboard: failed to save link order', error)
            window.dialog.show('Failed to save order.', 'error')
            saveBtn.disabled = false
            saveBtn.innerHTML = savedLabel
        }
    })

    bar.append(cancelBtn, saveBtn)

    // Append inside .main so the CSS Module nesting (.main .sort-save-bar) resolves;
    // position: fixed means it overlays the viewport regardless of DOM nesting.
    const dashboardRoot = document.querySelector(`.${styles['main']}`)
    ;(dashboardRoot ?? document.body).appendChild(bar)
}

// ── Refresh helper ───────────────────────────────────────

/**
 * Re-fetches the current page from the paginator's in-memory cache and
 * re-renders it. This is the shared refresh path after any mutation
 * (edit, delete, toggle) so we always stay on the same page the user
 * is viewing rather than jumping back to page 1.
 *
 * How it works:
 *   1. paginator.reset()     — clears the in-memory item cache and cursors
 *   2. paginator.goToPage()  — re-fetches sequentially from page 0 up to
 *                              the target page, caching each one
 *   3. renderLinks()         — swaps the DOM with the fresh slice
 *   4. renderPaginationBar() — redraws page controls with the updated count
 *
 * @param {HTMLElement} linksList
 * @param {object}      paginator
 * @param {object}      state      — { totalPages }
 * @param {object}      user
 */
async function refreshCurrentPage(linksList, paginator, state, user) {
    const page = paginator.currentPage
    const newCount = await getLinkCount(user.uid)
    state.totalPages = Math.ceil(newCount / PAGE_SIZE) || 1
    state.totalCount = newCount

    paginator.reset()

    // goToPage fetches pages 0..page sequentially and caches them, so the
    // user lands back on the exact page they were on (or the last valid page
    // if their current page no longer exists after a delete).
    const targetPage = Math.min(page, state.totalPages - 1)
    const refreshed = await paginator.goToPage(targetPage)
    renderLinksAndSort(linksList, refreshed, paginator, user, state)
    renderPaginationBar(linksList, paginator, state, user)
}

// ── Edit modal ────────────────────────────────────────────

/**
 * Opens the edit modal pre-filled with the link's current title and URL.
 * On submit, sends only the changed fields to Firestore then refreshes
 * the current page in place.
 *
 * @param {object}      link      — full link object from paginator cache
 * @param {object}      user
 * @param {HTMLElement} linksList
 * @param {object}      paginator
 */
function renderEditLinkModal(link, user, linksList, paginator, state) {
    window.modal.open({
        title: 'Edit link',
        submitLabel: 'Save changes',
        body: `
            <div class="modal-field">
                <label class="modal-label">Title</label>
                <input type="text" name="title" class="modal-input" value="${escapeAttr(link.title)}" required />
            </div>
            <div class="modal-field">
                <label class="modal-label">URL</label>
                <input type="text" name="url" class="modal-input" value="${escapeAttr(link.url)}" required />
            </div>
        `,
        onSubmit: async (formData) => {
            const title = formData.get('title').trim()
            const url = normalizeUrl(formData.get('url'))

            // Only send fields that actually changed — avoids unnecessary writes
            const patch = {}
            if (title !== link.title) patch.title = title
            if (url !== link.url) patch.url = url

            if (Object.keys(patch).length === 0) {
                // Nothing changed — close silently
                return
            }

            try {
                await updateLinkData(user.uid, link.id, patch)
                await refreshCurrentPage(linksList, paginator, state, user)
                window.dialog.show('Link updated.', 'success')
            } catch (error) {
                window.dialog.show('Failed to update link.', 'error')
                console.error(error)
                throw error // keeps modal open
            }
        },
    })
}

// ── Delete confirm modal ──────────────────────────────────

/**
 * Opens a confirmation modal before permanently deleting a link.
 * Uses window.modal with a danger-styled submit label so the user
 * cannot accidentally delete.
 *
 * On confirm, deletes from Firestore then refreshes the current page.
 * If the deleted item was the only one on the last page, the paginator
 * naturally falls back to the previous page via the min(page, totalPages-1)
 * guard in refreshCurrentPage.
 *
 * @param {object}      link      — full link object from paginator cache
 * @param {object}      user
 * @param {HTMLElement} linksList
 * @param {object}      paginator
 */
function renderDeleteConfirmModal(link, user, linksList, paginator, state) {
    window.modal.open({
        title: 'Delete link',
        submitLabel: 'Delete',
        body: `
            <p style="margin:0;font-size:14px;color:var(--text-h);line-height:1.6">
                Are you sure you want to delete
                <strong>${escapeHtml(link.title)}</strong>?
                This cannot be undone.
            </p>
        `,
        onSubmit: async () => {
            try {
                await deleteLinkData(user.uid, link.id)
                await refreshCurrentPage(linksList, paginator, state, user)
                window.dialog.show('Link deleted.', 'success')
            } catch (error) {
                window.dialog.show('Failed to delete link.', 'error')
                console.error(error)
                throw error // keeps modal open
            }
        },
    })
}

// ── Escape helpers ────────────────────────────────────────

/**
 * Escapes a string for safe insertion into an HTML attribute (value="...").
 * Prevents attribute-injection if a link title contains quotes.
 */
function escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/**
 * Escapes a string for safe insertion into HTML text content.
 * Used in the delete modal's confirmation message.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function renderAddLinkModal(user, linksList, paginator, state) {
    if (!user?.uid) return

    window.modal.open({
        title: 'Add link',
        submitLabel: 'Add link',
        body: `
            <div class="modal-field">
                <label class="modal-label">Title</label>
                <input type="text" name="title" class="modal-input" placeholder="e.g. My YouTube Channel" required />
            </div>
            <div class="modal-field">
                <label class="modal-label">URL</label>
                <input type="text" name="url" class="modal-input" placeholder="https://www.example.com" required />
            </div>
        `,
        onSubmit: async (formData) => {
            const title = formData.get('title').trim()
            const url = normalizeUrl(formData.get('url'))

            try {
                const newLink = await createLink(user.uid, { title, url })

                // Optimistic update — no refetch needed.
                // createLink returns the full link object so we inject it
                // directly into the paginator's in-memory list and re-render.
                paginator.appendItem(newLink)
                state.totalCount++
                state.totalPages = Math.ceil(state.totalCount / PAGE_SIZE) || 1

                renderLinksAndSort(linksList, paginator.getPageItems(), paginator, user, state)
                renderPaginationBar(linksList, paginator, state, user)

                window.dialog.show('Link added.', 'success')
            } catch (error) {
                window.dialog.show('Failed to add link.', 'error')
                console.error(error)
                throw error
            }
        },
    })
}

function renderContentHeader(user, linksList, paginator, state) {
    const previewBtn = document.querySelector(`.${styles['btn-preview']}`)
    const addBtn = document.querySelector(`.${styles['btn-add']}`)

    previewBtn?.addEventListener('click', () => {
        window.open(`/${user.username}`, '_blank', 'noopener,noreferrer')
    })

    addBtn?.addEventListener('click', () => renderAddLinkModal(user, linksList, paginator, state))
}

function handleNavSwitch() {
    const navItems = document.querySelectorAll(`.${styles['nav-item']}`)
    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault()
            // Silently ignore disabled items — they have no view to render yet
            if (item.getAttribute('aria-disabled') === 'true') return
            navItems.forEach((i) => i.classList.remove(styles['active']))
            item.classList.add(styles['active'])
            // TODO: render corresponding view section
        })
    })
}
