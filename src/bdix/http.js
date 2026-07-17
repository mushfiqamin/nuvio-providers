/**
 * HTTP Utilities
 * Pure production implementations for the Nuvio dynamic engine environment.
 */

export const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json"
};

export async function fetchText(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            ...HEADERS,
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    return await response.text();
}

export async function fetchJson(url, options = {}) {
    const raw = await fetchText(url, options);
    return JSON.parse(raw);
}

export async function postJson(url, data, options = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            ...HEADERS,
            ...options.headers
        },
        body: JSON.stringify(data),
        ...options
    });

    if (!response.ok) {
        throw new Error(`POST error ${response.status}`);
    }

    const raw = await response.text();
    return JSON.parse(raw);
}

export function formatEpisodeNumber(season, episode) {
    const s = String(season).padStart(2, '0');
    const e = String(episode).padStart(2, '0');
    return `S${s}E${e}`;
}