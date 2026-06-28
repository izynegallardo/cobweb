import Layout from '@/layouts/default'
import Header from '@/components/header/header'
import Main from '@/components/register/main'
import Footer from '@/components/footer/footer'
import Events from '@/components/register/event'

export default function RegisterPage() {
    const { header, main, footer } = Layout(this.root)

    // Header(header)
    Main(main)
    // Footer(footer)

    Events()
}
