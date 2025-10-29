export function triggerDownload(link: string, filename: string) {
    const a = document.createElement('a')
    a.href = link
    a.download = filename + '.mp4'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}
