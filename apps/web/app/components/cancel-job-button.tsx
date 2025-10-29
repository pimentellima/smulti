import { useCancelJob } from '@/hooks/jobs'
import { Button } from './ui/button'
import useDictionary from '@/hooks/dictionary'
import { XIcon } from 'lucide-react'
import { Job } from '@/common/types'

export default function CancelJobButton({ job }: { job: Job }) {
    const { mutate, isPending } = useCancelJob()
    const dictionary = useDictionary()

    return (
        <Button
            disabled={isPending}
            title={dictionary.actions.cancel}
            onClick={() => mutate(job)}
            variant={'outline'}
        >
            <XIcon />
        </Button>
    )
}
