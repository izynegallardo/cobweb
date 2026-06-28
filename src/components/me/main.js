import styles from './component.module.css'

export default function Main(root) {
    root.innerHTML = `
        <section class='${styles['center']}'>
            <div class='${styles['card']}'>

                <div class='${styles['avatar-wrap']}'>
                    <img class='${styles['avatar']}' id="avatar-preview" src="" alt="Profile picture" />
                    <label for="avatar-input" class='${styles['avatar-label']}'>Change photo</label>
                    <input type="file" id="avatar-input" accept="image/*" hidden />
                </div>

                <form id="profile-form" class='${styles['form']}'>
                    <div class='${styles['form-group']}'>
                        <label class='${styles['label']}'>Display name</label>
                        <input
                            type="text"
                            class='${styles['form-input']}'
                            id="displayName"
                            name="displayName"
                            placeholder="Your name"
                        />
                    </div>

                    <div class='${styles['form-group']}'>
                        <label class='${styles['label']}'>Username</label>
                        <div class='${styles['input-prefix-wrap']}'>
                            <span class='${styles['input-prefix']}'>cobweb.app/</span>
                            <input
                                type="text"
                                class='${styles['form-input']}'
                                id="username"
                                name="username"
                                placeholder="username"
                            />
                        </div>
                    </div>

                    <div class='${styles['form-group']}'>
                        <label class='${styles['label']}'>Bio</label>
                        <textarea
                            class='${styles['form-input']} ${styles['textarea']}'
                            id="bio"
                            name="bio"
                            placeholder="A short bio..."
                            maxlength="160"
                            rows="3"
                        ></textarea>
                    </div>

                    <div class='${styles['form-group']}'>
                        <label class='${styles['label']}'>Email</label>
                        <input
                            type="email"
                            class='${styles['form-input']} ${styles['readonly']}'
                            id="email"
                            name="email"
                            placeholder="email@example.com"
                            readonly
                        />
                        <span class='${styles['hint']}'>Email cannot be changed here.</span>
                    </div>

                    <button type="submit" id='save-changes' class='${styles['submit-btn']}'>Save changes</button>
                </form>

                <div class='${styles['back-link']}'>
                    <a href="/dashboard" class='${styles['link']}'>Back to dashboard</a>
                </div>

            </div>
        </section>
    `
    root.className = styles['main']
}
