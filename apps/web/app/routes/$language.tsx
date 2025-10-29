import HomePage from '@/home/home-page'

export function meta({}: any) {
    return [
        { title: 'Smulti' },
        { name: 'description', content: 'Welcome to Smulti!' },
    ]
}

export default function Page() {
    return <HomePage />
}
