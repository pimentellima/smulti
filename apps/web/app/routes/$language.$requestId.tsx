import { getJobsByRequestId } from '@/core/api'
import HomePage from '@/home/home-page'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { LoaderFunctionArgs, useLoaderData } from 'react-router'
export function meta({}: any) {
    return [
        { title: 'Smulti' },
        { name: 'description', content: 'Welcome to Smulti!' },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const requestId = params.requestId

    const queryClient = new QueryClient()
    if (requestId) {
        await queryClient.prefetchQuery({
            queryKey: ['jobs', { requestId }],
            queryFn: () => getJobsByRequestId(requestId),
        })
    }
    return {
        dehydratedState: dehydrate(queryClient),
    }
}

export default function Page() {
    const { dehydratedState } = useLoaderData() as Awaited<
        ReturnType<typeof loader>
    >

    return (
        <HydrationBoundary state={dehydratedState}>
            <HomePage />
        </HydrationBoundary>
    )
}
