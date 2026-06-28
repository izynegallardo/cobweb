import Layout from '@/layouts/default'
import Header from '@/components/pageNotFound/header'
import Main from '@/components/pageNotFound/main'
import Footer from '@/components/pageNotFound/footer'
import Events from '@/components/pageNotFound/event'

export default function PageNotFoundPage() {
    const { header, main, footer } = Layout(this.root)

    // Header(header)
    Main(main)
    // Footer(footer)

    Events()
}
