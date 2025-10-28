import { useCancelJob } from '@/hooks/jobs'
import { Button } from './ui/button'
import useDictionary from '@/hooks/dictionary'
import { XIcon } from 'lucide-react'

export default function CancelJobButton({ jobId }: { jobId: string }) {
    const { mutate, isPending } = useCancelJob(jobId)
    const dictionary = useDictionary()

    return (
        <Button
            disabled={isPending}
            title={dictionary.actions.cancel}
            onClick={() => mutate()}
            variant={'outline'}
        >
            <XIcon />
        </Button>
    )
}
