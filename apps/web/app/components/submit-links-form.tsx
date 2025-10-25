import { useCreateJobs } from '../hooks/jobs'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocale } from '../hooks/locale'

const formDictionary = {
    'en-US': {
        placeholder: 'Paste your links here',
        helperText: 'Enter one or more links separated by commas',
        submitButton: 'Process Links',
        processing: 'Processing',
        errors: {
            emptyLinks: 'Please enter at least one valid link',
            invalidLinks: 'All links must be valid URLs',
        },
    },
    'pt-BR': {
        placeholder: 'Cole seus links aqui',
        helperText: 'Insira um ou mais links separados por vírgulas',
        submitButton: 'Processar Links',
        processing: 'Processando',
        errors: {
            emptyLinks: 'Por favor, insira pelo menos um link válido ',
            invalidLinks: 'Todos os links devem ser URLs válidas ',
        },
    },
}
interface SubmitLinksFormProps {
    setPageError: (error: string | undefined) => void
}
export default function SubmitLinksForm({
    setPageError,
}: SubmitLinksFormProps) {
    const locale = useLocale()
    const [inputValue, setInputValue] = useState('')
    const links = useMemo(
        () => (inputValue ? inputValue.split(',') : []),
        [inputValue],
    )
    const createJobs = useCreateJobs()
    const [params, setParams] = useSearchParams()
    const requestId = params.get('requestId')

    const setRequestId = (id: string) => {
        setParams({ requestId: id })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (links.length === 0) {
            setPageError?.(formDictionary[locale].errors.emptyLinks)
            return
        }
        const result = await createJobs.mutateAsync(
            {
                urls: links,
                requestId,
            },
            {
                onError: (err) => {
                    setPageError?.(formDictionary[locale].errors.invalidLinks)
                    console.error('Error processing links:', err)
                },
            },
        )
        if (result.requestId !== requestId) {
            setRequestId(result.requestId)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
                    <Input
                        type="text"
                        placeholder={formDictionary[locale].placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={createJobs.isPending}
                        className="h-9 rounded-r-md sm:rounded-r-none focus-visible-ring-2 sm:focus-visible:ring-0 bg-background
                        text-sm"
                    />
                    <Button
                        type="submit"
                        disabled={createJobs.isPending}
                        variant="secondary"
                        className="sm:rounded-l-none rounded-l-md"
                    >
                        {createJobs.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {formDictionary[locale].processing}
                            </>
                        ) : (
                            formDictionary[locale].submitButton
                        )}
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                    {formDictionary[locale].helperText}
                </div>
            </div>
        </form>
    )
}
