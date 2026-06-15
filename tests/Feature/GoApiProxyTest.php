<?php

use Illuminate\Support\Facades\Http;

it('forwards allowed requests to the configured go api', function (): void {
    config(['services.go_api.url' => 'https://go-api.test']);

    Http::fake([
        'go-api.test/events' => Http::response([
            'data' => [
                [
                    'id' => 'evt_123',
                    'title' => 'Formatura',
                    'starts_at' => '2026-07-23T19:00:00Z',
                    'location' => 'Sao Paulo',
                ],
            ],
        ]),
    ]);

    $this->withHeader('Authorization', 'Bearer token-123')
        ->getJson('/api/v1/go/events')
        ->assertOk()
        ->assertJsonPath('data.0.id', 'evt_123');

    Http::assertSent(fn ($request): bool => $request->url() === 'https://go-api.test/events'
        && $request->hasHeader('Authorization', 'Bearer token-123'));
});

it('blocks routes that are not in the go api proxy allowlist', function (): void {
    config(['services.go_api.url' => 'https://go-api.test']);

    Http::fake();

    $this->getJson('/api/v1/go/swagger/doc.json')
        ->assertNotFound()
        ->assertJsonPath('error', 'proxy_route_not_allowed');

    Http::assertNothingSent();
});

it('rejects insecure go api urls in production', function (): void {
    app()->detectEnvironment(fn () => 'production');
    config(['services.go_api.url' => 'http://localhost:8080']);

    Http::fake();

    $this->getJson('/api/v1/go/health')
        ->assertStatus(500)
        ->assertJsonPath('error', 'go_api_url_invalid');

    Http::assertNothingSent();
});
