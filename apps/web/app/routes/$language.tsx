import { DonateButton } from '@/components/donate-button'
import Downloader from '@/components/downloader'
import { LanguageSelector } from '@/components/language-selector'
import SubmitLinksForm from '@/components/submit-links-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/common/locale'
import { Clock, Download, Music, Shield } from 'lucide-react'
import { Suspense, useState } from 'react'
import { useLoaderData, useParams, type LoaderFunctionArgs } from 'react-router'
import { loadDictionary } from '@/lib/dictionaries/load-dictionary'
import { getJobsByRequestId } from '@/core/api'
export function meta({}: any) {
    return [
        { title: 'Smulti' },
        { name: 'description', content: 'Welcome to Smulti!' },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const requestId = url.searchParams.get('requestId') || undefined

    const queryClient = new QueryClient()
    if (requestId) {
        await queryClient.prefetchQuery({
            queryKey: ['jobs', { requestId }],
            queryFn: () => getJobsByRequestId(requestId),
        })
    }
    return {
        requestId,
        dehydratedState: dehydrate(queryClient),
    }
}

export default function HomePage() {
    const locale = useParams().locale as Locale
    const { dehydratedState } = useLoaderData() as Awaited<
        ReturnType<typeof loader>
    >
    const dictionary = loadDictionary(locale)

    const [pageError, setPageError] = useState<string | undefined>()

    return (
        <main className="bg-card">
            <div className="flex gap-1 absolute right-1/2 translate-x-1/2 top-2 z-10">
                <DonateButton locale={locale} />
                <LanguageSelector />
            </div>
            <section className="h-[75vh] flex w-full justify-center items-center bg-linear-to-r from-[#2e2727] to-[#af2c39] mx-auto py-24 px-4 scroll-mt-16">
                <Card className="w-5xl mx-auto bg-background text-foreground">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl md:text-3xl font-bold">
                            {dictionary.hero.title}
                        </CardTitle>
                        <CardDescription className="text-center text-sm">
                            {dictionary.hero.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SubmitLinksForm setPageError={setPageError} />
                        <Suspense fallback={<LoadingSkeleton />}>
                            <HydrationBoundary state={dehydratedState}>
                                <Downloader setPageError={setPageError} />
                            </HydrationBoundary>
                        </Suspense>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {pageError && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTitle>
                                    {dictionary.error.default}
                                </AlertTitle>
                                <AlertDescription>{pageError}</AlertDescription>
                            </Alert>
                        )}
                    </CardFooter>
                </Card>
            </section>

            <section className="container mx-auto py-8 md:py-14">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-xl md:text-xl font-semibold text-center mb-10">
                        {dictionary.features.title}
                    </h2>
                    <div className="grid md:grid-cols-4 px-5 gap-6 md:gap-8">
                        <FeatureCard
                            icon={<Clock className="h-6 md:h-8 w-6 md:w-8" />}
                            title={dictionary.features.downloadMulti.title}
                            description={
                                dictionary.features.downloadMulti.description
                            }
                        />
                        <FeatureCard
                            icon={<Music className="h-6 md:h-8 w-6 md:w-8" />}
                            title={dictionary.features.createShare.title}
                            description={
                                dictionary.features.createShare.description
                            }
                        />
                        <FeatureCard
                            icon={<Shield className="h-6 md:h-8 w-6 md:w-8" />}
                            title={dictionary.features.protect.title}
                            description={
                                dictionary.features.protect.description
                            }
                        />
                        <FeatureCard
                            icon={
                                <Download className="h-6 md:h-8 w-6 md:w-8" />
                            }
                            title={dictionary.features.simple.title}
                            description={dictionary.features.simple.description}
                        />
                    </div>
                </div>
            </section>

            <section className="container mx-auto mb-16 px-4 ">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl md:text-xl font-semibold text-center mb-10">
                        {dictionary.faq.title}
                    </h2>
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full space-y-3"
                    >
                        {dictionary.faq.items.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-14"
                                    variant="ghost"
                                >
                                    <AccordionTrigger className="text-left">
                                        {item.question}
                                    </AccordionTrigger>
                                </Button>
                                <AccordionContent className="text-xs md:text-sm">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            <footer className="bg-background container mx-auto py-12 px-4 border-t">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="text-sm text-muted-foreground">
                        {dictionary.footer.disclaimer}
                    </p>
                </div>
            </footer>
        </main>
    )
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="bg-muted rounded-lg p-6 shadow-sm border">
            <div className="text-primary mb-4">{icon}</div>
            <h3 className="mg:text-lg font-medium mb-2">{title}</h3>
            <p className="text-xs md:text-base text-muted-foreground">
                {description}
            </p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <Card className="max-w-5xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-6 w-48" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
