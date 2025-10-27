import useDictionary from '@/hooks/dictionary'
import { Heart } from 'lucide-react'
import { Button } from './ui/button'

export function DonateButton() {
    const { donate } = useDictionary()
    return (
        <Button variant={'secondary'} asChild>
            <a href={''} target="_blank">
                <Heart className="text-primary h-4 w-4 mr-2" /> {donate.button}
            </a>
        </Button>
    )
}
