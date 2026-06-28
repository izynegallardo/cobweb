import '@/styles/common.css'
import dialog from '@/components/dialog/dialog'
import modal from '@/components/modal/modal'
import SPA from '@/core/spa.js'

import { auth } from '@/utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'

import HomePage from '@/pages/home'
import PageNotFoundPage from '@/pages/pageNotFound.js'
import AuthPage from '@/pages/auth'
import SetupPage from '@/pages/setup'
import DashboardPage from '@/pages/dashboard'
import MePage from '@/pages/me'
import LinkPage from '@/pages/link'

const app = new SPA({
    root: document.querySelector('#app'),
    defaultRoute: PageNotFoundPage,
})

window.app = app
dialog.init()
window.dialog = dialog
modal.init()
window.modal = modal

app.add('/', HomePage, false, true)
app.add('/auth', AuthPage, false, true)
app.add('/setup', SetupPage, true) // protected, not guestOnly
app.add('/dashboard', DashboardPage, true)
app.add('/me', MePage, true)

// Public profile — must be last, acts as catch-all for /:username
app.add(/^\/(?<username>[a-z0-9_.]+)$/, LinkPage)

// Wait for Firebase to resolve auth state before starting the SPA.
// Without this, auth.currentUser is null on cold load even for logged-in users.
const unsubscribe = onAuthStateChanged(auth, () => {
    unsubscribe()
    app.handleRouteChanges()
})
