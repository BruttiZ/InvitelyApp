<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InvitelyService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

final class GoApiProxyController extends Controller
{
    public function __construct(private readonly InvitelyService $invitely) {}

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

        if (! $this->invitely->isConfigured()) {
            return response()->json(['error' => 'invitely_api_url_not_configured'], 500);
        }

        try {
            $upstream = $this->invitely->send(
                $method,
                $normalizedPath,
                $request->query(),
                $request->isJson() ? $request->json()->all() : $request->all(),
                $request->header('Authorization'),
            );
        } catch (ConnectionException) {
            return response()->json(['error' => 'invitely_api_unavailable'], 502);
        } catch (InvalidArgumentException) {
            return response()->json(['error' => 'invitely_api_url_invalid'], 500);
        }

        return response($upstream->body(), $upstream->status())
            ->header('Content-Type', $upstream->header('Content-Type'));
    }

    private function isAllowed(string $method, string $path): bool
    {
        return collect(self::ALLOWED_ROUTES[$method] ?? [])
            ->contains(fn (string $pattern): bool => Str::is($pattern, $path));
    }
}
