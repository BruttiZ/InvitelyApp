import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    Bell,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Crown,
    Download,
    Gift,
    HeartHandshake,
    ImagePlus,
    LifeBuoy,
    Link2,
    LogOut,
    Mail,
    MapPin,
    Megaphone,
    QrCode,
    Send,
    Settings2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    Trash2,
    UsersRound,
    Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthUser, UserRole, clearSession, getStoredSession, roleLabel } from '../../auth/session';
import { apiV1Url, authHeaders } from '../../../lib/api';
import { CreateEventForm, CreatedEventSummary } from './CreateEventForm';

type DashboardView =
    | 'overview'
    | 'events'
    | 'guests'
    | 'templates'
    | 'checkin'
    | 'budget'
    | 'platform'
    | 'tenants'
    | 'support'
    | 'rsvp'
    | 'gifts'
    | 'integrations'
    | 'settings';

type NavigationItem = {
    label: string;
    view: DashboardView;
    icon: LucideIcon;
};

type ActionItem = {
    label: string;
    icon: LucideIcon;
    message: string;
    variant?: 'primary' | 'secondary';
};

type TemplateOption = {
    id: string;
    name: string;
    description: string;
    accent: string;
    badge: string;
    gradient: string;
    image: string;
    highlights: string[];
};

type GuestRow = {
    name: string;
    email: string;
    status: string;
};

type GuestResource = {
    id?: string | number;
    name?: string;
    email?: string;
    status?: string;
    rsvp_status?: string;
};

type MetricItem = {
    label: string;
    value: string;
    trend: string;
    icon: LucideIcon;
    color: string;
};

type BudgetItem = {
    id: string;
    eventId?: string;
    category: string;
    description: string;
    amount: number;
    paid: boolean;
};

type GiftWish = {
    id: string;
    eventId?: string;
    name: string;
    description: string;
    price: number;
    url: string;
    reserved: boolean;
    reservedBy: string;
};

type AdminEventResource = {
    id: string | number;
    title: string;
    description?: string;
    slug?: string;
    status?: string;
    starts_at: string;
    ends_at?: string;
    location?: string;
};

type PaginatedEventResponse = {
    data?: AdminEventResource[];
};

type GuestListResponse = {
    data?: GuestResource[];
};

type BudgetResource = {
    id: string | number;
    event_id?: string;
    category: string;
    description: string;
    amount: number | string;
    paid?: boolean;
};

type BudgetListResponse = {
    data?: BudgetResource[];
};

type BudgetResponse = {
    data?: BudgetResource;
};

type GiftResource = {
    id: string | number;
    event_id?: string;
    name: string;
    description?: string;
    price: number | string;
    url?: string;
    reserved?: boolean;
    reserved_by?: string;
};

type GiftListResponse = {
    data?: GiftResource[];
};

type GiftResponse = {
    data?: GiftResource;
};

const destinations: Record<UserRole, string> = {
    owner: '/organizador',
    guest: '/convidado',
    platform_admin: '/admin',
};

const profileCopy: Record<
    UserRole,
    {
        eyebrow: string;
        title: string;
        description: string;
        roleName: string;
    }
> = {
    platform_admin: {
        eyebrow: 'Operacao do software',
        title: 'Painel do admin da plataforma',
        description: 'Monitore clientes, saude do sistema, suporte, integracoes e configuracoes globais.',
        roleName: 'Admin da plataforma',
    },
    owner: {
        eyebrow: 'Festa em producao',
        title: 'Painel de quem esta fazendo a festa',
        description: 'Monte o convite, acompanhe convidados, envie lembretes e controle a entrada.',
        roleName: 'Organizador',
    },
    guest: {
        eyebrow: 'Meu convite',
        title: 'Area de quem vai a festa',
        description: 'Confirme presenca, veja detalhes do evento, salve QR Code e acompanhe recados.',
        roleName: 'Convidado',
    },
};

const initialEventCards: CreatedEventSummary[] = [
    {
        id: 'demo-invitely-launch-night',
        slug: 'invitely-launch-night',
        title: 'Invitely Launch Night',
        date: '23 jul 2026 - 19:00',
        place: 'Atelier Vista',
        status: 'Publicado',
        confirmed: 180,
        rsvp: 71,
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    },
    {
        id: 'demo-founders-dinner',
        slug: 'founders-dinner',
        title: 'Founders Dinner',
        date: '05 ago 2026 - 20:00',
        place: 'Rascunho',
        status: 'Rascunho',
        confirmed: 64,
        rsvp: 42,
        image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
    },
    {
        id: 'demo-aurora-summit',
        slug: 'aurora-summit',
        title: 'Aurora Summit',
        date: '12 set 2026 - 08:00',
        place: 'Centro de Convencoes',
        status: 'Encerrado',
        confirmed: 920,
        rsvp: 84,
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
    },
];

function mapEventResource(event: AdminEventResource): CreatedEventSummary {
    return {
        id: String(event.id),
        slug: event.slug ?? String(event.id),
        title: event.title,
        description: event.description,
        date: formatEventDate(event.starts_at),
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        place: event.location ?? 'Local a definir',
        status: event.status === 'published' ? 'Publicado' : 'Salvo',
        confirmed: 0,
        rsvp: 0,
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    };
}

function mapGuestResource(guest: GuestResource): GuestRow {
    return {
        name: guest.name ?? guest.email ?? 'Convidado',
        email: guest.email ?? '',
        status: guest.status ?? guest.rsvp_status ?? 'Pendente',
    };
}

function mapBudgetResource(item: BudgetResource): BudgetItem {
    return {
        id: String(item.id),
        eventId: item.event_id,
        category: item.category,
        description: item.description,
        amount: Number(item.amount),
        paid: Boolean(item.paid),
    };
}

function mapGiftResource(item: GiftResource): GiftWish {
    return {
        id: String(item.id),
        eventId: item.event_id,
        name: item.name,
        description: item.description ?? '',
        price: Number(item.price),
        url: item.url ?? '',
        reserved: Boolean(item.reserved),
        reservedBy: item.reserved_by ?? '',
    };
}

async function responseError(response: Response, fallback: string): Promise<Error> {
    const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

    return new Error(payload.error ?? payload.message ?? fallback);
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function formatEventDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

const defaultTemplate: TemplateOption = {
    id: 'linear-premium',
    name: 'Linear Premium',
    description: 'Convite executivo com foco em agenda, RSVP rapido e visual SaaS premium.',
    accent: '#22D3EE',
    badge: 'Corporativo',
    gradient: 'linear-gradient(135deg, #111827 0%, #312E81 45%, #22D3EE 100%)',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
    highlights: ['Agenda em destaque', 'Check-in minimalista', 'Resumo executivo'],
};

const templateOptions: TemplateOption[] = [
    defaultTemplate,
    {
        id: 'gala-aurora',
        name: 'Gala Aurora',
        description: 'Layout sofisticado para formaturas, casamentos e jantares com fotografia imersiva.',
        accent: '#A78BFA',
        badge: 'Elegante',
        gradient: 'linear-gradient(135deg, #1E1B4B 0%, #7C3AED 50%, #F0ABFC 100%)',
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
        highlights: ['Hero fotografico', 'Galeria premium', 'Dress code visual'],
    },
    {
        id: 'garden-night',
        name: 'Jardim Noturno',
        description: 'Template acolhedor para aniversarios e encontros ao ar livre, com detalhes vivos.',
        accent: '#34D399',
        badge: 'Social',
        gradient: 'linear-gradient(135deg, #052E2B 0%, #047857 48%, #F59E0B 100%)',
        image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
        highlights: ['Mapa afetivo', 'Recados dos convidados', 'Contagem regressiva'],
    },
    {
        id: 'neon-festival',
        name: 'Neon Festival',
        description: 'Experiencia vibrante para festas, baladas e lancamentos com presenca forte.',
        accent: '#38BDF8',
        badge: 'Energetico',
        gradient: 'linear-gradient(135deg, #020617 0%, #DB2777 45%, #06B6D4 100%)',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
        highlights: ['Pulseira QR Code', 'Line-up visual', 'CTA de confirmacao'],
    },
];

const tenants = [
    { name: 'Invitely Produção', plan: 'community', events: '12', status: 'Saudavel' },
    { name: 'Aurora Studio', plan: 'pro', events: '28', status: 'Saudavel' },
    { name: 'Mira Eventos', plan: 'business', events: '104', status: 'Atencao' },
];

const defaultBudgetItems: BudgetItem[] = [
    {
        id: 'buffet',
        category: 'Buffet',
        description: 'Comidas, bebidas e equipe de servico',
        amount: 8500,
        paid: false,
    },
    { id: 'aluguel', category: 'Aluguel', description: 'Espaco do evento', amount: 4200, paid: false },
    {
        id: 'decoracao',
        category: 'Decoracao',
        description: 'Flores, mobiliario e ambientacao',
        amount: 2800,
        paid: false,
    },
    {
        id: 'som-luz',
        category: 'Som e luz',
        description: 'DJ, iluminacao e estrutura tecnica',
        amount: 2300,
        paid: false,
    },
];

const defaultGiftWishes: GiftWish[] = [
    {
        id: 'pix',
        name: 'Cota Pix dos anfitrioes',
        description: 'Ajuda para custos do evento',
        price: 5000,
        url: '',
        reserved: false,
        reservedBy: '',
    },
    {
        id: 'vinhos',
        name: 'Adega inicial',
        description: 'Selecao de vinhos para casa',
        price: 1200,
        url: '',
        reserved: false,
        reservedBy: '',
    },
];

function readStoredArray<T>(key: string, fallback: T[]): T[] {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
        return fallback;
    }

    try {
        return JSON.parse(raw) as T[];
    } catch {
        return fallback;
    }
}

function writeStoredArray(key: string, value: unknown[]): void {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function navigationFor(user: AuthUser): NavigationItem[] {
    if (user.role === 'platform_admin') {
        return [
            { label: 'Software', view: 'overview', icon: Activity },
            { label: 'Clientes', view: 'tenants', icon: Crown },
            { label: 'Eventos', view: 'events', icon: CalendarDays },
            { label: 'Suporte', view: 'support', icon: LifeBuoy },
            { label: 'Integracoes', view: 'integrations', icon: Link2 },
            { label: 'Governanca', view: 'platform', icon: ShieldCheck },
        ];
    }

    if (user.role === 'guest') {
        return [
            { label: 'Convite', view: 'overview', icon: TicketCheck },
            { label: 'RSVP', view: 'rsvp', icon: HeartHandshake },
            { label: 'QR Code', view: 'checkin', icon: QrCode },
            { label: 'Presentes', view: 'gifts', icon: Gift },
            { label: 'Ajustes', view: 'settings', icon: Settings2 },
        ];
    }

    return [
        { label: 'Resumo', view: 'overview', icon: BarChart3 },
        { label: 'Eventos', view: 'events', icon: CalendarDays },
        { label: 'Convidados', view: 'guests', icon: UsersRound },
        { label: 'Orcamento', view: 'budget', icon: ClipboardList },
        { label: 'Presentes', view: 'gifts', icon: Gift },
        { label: 'Templates', view: 'templates', icon: ImagePlus },
        { label: 'Check-in', view: 'checkin', icon: QrCode },
        { label: 'Ajustes', view: 'settings', icon: Settings2 },
    ];
}

function actionsFor(user: AuthUser): ActionItem[] {
    if (user.role === 'platform_admin') {
        return [
            { label: 'Revisar saude', icon: Activity, message: 'Fila, banco e storage revisados com sucesso.' },
            { label: 'Abrir suporte', icon: LifeBuoy, message: 'Central de suporte aberta para triagem.' },
            {
                label: 'Exportar tenants',
                icon: Download,
                message: 'Relatorio de tenants exportado com sucesso.',
                variant: 'secondary',
            },
        ];
    }

    if (user.role === 'guest') {
        return [
            { label: 'Confirmar presenca', icon: CheckCircle2, message: 'Presenca confirmada. QR Code liberado.' },
            {
                label: 'Ver mapa',
                icon: MapPin,
                message: 'Mapa do Atelier Vista aberto com sucesso.',
                variant: 'secondary',
            },
            { label: 'Enviar recado', icon: Send, message: 'Recado enviado para os anfitrioes.' },
        ];
    }

    return [
        { label: 'Criar evento', icon: CalendarDays, message: 'Novo evento iniciado.' },
        { label: 'Enviar lembrete', icon: Megaphone, message: 'Lembrete enviado para convidados pendentes.' },
        {
            label: 'Exportar lista',
            icon: Download,
            message: 'Lista de convidados exportada com sucesso.',
            variant: 'secondary',
        },
    ];
}

function expectedRoleForPath(pathname: string): UserRole | null {
    if (pathname.startsWith('/admin')) {
        return 'platform_admin';
    }

    if (pathname.startsWith('/organizador')) {
        return 'owner';
    }

    if (pathname.startsWith('/convidado')) {
        return 'guest';
    }

    return null;
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const session = getStoredSession();
    const user = session?.user;
    const [view, setView] = useState<DashboardView>('overview');
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [createdEvents, setCreatedEvents] = useState<CreatedEventSummary[]>([]);
    const [eventOverrides, setEventOverrides] = useState<CreatedEventSummary[]>(() =>
        readStoredArray('invitely.eventOverrides', []),
    );
    const [deletedEventIds, setDeletedEventIds] = useState<string[]>(() =>
        readStoredArray('invitely.deletedEventIds', []),
    );
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() =>
        readStoredArray('invitely.budgetItems', defaultBudgetItems),
    );
    const [giftWishes, setGiftWishes] = useState<GiftWish[]>(() =>
        readStoredArray('invitely.giftWishes', defaultGiftWishes),
    );
    const [reminderEventId, setReminderEventId] = useState('');
    const [activeTemplate, setActiveTemplate] = useState<TemplateOption>(defaultTemplate);
    const [toast, setToast] = useState('Dashboard carregado. Explore os modulos do produto.');

    const expectedRole = expectedRoleForPath(location.pathname);
    const navigation = useMemo(() => (user ? navigationFor(user) : []), [user]);
    const actions = useMemo(() => (user ? actionsFor(user) : []), [user]);
    const shouldLoadAdminEvents = user?.role === 'owner' && Boolean(session?.token);
    const eventsQuery = useQuery({
        queryKey: ['admin-events', session?.user.id],
        enabled: shouldLoadAdminEvents,
        queryFn: async () => {
            if (!session?.token) {
                throw new Error('Sessao expirada. Faca login novamente.');
            }

            const response = await fetch(apiV1Url('/go/events'), {
                headers: authHeaders(session.token),
            });
            const payload = (await response.json().catch(() => ({}))) as PaginatedEventResponse & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(payload.message ?? 'Nao foi possivel carregar eventos salvos.');
            }

            return (payload.data ?? []).map(mapEventResource);
        },
    });

    const events = useMemo(() => {
        const overrides = new Map(eventOverrides.map((event) => [event.id, event]));

        return [...createdEvents, ...(eventsQuery.data ?? [])]
            .filter((event) => !deletedEventIds.includes(event.id))
            .map((event) => overrides.get(event.id) ?? event);
    }, [createdEvents, deletedEventIds, eventOverrides, eventsQuery.data]);
    const planningEventId = events[0]?.id;
    const activeReminderEventId = reminderEventId || planningEventId;
    const planningGuestsQuery = useQuery({
        queryKey: ['event-guests', planningEventId],
        enabled: user?.role === 'owner' && Boolean(session?.token) && Boolean(planningEventId),
        queryFn: async () => {
            if (!session?.token || !planningEventId) {
                throw new Error('Selecione um evento para carregar convidados.');
            }

            const response = await fetch(apiV1Url(`/go/guests?event_id=${encodeURIComponent(planningEventId)}`), {
                headers: authHeaders(session.token),
            });

            if (!response.ok) {
                throw await responseError(response, 'Nao foi possivel carregar convidados.');
            }

            const payload = (await response.json()) as GuestListResponse;

            return (payload.data ?? []).map(mapGuestResource).filter((guest) => guest.email.trim() !== '');
        },
    });
    const reminderGuestsQuery = useQuery({
        queryKey: ['event-reminder-guests', activeReminderEventId],
        enabled:
            user?.role === 'owner' &&
            Boolean(session?.token) &&
            Boolean(activeReminderEventId) &&
            activeReminderEventId !== planningEventId,
        queryFn: async () => {
            if (!session?.token || !activeReminderEventId) {
                throw new Error('Selecione um evento para carregar convidados.');
            }

            const response = await fetch(apiV1Url(`/go/guests?event_id=${encodeURIComponent(activeReminderEventId)}`), {
                headers: authHeaders(session.token),
            });

            if (!response.ok) {
                throw await responseError(response, 'Nao foi possivel carregar convidados.');
            }

            const payload = (await response.json()) as GuestListResponse;

            return (payload.data ?? []).map(mapGuestResource).filter((guest) => guest.email.trim() !== '');
        },
    });
    const reminderGuests =
        activeReminderEventId === planningEventId ? (planningGuestsQuery.data ?? []) : (reminderGuestsQuery.data ?? []);
    const isLoadingReminderGuests =
        activeReminderEventId === planningEventId ? planningGuestsQuery.isLoading : reminderGuestsQuery.isLoading;
    const reminderGuestsError =
        activeReminderEventId === planningEventId
            ? planningGuestsQuery.error?.message
            : reminderGuestsQuery.error?.message;
    const budgetQuery = useQuery({
        queryKey: ['event-budget', planningEventId],
        enabled: user?.role === 'owner' && Boolean(session?.token) && Boolean(planningEventId),
        queryFn: async () => {
            if (!session?.token || !planningEventId) {
                throw new Error('Selecione um evento para carregar o orcamento.');
            }

            const response = await fetch(apiV1Url(`/go/events/${planningEventId}/budget`), {
                headers: authHeaders(session.token),
            });

            if (!response.ok) {
                throw await responseError(response, 'Nao foi possivel carregar o orcamento.');
            }

            const payload = (await response.json()) as BudgetListResponse;

            return (payload.data ?? []).map(mapBudgetResource);
        },
    });
    const giftsQuery = useQuery({
        queryKey: ['event-gifts', planningEventId],
        enabled: user?.role === 'owner' && Boolean(session?.token) && Boolean(planningEventId),
        queryFn: async () => {
            if (!session?.token || !planningEventId) {
                throw new Error('Selecione um evento para carregar os presentes.');
            }

            const response = await fetch(apiV1Url(`/go/events/${planningEventId}/gifts`), {
                headers: authHeaders(session.token),
            });

            if (!response.ok) {
                throw await responseError(response, 'Nao foi possivel carregar os presentes.');
            }

            const payload = (await response.json()) as GiftListResponse;

            return (payload.data ?? []).map(mapGiftResource);
        },
    });

    if (!session || !user) {
        return <Navigate to="/login" replace />;
    }

    if (expectedRole && expectedRole !== user.role) {
        return <Navigate to={destinations[user.role]} replace />;
    }

    const copy = profileCopy[user.role];

    function notify(message: string) {
        setToast(message);
    }

    function logout() {
        clearSession();
        void navigate('/login');
    }

    function runAction(item: ActionItem) {
        if (user?.role === 'owner' && item.label === 'Criar evento') {
            setIsCreatingEvent(true);
            setIsSendingReminder(false);
            setView('events');
        }

        if (user?.role === 'owner' && item.label === 'Enviar lembrete') {
            setIsSendingReminder(true);
            setIsCreatingEvent(false);
            setView('guests');
        }

        notify(item.message);
    }

    return (
        <main className="min-h-screen bg-[#060B1A] pb-24 text-white lg:pb-0">
            <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
                <aside className="hidden border-r border-[#263247] bg-[#0B0F1A]/95 p-5 lg:flex lg:flex-col">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/20">
                            <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                        </div>
                        <div>
                            <p className="font-bold">Invitely</p>
                            <p className="text-xs text-[#94A3B8]">{roleLabel(user.role)}</p>
                        </div>
                    </div>

                    <nav className="mt-8 grid gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.view}
                                    type="button"
                                    onClick={() => {
                                        setView(item.view);
                                        setIsCreatingEvent(false);
                                        setIsSendingReminder(false);
                                        notify(`${item.label} aberto.`);
                                    }}
                                    className={
                                        item.view === view
                                            ? 'flex h-11 items-center gap-3 rounded-xl bg-[#8B5CF6]/25 px-3 text-sm font-semibold text-white'
                                            : 'flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white'
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-auto grid gap-2">
                        <Link
                            to="/events/invitely-launch-night"
                            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white"
                        >
                            <Sparkles className="h-4 w-4" />
                            Ver convite
                        </Link>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-[#CBD5E1] transition hover:bg-[#121827] hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                        <div className="mt-3 rounded-2xl border border-[#263247] bg-[#121827] p-3">
                            <p className="text-sm font-semibold">{user.name || 'Usuario'}</p>
                            <p className="text-xs text-[#94A3B8]">{user.email}</p>
                        </div>
                    </div>
                </aside>

                <section className="px-4 py-5 sm:px-6 lg:px-8">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <span className="inline-flex rounded-full border border-[#263247] bg-[#121827] px-3 py-1 text-xs font-semibold text-[#CBD5E1]">
                                {copy.roleName}
                            </span>
                            <p className="mt-4 text-sm text-[#94A3B8]">{copy.eyebrow}</p>
                            <h1 className="mt-1 text-2xl font-extrabold tracking-normal sm:text-3xl">{copy.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">{copy.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {actions.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <ActionButton
                                        key={item.label}
                                        variant={item.variant ?? 'primary'}
                                        onClick={() => {
                                            runAction(item);
                                        }}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </ActionButton>
                                );
                            })}
                        </div>
                    </header>

                    <Toast message={toast} />

                    {isCreatingEvent ? (
                        <div className="mt-6">
                            <CreateEventForm
                                onCancel={() => {
                                    setIsCreatingEvent(false);
                                    notify('Criacao de evento cancelada.');
                                }}
                                onCreated={(event) => {
                                    setCreatedEvents((current) => [event, ...current]);
                                    setIsCreatingEvent(false);
                                    notify(`${event.title} criado e adicionado ao painel.`);
                                }}
                            />
                        </div>
                    ) : isSendingReminder ? (
                        <ReminderPanel
                            key={activeReminderEventId ?? 'no-event'}
                            events={events}
                            selectedEventId={activeReminderEventId}
                            organizerEmail={user.email}
                            token={session.token}
                            guests={reminderGuests}
                            isLoadingGuests={isLoadingReminderGuests}
                            guestsError={reminderGuestsError}
                            onEventChange={setReminderEventId}
                            onCancel={() => {
                                setIsSendingReminder(false);
                                notify('Envio de lembrete cancelado.');
                            }}
                            onSent={(count) => {
                                setIsSendingReminder(false);
                                notify(`${String(count)} lembrete(s) preparados para envio.`);
                            }}
                        />
                    ) : (
                        <DashboardContent
                            role={user.role}
                            view={view}
                            notify={notify}
                            events={events}
                            isLoadingEvents={eventsQuery.isLoading}
                            eventsError={eventsQuery.error?.message}
                            guests={planningGuestsQuery.data ?? []}
                            isLoadingGuests={planningGuestsQuery.isLoading}
                            guestsError={planningGuestsQuery.error?.message}
                            planningEventId={planningEventId}
                            budgetItems={budgetQuery.data ?? budgetItems}
                            giftWishes={giftsQuery.data ?? giftWishes}
                            isLoadingBudget={budgetQuery.isLoading}
                            isLoadingGifts={giftsQuery.isLoading}
                            budgetError={budgetQuery.error?.message}
                            giftsError={giftsQuery.error?.message}
                            onUpdateEvent={async (event) => {
                                if (!session.token) {
                                    throw new Error('Sessao expirada. Faca login novamente.');
                                }

                                const response = await fetch(apiV1Url(`/go/events/${event.id}`), {
                                    method: 'PUT',
                                    headers: authHeaders(session.token),
                                    body: JSON.stringify({
                                        title: event.title,
                                        description: event.description ?? 'Evento atualizado pelo painel Invitely.',
                                        starts_at: event.startsAt ?? new Date().toISOString(),
                                        ends_at:
                                            event.endsAt ??
                                            event.startsAt ??
                                            new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                                        location: event.place,
                                    }),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel atualizar o evento.');
                                }

                                const payload = (await response.json()) as { data?: AdminEventResource };
                                const updatedEvent = payload.data ? mapEventResource(payload.data) : event;
                                setCreatedEvents((current) =>
                                    current.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
                                );
                                setEventOverrides((current) => {
                                    const next = [
                                        updatedEvent,
                                        ...current.filter((item) => item.id !== updatedEvent.id),
                                    ];
                                    writeStoredArray('invitely.eventOverrides', next);

                                    return next;
                                });
                                void eventsQuery.refetch();
                                notify(`${updatedEvent.title} atualizado na API.`);
                            }}
                            onDeleteEvent={async (eventId) => {
                                if (!session.token) {
                                    throw new Error('Sessao expirada. Faca login novamente.');
                                }

                                const response = await fetch(apiV1Url(`/go/events/${eventId}`), {
                                    method: 'DELETE',
                                    headers: authHeaders(session.token),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel deletar o evento.');
                                }

                                setCreatedEvents((current) => current.filter((event) => event.id !== eventId));
                                setDeletedEventIds((current) => {
                                    const next = current.includes(eventId) ? current : [...current, eventId];
                                    writeStoredArray('invitely.deletedEventIds', next);

                                    return next;
                                });
                                void eventsQuery.refetch();
                                notify('Evento deletado na API.');
                            }}
                            onAddBudgetItem={async (item) => {
                                if (!session.token || !planningEventId) {
                                    throw new Error('Crie ou carregue um evento antes de adicionar custos.');
                                }

                                const response = await fetch(apiV1Url(`/go/events/${planningEventId}/budget`), {
                                    method: 'POST',
                                    headers: authHeaders(session.token),
                                    body: JSON.stringify({
                                        description: item.description,
                                        category: item.category,
                                        amount: item.amount,
                                        paid: item.paid,
                                    }),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel salvar o item de orcamento.');
                                }

                                const payload = (await response.json()) as BudgetResponse;
                                const createdItem = payload.data ? mapBudgetResource(payload.data) : item;
                                setBudgetItems((current) => [createdItem, ...current]);
                                void budgetQuery.refetch();
                                notify('Item de orcamento salvo na API.');
                            }}
                            onDeleteBudgetItem={async (itemId) => {
                                if (!session.token) {
                                    throw new Error('Sessao expirada. Faca login novamente.');
                                }

                                const response = await fetch(apiV1Url(`/go/budget/${itemId}`), {
                                    method: 'DELETE',
                                    headers: authHeaders(session.token),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel remover o item.');
                                }

                                setBudgetItems((current) => current.filter((item) => item.id !== itemId));
                                void budgetQuery.refetch();
                                notify('Item de orcamento removido da API.');
                            }}
                            onAddGiftWish={async (item) => {
                                if (!session.token || !planningEventId) {
                                    throw new Error('Crie ou carregue um evento antes de adicionar presentes.');
                                }

                                const response = await fetch(apiV1Url(`/go/events/${planningEventId}/gifts`), {
                                    method: 'POST',
                                    headers: authHeaders(session.token),
                                    body: JSON.stringify({
                                        name: item.name,
                                        description: item.description,
                                        price: item.price,
                                        url: item.url,
                                        reserved: item.reserved,
                                        reserved_by: item.reservedBy,
                                    }),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel salvar o presente.');
                                }

                                const payload = (await response.json()) as GiftResponse;
                                const createdItem = payload.data ? mapGiftResource(payload.data) : item;
                                setGiftWishes((current) => [createdItem, ...current]);
                                void giftsQuery.refetch();
                                notify('Presente salvo na API.');
                            }}
                            onDeleteGiftWish={async (itemId) => {
                                if (!session.token) {
                                    throw new Error('Sessao expirada. Faca login novamente.');
                                }

                                const response = await fetch(apiV1Url(`/go/gifts/${itemId}`), {
                                    method: 'DELETE',
                                    headers: authHeaders(session.token),
                                });

                                if (!response.ok) {
                                    throw await responseError(response, 'Nao foi possivel remover o presente.');
                                }

                                setGiftWishes((current) => current.filter((item) => item.id !== itemId));
                                void giftsQuery.refetch();
                                notify('Presente removido da API.');
                            }}
                            activeTemplate={activeTemplate}
                            onApplyTemplate={setActiveTemplate}
                        />
                    )}
                </section>
            </div>
        </main>
    );
}

function DashboardContent({
    role,
    view,
    notify,
    events,
    isLoadingEvents,
    eventsError,
    guests,
    isLoadingGuests,
    guestsError,
    planningEventId,
    budgetItems,
    giftWishes,
    isLoadingBudget,
    isLoadingGifts,
    budgetError,
    giftsError,
    onUpdateEvent,
    onDeleteEvent,
    onAddBudgetItem,
    onDeleteBudgetItem,
    onAddGiftWish,
    onDeleteGiftWish,
    activeTemplate,
    onApplyTemplate,
}: {
    role: UserRole;
    view: DashboardView;
    notify: (message: string) => void;
    events: CreatedEventSummary[];
    isLoadingEvents: boolean;
    eventsError?: string;
    guests: GuestRow[];
    isLoadingGuests: boolean;
    guestsError?: string;
    planningEventId?: string;
    budgetItems: BudgetItem[];
    giftWishes: GiftWish[];
    isLoadingBudget: boolean;
    isLoadingGifts: boolean;
    budgetError?: string;
    giftsError?: string;
    onUpdateEvent: (event: CreatedEventSummary) => Promise<void>;
    onDeleteEvent: (eventId: string) => Promise<void>;
    onAddBudgetItem: (item: BudgetItem) => Promise<void>;
    onDeleteBudgetItem: (itemId: string) => Promise<void>;
    onAddGiftWish: (item: GiftWish) => Promise<void>;
    onDeleteGiftWish: (itemId: string) => Promise<void>;
    activeTemplate: TemplateOption;
    onApplyTemplate: (template: TemplateOption) => void;
}) {
    if (view === 'overview') {
        return <Overview role={role} notify={notify} />;
    }

    if (view === 'events') {
        return (
            <EventsView
                role={role}
                notify={notify}
                events={role === 'owner' ? events : initialEventCards}
                isLoading={isLoadingEvents}
                error={eventsError}
                onUpdateEvent={onUpdateEvent}
                onDeleteEvent={onDeleteEvent}
            />
        );
    }

    if (view === 'budget') {
        return (
            <BudgetBIView
                eventId={planningEventId}
                events={events}
                guests={guests}
                items={budgetItems}
                isLoading={isLoadingBudget}
                error={budgetError}
                onAddItem={onAddBudgetItem}
                onDeleteItem={onDeleteBudgetItem}
                notify={notify}
            />
        );
    }

    if (view === 'guests') {
        if (isLoadingGuests) {
            return (
                <Panel title="Convidados" className="mt-6">
                    <div className="flex items-center gap-3 text-sm text-[#CBD5E1]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#22D3EE]/30 border-t-[#22D3EE]" />
                        Carregando convidados do evento...
                    </div>
                </Panel>
            );
        }

        if (guestsError) {
            return (
                <Panel title="Convidados" className="mt-6">
                    <p className="text-sm text-[#FCA5A5]">{guestsError}</p>
                </Panel>
            );
        }

        return (
            <DataPanel
                title="Convidados"
                headers={['Nome', 'Email', 'Status']}
                rows={guests.map((guest) => [guest.name, guest.email, guest.status])}
            />
        );
    }

    if (view === 'templates') {
        return <TemplatesView activeTemplate={activeTemplate} notify={notify} onApplyTemplate={onApplyTemplate} />;
    }

    if (view === 'checkin') {
        return <CheckInView role={role} notify={notify} />;
    }

    if (view === 'tenants') {
        return (
            <DataPanel
                title="Clientes e planos"
                headers={['Tenant', 'Plano', 'Eventos', 'Status']}
                rows={tenants.map((tenant) => [tenant.name, tenant.plan, tenant.events, tenant.status])}
            />
        );
    }

    if (view === 'platform') {
        return (
            <DataPanel
                title="Governanca da plataforma"
                headers={['Area', 'Controle', 'Status']}
                rows={[
                    ['Autenticacao', 'Tokens por habilidade', 'Ativo'],
                    ['Tenancy', 'Tenant opcional por request', 'Ativo'],
                    ['Auditoria', 'Eventos criticos em fila', 'Produção'],
                ]}
            />
        );
    }

    if (view === 'support') {
        return (
            <CardsModule
                title="Suporte"
                icon={LifeBuoy}
                notify={notify}
                items={['Novo chamado', 'Bug reportado', 'Upgrade de plano']}
            />
        );
    }

    if (view === 'rsvp') {
        return <RsvpView notify={notify} />;
    }

    if (view === 'gifts') {
        return role === 'owner' ? (
            <GiftPlannerView
                eventId={planningEventId}
                wishes={giftWishes}
                isLoading={isLoadingGifts}
                error={giftsError}
                onAddWish={onAddGiftWish}
                onDeleteWish={onDeleteGiftWish}
                notify={notify}
            />
        ) : (
            <CardsModule
                title="Presentes"
                icon={Gift}
                notify={notify}
                items={['Pix dos anfitrioes', 'Lista online', 'Mensagem carinhosa']}
            />
        );
    }

    if (view === 'integrations') {
        return (
            <CardsModule title="Integracoes" icon={Link2} notify={notify} items={['Supabase', 'Mailpit', 'MinIO']} />
        );
    }

    return (
        <CardsModule
            title="Configuracoes"
            icon={Settings2}
            notify={notify}
            items={['Perfil', 'Notificacoes', 'Privacidade']}
        />
    );
}

function Overview({ role, notify }: { role: UserRole; notify: (message: string) => void }) {
    const metrics: MetricItem[] =
        role === 'platform_admin'
            ? [
                  { label: 'Tenants ativos', value: '42', trend: '+6 esta semana', icon: Crown, color: '#A78BFA' },
                  {
                      label: 'Eventos publicados',
                      value: '318',
                      trend: '+18% este mes',
                      icon: CalendarDays,
                      color: '#22D3EE',
                  },
                  { label: 'Fila de e-mail', value: '12', trend: 'processando', icon: Bell, color: '#F59E0B' },
                  { label: 'SLA suporte', value: '98%', trend: '+2 pontos', icon: Activity, color: '#22C55E' },
              ]
            : role === 'guest'
              ? [
                    { label: 'RSVP', value: 'Sim', trend: 'confirmado', icon: CheckCircle2, color: '#22C55E' },
                    { label: 'Acompanhantes', value: '2', trend: 'liberado', icon: UsersRound, color: '#22D3EE' },
                    { label: 'Entrada', value: 'QR', trend: 'pronto', icon: QrCode, color: '#A78BFA' },
                    { label: 'Recados', value: '3', trend: 'novos', icon: Bell, color: '#F59E0B' },
                ]
              : [
                    { label: 'Eventos', value: '24', trend: '+18% este mes', icon: CalendarDays, color: '#22D3EE' },
                    { label: 'Convidados', value: '1.204', trend: '+24% este mes', icon: UsersRound, color: '#8B5CF6' },
                    { label: 'Taxa de RSVP', value: '76%', trend: '+8% este mes', icon: BarChart3, color: '#0EA5E9' },
                    { label: 'Check-ins', value: '846', trend: '+12% este mes', icon: QrCode, color: '#EF4444' },
                ];

    return (
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <button
                            key={metric.label}
                            type="button"
                            onClick={() => {
                                notify(`${metric.label} aberto.`);
                            }}
                            className="rounded-2xl border border-[#263247] bg-[#121827] p-5 text-left shadow-xl transition hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-sm text-[#CBD5E1]">{metric.label}</p>
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1A1F2E]">
                                    <Icon className="h-5 w-5" style={{ color: metric.color }} />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-extrabold">{metric.value}</p>
                            <p className="mt-2 text-xs text-[#22C55E]">{metric.trend}</p>
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Panel title={role === 'guest' ? 'Detalhes da festa' : 'Atividade recente'}>
                    <ActivityList role={role} />
                </Panel>
                <Panel title={role === 'guest' ? 'Proximos passos' : 'Distribuicao de RSVP'}>
                    <DonutSummary role={role} />
                </Panel>
            </div>
        </motion.div>
    );
}

function EventsView({
    role,
    notify,
    events,
    isLoading,
    error,
    onUpdateEvent,
    onDeleteEvent,
}: {
    role: UserRole;
    notify: (message: string) => void;
    events: CreatedEventSummary[];
    isLoading: boolean;
    error?: string;
    onUpdateEvent: (event: CreatedEventSummary) => Promise<void>;
    onDeleteEvent: (eventId: string) => Promise<void>;
}) {
    const [editingEvent, setEditingEvent] = useState<CreatedEventSummary | null>(null);

    if (isLoading) {
        return (
            <Panel title="Eventos" className="mt-6">
                <div className="flex items-center gap-3 text-sm text-[#CBD5E1]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#22D3EE]/30 border-t-[#22D3EE]" />
                    Carregando eventos salvos na API Go...
                </div>
            </Panel>
        );
    }

    if (error) {
        return (
            <Panel title="Eventos" className="mt-6">
                <p className="text-sm text-[#FCA5A5]">{error}</p>
            </Panel>
        );
    }

    if (events.length === 0) {
        return (
            <Panel title="Eventos" className="mt-6">
                <p className="text-sm leading-6 text-[#94A3B8]">
                    Nenhum evento salvo ainda. Use Criar evento para gravar o primeiro convite no banco.
                </p>
            </Panel>
        );
    }

    return (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
                <motion.article
                    key={event.id}
                    whileHover={{ y: -6 }}
                    className="overflow-hidden rounded-3xl border border-[#263247] bg-[#121827] shadow-xl"
                >
                    <img src={event.image} alt="" className="h-44 w-full object-cover" />
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold">{event.title}</h2>
                                <p className="mt-1 text-sm text-[#94A3B8]">{event.date}</p>
                            </div>
                            <StatusChip status={event.status} />
                        </div>
                        <p className="mt-3 text-sm text-[#CBD5E1]">{event.place}</p>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <MetricPill
                                label={role === 'platform_admin' ? 'Tenant' : 'Confirmados'}
                                value={role === 'platform_admin' ? 'Produção' : String(event.confirmed)}
                            />
                            <MetricPill label="Taxa RSVP" value={`${String(event.rsvp)}%`} />
                        </div>
                        <ActionButton
                            className="mt-5 w-full"
                            onClick={() => {
                                setEditingEvent(event);
                                notify(`${event.title} aberto para edicao.`);
                            }}
                        >
                            Gerenciar evento
                        </ActionButton>
                        {role === 'owner' ? (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <ActionButton
                                    variant="secondary"
                                    onClick={() => {
                                        setEditingEvent(event);
                                    }}
                                >
                                    Editar
                                </ActionButton>
                                <ActionButton
                                    variant="danger"
                                    onClick={() => {
                                        if (window.confirm(`Remover ${event.title} do painel?`)) {
                                            onDeleteEvent(event.id).catch((deleteError: unknown) => {
                                                notify(
                                                    getErrorMessage(deleteError, 'Nao foi possivel deletar o evento.'),
                                                );
                                            });
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Deletar
                                </ActionButton>
                            </div>
                        ) : null}
                    </div>
                </motion.article>
            ))}
            {editingEvent ? (
                <EventEditPanel
                    event={editingEvent}
                    onCancel={() => {
                        setEditingEvent(null);
                    }}
                    onSave={async (event) => {
                        await onUpdateEvent(event);
                        setEditingEvent(null);
                    }}
                />
            ) : null}
        </section>
    );
}

function EventEditPanel({
    event,
    onCancel,
    onSave,
}: {
    event: CreatedEventSummary;
    onCancel: () => void;
    onSave: (event: CreatedEventSummary) => Promise<void>;
}) {
    const [draft, setDraft] = useState(event);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[#22D3EE]/40 bg-[#0B0F1A] p-5 shadow-2xl md:col-span-2 xl:col-span-3"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-[#22D3EE]">Edicao rapida</p>
                    <h2 className="mt-1 text-xl font-bold">{event.title}</h2>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                        Ajustes salvos no painel. Quando a API Go expuser edicao, este fluxo pode gravar no backend.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ActionButton variant="secondary" onClick={onCancel}>
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        onClick={() => {
                            setIsSaving(true);
                            setError(null);
                            onSave(draft)
                                .catch((saveError: unknown) => {
                                    setError(getErrorMessage(saveError, 'Nao foi possivel salvar o evento.'));
                                })
                                .finally(() => {
                                    setIsSaving(false);
                                });
                        }}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </ActionButton>
                </div>
            </div>
            {error ? <p className="mt-4 text-sm text-[#FCA5A5]">{error}</p> : null}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label>
                    <span className="mb-2 block text-sm text-[#CBD5E1]">Nome</span>
                    <input
                        value={draft.title}
                        onChange={(input) => {
                            setDraft((current) => ({ ...current, title: input.target.value }));
                        }}
                        className="field-control"
                    />
                </label>
                <label>
                    <span className="mb-2 block text-sm text-[#CBD5E1]">Local</span>
                    <input
                        value={draft.place}
                        onChange={(input) => {
                            setDraft((current) => ({ ...current, place: input.target.value }));
                        }}
                        className="field-control"
                    />
                </label>
                <label>
                    <span className="mb-2 block text-sm text-[#CBD5E1]">Status</span>
                    <select
                        value={draft.status}
                        onChange={(input) => {
                            setDraft((current) => ({ ...current, status: input.target.value }));
                        }}
                        className="field-control"
                    >
                        <option>Salvo</option>
                        <option>Rascunho</option>
                        <option>Publicado</option>
                        <option>Encerrado</option>
                    </select>
                </label>
            </div>
        </motion.aside>
    );
}

function BudgetBIView({
    eventId,
    events,
    guests,
    items,
    isLoading,
    error,
    onAddItem,
    onDeleteItem,
    notify,
}: {
    eventId?: string;
    events: CreatedEventSummary[];
    guests: GuestRow[];
    items: BudgetItem[];
    isLoading: boolean;
    error?: string;
    onAddItem: (item: BudgetItem) => Promise<void>;
    onDeleteItem: (itemId: string) => Promise<void>;
    notify: (message: string) => void;
}) {
    const [draft, setDraft] = useState({ category: '', description: '', amount: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const confirmedFromGuests = guests.filter(
        (guest) => guest.status === 'Confirmado' || guest.status === 'Check-in feito',
    ).length;
    const confirmedFromEvents = events.reduce((sum, event) => sum + event.confirmed, 0);
    const confirmedGuests = Math.max(confirmedFromGuests, confirmedFromEvents, 1);
    const allGuests = Math.max(guests.length, confirmedGuests, 1);
    const contingency = total * 0.12;
    const estimatedTotal = total + contingency;

    function addItem() {
        const amount = Number(draft.amount);

        if (!draft.category.trim() || Number.isNaN(amount) || amount <= 0) {
            return;
        }

        setIsSaving(true);
        setFormError(null);
        onAddItem({
            id: `budget-${Date.now().toString()}`,
            eventId,
            category: draft.category.trim(),
            description: draft.description.trim() || draft.category.trim(),
            amount,
            paid: false,
        })
            .then(() => {
                setDraft({ category: '', description: '', amount: '' });
            })
            .catch((addError: unknown) => {
                setFormError(getErrorMessage(addError, 'Nao foi possivel salvar o item de orcamento.'));
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    function removeItem(id: string) {
        onDeleteItem(id).catch((deleteError: unknown) => {
            notify(getErrorMessage(deleteError, 'Nao foi possivel remover o item.'));
        });
    }

    return (
        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5">
                {!eventId ? (
                    <Panel title="Orcamento" className="border-[#F59E0B]/40">
                        <p className="text-sm text-[#FDE68A]">Crie ou carregue um evento antes de salvar custos.</p>
                    </Panel>
                ) : null}
                {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricPill label="Custo base" value={formatCurrency(total)} />
                    <MetricPill label="Reserva 12%" value={formatCurrency(contingency)} />
                    <MetricPill label="Estimativa total" value={formatCurrency(estimatedTotal)} />
                    <MetricPill label="Por convidado - todos" value={formatCurrency(estimatedTotal / allGuests)} />
                    <MetricPill
                        label="Por convidado - confirmados"
                        value={formatCurrency(estimatedTotal / confirmedGuests)}
                    />
                </div>

                <Panel title="Custos planejados">
                    {isLoading ? <p className="mb-4 text-sm text-[#94A3B8]">Carregando orcamento...</p> : null}
                    <div className="grid gap-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-3 rounded-2xl border border-[#263247] bg-[#0B0F1A] p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                            >
                                <div>
                                    <p className="font-semibold">{item.category}</p>
                                    <p className="mt-1 text-sm text-[#94A3B8]">{item.description}</p>
                                </div>
                                <strong>{formatCurrency(item.amount)}</strong>
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeItem(item.id);
                                    }}
                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[#EF4444]/40 px-3 text-sm text-[#FCA5A5]"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <aside className="rounded-3xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl">
                <ClipboardList className="h-6 w-6 text-[#22D3EE]" />
                <h3 className="mt-4 text-xl font-bold">Adicionar custo</h3>
                <div className="mt-5 grid gap-3">
                    <input
                        placeholder="Buffet, aluguel, decoracao..."
                        value={draft.category}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, category: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <input
                        placeholder="Descricao"
                        value={draft.description}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, description: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <input
                        type="number"
                        min="0"
                        placeholder="Valor estimado"
                        value={draft.amount}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, amount: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <ActionButton onClick={addItem}>Adicionar ao BI</ActionButton>
                    {formError ? <p className="text-sm text-[#FCA5A5]">{formError}</p> : null}
                    {isSaving ? <p className="text-sm text-[#94A3B8]">Salvando na API...</p> : null}
                </div>
            </aside>
        </section>
    );
}

function GiftPlannerView({
    eventId,
    wishes,
    isLoading,
    error,
    onAddWish,
    onDeleteWish,
    notify,
}: {
    eventId?: string;
    wishes: GiftWish[];
    isLoading: boolean;
    error?: string;
    onAddWish: (item: GiftWish) => Promise<void>;
    onDeleteWish: (itemId: string) => Promise<void>;
    notify: (message: string) => void;
}) {
    const [draft, setDraft] = useState({ name: '', description: '', price: '', url: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const total = wishes.reduce((sum, item) => sum + item.price, 0);

    function addWish() {
        const price = Number(draft.price);

        if (!draft.name.trim() || Number.isNaN(price) || price < 0) {
            return;
        }

        setIsSaving(true);
        setFormError(null);
        onAddWish({
            id: `gift-${Date.now().toString()}`,
            eventId,
            name: draft.name.trim(),
            description: draft.description.trim(),
            price,
            url: draft.url.trim(),
            reserved: false,
            reservedBy: '',
        })
            .then(() => {
                setDraft({ name: '', description: '', price: '', url: '' });
            })
            .catch((addError: unknown) => {
                setFormError(getErrorMessage(addError, 'Nao foi possivel salvar o presente.'));
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    return (
        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Panel title="Lista de presentes desejados">
                {!eventId ? (
                    <p className="mb-4 text-sm text-[#FDE68A]">Crie ou carregue um evento antes de salvar presentes.</p>
                ) : null}
                {error ? <p className="mb-4 text-sm text-[#FCA5A5]">{error}</p> : null}
                {isLoading ? <p className="mb-4 text-sm text-[#94A3B8]">Carregando presentes...</p> : null}
                <div className="grid gap-3">
                    {wishes.map((wish) => (
                        <div
                            key={wish.id}
                            className="grid gap-3 rounded-2xl border border-[#263247] bg-[#0B0F1A] p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                        >
                            <div>
                                <p className="font-semibold">{wish.name}</p>
                                <p className="mt-1 text-sm text-[#94A3B8]">{wish.description || wish.url}</p>
                            </div>
                            <strong>{formatCurrency(wish.price)}</strong>
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteWish(wish.id).catch((deleteError: unknown) => {
                                        notify(getErrorMessage(deleteError, 'Nao foi possivel remover o presente.'));
                                    });
                                }}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#EF4444]/40 px-3 text-sm text-[#FCA5A5]"
                            >
                                Remover
                            </button>
                        </div>
                    ))}
                </div>
            </Panel>

            <aside className="rounded-3xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl">
                <Gift className="h-6 w-6 text-[#A78BFA]" />
                <h3 className="mt-4 text-xl font-bold">Novo presente</h3>
                <p className="mt-2 text-sm text-[#94A3B8]">Meta total: {formatCurrency(total)}</p>
                <div className="mt-5 grid gap-3">
                    <input
                        placeholder="Ex: Cota lua de mel"
                        value={draft.name}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, name: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <input
                        placeholder="Descricao"
                        value={draft.description}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, description: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <input
                        type="url"
                        placeholder="Link da loja ou lista"
                        value={draft.url}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, url: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <input
                        type="number"
                        min="0"
                        placeholder="Valor desejado"
                        value={draft.price}
                        onChange={(event) => {
                            setDraft((current) => ({ ...current, price: event.target.value }));
                        }}
                        className="field-control"
                    />
                    <ActionButton onClick={addWish}>Adicionar presente</ActionButton>
                    {formError ? <p className="text-sm text-[#FCA5A5]">{formError}</p> : null}
                    {isSaving ? <p className="text-sm text-[#94A3B8]">Salvando na API...</p> : null}
                </div>
            </aside>
        </section>
    );
}

function ReminderPanel({
    events,
    selectedEventId,
    organizerEmail,
    token,
    guests,
    isLoadingGuests,
    guestsError,
    onEventChange,
    onCancel,
    onSent,
}: {
    events: CreatedEventSummary[];
    selectedEventId?: string;
    organizerEmail: string;
    token: string;
    guests: GuestRow[];
    isLoadingGuests: boolean;
    guestsError?: string;
    onEventChange: (eventId: string) => void;
    onCancel: () => void;
    onSent: (count: number) => void;
}) {
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    const pendingGuests = guests.filter((guest) => guest.status === 'Pendente');
    const defaultRecipientEmails =
        pendingGuests.length > 0 ? pendingGuests.map((guest) => guest.email) : guests.map((guest) => guest.email);
    const [fromEmail, setFromEmail] = useState(organizerEmail);
    const [selectedEmailsOverride, setSelectedEmailsOverride] = useState<string[] | null>(null);
    const [customRecipients, setCustomRecipients] = useState<GuestRow[]>([]);
    const [customEmail, setCustomEmail] = useState('');
    const [subject, setSubject] = useState('Lembrete: confirme sua presenca no evento');
    const [message, setMessage] = useState(
        'Oi! Passando para lembrar voce de confirmar presenca. Assim conseguimos organizar tudo com carinho.',
    );
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const reminderGuests = [...guests, ...customRecipients];
    const pendingRecipientEmails = reminderGuests
        .filter((guest) => guest.status === 'Pendente' || guest.status === 'Manual')
        .map((guest) => guest.email);
    const selectedEmails = selectedEmailsOverride ?? defaultRecipientEmails;
    const canSend =
        Boolean(selectedEventId) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail.trim()) &&
        selectedEmails.length > 0 &&
        subject.trim() !== '' &&
        message.trim() !== '';

    function toggleEmail(email: string) {
        setSelectedEmailsOverride((current) =>
            (current ?? selectedEmails).includes(email)
                ? (current ?? selectedEmails).filter((item) => item !== email)
                : [...(current ?? selectedEmails), email],
        );
    }

    function selectEmails(emails: string[]) {
        setSelectedEmailsOverride(emails);
    }

    function addSelectedEmail(email: string) {
        setSelectedEmailsOverride((current) =>
            (current ?? selectedEmails).includes(email)
                ? (current ?? selectedEmails)
                : [...(current ?? selectedEmails), email],
        );
    }

    function addCustomEmail() {
        const normalizedEmail = customEmail.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return;
        }

        if (reminderGuests.some((guest) => guest.email === normalizedEmail)) {
            addSelectedEmail(normalizedEmail);
            setCustomEmail('');
            return;
        }

        const [emailName = 'Convidado manual'] = normalizedEmail.split('@');

        setCustomRecipients((current) => [
            ...current,
            {
                name: emailName.replace(/[._-]/g, ' '),
                email: normalizedEmail,
                status: 'Manual',
            },
        ]);
        addSelectedEmail(normalizedEmail);
        setCustomEmail('');
    }

    async function sendReminder() {
        if (!canSend || !selectedEventId) {
            return;
        }

        setIsSending(true);
        setSendError(null);

        try {
            const response = await fetch(apiV1Url(`/go/events/${selectedEventId}/reminders`), {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({
                    from_email: fromEmail.trim(),
                    recipients: selectedEmails,
                    subject: subject.trim(),
                    message: message.trim(),
                }),
            });

            if (!response.ok) {
                throw await responseError(response, 'Nao foi possivel enviar os lembretes.');
            }

            const payload = (await response.json().catch(() => ({}))) as {
                data?: {
                    queued?: number;
                    status?: string;
                };
            };
            const sentCount = payload.data?.queued ?? selectedEmails.length;

            onSent(sentCount);
        } catch (error: unknown) {
            setSendError(getErrorMessage(error, 'Nao foi possivel enviar os lembretes.'));
        } finally {
            setIsSending(false);
        }
    }

    return (
        <motion.section
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
            <div className="rounded-3xl border border-[#263247] bg-[#121827]/90 p-6 shadow-2xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#22D3EE]">Campanha de lembrete</p>
                        <h2 className="mt-2 text-2xl font-bold">Enviar e-mails para convidados</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
                            Escolha um evento, defina o remetente e selecione os convidados que devem receber o
                            lembrete.
                        </p>
                    </div>
                    <ActionButton variant="secondary" onClick={onCancel}>
                        Cancelar
                    </ActionButton>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <label>
                        <span className="mb-2 block text-sm text-[#CBD5E1]">Evento</span>
                        <select
                            value={selectedEventId ?? ''}
                            onChange={(event) => {
                                onEventChange(event.target.value);
                            }}
                            className="field-control"
                        >
                            {events.length === 0 ? <option value="">Nenhum evento salvo</option> : null}
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span className="mb-2 block text-sm text-[#CBD5E1]">E-mail de quem envia</span>
                        <input
                            type="email"
                            value={fromEmail}
                            onChange={(event) => {
                                setFromEmail(event.target.value);
                            }}
                            placeholder="seu@email.com"
                            className="field-control"
                        />
                    </label>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <Panel title="Destinatarios">
                        {isLoadingGuests ? (
                            <p className="mb-4 text-sm text-[#94A3B8]">Carregando convidados do evento...</p>
                        ) : null}
                        {guestsError ? <p className="mb-4 text-sm text-[#FCA5A5]">{guestsError}</p> : null}
                        {!isLoadingGuests && reminderGuests.length === 0 ? (
                            <p className="mb-4 text-sm text-[#FDE68A]">
                                Este evento ainda nao tem convidados salvos. Adicione e-mails manualmente abaixo.
                            </p>
                        ) : null}
                        <div className="mb-4 flex flex-wrap gap-2">
                            <ActionButton
                                variant="secondary"
                                onClick={() => {
                                    selectEmails(reminderGuests.map((guest) => guest.email));
                                }}
                            >
                                Selecionar todos
                            </ActionButton>
                            <ActionButton
                                variant="secondary"
                                onClick={() => {
                                    selectEmails(pendingRecipientEmails);
                                }}
                            >
                                Apenas pendentes
                            </ActionButton>
                        </div>

                        <div className="grid gap-3">
                            {reminderGuests.map((guest) => {
                                const isSelected = selectedEmails.includes(guest.email);

                                return (
                                    <button
                                        key={guest.email}
                                        type="button"
                                        onClick={() => {
                                            toggleEmail(guest.email);
                                        }}
                                        className={
                                            isSelected
                                                ? 'flex items-center justify-between gap-3 rounded-2xl border border-[#22D3EE]/60 bg-[#0EA5E9]/15 p-4 text-left'
                                                : 'flex items-center justify-between gap-3 rounded-2xl border border-[#263247] bg-[#0B0F1A] p-4 text-left transition hover:border-[#22D3EE]/40'
                                        }
                                    >
                                        <span>
                                            <span className="block text-sm font-semibold text-white">{guest.name}</span>
                                            <span className="mt-1 block text-xs text-[#94A3B8]">{guest.email}</span>
                                        </span>
                                        <StatusChip status={guest.status} />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <input
                                value={customEmail}
                                onChange={(event) => {
                                    setCustomEmail(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        addCustomEmail();
                                    }
                                }}
                                placeholder="adicionar@email.com"
                                className="h-11 min-w-0 flex-1 rounded-xl border border-[#263247] bg-[#060B1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                            />
                            <ActionButton onClick={addCustomEmail}>Adicionar</ActionButton>
                        </div>
                        {customRecipients.length > 0 ? (
                            <p className="mt-3 text-xs text-[#94A3B8]">
                                {String(customRecipients.length)} e-mail(s) manual(is) adicionado(s) a campanha.
                            </p>
                        ) : null}
                    </Panel>

                    <Panel title="Mensagem">
                        <div className="grid gap-4">
                            <label>
                                <span className="mb-2 block text-sm text-[#CBD5E1]">Assunto</span>
                                <input
                                    value={subject}
                                    onChange={(event) => {
                                        setSubject(event.target.value);
                                    }}
                                    className="h-12 w-full rounded-xl border border-[#263247] bg-[#060B1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                                />
                            </label>
                            <label>
                                <span className="mb-2 block text-sm text-[#CBD5E1]">Mensagem</span>
                                <textarea
                                    value={message}
                                    onChange={(event) => {
                                        setMessage(event.target.value);
                                    }}
                                    rows={7}
                                    className="w-full resize-none rounded-xl border border-[#263247] bg-[#060B1A] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#22D3EE]"
                                />
                            </label>
                        </div>
                    </Panel>
                </div>
            </div>

            <aside className="rounded-3xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/20">
                    <Mail className="h-5 w-5 text-[#A78BFA]" />
                </div>
                <h3 className="mt-5 text-xl font-bold">Resumo do envio</h3>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                    {String(selectedEmails.length)} destinatario(s) selecionado(s) para{' '}
                    {selectedEvent?.title ?? 'um evento selecionado'}.
                </p>
                <div className="mt-5 rounded-2xl border border-[#263247] bg-[#121827] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Remetente</p>
                    <p className="mt-2 text-sm text-white">{fromEmail || 'Informe um e-mail'}</p>
                </div>
                <div className="mt-5 rounded-2xl border border-[#263247] bg-[#121827] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Assunto</p>
                    <p className="mt-2 text-sm text-white">{subject}</p>
                </div>
                <ActionButton
                    className="mt-5 w-full"
                    onClick={() => {
                        void sendReminder();
                    }}
                    disabled={!canSend || isSending}
                >
                    {isSending ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            Enviar lembretes
                        </>
                    )}
                </ActionButton>
                {!canSend ? (
                    <p className="mt-3 text-xs leading-5 text-[#FDE68A]">
                        Selecione um evento, informe um remetente valido e escolha pelo menos um destinatario.
                    </p>
                ) : null}
                {sendError ? <p className="mt-3 text-xs leading-5 text-[#FCA5A5]">{sendError}</p> : null}
            </aside>
        </motion.section>
    );
}

function TemplatesView({
    activeTemplate,
    notify,
    onApplyTemplate,
}: {
    activeTemplate: TemplateOption;
    notify: (message: string) => void;
    onApplyTemplate: (template: TemplateOption) => void;
}) {
    return (
        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {templateOptions.map((template) => {
                    const isActive = activeTemplate.id === template.id;

                    return (
                        <motion.article
                            key={template.id}
                            whileHover={{ y: -5 }}
                            className={
                                isActive
                                    ? 'rounded-3xl border border-[#22D3EE]/70 bg-[#121827] p-5 shadow-[0_24px_80px_rgba(34,211,238,0.12)]'
                                    : 'rounded-3xl border border-[#263247] bg-[#121827] p-5 transition hover:border-[#22D3EE]/40'
                            }
                        >
                            <div
                                className="relative h-36 overflow-hidden rounded-2xl"
                                style={{ background: template.gradient }}
                            >
                                <img
                                    src={template.image}
                                    alt=""
                                    className="h-full w-full object-cover opacity-45 mix-blend-screen"
                                />
                                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                                    {template.badge}
                                </span>
                            </div>
                            <div className="mt-4 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold">{template.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{template.description}</p>
                                </div>
                                {isActive ? <StatusChip status="Ativo" /> : null}
                            </div>
                            <div className="mt-4 grid gap-2">
                                {template.highlights.map((highlight) => (
                                    <span key={highlight} className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                                        <CheckCircle2 className="h-4 w-4" style={{ color: template.accent }} />
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                            <ActionButton
                                className="mt-5 w-full"
                                variant={isActive ? 'secondary' : 'primary'}
                                onClick={() => {
                                    onApplyTemplate(template);
                                    notify(`${template.name} aplicado ao preview do evento.`);
                                }}
                            >
                                <Wand2 className="h-4 w-4" />
                                {isActive ? 'Template aplicado' : 'Aplicar template'}
                            </ActionButton>
                        </motion.article>
                    );
                })}
            </div>

            <aside className="rounded-3xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl">
                <p className="text-sm font-semibold text-[#94A3B8]">Preview do template</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#263247] bg-[#121827]">
                    <div className="relative h-44" style={{ background: activeTemplate.gradient }}>
                        <img
                            src={activeTemplate.image}
                            alt=""
                            className="h-full w-full object-cover opacity-50 mix-blend-screen"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#060B1A] to-transparent p-4">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                                {activeTemplate.badge}
                            </span>
                            <h3 className="mt-3 text-2xl font-extrabold">{activeTemplate.name}</h3>
                        </div>
                    </div>
                    <div className="grid gap-3 p-4">
                        {activeTemplate.highlights.map((highlight) => (
                            <div
                                key={highlight}
                                className="rounded-xl border border-[#263247] bg-[#0B0F1A] p-3 text-sm text-[#CBD5E1]"
                            >
                                {highlight}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </section>
    );
}

function CheckInView({ role, notify }: { role: UserRole; notify: (message: string) => void }) {
    return (
        <Panel title={role === 'guest' ? 'Meu QR Code' : 'Check-in por QR Code'} className="mt-6 max-w-2xl">
            <div className="grid gap-4">
                <div className="grid aspect-square max-w-48 place-items-center rounded-2xl border border-[#263247] bg-white text-[#060B1A]">
                    <QrCode className="h-24 w-24" />
                </div>
                <input
                    placeholder="Cole ou leia o token do convite"
                    defaultValue=""
                    className="h-14 rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                />
                <ActionButton
                    onClick={() => {
                        notify(role === 'guest' ? 'QR Code salvo no celular.' : 'Check-in validado com sucesso.');
                    }}
                >
                    <QrCode className="h-4 w-4" />
                    {role === 'guest' ? 'Salvar QR Code' : 'Validar entrada'}
                </ActionButton>
                <div className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]">
                    QR Code pronto para validacao na portaria.
                </div>
            </div>
        </Panel>
    );
}

function RsvpView({ notify }: { notify: (message: string) => void }) {
    return (
        <Panel title="Confirmacao de presenca" className="mt-6 max-w-2xl">
            <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    {['Vou sim', 'Talvez', 'Nao posso ir'].map((answer) => (
                        <ActionButton
                            key={answer}
                            variant={answer === 'Vou sim' ? 'primary' : 'secondary'}
                            onClick={() => {
                                notify(`RSVP atualizado: ${answer}.`);
                            }}
                        >
                            {answer}
                        </ActionButton>
                    ))}
                </div>
                <input
                    defaultValue="Vou com mais 2 pessoas"
                    className="h-12 rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-sm text-white outline-none transition focus:border-[#22D3EE]"
                />
            </div>
        </Panel>
    );
}

function CardsModule({
    title,
    icon: Icon,
    items,
    notify,
}: {
    title: string;
    icon: LucideIcon;
    items: string[];
    notify: (message: string) => void;
}) {
    return (
        <Panel title={title} className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
                {items.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => {
                            notify(`${item} aberto com sucesso.`);
                        }}
                        className="rounded-2xl border border-[#263247] bg-[#1A1F2E] p-5 text-left transition hover:-translate-y-1"
                    >
                        <Icon className="h-5 w-5 text-[#22D3EE]" />
                        <h3 className="mt-4 font-bold">{item}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                            Modulo preparado para evoluir com dados reais do produto.
                        </p>
                    </button>
                ))}
            </div>
        </Panel>
    );
}

function DataPanel({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
    return (
        <Panel title={title} className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-[#263247]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A1F2E] text-xs uppercase text-[#94A3B8]">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-4 py-3">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.join('-')} className="border-t border-[#263247]">
                                {row.map((cell, index) => (
                                    <td key={`${cell}-${String(index)}`} className="px-4 py-4">
                                        {index === row.length - 1 ? <StatusChip status={cell} /> : cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

function ActivityList({ role }: { role: UserRole }) {
    const items =
        role === 'platform_admin'
            ? ['Tenant Aurora Studio atualizou plano', 'Fila de e-mail estabilizada', 'Novo chamado atribuido']
            : role === 'guest'
              ? ['Evento confirmado para 23 jul 2026', 'Dress code: smart casual', 'Endereco salvo: Atelier Vista']
              : ['Joao Silva confirmou presenca', 'Maria Oliveira fez check-in', 'Lucas Pereira recusou presenca'];

    return (
        <div className="grid gap-4">
            {items.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
                    <div>
                        <p className="text-sm text-[#E2E8F0]">{item}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">ha {String(index * 7 + 2)} min</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function DonutSummary({ role }: { role: UserRole }) {
    const labels =
        role === 'guest'
            ? [
                  ['Confirmado', 'Sim', '#22D3EE'],
                  ['Acompanhantes', '2', '#8B5CF6'],
                  ['Entrada', 'QR liberado', '#22C55E'],
              ]
            : [
                  ['Confirmados', '76% (918)', '#22D3EE'],
                  ['Pendentes', '18% (216)', '#8B5CF6'],
                  ['Recusados', '6% (72)', '#EF4444'],
              ];

    return (
        <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
            <div className="mx-auto h-40 w-40 rounded-full bg-[conic-gradient(#22D3EE_0_76%,#8B5CF6_76%_94%,#EF4444_94%_100%)] p-8">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#121827] text-center">
                    <div>
                        <p className="text-2xl font-extrabold">{role === 'guest' ? 'OK' : '76%'}</p>
                        <p className="text-xs text-[#94A3B8]">{role === 'guest' ? 'Convite' : 'RSVP'}</p>
                    </div>
                </div>
            </div>
            <div className="grid gap-3 text-sm">
                {labels.map(([label, value, color]) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-[#CBD5E1]">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </span>
                        <strong>{value}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-3xl border border-[#263247] bg-[#121827] p-5 shadow-xl ${className}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-bold">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function ActionButton({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false,
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    disabled?: boolean;
}) {
    const classes = {
        primary: `inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold text-white transition hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-50 ${className}`,
        secondary: `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#263247] bg-[#121827] px-4 text-sm font-bold text-white transition hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-50 ${className}`,
        danger: `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 text-sm font-bold text-[#FCA5A5] transition hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-50 ${className}`,
    };

    return (
        <button type="button" onClick={onClick} disabled={disabled} className={classes[variant]}>
            {children}
        </button>
    );
}

function Toast({ message }: { message: string }) {
    return (
        <motion.div
            key={message}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#263247] bg-[#121827]/90 px-4 py-3 text-sm text-[#CBD5E1]"
        >
            <Bell className="h-4 w-4 text-[#22D3EE]" />
            {message}
        </motion.div>
    );
}

function StatusChip({ status }: { status: string }) {
    const color =
        status === 'Publicado' || status === 'Confirmado' || status === 'Saudavel' || status === 'Ativo'
            ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#86EFAC]'
            : status === 'Rascunho' || status === 'Pendente' || status === 'Atencao' || status === 'Produção'
              ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#FCD34D]'
              : 'border-[#94A3B8]/30 bg-[#94A3B8]/10 text-[#CBD5E1]';

    return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>{status}</span>;
}

function MetricPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[#263247] bg-[#0B0F1A] p-3">
            <p className="text-xs text-[#94A3B8]">{label}</p>
            <p className="mt-1 text-lg font-bold">{value}</p>
        </div>
    );
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(value);
}
