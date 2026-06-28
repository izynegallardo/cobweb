export default async function Events() {
    try {
        await log()
    } catch (error) {
        console.error(error)
    }
}

function log() {
    console.log('Page Not Found Event')
}
