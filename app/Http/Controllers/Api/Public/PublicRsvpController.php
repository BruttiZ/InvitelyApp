<?php

namespace App\Http\Controllers\Api\Public;

use App\Domain\Events\Repositories\EventRepository;
use App\Domain\Guests\Actions\ConfirmRsvpAction;
use App\Domain\Guests\Data\RsvpData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ConfirmRsvpRequest;
use Illuminate\Http\JsonResponse;

final class PublicRsvpController extends Controller
{
    public function __construct(
        private readonly EventRepository $events,
        private readonly ConfirmRsvpAction $confirmRsvp,
    ) {}

    public function store(ConfirmRsvpRequest $request, string $slug): JsonResponse
    {
        $event = $this->events->findPublicBySlug($slug);

        if (! $event) {
            return response()->json(['message' => 'Event not found.'], 404);
        }

        $rsvp = $this->confirmRsvp->execute($event, new RsvpData(
            inviteToken: (string) ($request->validated('invite_token') ?? ''),
            status: (string) $request->validated('status'),
            companions: (int) $request->validated('companions'),
            message: $request->validated('message'),
            answers: $request->validated('answers'),
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return response()->json([
            'message' => 'RSVP confirmed.',
            'data' => $rsvp,
        ], 201);
    }
}
