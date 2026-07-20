import styles from './component.module.css'
import {
    getCurrentUserProfile,
    updateProfileData,
    updateProfileAvatar,
    migrateGoogleAvatar,
    updateUsername,
} from '@/services/users'
import { isUsernameTaken } from '@/services/auth'
import { isValidSize, isValidUsername } from '@/utils/validation'
import { UsernameTakenError } from '@/utils/errors'
import { showSkeleton, hideSkeleton } from '@/utils/skeleton'

export default async function Events() {
    try {
        // .card is the form's wrapping container in me/main.js
        const card = document.querySelector(`.${styles['card']}`)
        showSkeleton(card, 'profile-form')

        const user = await getCurrentUserProfile()

        hideSkeleton(card)

        const displayNameInput = document.querySelector('#displayName')
        const usernameInput = document.querySelector('#username')
        const usernameError = document.querySelector('#username-error')
        const bioInput = document.querySelector('#bio')
        const emailInput = document.querySelector('#email')
        const avatarPreview = document.querySelector('#avatar-preview')
        const avatarInput = document.querySelector('#avatar-input')
        const form = document.querySelector('#profile-form')
        const saveButton = document.querySelector('#save-changes')

        if (saveButton) saveButton.disabled = true

        let selectedAvatarFile = null
        let originalData = {
            displayName: '',
            username: '',
            bio: '',
        }

        function setAvatarBackground(url) {
            if (!avatarPreview) return
            avatarPreview.src = url
        }

        if (user) {
            // Cache original values
            originalData.displayName = user.displayName || ''
            originalData.username = user.username || ''
            originalData.bio = user.bio || ''

            if (displayNameInput) displayNameInput.value = user.displayName || ''
            if (usernameInput) usernameInput.value = user.username || ''
            if (bioInput) bioInput.value = user.bio || ''
            if (emailInput) emailInput.value = user.email || ''

            if (user.photoURL) {
                const isGoogleURL = user.photoURL.includes('googleusercontent.com')
                if (isGoogleURL) {
                    // Show immediately via blob (session cookies make this work),
                    // then migrate to Cloudinary in the background so the public
                    // link page can display it on next load.
                    fetch(user.photoURL)
                        .then((res) => (res.ok ? res.blob() : null))
                        .then((blob) => {
                            if (!blob) return
                            setAvatarBackground(URL.createObjectURL(blob))
                            // Fire-and-forget migration
                            migrateGoogleAvatar(user.uid, user.photoURL)
                        })
                        .catch(() => {})
                } else {
                    setAvatarBackground(user.photoURL)
                }
            }
        }

        function checkFormChanges() {
            if (!saveButton) return

            // Has a new image successfully bypassed the size validation guard?
            const hasAvatarChanged = selectedAvatarFile !== null

            // Do the text fields differ from what's stored in Firestore?
            const hasTextChanged =
                displayNameInput?.value.trim() !== originalData.displayName ||
                usernameInput?.value.trim() !== originalData.username ||
                bioInput?.value.trim() !== originalData.bio

            // Enable button if ANYTHING changed. Otherwise, keep it locked.
            if (hasAvatarChanged || hasTextChanged) {
                saveButton.disabled = false // CSS automatically handles the hover pointer now!
            } else {
                saveButton.disabled = true // CSS automatically switches to "not-allowed"!
            }
        }

        ;[displayNameInput, usernameInput, bioInput].forEach((input) => {
            input?.addEventListener('input', checkFormChanges)
        })

        // Clear the inline username error as soon as the user edits the field again,
        // so a stale "already taken" message doesn't linger after they change it.
        usernameInput?.addEventListener('input', () => {
            if (usernameError) usernameError.textContent = ''
        })

        // Avatar preview
        avatarInput?.addEventListener('change', () => {
            const file = avatarInput.files[0]
            if (!file) return

            if (!isValidSize(file)) {
                avatarInput.value = ''
                selectedAvatarFile = null
                checkFormChanges()
                return
            }

            selectedAvatarFile = file
            checkFormChanges()

            const reader = new FileReader()
            reader.onload = (e) => {
                setAvatarBackground(e.target.result)
            }
            reader.readAsDataURL(file)
        })

        // Form submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault()

            if (usernameError) usernameError.textContent = ''

            const rawUsername = usernameInput?.value.trim() || ''
            const normalizedUsername = rawUsername.toLowerCase()
            const usernameChanged = normalizedUsername !== originalData.username.toLowerCase()

            // Guard clause: validate BEFORE writing anything, so a bad username
            // never leaves the avatar/displayName/bio partially saved.
            if (usernameChanged) {
                if (!isValidUsername(normalizedUsername)) {
                    if (usernameError) {
                        usernameError.textContent =
                            '3-20 characters. Letters, numbers, and underscores only.'
                    }
                    return
                }

                // Fast-path UX check. Not authoritative — updateUsername() re-checks
                // availability inside a transaction, so a concurrent claim between
                // this check and the write below still fails safely (caught below).
                if (await isUsernameTaken(normalizedUsername)) {
                    if (usernameError) usernameError.textContent = 'Username is already taken.'
                    return
                }
            }

            const originalButtonText = saveButton ? saveButton.textContent : 'Save'

            try {
                if (saveButton) {
                    saveButton.disabled = true
                    saveButton.textContent = 'Saving...'
                }
                // Step A: Run Cloudinary upload service ONLY if a file was changed
                if (selectedAvatarFile) {
                    await updateProfileAvatar(user.uid, selectedAvatarFile)
                }

                // Step B: Collect text input data (displayName/bio only — username
                // is handled separately below via the transactional rename path)
                const textData = {
                    displayName: displayNameInput?.value.trim() || '',
                    bio: bioInput?.value.trim() || '',
                }

                // Step C: Run Firestore text profile update service
                await updateProfileData(user.uid, textData)

                // Step D: Rename, if the username actually changed. Keeps the
                // usernames/{username} reservation doc in sync with users/{uid}.username
                // so the public /:username page keeps resolving correctly.
                if (usernameChanged) {
                    await updateUsername(user.uid, normalizedUsername, originalData.username)
                }

                window.dialog.show('Profile saved successfully', 'success')

                originalData = {
                    ...textData,
                    username: usernameChanged ? normalizedUsername : originalData.username,
                }
                if (usernameInput) usernameInput.value = originalData.username
                selectedAvatarFile = null
                if (avatarInput) avatarInput.value = ''

                checkFormChanges()
            } catch (error) {
                if (error instanceof UsernameTakenError) {
                    if (usernameError) usernameError.textContent = 'Username is already taken.'
                } else {
                    console.error('Profile update failed:', error)
                    window.dialog.show('An error occurred while saving your profile.', 'error')
                }
                if (saveButton) saveButton.disabled = false
            } finally {
                if (saveButton) {
                    saveButton.textContent = originalButtonText
                }
            }
        })
    } catch (error) {
        console.error('Me Page: failed to load current user:', error)
    }
}
