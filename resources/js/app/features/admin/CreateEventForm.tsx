import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle2, Clock, Loader2, MapPin, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { SyntheticEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiV1Url, authHeaders } from '../../../lib/api';
import { getStoredSession } from '../../auth/session';

export type CreatedEventSummary = {
    id: string;
    slug: string;
    title: string;
    description?: string;
    templateId?: string;
    date: string;
    startsAt?: string;
    endsAt?: string;
    place: string;
    status: string;
    confirmed: number;
    rsvp: number;
    image: string;
};

type CreateEventFormProps = {
    onCancel?: () => void;
    onCreated?: (event: CreatedEventSummary) => void;
};

type ApiErrorResponse = {
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
};

type CreateEventResponse = {
    data?: {
        id?: string | number;
        title?: string;
        description?: string;
        slug?: string;
        starts_at?: string;
        ends_at?: string;
        status?: string;
        location?: string;
    };
};

type CreateEventResult = {
    id: string;
    event: CreatedEventSummary;
};

const defaultImage = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';

function eventSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function CreateEventForm({ onCancel, onCreated }: CreateEventFormProps) {
    const navigate = useNavigate();
    const session = getStoredSession();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        slug: '',
        startsAt: '',
        endsAt: '',
        timezone: 'America/Sao_Paulo',
        venueName: '',
        address: '',
        spotifyPlaylistUrl: '',
        capacity: '',
    });

    const preview = useMemo<CreatedEventSummary>(
        () => ({
            id: 'preview',
            slug: form.slug.trim() || eventSlug(form.name),
            title: form.name.trim() || 'Novo evento',
            date: form.startsAt ? formatEventDate(form.startsAt) : 'Data a definir',
            place: form.venueName.trim() || 'Local a definir',
            status: 'Rascunho',
            confirmed: 0,
            rsvp: 0,
            image: defaultImage,
        }),
        [form.name, form.slug, form.startsAt, form.venueName],
    );

    const createEvent = useMutation<CreateEventResult>({
        mutationFn: async (): Promise<CreateEventResult> => {
            setError(null);
            setSuccess(null);

            if (!form.name.trim()) {
                throw new Error('Nome do evento e obrigatorio.');
            }

            if (!form.startsAt) {
                throw new Error('Data de inicio e obrigatoria.');
            }

            if (!form.slug.trim()) {
                throw new Error('URL do evento e obrigatoria.');
            }

            if (!session?.token || session.token.startsWith('demo-') || session.token.startsWith('super-user-token-')) {
                throw new Error('Entre com uma conta autorizada para criar eventos.');
            }

            const slug = form.slug.trim() || eventSlug(form.name);
            const venueName = form.venueName.trim();
            const address = form.address.trim();
            const payload: {
                title: string;
                description: string;
                starts_at: string;
                ends_at: string;
                location: string;
            } = {
                title: form.name.trim(),
                description: 'Convite digital criado pelo Invitely.',
                starts_at: new Date(form.startsAt).toISOString(),
                ends_at: new Date(form.endsAt || form.startsAt).toISOString(),
                location: [venueName, address].filter(Boolean).join(' - ') || 'Local a definir',
            };
            const createdEvent: CreatedEventSummary = {
                ...preview,
                slug,
                description: payload.description,
                startsAt: payload.starts_at,
                endsAt: payload.ends_at,
            };

            let response: Response;

            try {
                response = await fetch(apiV1Url('/go/events'), {
                    method: 'POST',
                    headers: authHeaders(session.token),
                    body: JSON.stringify(payload),
                });
            } catch {
                throw new Error('Nao foi possivel conectar no backend Laravel. Verifique VITE_API_URL.');
            }

            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse;

                if (response.status === 404) {
                    throw new Error(
                        'API de eventos nao encontrada. VITE_API_URL deve apontar para o Laravel ou ficar vazio na Vercel.',
                    );
                }

                const validationMessages =
                    errorData.errors && typeof errorData.errors === 'object'
                        ? Object.values(errorData.errors).flat().join(' ')
                        : null;
                const errorMessage =
                    validationMessages ?? errorData.message ?? errorData.error ?? 'Erro ao criar evento.';

                throw new Error(errorMessage);
            }

            const data = (await response.json()) as CreateEventResponse;
            const apiEvent = data.data;
            const eventFromApi: CreatedEventSummary = {
                ...createdEvent,
                id: String(apiEvent?.id ?? Date.now()),
                slug: apiEvent?.slug ?? createdEvent.slug,
                title: apiEvent?.title ?? createdEvent.title,
                description: apiEvent?.description ?? createdEvent.description,
                date: apiEvent?.starts_at ? formatEventDate(apiEvent.starts_at) : createdEvent.date,
                startsAt: apiEvent?.starts_at ?? createdEvent.startsAt,
                endsAt: apiEvent?.ends_at ?? createdEvent.endsAt,
                place: apiEvent?.location ?? createdEvent.place,
                status: apiEvent?.status === 'published' ? 'Publicado' : 'Salvo',
            };

            return { id: eventFromApi.id, event: eventFromApi };
        },
        onSuccess: (result) => {
            setSuccess('Evento criado com sucesso.');
            onCreated?.(result.event);

            if (!onCreated) {
                void navigate(`/admin/events/${result.id}`);
            }
        },
        onError: (mutationError: Error) => {
            setError(mutationError.message);
        },
    });

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        createEvent.mutate();
    }

    return (
        <motion.div initial={false} animate={{ opacity: 1 }} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
                <div className="mb-6 flex items-center gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#263247] bg-[#121827] text-[#CBD5E1] transition hover:bg-[#1A1F2E] hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    )}
                    <div>
                        <p className="text-sm text-[#94A3B8]">Novo rascunho</p>
                        <h2 className="text-2xl font-bold">Criar evento</h2>
                    </div>
                </div>

                {error ? <StatusNotice tone="error" message={error} /> : null}
                {success ? <StatusNotice tone="success" message={success} /> : null}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-3xl border border-[#263247] bg-[#121827]/90 p-6 shadow-2xl"
                >
                    <FormSection title="Informacoes basicas">
                        <Field label="Nome do evento">
                            <input
                                type="text"
                                placeholder="Ex: Lancamento do Invitely"
                                value={form.name}
                                onChange={(event) => {
                                    const name = event.target.value;
                                    setForm((current) => ({ ...current, name, slug: eventSlug(name) }));
                                }}
                                className="field-control"
                                disabled={createEvent.isPending}
                            />
                        </Field>
                        <Field label="URL do evento">
                            <input
                                type="text"
                                placeholder="lancamento-invitely"
                                value={form.slug}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, slug: event.target.value }));
                                }}
                                className="field-control"
                                disabled={createEvent.isPending}
                            />
                        </Field>
                    </FormSection>

                    <FormSection title="Data e local">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Data de inicio" icon={Calendar}>
                                <input
                                    type="datetime-local"
                                    value={form.startsAt}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, startsAt: event.target.value }));
                                    }}
                                    className="field-control"
                                    disabled={createEvent.isPending}
                                />
                            </Field>
                            <Field label="Data de termino" icon={Clock}>
                                <input
                                    type="datetime-local"
                                    value={form.endsAt}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, endsAt: event.target.value }));
                                    }}
                                    className="field-control"
                                    disabled={createEvent.isPending}
                                />
                            </Field>
                        </div>
                        <Field label="Fuso horario">
                            <select
                                value={form.timezone}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, timezone: event.target.value }));
                                }}
                                className="field-control"
                                disabled={createEvent.isPending}
                            >
                                <option value="America/Sao_Paulo">America/Sao Paulo (BRT)</option>
                                <option value="America/New_York">America/New York (EST)</option>
                                <option value="Europe/London">Europe/London (GMT)</option>
                                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                            </select>
                        </Field>
                        <Field label="Nome do local" icon={MapPin}>
                            <input
                                type="text"
                                placeholder="Ex: Atelier Vista"
                                value={form.venueName}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, venueName: event.target.value }));
                                }}
                                className="field-control"
                                disabled={createEvent.isPending}
                            />
                        </Field>
                        <Field label="Endereco">
                            <input
                                type="text"
                                placeholder="Ex: Av. Paulista, 1000, Sao Paulo - SP"
                                value={form.address}
                                onChange={(event) => {
                                    setForm((current) => ({ ...current, address: event.target.value }));
                                }}
                                className="field-control"
                                disabled={createEvent.isPending}
                            />
                        </Field>
                    </FormSection>

                    <FormSection title="Extras">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Playlist Spotify">
                                <input
                                    type="url"
                                    placeholder="https://open.spotify.com/playlist/..."
                                    value={form.spotifyPlaylistUrl}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, spotifyPlaylistUrl: event.target.value }));
                                    }}
                                    className="field-control"
                                    disabled={createEvent.isPending}
                                />
                            </Field>
                            <Field label="Capacidade">
                                <input
                                    type="number"
                                    placeholder="500"
                                    value={form.capacity}
                                    onChange={(event) => {
                                        setForm((current) => ({ ...current, capacity: event.target.value }));
                                    }}
                                    min="1"
                                    max="100000"
                                    className="field-control"
                                    disabled={createEvent.isPending}
                                />
                            </Field>
                        </div>
                    </FormSection>

                    <div className="flex flex-col gap-3 border-t border-[#263247] pt-6 sm:flex-row">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#263247] bg-[#0B0F1A] px-6 text-sm font-semibold text-[#CBD5E1] transition hover:scale-[1.03] disabled:opacity-50"
                                disabled={createEvent.isPending}
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-6 text-sm font-bold text-white shadow-lg shadow-[#0EA5E9]/20 transition hover:scale-[1.03] disabled:opacity-50"
                            disabled={createEvent.isPending}
                        >
                            {createEvent.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Criar evento
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <aside className="rounded-3xl border border-[#263247] bg-[#0B0F1A]/90 p-5 shadow-2xl">
                <p className="text-sm font-semibold text-[#94A3B8]">Preview instantaneo</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#263247] bg-[#121827]">
                    <img src={preview.image} alt="" className="h-40 w-full object-cover" />
                    <div className="p-4">
                        <span className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold text-[#FCD34D]">
                            {preview.status}
                        </span>
                        <h3 className="mt-4 text-xl font-bold">{preview.title}</h3>
                        <p className="mt-2 text-sm text-[#94A3B8]">{preview.date}</p>
                        <p className="mt-1 text-sm text-[#CBD5E1]">{preview.place}</p>
                    </div>
                </div>
            </aside>
        </motion.div>
    );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Calendar; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#CBD5E1]">
                {Icon ? <Icon className="h-4 w-4 text-[#22D3EE]" /> : null}
                {label}
            </span>
            {children}
        </label>
    );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#94A3B8]">{title}</h3>
            {children}
        </section>
    );
}

function StatusNotice({ tone, message }: { tone: 'success' | 'error'; message: string }) {
    const isSuccess = tone === 'success';

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={
                isSuccess
                    ? 'mb-5 flex items-start gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]'
                    : 'mb-5 flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]'
            }
        >
            {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
            <span>{message}</span>
        </motion.div>
    );
}

function formatEventDate(value: string): string {
    if (!value) {
        return 'Data a definir';
    }

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}
