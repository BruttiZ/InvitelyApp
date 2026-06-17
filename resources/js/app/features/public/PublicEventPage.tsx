import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Loader2,
    Mail,
    MapPin,
    MessageSquareText,
    Minus,
    Music2,
    PartyPopper,
    Plus,
    QrCode,
    Share2,
    ShieldCheck,
    Sparkles,
    TicketCheck,
    UsersRound,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getStoredSession } from '../../auth/session';
import { apiUrl } from '../../../lib/api';
import { PublicEvent } from './types';

type RsvpStatus = 'accepted' | 'declined';
type RsvpStep = 'details' | 'code' | 'done';
type CountdownItem = [label: string, value: number];

type RsvpFormState = {
    invite_token: string;
    name: string;
    email: string;
    code: string;
    companions: number;
    message: string;
};

type InviteDetails = {
    invite_token: string;
    guest_id: string;
    guest_name: string;
    guest_email: string | null;
    guest_status: string;
    max_companions: number;
    party_size: number;
    event_id: string;
    event_name: string;
    event_slug: string;
    event_date?: string | null;
    event_status: string;
};

type StoredEventSummary = {
    id: string;
    slug: string;
    title: string;
    description?: string;
    date: string;
    startsAt?: string;
    endsAt?: string;
    place: string;
    status: string;
    confirmed: number;
    rsvp: number;
    image: string;
};

type StoredPublicRsvp = {
    eventId: string;
    eventSlug: string;
    name: string;
    email: string;
    status: RsvpStatus;
    companions: number;
    message: string;
    respondedAt: string;
};

const fallbackHeroImage =
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=85';
const fallbackMetrics = { accepted: 42, declined: 3, invited: 120 };

const demoEvent: PublicEvent = {
    id: 'demo',
    source: 'demo',
    name: 'Invitely Launch Night',
    slug: 'invitely-launch-night',
    status: 'published',
    starts_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: null,
    timezone: 'America/Sao_Paulo',
    venue: {
        name: 'Atelier Vista',
        address: 'Av. Paulista, 1000 - Sao Paulo, SP',
        latitude: null,
        longitude: null,
    },
    spotify_playlist_url: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
    hero: {
        eyebrow: 'Convite digital',
        title: 'Invitely Launch Night',
        subtitle: 'Uma noite para celebrar produto, comunidade e experiencias memoraveis.',
        image_url: fallbackHeroImage,
    },
    content: {
        hosts: ['Equipe Invitely'],
        schedule: [
            { time: '19:00', title: 'Recepcao' },
            { time: '20:30', title: 'Apresentacao' },
            { time: '21:30', title: 'Celebracao' },
        ],
        dress_code: 'Smart casual',
        note: 'Use seu QR Code na entrada para check-in rapido.',
    },
    theme: { mode: 'dark', primary: '#8B5CF6', accent: '#22D3EE' },
    gallery: [
        {
            url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
            alt: 'Palco iluminado',
        },
        {
            url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
            alt: 'Celebracao do evento',
        },
        {
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
            alt: 'Convidados reunidos',
        },
    ],
    metrics: fallbackMetrics,
};

function normalizeStoredEvent(event: StoredEventSummary): PublicEvent {
    const startsAt = event.startsAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const localRsvps = readStoredPublicRsvps().filter(
        (rsvp) => rsvp.eventId === event.id || rsvp.eventSlug === event.slug,
    );
    const accepted = localRsvps.filter((rsvp) => rsvp.status === 'accepted').length;
    const declined = localRsvps.filter((rsvp) => rsvp.status === 'declined').length;
    const invited = Math.max(event.confirmed, localRsvps.length, 1);

    return {
        id: event.id,
        source: 'go',
        name: event.title,
        slug: event.slug,
        status: event.status === 'Publicado' ? 'published' : event.status,
        starts_at: startsAt,
        ends_at: event.endsAt ?? null,
        timezone: 'America/Sao_Paulo',
        venue: {
            name: event.place,
            address: event.place,
            latitude: null,
            longitude: null,
        },
        spotify_playlist_url: null,
        hero: {
            eyebrow: 'Convite digital',
            title: event.title,
            subtitle: event.description ?? 'Confirme sua presenca e acompanhe os detalhes do evento.',
            image_url: event.image,
        },
        content: {
            hosts: ['Organizacao'],
            schedule: [
                {
                    time: new Intl.DateTimeFormat('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(new Date(startsAt)),
                    title: 'Inicio do evento',
                },
            ],
            dress_code: 'A definir',
            note: 'Use seu QR Code na entrada para check-in rapido.',
        },
        theme: { mode: 'dark', primary: '#8B5CF6', accent: '#22D3EE' },
        gallery: demoEvent.gallery,
        metrics: { accepted, declined, invited },
    };
}

function readStoredPublicRsvps(): StoredPublicRsvp[] {
    const raw = window.localStorage.getItem('invitely.publicRsvps');

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as StoredPublicRsvp[];

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStoredPublicRsvp(event: PublicEvent, form: RsvpFormState, status: RsvpStatus): void {
    const record: StoredPublicRsvp = {
        eventId: event.id,
        eventSlug: event.slug,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        status,
        companions: form.companions,
        message: form.message.trim(),
        respondedAt: new Date().toISOString(),
    };
    const next = [
        record,
        ...readStoredPublicRsvps().filter(
            (rsvp) =>
                !(
                    (rsvp.eventId === record.eventId || rsvp.eventSlug === record.eventSlug) &&
                    rsvp.email.toLowerCase() === record.email
                ),
        ),
    ];

    window.localStorage.setItem('invitely.publicRsvps', JSON.stringify(next));
}

function readStoredEvents(): StoredEventSummary[] {
    const sources = ['invitely.publicPreviewEvent', 'invitely.eventOverrides', 'invitely.createdEvents'];

    return sources.flatMap((key) => {
        const raw = window.localStorage.getItem(key);

        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw) as StoredEventSummary | StoredEventSummary[];

            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return [];
        }
    });
}

async function fetchPublicEvent(slug: string): Promise<PublicEvent> {
    const storedEvent = readStoredEvents().find((event) => event.slug === slug);

    if (storedEvent) {
        return normalizeStoredEvent(storedEvent);
    }

    const publicResponse = await fetch(apiUrl(`/api/v1/events/${slug}`));

    if (publicResponse.ok) {
        const payload = (await publicResponse.json()) as { data: PublicEvent };

        return { ...payload.data, source: 'laravel' };
    }

    if (slug === 'invitely-launch-night') {
        return demoEvent;
    }

    throw new Error('Convite nao encontrado. Verifique se o link do evento esta correto.');
}

function useCountdown(date: string): CountdownItem[] {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    return useMemo(() => {
        const diff = Math.max(0, new Date(date).getTime() - now);

        return [
            ['Dias', Math.floor(diff / 86_400_000)],
            ['Horas', Math.floor((diff / 3_600_000) % 24)],
            ['Min', Math.floor((diff / 60_000) % 60)],
        ];
    }, [date, now]);
}

export function PublicEventPage() {
    const { slug = 'invitely-launch-night' } = useParams();
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite') ?? searchParams.get('token') ?? '';
    const session = getStoredSession();
    const [notice, setNotice] = useState('Informe seu e-mail para receber um codigo de verificacao.');
    const [responseStatus, setResponseStatus] = useState<RsvpStatus | null>(null);
    const [rsvpStep, setRsvpStep] = useState<RsvpStep>('details');
    const [desiredStatus, setDesiredStatus] = useState<RsvpStatus>('accepted');
    const [form, setForm] = useState<RsvpFormState>({
        invite_token: inviteToken,
        name: '',
        email: '',
        code: '',
        companions: 0,
        message: '',
    });

    const inviteQuery = useQuery({
        queryKey: ['public-invite', inviteToken],
        enabled: inviteToken.trim() !== '',
        retry: false,
        queryFn: async () => {
            const response = await fetch(apiUrl(`/api/v1/invites/${inviteToken}`));

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as {
                    error?: string;
                    message?: string;
                } | null;
                throw new Error(payload?.error ?? payload?.message ?? 'Convite recebido nao encontrado.');
            }

            return (await response.json()) as InviteDetails;
        },
    });

    const eventQuery = useQuery({
        queryKey: ['public-event', inviteQuery.data?.event_slug ?? slug],
        retry: false,
        queryFn: async () => {
            return fetchPublicEvent(inviteQuery.data?.event_slug ?? slug);
        },
    });

    const event = eventQuery.data ?? demoEvent;
    const maxCompanions = inviteQuery.data?.max_companions ?? 5;
    const rsvpForm: RsvpFormState = inviteQuery.data
        ? {
              ...form,
              invite_token: inviteQuery.data.invite_token,
              name: inviteQuery.data.guest_name,
              email: inviteQuery.data.guest_email ?? '',
              companions: Math.min(form.companions, inviteQuery.data.max_companions),
          }
        : form;
    const currentNotice = inviteQuery.data
        ? `Convite de ${inviteQuery.data.guest_name} carregado para ${inviteQuery.data.event_name}.`
        : notice;
    const countdown = useCountdown(event.starts_at);
    const heroImage = event.hero.image_url ?? fallbackHeroImage;
    const accepted = event.metrics?.accepted ?? fallbackMetrics.accepted;
    const invited = event.metrics?.invited ?? fallbackMetrics.invited;
    const rsvpRate = Math.min(100, Math.round((accepted / Math.max(1, invited)) * 100));
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date(event.starts_at));
    const formattedTime = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(event.starts_at));

    const requestCode = useMutation({
        mutationFn: async () => {
            if (event.id === 'demo') {
                await new Promise((resolve) => window.setTimeout(resolve, 500));

                return { message: 'Codigo enviado. Confira os 6 digitos para continuar.' };
            }

            const response = await fetch(apiUrl('/api/v1/rsvp/request-code'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    event_id: event.id,
                    email: rsvpForm.email,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                throw new Error(payload?.message ?? 'Nao foi possivel enviar o codigo agora.');
            }

            return (await response.json()) as { message: string };
        },
        onSuccess: (payload) => {
            setRsvpStep('code');
            setNotice(payload.message);
        },
    });

    const directRsvp = useMutation({
        mutationFn: async (status: RsvpStatus) => {
            if (event.id === 'demo') {
                await new Promise((resolve) => window.setTimeout(resolve, 500));
                writeStoredPublicRsvp(event, rsvpForm, status);

                return {
                    message: status === 'accepted' ? 'Presenca confirmada!' : 'Voce recusou o convite.',
                };
            }

            const body = {
                event_id: event.id,
                event_slug: event.slug,
                invite_token: rsvpForm.invite_token,
                status,
                companions: rsvpForm.companions,
                message: rsvpForm.message,
                name: rsvpForm.name,
                email: rsvpForm.email,
            };
            const localResponse = await fetch(apiUrl(`/api/v1/events/${event.slug}/rsvp`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(body),
            });

            if (localResponse.ok) {
                return (await localResponse.json()) as { message: string };
            }

            if (event.source === 'go') {
                const goResponse = await fetch(apiUrl('/api/v1/go/rsvp'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(body),
                });

                if (goResponse.ok) {
                    return (await goResponse.json()) as { message: string };
                }

                writeStoredPublicRsvp(event, rsvpForm, status);

                return {
                    message:
                        status === 'accepted'
                            ? 'Presenca confirmada! O organizador ja pode ver seu e-mail no painel.'
                            : 'Resposta registrada. O organizador ja pode ver sua recusa no painel.',
                };
            }

            const payload = (await localResponse.json().catch(() => null)) as { message?: string } | null;
            throw new Error(payload?.message ?? 'Nao foi possivel registrar sua resposta agora.');
        },
        onSuccess: (payload, status) => {
            setResponseStatus(status);
            setRsvpStep('done');
            setNotice(payload.message);
        },
    });

    const verifyCode = useMutation({
        mutationFn: async (status: RsvpStatus) => {
            if (event.id === 'demo') {
                await new Promise((resolve) => window.setTimeout(resolve, 500));

                return {
                    message: status === 'accepted' ? 'Presenca confirmada!' : 'Voce recusou o convite.',
                };
            }

            const response = await fetch(apiUrl('/api/v1/rsvp/verify-code'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    event_id: event.id,
                    email: rsvpForm.email,
                    code: rsvpForm.code,
                    status,
                    name: rsvpForm.name,
                    companions: rsvpForm.companions,
                    message: rsvpForm.message,
                    invite_token: rsvpForm.invite_token || undefined,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                throw new Error(payload?.message ?? 'Nao foi possivel validar o codigo agora.');
            }

            return (await response.json()) as { message: string };
        },
        onSuccess: (payload, status) => {
            setResponseStatus(status);
            setRsvpStep('done');
            setNotice(payload.message);
        },
    });

    const isFormReady = rsvpForm.name.trim().length > 2 && rsvpForm.email.includes('@');
    const isCodeReady = /^\d{6}$/.test(rsvpForm.code);
    const isBusy = requestCode.isPending || verifyCode.isPending || directRsvp.isPending;
    const errorMessage = requestCode.error?.message ?? verifyCode.error?.message ?? directRsvp.error?.message;

    function submit(eventSubmit: SyntheticEvent<HTMLFormElement>) {
        eventSubmit.preventDefault();

        if (!isFormReady) {
            setNotice('Preencha nome e e-mail para receber seu codigo de verificacao.');

            return;
        }

        if (rsvpStep === 'details') {
            directRsvp.mutate(desiredStatus);

            return;
        }

        if (!isCodeReady) {
            setNotice('Digite o codigo de 6 digitos enviado para o seu e-mail.');

            return;
        }

        verifyCode.mutate(desiredStatus);
    }

    function updateCompanions(direction: 1 | -1) {
        setForm((current) => ({
            ...current,
            companions: Math.min(maxCompanions, Math.max(0, current.companions + direction)),
        }));
    }

    function share() {
        if (typeof navigator.share === 'function') {
            void navigator.share({ title: event.name, url: window.location.href });
            setNotice('Compartilhamento aberto pelo navegador.');

            return;
        }

        void navigator.clipboard.writeText(window.location.href);
        setNotice('Link do convite copiado para a area de transferencia.');
    }

    if (eventQuery.isError) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#060B1A] px-4 text-white">
                <Panel title="Convite indisponivel">
                    <p className="text-sm leading-6 text-[#CBD5E1]">
                        {eventQuery.error instanceof Error
                            ? eventQuery.error.message
                            : 'Nao foi possivel carregar este convite.'}
                    </p>
                    <Link
                        to="/"
                        className="mt-5 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold"
                    >
                        Voltar ao inicio
                    </Link>
                </Panel>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#060B1A] pb-24 text-white">
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#060B1A_0%,#090F20_42%,#10172A_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(139,92,246,0.22)_0%,transparent_32%,rgba(34,211,238,0.13)_68%,transparent_100%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/70 to-transparent" />

                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                        Invitely
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={share}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]/80 backdrop-blur transition hover:scale-[1.03] hover:border-[#22D3EE]/70"
                            aria-label="Compartilhar"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                        <Link
                            to={session ? '/admin' : '/login'}
                            className="hidden h-11 items-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold transition hover:scale-[1.03] sm:inline-flex"
                        >
                            {session ? 'Painel' : 'Entrar'}
                        </Link>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="min-w-0"
                    >
                        <div className="grid gap-5 lg:grid-cols-[0.86fr_1fr] lg:items-stretch">
                            <EventHeroCard
                                event={event}
                                heroImage={heroImage}
                                formattedDate={formattedDate}
                                formattedTime={formattedTime}
                                share={share}
                            />

                            <div className="grid gap-4">
                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#263247] bg-[#121827]/80 px-3 py-1 text-xs text-[#CBD5E1]">
                                    <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" />
                                    {event.hero.eyebrow ?? 'Convite digital'}
                                </span>

                                <div>
                                    <h1 className="max-w-3xl break-words text-4xl font-extrabold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
                                        {event.hero.title ?? event.name}
                                    </h1>
                                    <p className="mt-5 max-w-2xl text-base leading-8 text-[#CBD5E1] sm:text-lg">
                                        {event.hero.subtitle}
                                    </p>
                                </div>

                                <div className="grid gap-3 text-sm text-[#E2E8F0] sm:grid-cols-3">
                                    <InfoPill icon={CalendarDays} label={formattedDate} />
                                    <InfoPill icon={Clock3} label={formattedTime} />
                                    <InfoPill icon={MapPin} label={event.venue.name ?? 'Local a definir'} />
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <a
                                        href="#confirmar"
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-5 text-sm font-bold transition hover:scale-[1.03]"
                                    >
                                        Confirmar presenca <ArrowRight className="h-4 w-4" />
                                    </a>
                                    <a
                                        href="#detalhes"
                                        className="inline-flex h-12 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]/80 px-5 text-sm font-bold backdrop-blur transition hover:scale-[1.03] hover:border-[#22D3EE]/70"
                                    >
                                        Ver detalhes
                                    </a>
                                </div>

                                <div className="grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                                    {countdown.map(([label, value]) => (
                                        <motion.div
                                            key={label}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="min-w-0 rounded-2xl border border-[#263247] bg-[#121827]/80 p-4 shadow-xl"
                                        >
                                            <p className="text-3xl font-extrabold">{value}</p>
                                            <p className="mt-1 text-xs text-[#CBD5E1]">{label}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="rounded-2xl border border-[#263247] bg-[#121827]/70 p-4">
                                    <div className="mb-3 flex items-center justify-between text-sm">
                                        <span className="font-semibold">Confirmacoes</span>
                                        <span className="text-[#22D3EE]">{rsvpRate}% RSVP</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[#263247]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${String(rsvpRate)}%` }}
                                            transition={{ duration: 0.7 }}
                                            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <RsvpCard
                        form={rsvpForm}
                        notice={currentNotice}
                        step={rsvpStep}
                        desiredStatus={desiredStatus}
                        isFormReady={isFormReady}
                        isCodeReady={isCodeReady}
                        isPending={isBusy}
                        errorMessage={errorMessage}
                        responseStatus={responseStatus}
                        inviteToken={rsvpForm.invite_token}
                        hasInviteToken={inviteToken.trim() !== ''}
                        maxCompanions={maxCompanions}
                        inviteError={inviteQuery.error?.message}
                        setDesiredStatus={setDesiredStatus}
                        setForm={setForm}
                        submit={submit}
                        requestNewCode={() => {
                            requestCode.mutate();
                        }}
                        updateCompanions={updateCompanions}
                    />
                </div>
            </section>

            <SuccessToast responseStatus={responseStatus} notice={notice} />

            <section
                id="detalhes"
                className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
            >
                <Panel title="Programacao">
                    <div className="grid gap-3">
                        {event.content.schedule?.map((item) => (
                            <div
                                key={`${item.time}-${item.title}`}
                                className="flex items-center justify-between rounded-2xl border border-[#263247] bg-[#121827] p-4 transition hover:-translate-y-1 hover:border-[#22D3EE]/60"
                            >
                                <span className="font-semibold">{item.title}</span>
                                <span className="text-sm text-[#22D3EE]">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
                <div className="grid gap-3 sm:grid-cols-3">
                    {event.gallery.map((image) => (
                        <motion.img
                            key={image.url}
                            src={image.url}
                            alt={image.alt}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className="aspect-[4/5] rounded-2xl border border-[#263247] object-cover shadow-xl"
                        />
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-8">
                <Panel title="Check-in QR">
                    <div className="flex items-center gap-5">
                        <div className="rounded-2xl bg-white p-3">
                            <QRCodeSVG
                                value={`${window.location.origin}/check-in/${rsvpForm.invite_token}`}
                                size={104}
                            />
                        </div>
                        <p className="text-sm leading-6 text-[#94A3B8]">
                            Token seguro para validacao rapida na entrada do evento.
                        </p>
                    </div>
                </Panel>
                <Panel title="Local">
                    <p className="font-semibold">{event.venue.name}</p>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{event.venue.address}</p>
                    <div className="mt-4 h-28 overflow-hidden rounded-2xl border border-[#263247] bg-[#0B0F1A]">
                        <div className="h-full bg-[linear-gradient(135deg,rgba(14,165,233,0.34),rgba(139,92,246,0.44)),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_24px),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_24px)]" />
                    </div>
                </Panel>
                <Panel title="Playlist">
                    <a
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#22D3EE]"
                        href={event.spotify_playlist_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Music2 className="h-4 w-4" /> Abrir no Spotify
                    </a>
                    <p className="mt-3 text-sm leading-6 text-[#94A3B8]">{event.content.note}</p>
                </Panel>
            </section>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#263247] bg-[#0B0F1A]/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="grid grid-cols-[1fr_52px] gap-3">
                    <a
                        href="#confirmar"
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold"
                    >
                        Confirmar presenca
                    </a>
                    <button
                        type="button"
                        onClick={share}
                        className="flex h-12 items-center justify-center rounded-xl border border-[#263247] bg-[#121827]"
                        aria-label="Compartilhar convite"
                    >
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>
            </nav>
        </main>
    );
}

function EventHeroCard({
    event,
    heroImage,
    formattedDate,
    formattedTime,
    share,
}: {
    event: PublicEvent;
    heroImage: string;
    formattedDate: string;
    formattedTime: string;
    share: () => void;
}) {
    return (
        <motion.article
            whileHover={{ y: -6 }}
            className="group relative min-h-[440px] overflow-hidden rounded-2xl border border-[#263247] bg-[#121827] shadow-2xl"
        >
            <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,26,0.08),rgba(6,11,26,0.82)_58%,#060B1A_100%)]" />
            <button
                type="button"
                onClick={share}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#0B0F1A]/70 text-white backdrop-blur transition hover:scale-[1.03]"
                aria-label="Compartilhar evento"
            >
                <Share2 className="h-4 w-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-[#E2E8F0] backdrop-blur">
                    <TicketCheck className="h-3.5 w-3.5 text-[#22D3EE]" />
                    Convite pessoal
                </div>
                <h2 className="text-3xl font-extrabold leading-tight">{event.name}</h2>
                <div className="mt-4 grid gap-2 text-sm text-[#E2E8F0]">
                    <InfoPill icon={CalendarDays} label={formattedDate} />
                    <InfoPill icon={Clock3} label={formattedTime} />
                    <InfoPill icon={MapPin} label={event.venue.address ?? event.venue.name ?? 'Local a definir'} />
                </div>
            </div>
        </motion.article>
    );
}

function RsvpCard({
    form,
    notice,
    step,
    desiredStatus,
    isFormReady,
    isCodeReady,
    isPending,
    errorMessage,
    responseStatus,
    inviteToken,
    hasInviteToken,
    maxCompanions,
    inviteError,
    setDesiredStatus,
    setForm,
    submit,
    requestNewCode,
    updateCompanions,
}: {
    form: RsvpFormState;
    notice: string;
    step: RsvpStep;
    desiredStatus: RsvpStatus;
    isFormReady: boolean;
    isCodeReady: boolean;
    isPending: boolean;
    errorMessage?: string;
    responseStatus: RsvpStatus | null;
    inviteToken: string;
    hasInviteToken: boolean;
    maxCompanions: number;
    inviteError?: string;
    setDesiredStatus: (status: RsvpStatus) => void;
    setForm: (form: RsvpFormState) => void;
    submit: (eventSubmit: SyntheticEvent<HTMLFormElement>) => void;
    requestNewCode: () => void;
    updateCompanions: (direction: 1 | -1) => void;
}) {
    const submitLabel =
        step === 'details' && hasInviteToken
            ? desiredStatus === 'accepted'
                ? 'Confirmar presenca'
                : 'Recusar convite'
            : step === 'details'
              ? 'Receber codigo'
              : desiredStatus === 'accepted'
                ? 'Confirmar presenca'
                : 'Recusar convite';

    return (
        <motion.form
            id="confirmar"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            onSubmit={submit}
            className="relative min-w-0 rounded-2xl border border-[#263247] bg-[#0B0F1A]/92 p-5 shadow-2xl backdrop-blur-xl lg:sticky lg:top-6"
        >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/80 to-transparent" />

            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-[#22D3EE]">RSVP seguro</p>
                    <h2 className="mt-2 text-2xl font-extrabold">Confirmar presenca</h2>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]">{notice}</p>
                </div>
                <div className="hidden rounded-2xl bg-white p-2 sm:block">
                    <QRCodeSVG value={`${window.location.origin}/check-in/${inviteToken}`} size={62} />
                </div>
            </div>
            {hasInviteToken ? (
                <div className="mb-5 rounded-xl border border-[#22D3EE]/35 bg-[#0EA5E9]/10 px-3 py-2 text-sm text-[#BAE6FD]">
                    Convite pessoal carregado. Nome e e-mail ficam vinculados ao convite recebido.
                </div>
            ) : null}
            {inviteError ? (
                <div className="mb-5 rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-2 text-sm text-[#FDE68A]">
                    {inviteError}
                </div>
            ) : null}

            <div className="mb-5 grid grid-cols-3 gap-2">
                <StepPill active icon={UsersRound} label="Dados" />
                <StepPill active={step !== 'details'} icon={ShieldCheck} label="Codigo" />
                <StepPill active={step === 'done'} icon={QrCode} label="Resposta" />
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setDesiredStatus('accepted');
                    }}
                    className={
                        desiredStatus === 'accepted'
                            ? 'h-12 rounded-xl border border-[#22C55E] bg-[#22C55E]/15 text-sm font-bold text-[#BBF7D0]'
                            : 'h-12 rounded-xl border border-[#263247] bg-[#121827] text-sm font-bold text-[#CBD5E1] transition hover:border-[#22D3EE]/70'
                    }
                >
                    Vou participar
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setDesiredStatus('declined');
                    }}
                    className={
                        desiredStatus === 'declined'
                            ? 'h-12 rounded-xl border border-[#F59E0B] bg-[#F59E0B]/15 text-sm font-bold text-[#FDE68A]'
                            : 'h-12 rounded-xl border border-[#263247] bg-[#121827] text-sm font-bold text-[#CBD5E1] transition hover:border-[#F59E0B]/70'
                    }
                >
                    Nao vou
                </button>
            </div>

            <div className="grid gap-3">
                <InviteInput
                    icon={UsersRound}
                    label="Nome completo"
                    value={form.name}
                    disabled={step !== 'details' || hasInviteToken}
                    onChange={(value) => {
                        setForm({ ...form, name: value });
                    }}
                />
                <InviteInput
                    icon={Mail}
                    label="E-mail"
                    type="email"
                    value={form.email}
                    disabled={step !== 'details' || hasInviteToken}
                    onChange={(value) => {
                        setForm({ ...form, email: value });
                    }}
                />
                {step !== 'details' ? (
                    <InviteInput
                        icon={ShieldCheck}
                        label="Codigo de 6 digitos"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.code}
                        onChange={(value) => {
                            setForm({ ...form, code: value.replace(/\D/g, '').slice(0, 6) });
                        }}
                    />
                ) : null}
                <div>
                    <label className="mb-2 block text-xs font-semibold text-[#CBD5E1]">
                        Acompanhantes <span className="text-[#64748B]">max. {maxCompanions}</span>
                    </label>
                    <div className="grid grid-cols-[52px_1fr_52px] overflow-hidden rounded-xl border border-[#263247] bg-[#060B1A]">
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={() => {
                                updateCompanions(-1);
                            }}
                            className="flex h-12 items-center justify-center border-r border-[#263247] transition hover:bg-[#121827]"
                        >
                            <Minus className="h-4 w-4" />
                        </motion.button>
                        <motion.div
                            key={form.companions}
                            initial={{ scale: 0.9, opacity: 0.4 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex h-12 items-center justify-center font-bold"
                        >
                            {form.companions}
                        </motion.div>
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            onClick={() => {
                                updateCompanions(1);
                            }}
                            className="flex h-12 items-center justify-center border-l border-[#263247] transition hover:bg-[#121827]"
                        >
                            <Plus className="h-4 w-4" />
                        </motion.button>
                    </div>
                </div>
                <InviteTextarea
                    icon={MessageSquareText}
                    label="Mensagem opcional"
                    value={form.message}
                    onChange={(value) => {
                        setForm({ ...form, message: value });
                    }}
                />

                <button
                    type="submit"
                    disabled={isPending || !isFormReady || (step !== 'details' && !isCodeReady)}
                    className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] text-sm font-bold transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-55"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {submitLabel}
                </button>
                {step === 'code' ? (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={requestNewCode}
                        className="h-11 rounded-xl border border-[#263247] text-sm font-bold text-[#22D3EE] transition hover:border-[#22D3EE]/70 disabled:opacity-60"
                    >
                        Reenviar codigo
                    </button>
                ) : null}
            </div>

            <AnimatePresence>
                {responseStatus ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="mt-5 rounded-2xl border border-[#22C55E]/35 bg-[#22C55E]/10 p-4"
                    >
                        <div className="flex items-start gap-3">
                            <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
                            <div>
                                <p className="font-bold">
                                    {responseStatus === 'accepted' ? 'Presenca confirmada!' : 'Convite recusado.'}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#CBD5E1]">
                                    {responseStatus === 'accepted'
                                        ? 'Leve este QR Code no dia do evento para acelerar seu check-in.'
                                        : 'Voce pode alterar sua resposta solicitando um novo codigo.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {errorMessage ? (
                <p className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-sm text-red-100">
                    {errorMessage}
                </p>
            ) : null}
        </motion.form>
    );
}

function SuccessToast({ responseStatus, notice }: { responseStatus: RsvpStatus | null; notice: string }) {
    return (
        <AnimatePresence>
            {responseStatus ? (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#263247] bg-[#0B0F1A]/95 p-4 shadow-2xl backdrop-blur"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/15 text-[#22C55E]">
                            {responseStatus === 'accepted' ? (
                                <CheckCircle2 className="h-5 w-5" />
                            ) : (
                                <XCircle className="h-5 w-5 text-[#F59E0B]" />
                            )}
                        </div>
                        <div>
                            <p className="font-bold">
                                {responseStatus === 'accepted' ? 'Presenca confirmada' : 'Resposta registrada'}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#CBD5E1]">{notice}</p>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

function StepPill({ active, icon: Icon, label }: { active: boolean; icon: LucideIcon; label: string }) {
    return (
        <div
            className={
                active
                    ? 'grid min-h-16 place-items-center rounded-xl border border-[#22D3EE]/60 bg-[#0EA5E9]/15 px-2 text-center text-[11px] font-bold text-white'
                    : 'grid min-h-16 place-items-center rounded-xl border border-[#263247] bg-[#121827] px-2 text-center text-[11px] font-bold text-[#94A3B8]'
            }
        >
            <Icon className={active ? 'h-4 w-4 text-[#22D3EE]' : 'h-4 w-4 text-[#64748B]'} />
            {label}
        </div>
    );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <span className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 backdrop-blur">
            <Icon className="h-4 w-4 shrink-0 text-[#22D3EE]" />
            <span className="min-w-0 truncate">{label}</span>
        </span>
    );
}

function InviteInput({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    disabled = false,
    inputMode,
    maxLength,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'email';
    disabled?: boolean;
    inputMode?: 'numeric';
    maxLength?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</span>
            <span className="grid grid-cols-[42px_1fr] overflow-hidden rounded-xl border border-[#263247] bg-[#060B1A] transition focus-within:border-[#22D3EE] focus-within:ring-2 focus-within:ring-[#8B5CF6]/30">
                <span className="flex h-12 items-center justify-center border-r border-[#263247] text-[#22D3EE]">
                    <Icon className="h-4 w-4" />
                </span>
                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                    className="h-12 w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-[#64748B] disabled:opacity-70"
                />
            </span>
        </label>
    );
}

function InviteTextarea({
    icon: Icon,
    label,
    value,
    onChange,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#CBD5E1]">{label}</span>
            <span className="grid grid-cols-[42px_1fr] overflow-hidden rounded-xl border border-[#263247] bg-[#060B1A] transition focus-within:border-[#22D3EE] focus-within:ring-2 focus-within:ring-[#8B5CF6]/30">
                <span className="flex h-full min-h-24 items-start justify-center border-r border-[#263247] pt-4 text-[#22D3EE]">
                    <Icon className="h-4 w-4" />
                </span>
                <textarea
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                    className="min-h-24 w-full resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[#64748B]"
                    placeholder="Alguma observacao para a organizacao?"
                />
            </span>
        </label>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#263247] bg-[#121827] p-5 shadow-xl">
            <h2 className="mb-5 text-lg font-bold">{title}</h2>
            {children}
        </section>
    );
}
