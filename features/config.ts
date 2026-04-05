const normalizedBaseUrl = (process.env.BASE_URL ?? "").trim().replace(/\/+$/, "");

export const apiConfig = {
    base_url: normalizedBaseUrl,
    request_headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.API_KEY ?? "",
    }
}

export const isApiConfigured = normalizedBaseUrl.length > 0;
