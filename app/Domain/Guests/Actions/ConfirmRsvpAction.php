<?php

namespace App\Domain\Guests\Actions;

use App\Domain\Guests\Data\RsvpData;
use App\Domain\Guests\Repositories\GuestRepository;
use App\Models\Event;
use App\Models\Guest;
use App\Models\Rsvp;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class ConfirmRsvpAction
{
    public function __construct(private GuestRepository $guests) {}

    public function execute(Event $event, RsvpData $data): Rsvp
    {
        return DB::transaction(function () use ($event, $data): Rsvp {
            $guest = $this->resolveGuest($event, $data);

            if ($data->companions > $guest->max_companions) {
                throw ValidationException::withMessages([
                    'companions' => __('This invitation does not allow that many companions.'),
                ]);
            }

            $rsvp = Rsvp::query()->updateOrCreate(
                ['event_id' => $event->id, 'guest_id' => $guest->id],
                [
                    'status' => $data->status,
                    'companions' => $data->companions,
                    'message' => $data->message,
                    'answers' => $data->answers,
                    'source' => $data->inviteToken !== '' ? 'public' : 'public_link',
                ],
            );

            $guest->forceFill([
                'name' => $this->guestName($data->name, $data->email, $guest->name),
                'status' => $data->status,
                'party_size' => 1 + $data->companions,
                'last_seen_at' => now(),
            ])->save();

            Cache::forget('events.public.'.$event->slug);

            return $rsvp->refresh();
        });
    }

    private function resolveGuest(Event $event, RsvpData $data): Guest
    {
        if ($data->inviteToken !== '') {
            $guest = $this->guests->findByInviteToken($event, $data->inviteToken);

            if (! $guest) {
                throw ValidationException::withMessages([
                    'invite_token' => __('Invalid invitation token.'),
                ]);
            }

            return $guest;
        }

        if (! is_string($data->email) || trim($data->email) === '') {
            throw ValidationException::withMessages([
                'email' => __('Informe um e-mail para confirmar presenca.'),
            ]);
        }

        $normalizedEmail = Str::lower(trim($data->email));

        /** @var Guest|null $guest */
        $guest = Guest::query()
            ->where('event_id', $event->id)
            ->where('email', $normalizedEmail)
            ->lockForUpdate()
            ->first();

        if ($guest) {
            return $guest;
        }

        return Guest::query()->create([
            'event_id' => $event->id,
            'name' => $this->guestName($data->name, $normalizedEmail),
            'email' => $normalizedEmail,
            'status' => 'invited',
            'party_size' => 1,
            'max_companions' => 5,
            'invite_token' => Str::random(40),
            'invited_at' => now(),
            'metadata' => [
                'source' => 'public_event_link',
            ],
        ]);
    }

    private function guestName(?string $name, ?string $email, ?string $fallback = null): string
    {
        if (is_string($name) && trim($name) !== '') {
            return trim($name);
        }

        if (is_string($fallback) && trim($fallback) !== '') {
            return trim($fallback);
        }

        if (is_string($email) && trim($email) !== '') {
            return Str::headline(Str::before($email, '@'));
        }

        return __('Convidado');
    }
}
