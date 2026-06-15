const hopByHopHeaders = new Set([
    'connection',
    'content-length',
    'expect',
    'host',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'x-forwarded-host',
    'x-forwarded-proto',
]);

function normalizeBaseUrl(value) {
    return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function isSecureProductionUrl(value) {
    if (!value) {
        return false;
    }

    try {
        const url = new URL(value);

        return url.protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
    } catch {
        return false;
    }
}

function forwardHeaders(headers) {
    const forwarded = {};

    for (const [key, value] of Object.entries(headers)) {
        const normalizedKey = key.toLowerCase();

        if (!hopByHopHeaders.has(normalizedKey) && typeof value !== 'undefined') {
            forwarded[key] = Array.isArray(value) ? value.join(',') : value;
        }
    }

    forwarded.Accept = forwarded.Accept || 'application/json';

    return forwarded;
}

function responseHeaders(headers) {
    const forwarded = {};

    headers.forEach((value, key) => {
        if (!hopByHopHeaders.has(key.toLowerCase())) {
            forwarded[key] = value;
        }
    });

    return forwarded;
}

export default async function handler(request, response) {
    const baseUrl = normalizeBaseUrl(process.env.LARAVEL_API_URL);

    if (!baseUrl) {
        response.status(503).json({
            message: 'Backend Laravel nao configurado. Defina LARAVEL_API_URL na Vercel apontando para o backend Laravel em producao.',
        });

        return;
    }

    if (!isSecureProductionUrl(baseUrl)) {
        response.status(503).json({
            message: 'LARAVEL_API_URL deve ser uma URL HTTPS publica do backend Laravel em producao.',
        });

        return;
    }

    const originalUrl = new URL(request.url || '/', 'https://invitely.local');
    const targetUrl = new URL(originalUrl.pathname + originalUrl.search, baseUrl);
    const method = request.method || 'GET';
    const hasBody = !['GET', 'HEAD'].includes(method);

    const upstreamResponse = await fetch(targetUrl, {
        method,
        headers: forwardHeaders(request.headers),
        body: hasBody ? request : undefined,
        duplex: hasBody ? 'half' : undefined,
        redirect: 'manual',
    });

    response.writeHead(upstreamResponse.status, responseHeaders(upstreamResponse.headers));

    if (upstreamResponse.body) {
        const body = Buffer.from(await upstreamResponse.arrayBuffer());
        response.end(body);

        return;
    }

    response.end();
}
