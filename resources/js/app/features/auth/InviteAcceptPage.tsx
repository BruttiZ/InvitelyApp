import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Sparkles, TicketCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../../lib/api';

type InviteStatus = 'loading' | 'valid' | 'expired' | 'accepted' | 'rejected' | 'error';

type InviteData = {
    guest_name: string;
    guest_email: string;
    event_name: string;
    event_slug: string;
    event_date?: string;
};

export function InviteAcceptPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<InviteStatus>('loading');
    const [inviteData, setInviteData] = useState<InviteData | null>(null);

    // Fetch invite details
    const inviteQuery = useQuery({
        queryKey: ['invite', token],
        queryFn: async () => {
            if (!token) {
                setStatus('error');
                throw new Error('Token de convite não encontrado na URL');
            }

            try {
                const response = await fetch(apiUrl(`/api/v1/invites/${token}`), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.status === 404) {
                    setStatus('expired');
                    throw new Error('Este convite expirou ou não existe');
                }

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error || 'Erro ao carregar convite');
                }

                const data = (await response.json()) as InviteData;
                setInviteData(data);
                setStatus('valid');
                return data;
            } catch (error) {
                setStatus(status === 'loading' ? 'error' : status);
                throw error;
            }
        },
        enabled: !!token,
        retry: false,
    });

    // Accept invite
    const acceptMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error('Token ausente');

            const response = await fetch(apiUrl(`/api/v1/invites/${token}/accept`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Erro ao aceitar convite');
            }

            return (await response.json()) as unknown;
        },
        onSuccess: () => {
            setStatus('accepted');
            setTimeout(() => {
                if (inviteData?.event_slug && token) {
                    void navigate(`/events/${inviteData.event_slug}?invite=${encodeURIComponent(token)}`);

                    return;
                }

                void navigate('/login');
            }, 2000);
        },
        onError: (error) => {
            console.error('Accept error:', error);
            setStatus('error');
        },
    });

    // Reject invite
    const rejectMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error('Token ausente');

            const response = await fetch(apiUrl(`/api/v1/invites/${token}/reject`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Erro ao recusar convite');
            }

            return (await response.json()) as unknown;
        },
        onSuccess: () => {
            setStatus('rejected');
            // Redirect to home after 2 seconds
            setTimeout(() => {
                void navigate('/');
            }, 2000);
        },
        onError: (error) => {
            console.error('Reject error:', error);
            setStatus('error');
        },
    });

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#060B1A] text-white">
            <section className="relative mx-auto grid w-full max-w-2xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
                <div className="absolute left-16 top-10 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
                <div className="absolute bottom-10 right-16 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-3xl" />

                <header className="relative z-10 flex items-center justify-between gap-3">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                        Invitely
                    </Link>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="relative z-10 rounded-3xl border border-[#263247] bg-[#121827]/90 p-8 shadow-2xl backdrop-blur-xl"
                >
                    {/* Loading state */}
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center gap-6 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-[#22D3EE]" />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Carregando seu convite...</h2>
                                <p className="mt-2 text-sm text-[#94A3B8]">
                                    Estamos verificando se este convite é válido
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Valid invite */}
                    {status === 'valid' && inviteData && (
                        <div className="flex flex-col gap-8">
                            <div className="flex items-start gap-4">
                                <TicketCheck className="h-8 w-8 flex-shrink-0 text-[#22D3EE]" />
                                <div>
                                    <h2 className="text-2xl font-bold">Você foi convidado!</h2>
                                    <p className="mt-1 text-sm text-[#94A3B8]">
                                        Você recebeu um convite para participar de um evento
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl bg-[#0B0F1A] p-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                        Seu nome
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-white">{inviteData.guest_name}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                        Seu e-mail
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-white">{inviteData.guest_email}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                        Evento
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-white">{inviteData.event_name}</p>
                                </div>

                                {inviteData.event_date && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                                            Data
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-white">
                                            {new Date(inviteData.event_date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={() => {
                                        acceptMutation.mutate();
                                    }}
                                    disabled={acceptMutation.isPending}
                                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] font-bold text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                    {acceptMutation.isPending ? 'Aceitando...' : 'Aceitar convite'}
                                </button>

                                <button
                                    onClick={() => {
                                        rejectMutation.mutate();
                                    }}
                                    disabled={rejectMutation.isPending}
                                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#263247] bg-[#0B0F1A] font-bold text-[#F59E0B] transition hover:border-[#F59E0B]/50 hover:bg-[#F59E0B]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <XCircle className="h-5 w-5" />
                                    {rejectMutation.isPending ? 'Recusando...' : 'Recusar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Accepted state */}
                    {status === 'accepted' && (
                        <div className="flex flex-col items-center justify-center gap-6 py-12">
                            <CheckCircle2 className="h-12 w-12 text-[#22C55E]" />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Convite aceito!</h2>
                                <p className="mt-2 text-sm text-[#94A3B8]">
                                    Agora crie sua conta para confirmar sua presença
                                </p>
                                <p className="mt-4 text-xs text-[#64748B]">Redirecionando em 2 segundos...</p>
                            </div>
                        </div>
                    )}

                    {/* Rejected state */}
                    {status === 'rejected' && (
                        <div className="flex flex-col items-center justify-center gap-6 py-12">
                            <XCircle className="h-12 w-12 text-[#F59E0B]" />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Convite recusado</h2>
                                <p className="mt-2 text-sm text-[#94A3B8]">
                                    Você recusou o convite. Pode aceitar depois, se mudar de ideia.
                                </p>
                                <p className="mt-4 text-xs text-[#64748B]">Redirecionando em 2 segundos...</p>
                            </div>
                        </div>
                    )}

                    {/* Expired state */}
                    {status === 'expired' && (
                        <div className="flex flex-col items-center justify-center gap-6 py-12">
                            <AlertTriangle className="h-12 w-12 text-[#EF4444]" />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Convite expirado</h2>
                                <p className="mt-2 text-sm text-[#94A3B8]">
                                    Este convite expirou ou não existe. Solicite um novo convite ao organizador do
                                    evento.
                                </p>
                                <Link
                                    to="/"
                                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-6 font-bold text-white transition hover:scale-[1.03]"
                                >
                                    Voltar ao início
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {status === 'error' && (
                        <div className="flex flex-col items-center justify-center gap-6 py-12">
                            <AlertTriangle className="h-12 w-12 text-[#EF4444]" />
                            <div className="text-center">
                                <h2 className="text-xl font-bold">Erro ao processar convite</h2>
                                <p className="mt-2 text-sm text-[#94A3B8]">
                                    {inviteQuery.error instanceof Error
                                        ? inviteQuery.error.message
                                        : 'Ocorreu um erro inesperado. Tente novamente mais tarde.'}
                                </p>
                                <Link
                                    to="/"
                                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-6 font-bold text-white transition hover:scale-[1.03]"
                                >
                                    Voltar ao início
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>
        </main>
    );
}
