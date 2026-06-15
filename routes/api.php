<?php

use App\Http\Controllers\Api\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminCheckInController;
use App\Http\Controllers\Api\Admin\AdminEventController;
use App\Http\Controllers\Api\Admin\AdminGuestController;
use App\Http\Controllers\Api\Admin\AdminGuestExportController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\SupabaseConfirmationController;
use App\Http\Controllers\Api\GoApiProxyController;
use App\Http\Controllers\Api\InviteController;
use App\Http\Controllers\Api\Public\PublicEventController;
use App\Http\Controllers\Api\Public\PublicRsvpCodeController;
use App\Http\Controllers\Api\Public\PublicRsvpController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api'])->group(function (): void {
    Route::match(['get', 'post', 'put', 'delete'], '/go/{path?}', GoApiProxyController::class)
        ->where('path', '.*');
});

Route::prefix('v1')->middleware(['throttle:api', 'tenant.optional'])->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/auth/resend-email-code', [AuthController::class, 'resendEmailCode'])->middleware('throttle:login');
    Route::post('/auth/verify-email-code', [AuthController::class, 'verifyEmailCode'])->middleware('throttle:login');
    Route::post('/auth/resend-confirmation', [SupabaseConfirmationController::class, 'resend'])->middleware('throttle:auth-email');

    // Public invite endpoints
    Route::get('/invites/{token}', [InviteController::class, 'show']);
    Route::post('/invites/{token}/accept', [InviteController::class, 'accept']);
    Route::post('/invites/{token}/reject', [InviteController::class, 'reject']);

    Route::get('/events/{slug}', [PublicEventController::class, 'show']);
    Route::post('/events/{slug}/rsvp', [PublicRsvpController::class, 'store'])->middleware('throttle:rsvp');
    Route::post('/rsvp/request-code', [PublicRsvpCodeController::class, 'requestCode'])->middleware('throttle:rsvp-otp');
    Route::post('/rsvp/verify-code', [PublicRsvpCodeController::class, 'verifyCode'])->middleware('throttle:rsvp-otp');

    Route::middleware(['auth:sanctum'])->prefix('admin')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::apiResource('events', AdminEventController::class);
        Route::get('events/{event}/analytics', AdminAnalyticsController::class);
        Route::post('events/{event}/check-ins', [AdminCheckInController::class, 'store']);
        Route::get('events/{event}/guests/export', AdminGuestExportController::class);
        Route::apiResource('events.guests', AdminGuestController::class)->shallow();
    });
});
