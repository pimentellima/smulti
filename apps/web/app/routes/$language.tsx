import { DonateButton } from '@/components/donate-button'
import { JobsTable } from '@/components/jobs-table'
import { LanguageSelector } from '@/components/language-selector'
import SubmitLinksForm from '@/components/submit-links-form'
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
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { getJobsByRequestId } from '@/core/api'
import useDictionary from '@/hooks/dictionary'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { Clock, Download, Music, Shield } from 'lucide-react'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
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
    const { dehydratedState } = useLoaderData() as Awaited<
        ReturnType<typeof loader>
    >
    const dictionary = useDictionary()

    return (
        <main className="bg-card">
            <section className="py-4 pb-14 px-4 w-full bg-linear-to-r from-[#2e2727] to-[#af2c39]">
                <div className="mx-auto flex flex-col gap-3 items-center ">
                    <div className="flex items-center gap-1">
                        <DonateButton />
                        <LanguageSelector />
                    </div>
                    <Card className="text-foreground bg-background my-auto xl:w-5xl">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl md:text-3xl font-bold">
                                {dictionary.hero.title}
                            </CardTitle>
                            <CardDescription className="text-center text-sm">
                                {dictionary.hero.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SubmitLinksForm />
                            <HydrationBoundary state={dehydratedState}>
                                <JobsTable />
                            </HydrationBoundary>
                        </CardContent>
                    </Card>
                </div>
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
                                <AccordionTrigger className="text-wrap text-left">
                                    {item.question}
                                </AccordionTrigger>
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
