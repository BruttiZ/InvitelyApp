/// <reference types="vite/client" />

/* eslint-disable @typescript-eslint/consistent-type-definitions */

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_AUTH_ADMIN_EMAIL?: string;
    readonly VITE_AUTH_ADMIN_NAME?: string;
    readonly VITE_AUTH_GUEST_EMAIL?: string;
    readonly VITE_AUTH_GUEST_NAME?: string;
    readonly VITE_AUTH_OWNER_EMAIL?: string;
    readonly VITE_AUTH_OWNER_NAME?: string;
    readonly VITE_AUTH_PARTY_NAME?: string;
    readonly VITE_SITE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPER_USER_EMAIL?: string;
    readonly VITE_SUPER_USER_PASSWORD?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
