import styles from './component.module.css'
import {
    getCurrentUserProfile,
    updateProfileData,
    updateProfileAvatar,
    migrateGoogleAvatar,
} from '@/services/users'
import { isValidSize } from '@/utils/validation'
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
        // Form submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault()

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

                // Step B: Collect text input data (Saves everything currently in the DOM)
                const textData = {
                    displayName: displayNameInput?.value.trim() || '',
                    username: usernameInput?.value.trim() || '',
                    bio: bioInput?.value.trim() || '',
                }

                // Step C: Run Firestore text profile update service
                await updateProfileData(user.uid, textData)

                window.dialog.show('Profile saved successfully', 'success')

                originalData = { ...textData }
                selectedAvatarFile = null
                if (avatarInput) avatarInput.value = ''

                checkFormChanges()
            } catch (error) {
                console.error('Profile update failed:', error)
                window.dialog.show('An error occurred while saving your profile.', 'error')
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
