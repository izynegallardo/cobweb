import ping from '@/utils/ping'

export default async function Events() {
    try {
        await ping()
    } catch (error) {
        document.querySelector('#under-maintenance').style.display = 'flex'
        document.querySelector('#app').style.display = 'none'
        return
    }

    // TODO: if user is already logged in, redirect to /dashboard
}
