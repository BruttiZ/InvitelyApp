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

it('forwards write requests for events budget and gifts', function (): void {
    config(['services.go_api.url' => 'https://go-api.test']);

    Http::fake([
        'go-api.test/events/evt_123' => Http::response(['data' => ['id' => 'evt_123', 'title' => 'Atualizado']]),
        'go-api.test/events/evt_123/budget' => Http::response(['data' => ['id' => 'bud_123']], 201),
        'go-api.test/gifts/gft_123' => Http::response('', 204),
    ]);

    $this->withHeader('Authorization', 'Bearer token-123')
        ->putJson('/api/v1/go/events/evt_123', [
            'title' => 'Atualizado',
            'description' => 'Descricao',
            'starts_at' => '2026-07-20T19:00:00Z',
            'ends_at' => '2026-07-20T23:00:00Z',
            'location' => 'Sao Paulo',
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Atualizado');

    $this->withHeader('Authorization', 'Bearer token-123')
        ->postJson('/api/v1/go/events/evt_123/budget', [
            'description' => 'Buffet',
            'category' => 'Alimentacao',
            'amount' => 2500,
            'paid' => false,
        ])
        ->assertCreated();

    $this->withHeader('Authorization', 'Bearer token-123')
        ->deleteJson('/api/v1/go/gifts/gft_123')
        ->assertNoContent();
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
