<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if ($this->driver() !== 'pgsql') {
            return;
        }

        $this->addComments();
        $this->addCheckConstraints();
    }

    public function down(): void
    {
        if ($this->driver() !== 'pgsql') {
            return;
        }

        $this->dropCheckConstraints();
        $this->dropComments();
    }

    private function driver(): string
    {
        return Schema::getConnection()->getDriverName();
    }

    private function addComments(): void
    {
        $comments = [
            'tenants' => [
                '_table' => 'Organizations/customers that own operational data in the SaaS.',
                'id' => 'Tenant UUID primary key.',
                'name' => 'Human-readable organization name.',
                'slug' => 'Unique public identifier used by APIs, seed data, and tenant resolution.',
                'domain' => 'Optional custom domain used to resolve tenant context.',
                'plan' => 'Commercial or community plan assigned to the tenant.',
                'settings' => 'Tenant-level preferences, locale, timezone, and feature flags.',
                'created_at' => 'Timestamp when the tenant was created.',
                'updated_at' => 'Timestamp when the tenant was last updated.',
            ],
            'users' => [
                '_table' => 'Local application users for development and first-party auth.',
                'id' => 'Auto-incrementing user primary key.',
                'tenant_id' => 'Optional tenant membership. Null is allowed for platform admins or guests.',
                'name' => 'Display name.',
                'email' => 'Unique login e-mail.',
                'email_verified_at' => 'Timestamp when local e-mail verification was completed.',
                'password' => 'Hashed local password.',
                'role' => 'Application role: owner, admin, guest, or platform_admin.',
                'settings' => 'User profile and workspace settings.',
                'notification_preferences' => 'User notification preferences.',
                'privacy_preferences' => 'User privacy preferences.',
                'remember_token' => 'Laravel remember-me token.',
                'created_at' => 'Timestamp when the user was created.',
                'updated_at' => 'Timestamp when the user was last updated.',
            ],
            'password_reset_tokens' => [
                '_table' => 'Laravel password reset tokens.',
                'email' => 'User e-mail receiving the password reset token.',
                'token' => 'Hashed password reset token.',
                'created_at' => 'Timestamp when the token was created.',
            ],
            'sessions' => [
                '_table' => 'Laravel database-backed sessions when the database session driver is used.',
                'id' => 'Session primary key.',
                'user_id' => 'Optional authenticated user id.',
                'ip_address' => 'Client IP address.',
                'user_agent' => 'Client user agent.',
                'payload' => 'Serialized session payload.',
                'last_activity' => 'Unix timestamp of the last session activity.',
            ],
            'cache' => [
                '_table' => 'Laravel database cache entries.',
                'key' => 'Cache key.',
                'value' => 'Serialized cache value.',
                'expiration' => 'Unix timestamp when the cache entry expires.',
            ],
            'cache_locks' => [
                '_table' => 'Laravel database cache locks.',
                'key' => 'Lock key.',
                'owner' => 'Lock owner token.',
                'expiration' => 'Unix timestamp when the lock expires.',
            ],
            'jobs' => [
                '_table' => 'Queued jobs when the database queue driver is used.',
                'id' => 'Job primary key.',
                'queue' => 'Queue name.',
                'payload' => 'Serialized job payload.',
                'attempts' => 'Number of processing attempts.',
                'reserved_at' => 'Unix timestamp when a worker reserved the job.',
                'available_at' => 'Unix timestamp when the job becomes available.',
                'created_at' => 'Unix timestamp when the job was created.',
            ],
            'job_batches' => [
                '_table' => 'Laravel queued job batches.',
                'id' => 'Batch primary key.',
                'name' => 'Batch display name.',
                'total_jobs' => 'Total jobs in the batch.',
                'pending_jobs' => 'Jobs still pending.',
                'failed_jobs' => 'Jobs failed in the batch.',
                'failed_job_ids' => 'Serialized failed job ids.',
                'options' => 'Serialized batch options.',
                'cancelled_at' => 'Unix timestamp when the batch was cancelled.',
                'created_at' => 'Unix timestamp when the batch was created.',
                'finished_at' => 'Unix timestamp when the batch finished.',
            ],
            'failed_jobs' => [
                '_table' => 'Failed queued jobs.',
                'id' => 'Failed job primary key.',
                'uuid' => 'Unique failed job UUID.',
                'connection' => 'Queue connection name.',
                'queue' => 'Queue name.',
                'payload' => 'Serialized job payload.',
                'exception' => 'Serialized exception details.',
                'failed_at' => 'Timestamp when the job failed.',
            ],
            'event_templates' => [
                '_table' => 'Reusable event design and content templates.',
                'id' => 'Template UUID primary key.',
                'tenant_id' => 'Owner tenant. Null means global/public template.',
                'name' => 'Template display name.',
                'slug' => 'Template identifier unique inside a tenant.',
                'category' => 'Template category used by the UI.',
                'tokens' => 'Design tokens such as colors, typography, and spacing.',
                'schema' => 'Optional JSON schema describing configurable template fields.',
                'is_public' => 'Whether other tenants can use the template.',
                'created_at' => 'Timestamp when the template was created.',
                'updated_at' => 'Timestamp when the template was last updated.',
            ],
            'events' => [
                '_table' => 'Events hosted by a tenant.',
                'id' => 'Event UUID primary key.',
                'tenant_id' => 'Tenant that owns the event.',
                'template_id' => 'Optional template used to render the event.',
                'name' => 'Event display name.',
                'slug' => 'Public event slug unique inside a tenant.',
                'status' => 'Lifecycle status: draft, published, closed, archived, or cancelled.',
                'timezone' => 'IANA timezone used for event dates.',
                'starts_at' => 'Event start timestamp with timezone.',
                'ends_at' => 'Optional event end timestamp with timezone.',
                'venue_name' => 'Venue display name.',
                'address' => 'Venue address.',
                'latitude' => 'Venue latitude in decimal degrees.',
                'longitude' => 'Venue longitude in decimal degrees.',
                'spotify_playlist_url' => 'Optional Spotify playlist URL.',
                'hero' => 'Hero content for the public invitation page.',
                'content' => 'Structured event content such as schedule, hosts, and notes.',
                'theme' => 'Theme tokens selected for this event.',
                'gallery' => 'Optional gallery image metadata.',
                'seo' => 'SEO metadata for public pages.',
                'capacity' => 'Optional maximum event capacity.',
                'created_at' => 'Timestamp when the event was created.',
                'updated_at' => 'Timestamp when the event was last updated.',
                'deleted_at' => 'Soft delete timestamp.',
            ],
            'guests' => [
                '_table' => 'Guests invited to an event.',
                'id' => 'Guest UUID primary key.',
                'event_id' => 'Event that owns this guest.',
                'name' => 'Guest display name.',
                'email' => 'Optional guest e-mail. Unique per event when present.',
                'phone' => 'Optional guest phone number.',
                'status' => 'Guest status: pending, invited, accepted, declined, checked_in, or cancelled.',
                'party_size' => 'Total party size reserved for the guest.',
                'max_companions' => 'Maximum companions the guest may add in RSVP.',
                'invite_token' => 'Unique token used by public invite links.',
                'invited_at' => 'Timestamp when the invite was sent or generated.',
                'last_seen_at' => 'Timestamp when the guest last opened the invite.',
                'metadata' => 'Additional guest segmentation or import metadata.',
                'created_at' => 'Timestamp when the guest was created.',
                'updated_at' => 'Timestamp when the guest was last updated.',
            ],
            'rsvps' => [
                '_table' => 'RSVP answers linked to event guests.',
                'id' => 'RSVP UUID primary key.',
                'event_id' => 'Event answered by the RSVP.',
                'guest_id' => 'Guest that submitted or owns the RSVP.',
                'status' => 'RSVP status: accepted or declined.',
                'companions' => 'Number of companions confirmed by the guest.',
                'message' => 'Optional guest message.',
                'source' => 'Origin of the RSVP, such as public link, OTP, admin, or import.',
                'answers' => 'Answers for custom RSVP questions.',
                'created_at' => 'Timestamp when the RSVP was created.',
                'updated_at' => 'Timestamp when the RSVP was last updated.',
            ],
            'check_ins' => [
                '_table' => 'Event check-in records.',
                'id' => 'Check-in UUID primary key.',
                'event_id' => 'Event where check-in happened.',
                'guest_id' => 'Checked-in guest.',
                'checked_in_by' => 'Optional user who performed the check-in.',
                'checked_in_at' => 'Timestamp when the check-in happened.',
                'method' => 'Check-in method: qr_code, manual, or import.',
                'metadata' => 'Additional device or import metadata.',
                'created_at' => 'Timestamp when the check-in was created.',
                'updated_at' => 'Timestamp when the check-in was last updated.',
            ],
            'audit_logs' => [
                '_table' => 'Audit trail for tenant and platform actions.',
                'id' => 'Audit log UUID primary key.',
                'tenant_id' => 'Tenant affected by the action, when applicable.',
                'actor_id' => 'User who performed the action, when known.',
                'action' => 'Machine-readable action name.',
                'subject_type' => 'Optional audited subject class or type.',
                'subject_id' => 'Optional audited subject identifier.',
                'properties' => 'Structured action metadata.',
                'ip_address' => 'Client IP address.',
                'user_agent' => 'Client user agent.',
                'created_at' => 'Timestamp when the action was logged.',
                'updated_at' => 'Timestamp when the audit log was last updated.',
            ],
            'personal_access_tokens' => [
                '_table' => 'Laravel Sanctum API tokens.',
                'id' => 'Token primary key.',
                'tokenable_type' => 'Polymorphic owner type.',
                'tokenable_id' => 'Polymorphic owner id.',
                'name' => 'Token display name.',
                'token' => 'Hashed API token.',
                'abilities' => 'Allowed token abilities.',
                'last_used_at' => 'Timestamp when the token was last used.',
                'expires_at' => 'Optional token expiration timestamp.',
                'created_at' => 'Timestamp when the token was created.',
                'updated_at' => 'Timestamp when the token was last updated.',
            ],
            'public_rsvp_otps' => [
                '_table' => 'One-time codes for public RSVP without login.',
                'id' => 'OTP UUID primary key.',
                'event_id' => 'Event being confirmed.',
                'email' => 'Guest e-mail receiving the code.',
                'code_hash' => 'Hashed one-time code. Plain codes are never stored.',
                'expires_at' => 'Timestamp when the OTP expires.',
                'consumed_at' => 'Timestamp when the OTP was consumed or invalidated.',
                'attempts' => 'Number of invalid verification attempts.',
                'ip_address' => 'Requester IP address.',
                'user_agent' => 'Requester user agent.',
                'metadata' => 'Additional OTP metadata.',
                'created_at' => 'Timestamp when the OTP was created.',
                'updated_at' => 'Timestamp when the OTP was last updated.',
            ],
            'user_email_verification_codes' => [
                '_table' => 'Local e-mail verification one-time codes.',
                'id' => 'Verification code primary key.',
                'user_id' => 'User receiving the verification code.',
                'email' => 'E-mail address being verified.',
                'code_hash' => 'Hashed one-time code. Plain codes are never stored.',
                'attempts' => 'Number of invalid verification attempts.',
                'expires_at' => 'Timestamp when the code expires.',
                'consumed_at' => 'Timestamp when the code was consumed or invalidated.',
                'ip_address' => 'Requester IP address.',
                'user_agent' => 'Requester user agent.',
                'created_at' => 'Timestamp when the code was created.',
                'updated_at' => 'Timestamp when the code was last updated.',
            ],
        ];

        foreach ($comments as $table => $tableComments) {
            foreach ($tableComments as $column => $comment) {
                $column === '_table'
                    ? $this->commentOnTable($table, $comment)
                    : $this->commentOnColumn($table, $column, $comment);
            }
        }
    }

    private function dropComments(): void
    {
        $tables = [
            'audit_logs',
            'cache',
            'cache_locks',
            'check_ins',
            'event_templates',
            'events',
            'failed_jobs',
            'guests',
            'job_batches',
            'jobs',
            'password_reset_tokens',
            'personal_access_tokens',
            'public_rsvp_otps',
            'rsvps',
            'sessions',
            'tenants',
            'user_email_verification_codes',
            'users',
        ];

        foreach ($tables as $table) {
            $this->commentOnTable($table, null);

            foreach ($this->columnsFor($table) as $column) {
                $this->commentOnColumn($table, $column, null);
            }
        }
    }

    private function addCheckConstraints(): void
    {
        $constraints = [
            ['tenants', 'tenants_plan_check', "plan in ('community', 'starter', 'pro', 'business', 'enterprise')"],
            ['users', 'users_role_check', "role in ('owner', 'admin', 'guest', 'platform_admin')"],
            ['events', 'events_status_check', "status in ('draft', 'published', 'closed', 'archived', 'cancelled')"],
            ['events', 'events_time_range_check', 'ends_at is null or ends_at > starts_at'],
            ['events', 'events_capacity_check', 'capacity is null or (capacity >= 1 and capacity <= 100000)'],
            ['events', 'events_latitude_check', 'latitude is null or (latitude >= -90 and latitude <= 90)'],
            ['events', 'events_longitude_check', 'longitude is null or (longitude >= -180 and longitude <= 180)'],
            ['guests', 'guests_status_check', "status in ('pending', 'invited', 'accepted', 'declined', 'checked_in', 'cancelled')"],
            ['guests', 'guests_party_size_check', 'party_size >= 1 and party_size <= 100'],
            ['guests', 'guests_max_companions_check', 'max_companions >= 0 and max_companions <= 20'],
            ['rsvps', 'rsvps_status_check', "status in ('accepted', 'declined')"],
            ['rsvps', 'rsvps_companions_check', 'companions >= 0 and companions <= 20'],
            ['rsvps', 'rsvps_source_check', "source in ('public', 'public_link', 'public_event_link', 'public_rsvp', 'public_rsvp_otp', 'public_otp', 'admin', 'import')"],
            ['check_ins', 'check_ins_method_check', "method in ('qr_code', 'manual', 'import')"],
            ['public_rsvp_otps', 'public_rsvp_otps_attempts_check', 'attempts >= 0 and attempts <= 5'],
            ['user_email_verification_codes', 'user_email_verification_codes_attempts_check', 'attempts >= 0 and attempts <= 5'],
        ];

        foreach ($constraints as [$table, $name, $expression]) {
            $this->addCheckConstraint($table, $name, $expression);
        }
    }

    private function dropCheckConstraints(): void
    {
        $constraints = [
            ['tenants', 'tenants_plan_check'],
            ['users', 'users_role_check'],
            ['events', 'events_status_check'],
            ['events', 'events_time_range_check'],
            ['events', 'events_capacity_check'],
            ['events', 'events_latitude_check'],
            ['events', 'events_longitude_check'],
            ['guests', 'guests_status_check'],
            ['guests', 'guests_party_size_check'],
            ['guests', 'guests_max_companions_check'],
            ['rsvps', 'rsvps_status_check'],
            ['rsvps', 'rsvps_companions_check'],
            ['rsvps', 'rsvps_source_check'],
            ['check_ins', 'check_ins_method_check'],
            ['public_rsvp_otps', 'public_rsvp_otps_attempts_check'],
            ['user_email_verification_codes', 'user_email_verification_codes_attempts_check'],
        ];

        foreach ($constraints as [$table, $name]) {
            DB::statement("alter table {$table} drop constraint if exists {$name}");
        }
    }

    private function addCheckConstraint(string $table, string $name, string $expression): void
    {
        DB::statement(<<<SQL
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = '{$name}'
    ) then
        alter table {$table}
            add constraint {$name}
            check ({$expression}) not valid;
    end if;
end
$$
SQL);
    }

    private function commentOnTable(string $table, ?string $comment): void
    {
        DB::statement('comment on table '.$table.' is '.$this->literal($comment));
    }

    private function commentOnColumn(string $table, string $column, ?string $comment): void
    {
        DB::statement('comment on column '.$table.'.'.$column.' is '.$this->literal($comment));
    }

    private function literal(?string $value): string
    {
        if ($value === null) {
            return 'null';
        }

        return "'".str_replace("'", "''", $value)."'";
    }

    /**
     * @return list<string>
     */
    private function columnsFor(string $table): array
    {
        return match ($table) {
            'audit_logs' => ['id', 'tenant_id', 'actor_id', 'action', 'subject_type', 'subject_id', 'properties', 'ip_address', 'user_agent', 'created_at', 'updated_at'],
            'cache' => ['key', 'value', 'expiration'],
            'cache_locks' => ['key', 'owner', 'expiration'],
            'check_ins' => ['id', 'event_id', 'guest_id', 'checked_in_by', 'checked_in_at', 'method', 'metadata', 'created_at', 'updated_at'],
            'event_templates' => ['id', 'tenant_id', 'name', 'slug', 'category', 'tokens', 'schema', 'is_public', 'created_at', 'updated_at'],
            'events' => ['id', 'tenant_id', 'template_id', 'name', 'slug', 'status', 'timezone', 'starts_at', 'ends_at', 'venue_name', 'address', 'latitude', 'longitude', 'spotify_playlist_url', 'hero', 'content', 'theme', 'gallery', 'seo', 'capacity', 'created_at', 'updated_at', 'deleted_at'],
            'failed_jobs' => ['id', 'uuid', 'connection', 'queue', 'payload', 'exception', 'failed_at'],
            'guests' => ['id', 'event_id', 'name', 'email', 'phone', 'status', 'party_size', 'max_companions', 'invite_token', 'invited_at', 'last_seen_at', 'metadata', 'created_at', 'updated_at'],
            'job_batches' => ['id', 'name', 'total_jobs', 'pending_jobs', 'failed_jobs', 'failed_job_ids', 'options', 'cancelled_at', 'created_at', 'finished_at'],
            'jobs' => ['id', 'queue', 'payload', 'attempts', 'reserved_at', 'available_at', 'created_at'],
            'password_reset_tokens' => ['email', 'token', 'created_at'],
            'personal_access_tokens' => ['id', 'tokenable_type', 'tokenable_id', 'name', 'token', 'abilities', 'last_used_at', 'expires_at', 'created_at', 'updated_at'],
            'public_rsvp_otps' => ['id', 'event_id', 'email', 'code_hash', 'expires_at', 'consumed_at', 'attempts', 'ip_address', 'user_agent', 'metadata', 'created_at', 'updated_at'],
            'rsvps' => ['id', 'event_id', 'guest_id', 'status', 'companions', 'message', 'source', 'answers', 'created_at', 'updated_at'],
            'sessions' => ['id', 'user_id', 'ip_address', 'user_agent', 'payload', 'last_activity'],
            'tenants' => ['id', 'name', 'slug', 'domain', 'plan', 'settings', 'created_at', 'updated_at'],
            'user_email_verification_codes' => ['id', 'user_id', 'email', 'code_hash', 'attempts', 'expires_at', 'consumed_at', 'ip_address', 'user_agent', 'created_at', 'updated_at'],
            'users' => ['id', 'tenant_id', 'name', 'email', 'email_verified_at', 'password', 'role', 'settings', 'notification_preferences', 'privacy_preferences', 'remember_token', 'created_at', 'updated_at'],
            default => [],
        };
    }
};
