import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useCreateJobs } from '../hooks/jobs'
import { useLocale } from '../hooks/locale'

const formDictionary = {
    'en-US': {
        placeholder: 'Paste your links here',
        helperText: 'Enter one or more links separated by commas',
        submitButton: 'Process Links',
        processing: 'Processing',
        errors: {
            emptyLinks: 'Please enter at least one valid link',
        },
    },
    'pt-BR': {
        placeholder: 'Cole seus links aqui',
        helperText: 'Insira um ou mais links separados por vírgulas',
        submitButton: 'Processar Links',
        processing: 'Processando',
        errors: {
            emptyLinks: 'Por favor, insira pelo menos um link válido ',
        },
    },
}

export default function SubmitLinksForm() {
    const locale = useLocale()
    const [inputValue, setInputValue] = useState('')
    const links = useMemo(
        () => (inputValue ? inputValue.split(',') : []),
        [inputValue],
    )
    const createJobs = useCreateJobs()
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const requestId = params.get('requestId')

    const setRequestId = (id: string) => {
        const params = new URLSearchParams(window.location.search)
        navigate(`/${locale}?${params.toString()}&requestId=${id}`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (links.length === 0) {
            toast.error(formDictionary[locale].errors.emptyLinks)
            return
        }
        await createJobs.mutateAsync(
            {
                urls: links,
                requestId,
            },
            {
                onSuccess: (data) => {
                    setRequestId(data.requestId)
                    setInputValue('')
                },
            },
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
                <div className="flex flex-col md:flex-row gap-1 md:gap-0">
                    <Input
                        type="text"
                        placeholder={formDictionary[locale].placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={createJobs.isPending}
                        className="h-9 rounded-r-md md:rounded-r-none focus-visible-ring-2 
                        md:focus-visible:ring-0 bg-background text-sm"
                    />
                    <Button
                        type="submit"
                        disabled={createJobs.isPending}
                        variant="secondary"
                        className="md:rounded-l-none rounded-l-md"
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
