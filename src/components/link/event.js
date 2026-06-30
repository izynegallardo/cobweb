import styles from './component.module.css'
import CobwebLogo from '@/assets/cobweb-light.svg'
import { auth } from '@/utils/firebase'
import { getProfileByUsername, migrateGoogleAvatar } from '@/services/users'
import { createPublicLinkQueryFn, incrementLinkClick } from '@/services/links'
import { createPaginator } from '@/utils/pagination'
import { showSkeleton, hideSkeleton } from '@/utils/skeleton'

const PAGE_SIZE = 12

export default async function Events(params) {
    try {
        if (auth.currentUser) {
            document.querySelector('#main-header')?.remove()
        }

        const username = params?.username
        if (!username) return

        const section = document.querySelector(`#${styles['user-link']}`)

        // Pass the actual zone elements directly — skeleton.js has no access
        // to the CSS Module hashed class names so we resolve them here.
        const zoneTop = section?.querySelector(`.${styles['zone-top']}`)
        const zoneMiddle = section?.querySelector(`.${styles['zone-middle']}`)
        showSkeleton({ zoneTop, zoneMiddle }, 'link-profile')

        const profile = await getProfileByUsername(username)

        if (!profile) {
            hideSkeleton({ zoneTop, zoneMiddle })
            renderNotFound(section)
            return
        }

        if (auth.currentUser?.uid === profile.uid) {
            const editBtn = document.querySelector(`.${styles['edit-btn']}`)
            if (editBtn) editBtn.style.display = 'flex'

            editBtn.addEventListener('click', () => {
                window.app.pushRoute('/me')
            })
        }

        if (profile.theme) section?.setAttribute('data-theme', profile.theme)

        hideSkeleton({ zoneTop })
        renderProfile(profile)
        await initLinks(profile.uid)
        hideSkeleton({ zoneMiddle })
    } catch (error) {
        console.error('Link Page: failed to load profile:', error)
    }
}

// ── Links with "show more" pagination ────────────────────

async function initLinks(uid) {
    const paginator = createPaginator({
        pageSize: PAGE_SIZE,
        queryFn: createPublicLinkQueryFn(uid, PAGE_SIZE),
    })

    const links = await paginator.nextPage()
    renderLinks(links, uid)

    if (paginator.hasNextPage) {
        renderShowMoreBtn(paginator, uid)
    }
}

function renderShowMoreBtn(paginator, uid) {
    const chainLink = document.querySelector(`.${styles['chain-link']}`)
    if (!chainLink) return

    // Remove stale button if it exists
    document.getElementById('show-more-links')?.remove()

    const btn = document.createElement('button')
    btn.id = 'show-more-links'
    btn.className = styles['show-more-btn']
    btn.type = 'button'
    btn.textContent = 'Show more'

    btn.addEventListener('click', async () => {
        btn.textContent = 'Loading...'
        btn.disabled = true

        await paginator.nextPage()
        // Render ALL fetched items so far — not just the new page
        renderLinks(paginator.getAllFetched(), uid)

        if (paginator.hasNextPage) {
            btn.textContent = 'Show more'
            btn.disabled = false
        } else {
            btn.remove()
        }
    })

    chainLink.after(btn)
}

// ── Render helpers ────────────────────────────────────────

function renderProfile(profile) {
    document.querySelector(`.${styles.fullname}`).textContent = profile.displayName || ''
    document.querySelector(`.${styles.username}`).textContent = `@${profile.username}`
    document.querySelector(`.${styles.bio}`).innerText = profile.bio || ''

    const avatar = document.getElementById('avatar-preview')
    if (avatar) {
        const name = encodeURIComponent(profile.displayName || profile.username || '?')
        const fallbackPhoto = `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&size=128`

        // Google OAuth URLs (lh3.googleusercontent.com) are session-bound
        // and will 403 for any visitor who isn't the owner. Skip them and
        // fall straight to the initials fallback for existing accounts that
        // still have a raw Google URL stored before the Cloudinary migration.
        const isGoogleURL = profile.photoURL?.includes('googleusercontent.com')
        const photoURL = profile.photoURL && !isGoogleURL ? profile.photoURL : fallbackPhoto

        avatar.src = photoURL
        avatar.onerror = () => {
            avatar.src = fallbackPhoto
        }
    }
}

function renderLinks(links, uid) {
    const chainLink = document.querySelector(`.${styles['chain-link']}`)
    if (!chainLink || !Array.isArray(links) || !links.length) {
        const p = document.createElement('p')
        p.textContent = 'No links yet'
        chainLink.appendChild(p)
        return
    }

    chainLink.replaceChildren(
        ...links.map((link) => {
            const a = document.createElement('a')

            try {
                const { protocol } = new URL(link.url)
                a.href = protocol === 'https:' || protocol === 'http:' ? link.url : '#'
            } catch {
                a.href = '#'
            }

            a.target = '_blank'
            a.rel = 'noopener noreferrer'
            a.className = styles['btn-link']

            const iconSpan = document.createElement('span')
            iconSpan.className = styles['link-icon']
            iconSpan.style.background = 'none'

            // Render logo icon if available
            if (link.icon?.primary || link.icon?.fallback) {
                const img = document.createElement('img')
                img.src = link.icon.primary || link.icon.fallback
                img.alt = ''
                img.className = styles['link-icon-img']
                img.setAttribute('aria-hidden', 'true')
                img.setAttribute('loading', 'lazy')
                img.addEventListener('error', () => {
                    if (link.icon.fallback && img.src !== link.icon.fallback) {
                        img.src = link.icon.fallback
                    }
                })
                iconSpan.appendChild(img)
            }

            const titleSpan = document.createElement('span')
            titleSpan.className = styles['link-title']
            titleSpan.textContent = link.title

            // Spacer keeps title visually centred when there's an icon
            const spacer = document.createElement('span')
            spacer.setAttribute('aria-hidden', 'true')

            a.append(iconSpan, titleSpan, spacer)

            // Track click — fire-and-forget, never blocks navigation.
            // Skip if the viewer is the profile owner.
            a.addEventListener('click', () => {
                if (auth.currentUser?.uid === uid) return
                incrementLinkClick(uid, link.id).catch(() => {})
            })

            return a
        }),
    )
}

function renderNotFound(section) {
    document.querySelector('#main-header')?.remove()

    section.style.padding = '0 20px'

    if (section) {
        section.innerHTML = `
            <div id='${styles['user-not-found']}'>
                <div>
                    <img
                        class="${styles['logo-icon-large']}"
                        src="${CobwebLogo}"
                        alt="Cobweb Logo"
                    />
                </div>
                <div class='${styles['message']}'>
                    <h1 class="${styles['headline']}">This user does not exist.</h1>
                    <p class="${styles['cta']}">
                        Want this to be your username?
                        <a href='/auth' class='${styles['link']}'>
                            Create your Cobweb now
                        </a>. 
                    </p>
                </div>

                <div class='${styles['page-footer']}' id='main-footer'>
                    <div class='${styles['footer-container']}'>
                        <div class='${styles['footer-logo']}'>
                            <h2 class="${styles['logo-text']}">
                                <span class="${styles['desktop-letter']}">C</span>
                                <span class="${styles['logo-o']}">
                                    <img
                                        class="${styles['logo-icon']}"
                                        src="${CobwebLogo}"
                                        alt="o"
                                    />
                                </span>
                                <span class="${styles['desktop-letter']}">bweb</span>
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}
