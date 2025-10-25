export async function handleApiResponse(res: Response) {
    const data = await res.json()
    if (!res.ok || data?.error) {
        const error = data?.error
        const err = {
            code: error.code || 'unknown_error',
            message: error.message || '',
            status: data?.status || res.status,
        }
        throw err
    }

    return data
}
