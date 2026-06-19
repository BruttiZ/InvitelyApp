import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react';
import { SyntheticEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthSession, storeSession } from '../../auth/session';
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';

type VerifyStep = 'requesting' | 'verifying' | 'done';

type VerifyOtpPageProps = {
    /**
     * Email can be passed via URL search param or component prop
     */
    email?: string;
};

function toAuthSession(accessToken: string, userId: string, email: string): AuthSession {
    const safeEmail = email.length > 0 ? email : 'usuario@invitely.dev';

    return {
        token: accessToken,
        token_type: 'Bearer',
        user: {
            id: userId,
            email: safeEmail,
            name: safeEmail.split('@')[0] ?? 'Usuario',
            role: 'owner',
            tenant_id: null,
        },
    };
}

export function VerifyOtpPage({ email: initialEmail }: VerifyOtpPageProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState<VerifyStep>('requesting');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState(initialEmail ?? searchParams.get('email') ?? '');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState<string | null>(null);

    const requestOtp = useMutation({
        mutationFn: async () => {
            if (!email.includes('@')) {
                throw new Error('Informe um e-mail válido.');
            }

            setError(null);
            const supabase = getSupabaseClient();

            // Request OTP for the email
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    shouldCreateUser: false, // Only send OTP if user exists, or allow signup
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            setMessage(`Enviamos um código de 6 dígitos para ${email}. Verifique sua caixa de entrada.`);
            setStep('verifying');
        },
        onError: (err: Error) => {
            setError(err.message);
        },
    });

    const verifyOtp = useMutation({
        mutationFn: async () => {
            if (code.length !== 6 || !/^\d+$/.test(code)) {
                throw new Error('Digite um código válido com 6 dígitos.');
            }

            setError(null);
            const supabase = getSupabaseClient();

            // Verify the OTP code
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: code,
                type: 'email',
            });

            if (error) {
                throw new Error(error.message);
            }

            if (!data.session || !data.user) {
                throw new Error('Falha ao verificar o código. Tente novamente.');
            }

            // Store session and redirect
            const session = toAuthSession(data.session.access_token, data.user.id, data.user.email ?? '');
            storeSession(session);
            setMessage('Autenticação bem-sucedida! Redirecionando...');
            setStep('done');

            setTimeout(() => {
                void navigate('/admin');
            }, 1500);
        },
        onError: (err: Error) => {
            setError(err.message);
        },
    });

    const handleRequestOtp = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        requestOtp.mutate();
    };

    const handleVerifyOtp = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        verifyOtp.mutate();
    };

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#060B1A] text-white">
            <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8">
                <div className="absolute left-16 top-10 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
                <div className="absolute bottom-10 right-16 h-72 w-72 rounded-full bg-[#22D3EE]/10 blur-3xl" />

                <div className="relative z-10 flex min-w-0 flex-col gap-8 py-4 lg:justify-between">
                    <header className="flex min-w-0 items-center justify-between gap-3">
                        <Link to="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-bold">
                            <Sparkles className="h-5 w-5 text-[#A78BFA]" />
                            Invitely
                        </Link>
                        <Link
                            to="/"
                            className="hidden shrink-0 rounded-xl border border-[#263247] bg-[#121827]/80 px-3 py-2 text-xs font-semibold transition hover:scale-[1.03] min-[420px]:inline-flex sm:px-4 sm:text-sm"
                        >
                            Inicio
                        </Link>
                    </header>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="w-full max-w-[calc(100vw-2rem)] py-4 sm:max-w-3xl sm:py-8 lg:py-14"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#263247] bg-[#121827]/80 px-3 py-1 text-xs text-[#CBD5E1]">
                            <Mail className="h-3.5 w-3.5 text-[#22D3EE]" />
                            Verificação por código
                        </span>
                        <h1 className="mt-6 max-w-full break-words text-2xl font-extrabold leading-tight tracking-normal min-[360px]:text-3xl sm:text-5xl lg:text-6xl">
                            Confirme seu e-mail com um código.
                        </h1>
                        <p className="mt-5 max-w-full text-base leading-8 text-[#CBD5E1] sm:max-w-2xl">
                            Enviamos um código de 6 dígitos para o seu e-mail. Digite o código abaixo para confirmar sua
                            identidade e acessar sua conta.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 flex min-w-0 items-start pb-6 lg:items-center lg:pb-0">
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.45 }}
                        className="w-full rounded-3xl border border-[#263247] bg-[#121827]/90 p-5 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-[#22D3EE]" />
                            <div>
                                <h2 className="text-xl font-bold">Verificação de E-mail</h2>
                                <p className="mt-1 text-sm text-[#94A3B8]">
                                    Use o código de 6 dígitos enviado por e-mail
                                </p>
                            </div>
                        </div>

                        {!isSupabaseConfigured() ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-5 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#FCD34D]"
                            >
                                <div className="font-semibold">⚠️ Supabase não configurado</div>
                                <p className="mt-1">Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</p>
                            </motion.div>
                        ) : null}

                        {error ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-5 flex items-start gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#FCA5A5]"
                            >
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div>{error}</div>
                            </motion.div>
                        ) : null}

                        {message ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-5 flex items-start gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]"
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div>{message}</div>
                            </motion.div>
                        ) : null}

                        <div className="mt-6 space-y-4">
                            {step === 'requesting' ? (
                                <form onSubmit={handleRequestOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#CBD5E1]">E-mail</label>
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                            }}
                                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-white outline-none transition focus:border-[#22D3EE]"
                                            disabled={requestOtp.isPending}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={
                                            !email.includes('@') || requestOtp.isPending || !isSupabaseConfigured()
                                        }
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold text-white transition hover:scale-[1.03] disabled:opacity-50"
                                    >
                                        {requestOtp.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Enviando código...
                                            </>
                                        ) : (
                                            'Enviar Código'
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#CBD5E1]">
                                            Código de 6 dígitos
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            pattern="\d{6}"
                                            value={code}
                                            onChange={(e) => {
                                                const cleaned = e.target.value.replace(/\D/g, '');
                                                setCode(cleaned.slice(0, 6));
                                            }}
                                            className="mt-2 h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] px-4 text-center font-mono text-lg tracking-wider text-white outline-none transition focus:border-[#22D3EE]"
                                            disabled={verifyOtp.isPending}
                                        />
                                        <p className="mt-2 text-xs text-[#94A3B8]">
                                            Verifique sua caixa de entrada e spam de <strong>{email}</strong>
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={code.length !== 6 || verifyOtp.isPending}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-bold text-white transition hover:scale-[1.03] disabled:opacity-50"
                                    >
                                        {verifyOtp.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Verificando...
                                            </>
                                        ) : (
                                            'Confirmar Código'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('requesting');
                                            setCode('');
                                            setError(null);
                                            setMessage(null);
                                        }}
                                        className="h-11 w-full rounded-xl border border-[#263247] bg-[#0B0F1A] text-sm font-semibold text-[#CBD5E1] transition hover:scale-[1.03]"
                                    >
                                        Voltar
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="mt-6 border-t border-[#263247] pt-6 text-center">
                            <p className="text-sm text-[#94A3B8]">
                                Já tem uma conta?{' '}
                                <Link to="/login" className="font-semibold text-[#22D3EE] hover:underline">
                                    Fazer login
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
