# Database schema analysis

Local development is now owned by Laravel migrations and the Docker Postgres
database. Supabase remains optional at the application/auth integration layer.

## Core domain

- `tenants`: SaaS organizations. Main keys: `id`, unique `slug`, nullable unique `domain`.
- `users`: local auth users. Main keys: `id`, unique `email`, nullable `tenant_id`.
- `event_templates`: reusable event templates. Unique by `tenant_id, slug`.
- `events`: tenant-owned events. Unique by `tenant_id, slug`, indexed by `tenant_id, status, starts_at`.
- `guests`: event guests. Unique `invite_token`, unique nullable `event_id, email`.
- `rsvps`: one RSVP per guest per event. Unique by `event_id, guest_id`.
- `check_ins`: one check-in per guest per event. Unique by `event_id, guest_id`.
- `audit_logs`: tenant/platform audit trail.

## Local auth and infrastructure

- `personal_access_tokens`: Sanctum bearer tokens.
- `user_email_verification_codes`: local e-mail verification OTPs.
- `public_rsvp_otps`: public RSVP OTPs, now created by Laravel migration.
- `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`: Laravel infrastructure tables.

## Postgres hardening

The migration `2026_06_23_000001_add_database_comments_and_constraints.php`
adds table/column comments and check constraints for:

- tenant plans;
- user roles;
- event, guest, RSVP, and check-in statuses;
- event date ranges, capacity, latitude, and longitude;
- RSVP companions;
- OTP attempts.

Constraints are created as `NOT VALID` so they start protecting new writes
without blocking existing local data during migration.

## Demo data

The local seeders create:

- 1 tenant;
- 3 users;
- 1 template;
- 1 published event;
- 5 guests;
- 4 RSVPs;
- 2 check-ins;
- 2 audit logs;
- public RSVP and e-mail verification OTP examples.
