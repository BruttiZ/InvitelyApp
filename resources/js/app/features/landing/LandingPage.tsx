import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, LayoutDashboard, QrCode, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const benefits = [
    {
        title: 'Convites inteligentes',
        description: 'Crie convites personalizados com confirmação de presença e QR Code único.',
        icon: LayoutDashboard,
    },
    {
        title: 'Check-in eficiente',
        description: 'Acelere a entrada com leitura de QR Code e coleta de informações.',
        icon: QrCode,
    },
    {
        title: 'Relatórios em tempo real',
        description: 'Acompanhe métricas e insights para tomar decisões melhores durante o evento.',
        icon: BarChart3,
    },
];

export function LandingPage() {
    return (
        <main className="min-h-screen overflow-hidden bg-[#060B1A] text-white">
            <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
                <header className="relative z-10 flex items-center justify-between rounded-2xl border border-[#263247]/70 bg-[#0B0F1A]/70 px-4 py-3 backdrop-blur-xl">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-5 w-5 text-[#8B5CF6]" />
                        Invitely
                    </Link>
                    <nav className="hidden items-center gap-7 text-sm text-[#94A3B8] md:flex">
                        <a href="#beneficios" className="transition hover:text-white">
                            Recursos
                        </a>
                        <button className="inline-flex items-center gap-1 transition hover:text-white">
                            Soluções <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <a href="#precos" className="transition hover:text-white">
                            Preços
                        </a>
                        <a href="#blog" className="transition hover:text-white">
                            Blog
                        </a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            className="hidden text-sm text-[#94A3B8] transition hover:text-white sm:block"
                        >
                            Login
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-4 text-sm font-semibold transition hover:scale-[1.03]"
                        >
                            Criar conta
                        </Link>
                    </div>
                </header>

                <div className="relative z-10 grid gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
                    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#263247] bg-[#121827]/80 px-3 py-1 text-xs text-[#CBD5E1]">
                            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6]" />
                            Plataforma completa para eventos
                        </span>
                        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                            Eventos incríveis. <span className="text-[#A78BFA]">Conexões reais.</span> Resultados
                            extraordinários.
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-[#CBD5E1] sm:text-lg">
                            Da criação ao check-in, tudo que você precisa para realizar eventos memoráveis.
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/login"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#0EA5E9] px-5 text-sm font-bold transition hover:scale-[1.03]"
                            >
                                Começar agora <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/admin"
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#263247] bg-[#121827]/70 px-5 text-sm font-bold transition hover:scale-[1.03] hover:border-[#22D3EE]/60"
                            >
                                Acessar painel
                            </Link>
                        </div>
                        <div className="mt-9 grid gap-4 text-sm text-[#CBD5E1] sm:grid-cols-3">
                            {['Gestão completa', 'Check-in rápido', 'Relatórios em tempo real'].map((item) => (
                                <div key={item} className="inline-flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.55 }}
                        className="relative"
                    >
                        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#8B5CF6]/20 via-[#22D3EE]/10 to-transparent blur-2xl" />
                        <div className="relative rounded-2xl border border-[#263247] bg-[#0B0F1A]/85 p-4 shadow-2xl backdrop-blur-xl">
                            <div className="grid gap-4 lg:grid-cols-[170px_1fr]">
                                <aside className="hidden rounded-xl border border-[#263247] bg-[#060B1A]/70 p-3 lg:block">
                                    <div className="mb-5 flex items-center gap-2 text-xs font-bold">
                                        <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                                        Invitely
                                    </div>
                                    {['Overview', 'Eventos', 'Convidados', 'Templates', 'Check-in'].map(
                                        (item, index) => (
                                            <div
                                                key={item}
                                                className={
                                                    index === 0
                                                        ? 'mb-1 rounded-lg bg-[#8B5CF6]/25 px-3 py-2 text-xs text-white'
                                                        : 'mb-1 rounded-lg px-3 py-2 text-xs text-[#94A3B8]'
                                                }
                                            >
                                                {item}
                                            </div>
                                        ),
                                    )}
                                </aside>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-[#94A3B8]">Painel operacional</p>
                                            <h2 className="text-lg font-bold">Aqui está o resumo dos seus eventos.</h2>
                                        </div>
                                        <span className="rounded-lg bg-[#8B5CF6] px-3 py-2 text-xs font-bold">
                                            Novo evento
                                        </span>
                                    </div>
                                    <div className="rounded-xl border border-[#263247] bg-[#121827] p-4">
                                        <div className="mb-4 flex items-center justify-between text-sm">
                                            <span>Confirmações nos últimos 7 dias</span>
                                            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#22C55E]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <section id="beneficios" className="relative z-10 grid gap-4 pb-14 md:grid-cols-3">
                    {benefits.map((benefit, index) => {
                        const Icon = benefit.icon;

                        return (
                            <motion.article
                                key={benefit.title}
                                initial={false}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ delay: index * 0.06 }}
                                whileHover={{ y: -6 }}
                                className="rounded-2xl border border-[#263247] bg-[#121827]/80 p-6 shadow-xl backdrop-blur"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/20 text-[#A78BFA]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{benefit.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-[#CBD5E1]">{benefit.description}</p>
                            </motion.article>
                        );
                    })}
                </section>
            </section>
        </main>
    );
}
