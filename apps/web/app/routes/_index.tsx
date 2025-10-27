import type { Route } from './+types/_index'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Smulti Downloader' },
        { name: 'description', content: 'Download your links' },
    ]
}

export default function Home() {
    return <div>Olá mundo</div>
}
