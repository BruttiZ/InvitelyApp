const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const apiVersionPrefix = '/api/v1';

export function apiUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return configuredApiUrl ? `${configuredApiUrl}${normalizedPath}` : normalizedPath;
}

export function apiV1Url(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (normalizedPath.startsWith(`${apiVersionPrefix}/`)) {
        return apiUrl(normalizedPath);
    }

    return apiUrl(`${apiVersionPrefix}${normalizedPath}`);
}

export function authHeaders(token: string): HeadersInit {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}
