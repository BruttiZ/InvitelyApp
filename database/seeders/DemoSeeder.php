<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\EventTemplate;
use App\Models\Guest;
use App\Models\PublicRsvpOtp;
use App\Models\Rsvp;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserEmailVerificationCode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = $this->tenant();
        $users = $this->users($tenant);
        $template = $this->template($tenant);
        $event = $this->event($tenant, $template);
        $guests = $this->guests($event);

        $this->rsvps($event, $guests);
        $this->checkIns($event, $guests, $users['owner']);
        $this->otps($event, $users['guest']);
        $this->auditLogs($tenant, $event, $users['owner']);
        Cache::forget('events.public.'.$event->slug);

        $this->command?->info('Demo data ready.');
        $this->command?->line('Owner login: owner@invitely.local / password');
        $this->command?->line('Guest login: guest@invitely.local / password');
        $this->command?->line('Public event: /events/invitely-launch-night');
        $this->command?->line('Demo invite token: demo-invite-token');
    }

    private function tenant(): Tenant
    {
        return Tenant::query()->updateOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Invitely Demo',
                'domain' => null,
                'plan' => 'community',
                'settings' => [
                    'locale' => 'pt_BR',
                    'timezone' => 'America/Sao_Paulo',
                    'features' => [
                        'public_rsvp' => true,
                        'check_in' => true,
                        'local_auth' => true,
                    ],
                ],
            ],
        );
    }

    /**
     * @return array{owner: User, guest: User, admin: User}
     */
    private function users(Tenant $tenant): array
    {
        $password = Hash::make((string) env('INVITELY_DEMO_PASSWORD', 'password'));

        $owner = User::query()->updateOrCreate(
            ['email' => 'owner@invitely.local'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Marina Alves',
                'password' => $password,
                'role' => 'owner',
                'email_verified_at' => now(),
                'settings' => [
                    'organization' => 'Invitely Demo',
                    'timezone' => 'America/Sao_Paulo',
                    'language' => 'pt-BR',
                ],
                'notification_preferences' => [
                    'emailRsvp' => true,
                    'emailReminders' => true,
                    'weeklySummary' => true,
                    'marketing' => false,
                    'quietHoursStart' => '22:00',
                    'quietHoursEnd' => '08:00',
                ],
                'privacy_preferences' => [
                    'profileVisibility' => 'team',
                    'showEmailToGuests' => false,
                    'allowGuestMessages' => true,
                    'analyticsConsent' => true,
                    'dataRetention' => '24_months',
                ],
            ],
        );

        $guest = User::query()->updateOrCreate(
            ['email' => 'guest@invitely.local'],
            [
                'tenant_id' => null,
                'name' => 'Ana Convidada',
                'password' => $password,
                'role' => 'guest',
                'email_verified_at' => now(),
                'settings' => [
                    'organization' => null,
                    'timezone' => 'America/Sao_Paulo',
                    'language' => 'pt-BR',
                ],
            ],
        );

        $admin = User::query()->updateOrCreate(
            ['email' => 'platform@invitely.local'],
            [
                'tenant_id' => null,
                'name' => 'Admin Plataforma',
                'password' => $password,
                'role' => 'platform_admin',
                'email_verified_at' => now(),
                'settings' => [
                    'organization' => 'Invitely',
                    'timezone' => 'America/Sao_Paulo',
                    'language' => 'pt-BR',
                ],
            ],
        );

        return ['owner' => $owner, 'guest' => $guest, 'admin' => $admin];
    }

    private function template(Tenant $tenant): EventTemplate
    {
        return EventTemplate::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'premium-evening'],
            [
                'name' => 'Premium Evening',
                'category' => 'premium',
                'tokens' => [
                    'colors' => [
                        'background' => '#060B1A',
                        'surface' => '#121827',
                        'primary' => '#8B5CF6',
                        'accent' => '#22D3EE',
                    ],
                    'typography' => [
                        'heading' => 'Inter',
                        'body' => 'Inter',
                    ],
                ],
                'schema' => [
                    'sections' => ['hero', 'schedule', 'gallery', 'rsvp'],
                    'supports_gallery' => true,
                    'supports_playlist' => true,
                ],
                'is_public' => true,
            ],
        );
    }

    private function event(Tenant $tenant, EventTemplate $template): Event
    {
        return Event::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'invitely-launch-night'],
            [
                'template_id' => $template->id,
                'name' => 'Invitely Launch Night',
                'status' => 'published',
                'timezone' => 'America/Sao_Paulo',
                'starts_at' => Carbon::now('America/Sao_Paulo')->addDays(45)->setTime(19, 30),
                'ends_at' => Carbon::now('America/Sao_Paulo')->addDays(46)->setTime(1, 0),
                'venue_name' => 'Atelier Vista',
                'address' => 'Av. Paulista, 1000 - Sao Paulo, SP',
                'latitude' => -23.561684,
                'longitude' => -46.655981,
                'spotify_playlist_url' => 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
                'hero' => [
                    'eyebrow' => 'Convite digital',
                    'title' => 'Invitely Launch Night',
                    'subtitle' => 'Uma noite para testar RSVP, convidados e check-in local sem Supabase.',
                    'image_url' => 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=80',
                ],
                'content' => [
                    'hosts' => ['Equipe Invitely'],
                    'schedule' => [
                        ['time' => '19:30', 'title' => 'Recepcao e welcome drinks'],
                        ['time' => '20:30', 'title' => 'Apresentacao do produto'],
                        ['time' => '21:30', 'title' => 'Celebracao e networking'],
                    ],
                    'dress_code' => 'Smart casual',
                    'note' => 'Use seu QR Code na entrada para testar o check-in.',
                ],
                'theme' => [
                    'mode' => 'dark',
                    'primary' => '#8B5CF6',
                    'accent' => '#22D3EE',
                ],
                'gallery' => [
                    ['url' => 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Mesas preparadas para evento'],
                    ['url' => 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Luzes de celebracao'],
                    ['url' => 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80', 'alt' => 'Ambiente premium'],
                ],
                'seo' => [
                    'title' => 'Invitely Launch Night',
                    'description' => 'Evento demo local com RSVP e check-in por QR Code.',
                ],
                'capacity' => 180,
            ],
        );
    }

    /**
     * @return array<string, Guest>
     */
    private function guests(Event $event): array
    {
        $rows = [
            'ana' => [
                'name' => 'Ana Convidada',
                'email' => 'ana.convidada@example.com',
                'phone' => '+55 11 90000-0001',
                'status' => 'accepted',
                'party_size' => 2,
                'max_companions' => 3,
                'invite_token' => 'demo-invite-token',
                'metadata' => ['segment' => 'family', 'source' => 'demo'],
            ],
            'bruno' => [
                'name' => 'Bruno Lima',
                'email' => 'bruno.lima@example.com',
                'phone' => '+55 11 90000-0002',
                'status' => 'accepted',
                'party_size' => 1,
                'max_companions' => 1,
                'invite_token' => 'demo-invite-token-bruno',
                'metadata' => ['segment' => 'friends', 'source' => 'demo'],
            ],
            'carla' => [
                'name' => 'Carla Rocha',
                'email' => 'carla.rocha@example.com',
                'phone' => '+55 11 90000-0003',
                'status' => 'declined',
                'party_size' => 1,
                'max_companions' => 2,
                'invite_token' => 'demo-invite-token-carla',
                'metadata' => ['segment' => 'team', 'source' => 'demo'],
            ],
            'diego' => [
                'name' => 'Diego Martins',
                'email' => 'diego.martins@example.com',
                'phone' => '+55 11 90000-0004',
                'status' => 'invited',
                'party_size' => 1,
                'max_companions' => 2,
                'invite_token' => 'demo-invite-token-diego',
                'metadata' => ['segment' => 'partners', 'source' => 'demo'],
            ],
            'elisa' => [
                'name' => 'Elisa Nogueira',
                'email' => 'elisa.nogueira@example.com',
                'phone' => '+55 11 90000-0005',
                'status' => 'checked_in',
                'party_size' => 2,
                'max_companions' => 2,
                'invite_token' => 'demo-invite-token-elisa',
                'metadata' => ['segment' => 'vip', 'source' => 'demo'],
            ],
        ];

        $guests = [];

        foreach ($rows as $key => $row) {
            $guests[$key] = Guest::query()->updateOrCreate(
                ['invite_token' => $row['invite_token']],
                [
                    ...$row,
                    'event_id' => $event->id,
                    'invited_at' => now()->subDays(7),
                    'last_seen_at' => in_array($row['status'], ['accepted', 'declined', 'checked_in'], true) ? now()->subDays(1) : null,
                ],
            );
        }

        return $guests;
    }

    /**
     * @param array<string, Guest> $guests
     */
    private function rsvps(Event $event, array $guests): void
    {
        $rows = [
            'ana' => ['status' => 'accepted', 'companions' => 1, 'message' => 'Confirmadissima. Ate la!', 'source' => 'public'],
            'bruno' => ['status' => 'accepted', 'companions' => 0, 'message' => 'Vou direto do trabalho.', 'source' => 'public_link'],
            'carla' => ['status' => 'declined', 'companions' => 0, 'message' => 'Nao vou conseguir desta vez.', 'source' => 'public_link'],
            'elisa' => ['status' => 'accepted', 'companions' => 1, 'message' => 'Levarei um acompanhante.', 'source' => 'admin'],
        ];

        foreach ($rows as $key => $row) {
            Rsvp::query()->updateOrCreate(
                ['event_id' => $event->id, 'guest_id' => $guests[$key]->id],
                [
                    ...$row,
                    'answers' => [
                        'dietary_restrictions' => $key === 'elisa' ? 'Vegetariano' : null,
                        'song_request' => $key === 'ana' ? 'Something About Us' : null,
                    ],
                ],
            );
        }
    }

    /**
     * @param array<string, Guest> $guests
     */
    private function checkIns(Event $event, array $guests, User $owner): void
    {
        foreach (['ana', 'elisa'] as $key) {
            CheckIn::query()->updateOrCreate(
                ['event_id' => $event->id, 'guest_id' => $guests[$key]->id],
                [
                    'checked_in_by' => $owner->id,
                    'checked_in_at' => now()->subHours($key === 'ana' ? 2 : 1),
                    'method' => $key === 'ana' ? 'qr_code' : 'manual',
                    'metadata' => [
                        'source' => 'demo',
                        'device' => 'front-desk',
                    ],
                ],
            );
        }
    }

    private function otps(Event $event, User $guest): void
    {
        PublicRsvpOtp::query()->updateOrCreate(
            ['event_id' => $event->id, 'email' => 'otp-demo@example.com', 'consumed_at' => null],
            [
                'code_hash' => Hash::make('123456'),
                'expires_at' => now()->addMinutes(10),
                'attempts' => 0,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Invitely Demo Seeder',
                'metadata' => ['source' => 'demo'],
            ],
        );

        UserEmailVerificationCode::query()->updateOrCreate(
            ['user_id' => $guest->id, 'email' => $guest->email, 'consumed_at' => null],
            [
                'code_hash' => Hash::make('123456'),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Invitely Demo Seeder',
            ],
        );
    }

    private function auditLogs(Tenant $tenant, Event $event, User $owner): void
    {
        $rows = [
            [
                'action' => 'demo.seeded',
                'subject_type' => Tenant::class,
                'subject_id' => (string) $tenant->id,
                'properties' => ['message' => 'Demo tenant seeded locally.'],
            ],
            [
                'action' => 'event.published',
                'subject_type' => Event::class,
                'subject_id' => (string) $event->id,
                'properties' => ['slug' => $event->slug, 'source' => 'demo'],
            ],
        ];

        foreach ($rows as $row) {
            AuditLog::query()->firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'actor_id' => $owner->id,
                    'action' => $row['action'],
                    'subject_type' => $row['subject_type'],
                    'subject_id' => $row['subject_id'],
                ],
                [
                    'properties' => $row['properties'],
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Invitely Demo Seeder',
                ],
            );
        }
    }
}
