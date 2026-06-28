import Layout from '@/layouts/default'
import Main from '@/components/setup/main'
import Events from '@/components/setup/event'

export default function SetupPage() {
    const { main } = Layout(this.root)
    Main(main)
    Events()
}
