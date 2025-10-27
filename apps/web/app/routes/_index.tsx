import type { LoaderFunctionArgs } from 'react-router'
import type { Route } from './+types/_index'
import { redirect } from 'react-router'

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Smulti Downloader' },
        { name: 'description', content: 'Download your links' },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    return redirect('/pt-BR')
}
