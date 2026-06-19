<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Mail\UserEmailVerificationCodeMail;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserEmailVerificationCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $role = (string) $request->validated('role');
        $tenant = $role === 'owner'
            ? $this->createTenantForOwner(
                (string) ($request->validated('party_name') ?: $request->validated('name')),
            )
            : null;

        $user = User::query()->create([
            'tenant_id' => $tenant?->id,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make((string) $request->validated('password')),
            'role' => $role,
            'email_verified_at' => config('invitely.require_email_verification') ? null : now(),
        ]);

        if (! config('invitely.require_email_verification')) {
            return response()->json([
                'data' => $this->issueToken($user, (string) ($request->validated('device_name') ?: 'web')),
            ], 201);
        }

        $this->sendVerificationCode($user, $request);

        return response()->json([
            'data' => [
                'email' => $user->email,
                'expires_in_minutes' => 10,
            ],
            'message' => 'Codigo de confirmacao enviado para o e-mail cadastrado.',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check((string) $request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('E-mail ou senha incorretos.'),
            ]);
        }

        if (config('invitely.require_email_verification') && $user->email_verified_at === null) {
            $this->sendVerificationCode($user, $request);

            throw ValidationException::withMessages([
                'email' => __('Confirme seu e-mail com o codigo enviado antes de entrar.'),
            ]);
        }

        return response()->json([
            'data' => $this->issueToken($user, (string) ($request->validated('device_name') ?: 'web')),
        ]);
    }

    public function resendEmailCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::exists('users', 'email')],
        ]);

        $email = Str::lower(trim((string) $validated['email']));
        /** @var User $user */
        $user = User::query()->where('email', $email)->firstOrFail();

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Este e-mail ja esta confirmado. Faca login para continuar.',
            ]);
        }

        $this->sendVerificationCode($user, $request);

        return response()->json([
            'data' => [
                'email' => $user->email,
                'expires_in_minutes' => 10,
            ],
            'message' => 'Novo codigo enviado para o e-mail cadastrado.',
        ]);
    }

    public function verifyEmailCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::exists('users', 'email')],
            'code' => ['required', 'string', 'digits:6'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $email = Str::lower(trim((string) $validated['email']));
        $code = (string) $validated['code'];

        $user = DB::transaction(function () use ($email, $code): User {
            /** @var User $user */
            $user = User::query()->where('email', $email)->lockForUpdate()->firstOrFail();

            /** @var UserEmailVerificationCode|null $otp */
            $otp = UserEmailVerificationCode::query()
                ->where('user_id', $user->id)
                ->where('email', $email)
                ->whereNull('consumed_at')
                ->latest()
                ->lockForUpdate()
                ->first();

            if (! $otp) {
                throw ValidationException::withMessages([
                    'code' => __('Solicite um novo codigo para confirmar seu e-mail.'),
                ]);
            }

            if (Carbon::parse($otp->expires_at)->isPast()) {
                $otp->forceFill(['consumed_at' => now()])->save();

                throw ValidationException::withMessages([
                    'code' => __('Codigo expirado. Solicite um novo codigo.'),
                ]);
            }

            if ($otp->attempts >= 5) {
                $otp->forceFill(['consumed_at' => now()])->save();

                throw ValidationException::withMessages([
                    'code' => __('Muitas tentativas invalidas. Solicite um novo codigo.'),
                ]);
            }

            if (! Hash::check($code, $otp->code_hash)) {
                $otp->increment('attempts');

                throw ValidationException::withMessages([
                    'code' => __('Codigo invalido. Confira os 6 digitos enviados por e-mail.'),
                ]);
            }

            $user->forceFill(['email_verified_at' => now()])->save();
            $otp->forceFill(['consumed_at' => now()])->save();

            return $user->refresh();
        });

        return response()->json([
            'data' => $this->issueToken($user, (string) ($validated['device_name'] ?? 'web')),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()]);
    }

    public function updateMe(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'settings' => ['required', 'array'],
            'settings.organization' => ['nullable', 'string', 'max:120'],
            'settings.timezone' => ['required', 'timezone'],
            'settings.language' => ['required', Rule::in(['pt-BR', 'en-US', 'es'])],
            'notification_preferences' => ['required', 'array'],
            'notification_preferences.emailRsvp' => ['required', 'boolean'],
            'notification_preferences.emailReminders' => ['required', 'boolean'],
            'notification_preferences.weeklySummary' => ['required', 'boolean'],
            'notification_preferences.marketing' => ['required', 'boolean'],
            'notification_preferences.quietHoursStart' => ['required', 'date_format:H:i'],
            'notification_preferences.quietHoursEnd' => ['required', 'date_format:H:i'],
            'privacy_preferences' => ['required', 'array'],
            'privacy_preferences.profileVisibility' => ['required', Rule::in(['team', 'private'])],
            'privacy_preferences.showEmailToGuests' => ['required', 'boolean'],
            'privacy_preferences.allowGuestMessages' => ['required', 'boolean'],
            'privacy_preferences.analyticsConsent' => ['required', 'boolean'],
            'privacy_preferences.dataRetention' => ['required', Rule::in(['12_months', '24_months', 'indefinite'])],
        ]);

        $user->update($validated);

        return response()->json([
            'data' => [
                'user' => $this->serializeUser($user->refresh()),
            ],
            'message' => 'Configuracoes atualizadas com sucesso.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessao encerrada.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function issueToken(User $user, string $deviceName): array
    {
        $abilities = match ($user->role) {
            'platform_admin' => ['platform:admin'],
            'guest' => ['event:guest'],
            default => ['tenant:owner'],
        };

        $token = $user->createToken(
            name: $deviceName,
            abilities: $abilities,
            expiresAt: now()->addDays(30),
        );

        return [
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'settings' => $user->settings,
                'notification_preferences' => $user->notification_preferences,
                'privacy_preferences' => $user->privacy_preferences,
            ],
        ];
    }

    private function createTenantForOwner(string $name): Tenant
    {
        $baseSlug = Str::slug($name) ?: 'tenant';
        $slug = $baseSlug;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.Str::lower(Str::random(6));
        }

        return Tenant::query()->create([
            'name' => $name,
            'slug' => $slug,
            'plan' => 'community',
            'settings' => ['locale' => 'pt_BR', 'timezone' => 'America/Sao_Paulo'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'tenant_id' => $user->tenant_id,
            'settings' => $user->settings,
            'notification_preferences' => $user->notification_preferences,
            'privacy_preferences' => $user->privacy_preferences,
        ];
    }

    private function sendVerificationCode(User $user, Request $request): void
    {
        $email = Str::lower(trim($user->email));
        $code = (string) random_int(100000, 999999);

        UserEmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('email', $email)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        UserEmailVerificationCode::query()->create([
            'user_id' => $user->id,
            'email' => $email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Mail::to($email)->send(new UserEmailVerificationCodeMail($user, $code));
    }
}
