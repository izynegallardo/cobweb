import Layout from '@/layouts/default'
import Main from '@/components/dashboard/main'
import Events from '@/components/dashboard/event'

export default function DashboardPage() {
    const { main } = Layout(this.root)

    Main(main)
    Events()
}
