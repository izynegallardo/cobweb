import Layout from '@/layouts/default'
import Main from '@/components/me/main'
import Events from '@/components/me/event'

export default function MePage() {
    const { main } = Layout(this.root)

    Main(main)
    Events()
}
