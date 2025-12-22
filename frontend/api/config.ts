export const apiConfig = {
    base_url: process.env.BASE_URL ?? "",
    request_headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.API_KEY ?? "",
    }
}