<?php

use Illuminate\Support\Facades\Http;

it('forwards allowed requests to the configured go api', function (): void {
    config([
        'services.invitely.base_url' => 'https://go-api.test',
        'services.invitely.api_key' => 'secret-key',
    ]);

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
        ->getJson('/api/v1/invitely/events')
        ->assertOk()
        ->assertJsonPath('data.0.id', 'evt_123');

    Http::assertSent(fn ($request): bool => $request->url() === 'https://go-api.test/events'
        && $request->hasHeader('Authorization', 'Bearer token-123')
        && $request->hasHeader('x-api-key', 'secret-key'));
});

it('blocks routes that are not in the go api proxy allowlist', function (): void {
    config(['services.invitely.base_url' => 'https://go-api.test']);

    Http::fake();

    $this->getJson('/api/v1/invitely/swagger/doc.json')
        ->assertNotFound()
        ->assertJsonPath('error', 'proxy_route_not_allowed');

    Http::assertNothingSent();
});

it('forwards write requests for events budget and gifts', function (): void {
    config([
        'services.invitely.base_url' => 'https://go-api.test',
        'services.invitely.api_key' => 'secret-key',
    ]);

    Http::fake([
        'go-api.test/events/evt_123' => Http::response(['data' => ['id' => 'evt_123', 'title' => 'Atualizado']]),
        'go-api.test/events/evt_123/budget' => Http::response(['data' => ['id' => 'bud_123']], 201),
        'go-api.test/events/evt_123/reminders' => Http::response(['data' => ['queued' => 2, 'status' => 'sent']], 202),
        'go-api.test/gifts/gft_123' => Http::response('', 204),
    ]);

    $this->withHeader('Authorization', 'Bearer token-123')
        ->putJson('/api/v1/invitely/events/evt_123', [
            'title' => 'Atualizado',
            'description' => 'Descricao',
            'starts_at' => '2026-07-20T19:00:00Z',
            'ends_at' => '2026-07-20T23:00:00Z',
            'location' => 'Sao Paulo',
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Atualizado');

    $this->withHeader('Authorization', 'Bearer token-123')
        ->postJson('/api/v1/invitely/events/evt_123/budget', [
            'description' => 'Buffet',
            'category' => 'Alimentacao',
            'amount' => 2500,
            'paid' => false,
        ])
        ->assertCreated();

    $this->withHeader('Authorization', 'Bearer token-123')
        ->postJson('/api/v1/invitely/events/evt_123/reminders', [
            'from_email' => 'organizador@example.com',
            'recipients' => ['convidado1@example.com', 'convidado2@example.com'],
            'subject' => 'Lembrete',
            'message' => 'Confirme sua presenca.',
        ])
        ->assertAccepted()
        ->assertJsonPath('data.queued', 2);

    $this->withHeader('Authorization', 'Bearer token-123')
        ->deleteJson('/api/v1/invitely/gifts/gft_123')
        ->assertNoContent();

    Http::assertSent(fn ($request): bool => $request->hasHeader('x-api-key', 'secret-key'));
});

it('rejects insecure go api urls in production', function (): void {
    app()->detectEnvironment(fn () => 'production');
    config(['services.invitely.base_url' => 'http://localhost:8080']);

    Http::fake();

    $this->getJson('/api/v1/invitely/health')
        ->assertStatus(500)
        ->assertJsonPath('error', 'invitely_api_url_invalid');

    Http::assertNothingSent();
});
