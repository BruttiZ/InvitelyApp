<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class GoApiProxyController extends Controller
{
    /**
     * @var array<string, array<int, string>>
     */
    private const ALLOWED_ROUTES = [
        'GET' => [
            'health',
            'auth/me',
            'events',
            'events/*',
            'events/*/budget',
            'events/*/gifts',
            'guests',
            'dashboard',
            'analytics/events/*',
        ],
        'POST' => [
            'auth/login',
            'auth/register',
            'events',
            'events/*/budget',
            'events/*/gifts',
            'events/*/reminders',
            'guests',
            'rsvp',
        ],
        'PUT' => [
            'events/*',
            'budget/*',
            'gifts/*',
        ],
        'PATCH' => [
            'events/*',
            'budget/*',
            'gifts/*',
        ],
        'DELETE' => [
            'events/*',
            'budget/*',
            'gifts/*',
        ],
    ];

    public function __invoke(Request $request, ?string $path = null): Response|JsonResponse
    {
        $method = strtoupper($request->method());
        $normalizedPath = trim((string) $path, '/');

        if (! $this->isAllowed($method, $normalizedPath)) {
            return response()->json(['error' => 'proxy_route_not_allowed'], 404);
        }

        $baseUrl = rtrim((string) config('services.go_api.url'), '/');

        if ($baseUrl === '') {
            return response()->json(['error' => 'go_api_url_not_configured'], 500);
        }

        if (! $this->isValidBaseUrl($baseUrl)) {
            return response()->json(['error' => 'go_api_url_invalid'], 500);
        }

        try {
            $options = ['query' => $request->query()];

            if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
                $options['json'] = $request->isJson() ? $request->json()->all() : $request->all();
            }

            $upstream = Http::timeout((int) config('services.go_api.timeout', 10))
                ->acceptJson()
                ->withHeaders($this->forwardHeaders($request))
                ->send($method, "{$baseUrl}/{$normalizedPath}", $options);
        } catch (ConnectionException) {
            return response()->json(['error' => 'go_api_unavailable'], 502);
        }

        return response($upstream->body(), $upstream->status())
            ->header('Content-Type', $upstream->header('Content-Type'));
    }

    private function isAllowed(string $method, string $path): bool
    {
        return collect(self::ALLOWED_ROUTES[$method] ?? [])
            ->contains(fn (string $pattern): bool => Str::is($pattern, $path));
    }

    private function isValidBaseUrl(string $baseUrl): bool
    {
        $host = parse_url($baseUrl, PHP_URL_HOST);
        $scheme = parse_url($baseUrl, PHP_URL_SCHEME);

        if (! is_string($host) || $host === '' || ! is_string($scheme)) {
            return false;
        }

        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        if (App::isProduction()) {
            return $scheme === 'https'
                && ! in_array($host, ['localhost', '127.0.0.1', '0.0.0.0'], true);
        }

        return true;
    }

    /**
     * @return array<string, string>
     */
    private function forwardHeaders(Request $request): array
    {
        $headers = [];
        $authorization = $request->header('Authorization');
        $apiKey = config('services.go_api.api_key');

        if (is_string($authorization) && $authorization !== '') {
            $headers['Authorization'] = $authorization;
        }

        if (is_string($apiKey) && $apiKey !== '') {
            $headers['x-api-key'] = $apiKey;
        }

        return $headers;
    }
}
