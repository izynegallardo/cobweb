import Layout from '@/layouts/default'
import Header from '@/components/header/header'
import Main from '@/components/link/main'
import Events from '@/components/link/event'

export default function LinkPage(params) {
    const { header, main } = Layout(this.root)

    Header(header)
    Main(main)

    Events(params)
}
