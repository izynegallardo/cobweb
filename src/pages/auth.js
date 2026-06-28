import Layout from '@/layouts/default'
import Main from '@/components/auth/main'
import Events from '@/components/auth/event'

export default function AuthPage() {
    const { main } = Layout(this.root)

    Main(main)

    Events()
}
