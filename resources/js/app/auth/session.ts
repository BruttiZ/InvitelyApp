export type UserRole = 'owner' | 'guest' | 'platform_admin';

export type AuthUser = {
    id: number | string;
    name: string;
    email: string;
    role: UserRole;
    tenant_id: string | null;
    settings?: Record<string, unknown> | null;
    notification_preferences?: Record<string, unknown> | null;
    privacy_preferences?: Record<string, unknown> | null;
};

export type AuthSession = {
    token: string;
    token_type: 'Bearer';
    user: AuthUser;
    activeRole?: UserRole;
};

const storageKey = 'invitely.session';

export function getStoredSession(): AuthSession | null {
    const rawSession = window.localStorage.getItem(storageKey);

    if (!rawSession) {
        return null;
    }

    try {
        const session = JSON.parse(rawSession) as AuthSession;

        return {
            ...session,
            activeRole: resolveActiveRole(session.user.role, session.activeRole),
        };
    } catch {
        window.localStorage.removeItem(storageKey);

        return null;
    }
}

export function storeSession(session: AuthSession): void {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession(): void {
    window.localStorage.removeItem(storageKey);
}

export function resolveActiveRole(accountRole: UserRole, requestedRole?: UserRole): UserRole {
    if (accountRole === 'platform_admin') {
        return requestedRole === 'guest' ? 'guest' : 'platform_admin';
    }

    if (accountRole === 'owner') {
        return requestedRole === 'guest' ? 'guest' : 'owner';
    }

    return 'guest';
}

export function roleLabel(role: UserRole): string {
    return {
        owner: 'Dono do evento',
        guest: 'Convidado',
        platform_admin: 'Admin da plataforma',
    }[role];
}
