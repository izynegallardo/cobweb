// Marker attribute — injected elements carry this so hideSkeleton can find
// and remove only what it added, never touching real content.
const ATTR = 'data-skeleton'

/**
 * Templates keyed by type.
 * Each returns an HTML string of `.skeleton-bone` elements sized to
 * approximate the real content they stand in for.
 *
 * Class names from common.css handle layout and dimensions.
 * Only percentage widths that vary per line stay as inline styles.
 */
const templates = {
    /**
     * link-profile-top / link-profile-middle
     * Used together when type === 'link-profile'.
     * Injected into .zone-top and .zone-middle separately.
     */
    'link-profile-top': () => `
        <div class="skeleton-wrap skeleton-profile-top" data-skeleton>
            <div class="skeleton-bone skeleton-bone--circle-lg"></div>
            <div class="skeleton-wrap skeleton-profile-names">
                <div class="skeleton-bone skeleton-bone--text-lg" style="width:180px;height:60px;"></div>
                <div class="skeleton-bone skeleton-bone--text-md" style="width:100px;height:30px;"></div>
                <div class="skeleton-bone skeleton-bone--text-sm" style="width:240px;height:80px;"></div>
            </div>
        </div>
    `,

    'link-profile-middle': () => `
        <div class="skeleton-wrap skeleton-links" data-skeleton>
            <div class="skeleton-bone skeleton-bone--pill-lg"></div>
            <div class="skeleton-bone skeleton-bone--pill-lg"></div>
            <div class="skeleton-bone skeleton-bone--pill-lg"></div>
        </div>
    `,

    /**
     * profile-form
     * Gaps and sizes pulled directly from component.module.css:
     * .avatar 72px, .avatar-wrap gap:8px margin-bottom:24px,
     * .form gap:16px, .form-group gap:6px, .textarea min-height:80px
     */
    'profile-form': () => `
        <div class="skeleton-wrap skeleton-form" data-skeleton>
            <div class="skeleton-wrap skeleton-form-avatar">
                <div class="skeleton-bone skeleton-bone--circle-sm"></div>
                <div class="skeleton-bone skeleton-bone--text-sm" style="width:80px;"></div>
            </div>
            <div class="skeleton-wrap skeleton-form-fields">
                <div class="skeleton-wrap skeleton-form-group">
                    <div class="skeleton-bone skeleton-bone--text-sm" style="width:30%;"></div>
                    <div class="skeleton-bone skeleton-bone--input"></div>
                </div>
                <div class="skeleton-wrap skeleton-form-group">
                    <div class="skeleton-bone skeleton-bone--text-sm" style="width:30%;"></div>
                    <div class="skeleton-bone skeleton-bone--input"></div>
                </div>
                <div class="skeleton-wrap skeleton-form-group">
                    <div class="skeleton-bone skeleton-bone--text-sm" style="width:15%;"></div>
                    <div class="skeleton-bone skeleton-bone--textarea"></div>
                </div>
                <div class="skeleton-wrap skeleton-form-group">
                    <div class="skeleton-bone skeleton-bone--text-sm" style="width:20%;"></div>
                    <div class="skeleton-bone skeleton-bone--input"></div>
                    <div class="skeleton-bone skeleton-bone--text-sm" style="width:25%;"></div>
                </div>
                <div class="skeleton-bone skeleton-bone--pill-sm"></div>
            </div>
            <div class="skeleton-bone skeleton-bone--text-sm" style="width:120px;margin-top:20px;"></div>
        </div>
    `,

    /**
     * link-list
     */
    'link-list': () => `
        <div class="skeleton-wrap skeleton-list-items" data-skeleton>
            ${Array.from({ length: 5 })
                .map(
                    () => `
                <div class="skeleton-wrap skeleton-list-row">
                    <div class="skeleton-bone skeleton-bone--drag"></div>
                    <div class="skeleton-bone skeleton-bone--icon-md"></div>
                    <div class="skeleton-wrap skeleton-list-text">
                        <div class="skeleton-bone skeleton-bone--text-sm" style="min-width:10%;"></div>
                        <div class="skeleton-bone skeleton-bone--text-sm" style="min-width:15%;"></div>
                        <div remove-skeleton-bone--text-sm class="skeleton-bone skeleton-bone--text-sm" style="min-width:5%;"></div>
                    </div>
                    <div class="skeleton-wrap skeleton-list-actions">
                        <div remove-icon-sm class="skeleton-bone skeleton-bone--circle-icon-sm"></div>
                        <div remove-icon-sm class="skeleton-bone skeleton-bone--icon-sm"></div>
                        <div class="skeleton-bone skeleton-bone--icon-sm"></div>
                    </div>
                </div>
            `,
                )
                .join('')}
        </div>
    `,
}

/**
 * showSkeleton(container, type)
 *
 * For 'link-profile': pass { zoneTop, zoneMiddle } as container — the actual
 * DOM elements resolved in event.js using the CSS Module styles object.
 * This avoids skeleton.js needing to know hashed class names.
 *
 * For 'profile-form': pass the .card element.
 * For 'link-list': pass the #links-list element.
 *
 * @param {HTMLElement|{zoneTop:HTMLElement, zoneMiddle:HTMLElement}} container
 * @param {'link-profile'|'profile-form'|'link-list'} type
 */
export function showSkeleton(container, type) {
    if (!container) return

    if (type === 'link-profile') {
        const { zoneTop, zoneMiddle } = container

        if (zoneTop) {
            Array.from(zoneTop.children).forEach((el) => {
                el.dataset.skeletonHidden = ''
                el.style.display = 'none'
            })
            zoneTop.insertAdjacentHTML('afterbegin', templates['link-profile-top']())
        }
        if (zoneMiddle) {
            Array.from(zoneMiddle.children).forEach((el) => {
                el.dataset.skeletonHidden = ''
                el.style.display = 'none'
            })
            zoneMiddle.insertAdjacentHTML('afterbegin', templates['link-profile-middle']())
        }
        return
    }

    const html = templates[type]?.()
    if (!html) {
        console.warn(`skeleton: unknown type "${type}"`)
        return
    }

    if (type === 'profile-form') {
        // Hide real card children so the form doesn't bleed through beneath
        // the skeleton. display:none removes them from flow so the card
        // height matches the skeleton, not the hidden content beneath it.
        Array.from(container.children).forEach((el) => {
            el.dataset.skeletonHidden = ''
            el.style.display = 'none'
        })
    }

    container.insertAdjacentHTML('afterbegin', html)
}

/**
 * hideSkeleton(container)
 *
 * For 'link-profile': pass the same { zoneTop, zoneMiddle } object.
 * For all others: pass the element used in showSkeleton.
 *
 * @param {HTMLElement|{zoneTop:HTMLElement, zoneMiddle:HTMLElement}} container
 */
export function hideSkeleton(container) {
    if (!container) return

    // link-profile passes an object with two zone elements
    const roots =
        container.zoneTop || container.zoneMiddle
            ? [container.zoneTop, container.zoneMiddle].filter(Boolean)
            : [container]

    roots.forEach((root) => {
        // Restore hidden real children
        root.querySelectorAll('[data-skeleton-hidden]').forEach((el) => {
            el.style.visibility = ''
            el.style.display = ''
            delete el.dataset.skeletonHidden
        })
        // Remove skeleton bones
        root.querySelectorAll('[data-skeleton]').forEach((el) => el.remove())
    })
}
