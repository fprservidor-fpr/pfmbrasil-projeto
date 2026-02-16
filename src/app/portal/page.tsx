"use client";

import Link from "next/link";
import {
    ShieldCheck,
    ArrowLeft,
    UserCheck,
    GraduationCap,
    Mail,
    Key,
    Copy,
    Headset,
    Phone,
    Info,
    FileText,
    Download,
    CalendarCheck,
    LogIn
} from "lucide-react";
import { StarField } from "@/components/StarField";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function PortalPage() {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!", {
            description: `${text} copiado para a área de transferência.`,
            duration: 2000,
        });
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-yellow-400/30 overflow-x-hidden scroll-smooth pb-40">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <StarField />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <header className="sticky top-0 z-50 p-4 md:p-6 backdrop-blur-md border-b border-zinc-900/50 bg-zinc-950/50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Voltar para Início</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400/10 rounded-lg flex items-center justify-center border border-yellow-400/20">
                            <ShieldCheck className="text-yellow-400 w-5 h-5" />
                        </div>
                        <span className="hidden md:block text-sm font-black tracking-tighter uppercase whitespace-nowrap">Portal Informativo</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 px-4 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Access Instructions Section */}
                    <div className="text-center mb-16">
                        <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Info className="w-3.5 h-3.5" />
                            <span>Instruções de Acesso</span>
                        </motion.div>
                        <motion.h1 {...fadeInUp} className="text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter">
                            COMO ACESSAR SUA CONTA <span className="text-yellow-400">PFM Digital</span>?
                        </motion.h1>
                        <motion.p {...fadeInUp} className="text-zinc-500 font-medium max-w-2xl mx-auto">
                            Preparamos este guia rápido para ajudar você a acessar o sistema de forma segura e eficiente. Escolha o seu perfil abaixo:
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-24">
                        {/* Responsável Card */}
                        <motion.div
                            {...fadeInUp}
                            className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 hover:border-yellow-400/30 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <UserCheck className="w-32 h-32 text-white" />
                            </div>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-20 h-20 bg-yellow-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20">
                                    <UserCheck className="w-10 h-10 text-black" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sou Responsável</h3>
                                <p className="text-zinc-500 text-sm font-medium">CPF do responsável é a chave de acesso</p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-500 font-black text-sm">01</div>
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-500">
                                            <Mail className="w-4 h-4" /> E-mail de Login
                                        </h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed">Use seu CPF seguido de <strong className="text-white">@pfm.com</strong></p>
                                        <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                                            <code className="text-yellow-500 font-mono text-sm font-bold truncate">12345678900@pfm.com</code>
                                            <button
                                                onClick={() => copyToClipboard('12345678900@pfm.com')}
                                                className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black text-yellow-500 rounded-xl transition-all"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-500 font-black text-sm">02</div>
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-500">
                                            <Key className="w-4 h-4" /> Senha Inicial
                                        </h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed">Utilize a senha padrão informada pela coordenação do programa.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Aluno Card */}
                        <motion.div
                            {...fadeInUp}
                            transition={{ delay: 0.1 }}
                            className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 hover:border-yellow-400/30 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <GraduationCap className="w-32 h-32 text-white" />
                            </div>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20">
                                    <GraduationCap className="w-10 h-10 text-black" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sou Aluno</h3>
                                <p className="text-zinc-500 text-sm font-medium">Matrícula é a sua chave de acesso</p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">01</div>
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-400">
                                            <Mail className="w-4 h-4" /> E-mail de Login
                                        </h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed">Use seu nº de matrícula seguido de <strong className="text-white">@pfm.com</strong></p>
                                        <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                                            <code className="text-yellow-500 font-mono text-sm font-bold truncate">0126@pfm.com</code>
                                            <button
                                                onClick={() => copyToClipboard('0126@pfm.com')}
                                                className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black text-yellow-500 rounded-xl transition-all"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">02</div>
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-500">
                                            <Key className="w-4 h-4" /> Senha Inicial
                                        </h4>
                                        <p className="text-zinc-400 text-sm leading-relaxed">A mesma senha padrão fornecida no ato da matrícula.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Downloads Section */}
                    <section className="py-24 px-4 bg-zinc-900/20 rounded-[3rem] border border-white/5 mb-24">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-16">
                                <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Central de Downloads</span>
                                </motion.div>
                                <h2 className="text-4xl font-black uppercase tracking-tight mb-4 italic text-white">Documentos <span className="text-yellow-400">Essenciais</span></h2>
                                <p className="text-zinc-500 font-medium whitespace-pre-wrap">Abaixo você encontra os arquivos oficiais do programa disponíveis para baixar.</p>
                            </div>

                            <motion.div
                                {...fadeInUp}
                                className="bg-zinc-950/80 rounded-[2.5rem] p-8 md:p-10 border border-white/10 flex flex-col md:flex-row items-center gap-8 group hover:border-yellow-400/30 transition-all"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-all">
                                    <FileText className="w-10 h-10 text-red-500" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <div>
                                        <h4 className="text-2xl font-black uppercase tracking-tight mb-1">Ficha de Avaliação Mensal 2026</h4>
                                        <p className="text-zinc-500 text-sm font-medium">Documento oficial de acompanhamento pedagógico e disciplinar.</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <span className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> PDF
                                        </span>
                                        <span className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <CalendarCheck className="w-3.5 h-3.5" /> ANO 2026
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href="https://drive.google.com/file/d/1LVK9c7BNfs0bfbPPIPlJunnBme6DkQiK/view?usp=sharing"
                                    target="_blank"
                                    className="w-full md:w-auto px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black uppercase text-sm tracking-widest shadow-[0_10px_30px_rgba(234,179,8,0.2)] flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                    Baixar Agora
                                </Link>
                            </motion.div>
                        </div>
                    </section>

                    {/* Help Section */}
                    <motion.div
                        {...fadeInUp}
                        className="bg-yellow-500 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shrink-0">
                            <Headset className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-1 text-black">Ainda com Dúvidas?</h3>
                            <p className="text-black/70 text-sm font-bold">Nossa central de atendimento está disponível para ajudar você.</p>
                        </div>
                        <Link
                            href="https://api.whatsapp.com/send/?phone=5586999945135&text&type=phone_number&app_absent=0"
                            target="_blank"
                            className="px-8 py-4 bg-black text-yellow-500 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-transform"
                        >
                            <Phone className="w-4 h-4" />
                            Suporte WhatsApp
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* Fixed Floating Button */}
            <motion.div
                initial={{ y: 100, x: "-50%", opacity: 0 }}
                animate={{ y: 0, x: "-50%", opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
            >
                <Link href="/login" className="block">
                    <Button size="xl" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest italic rounded-2xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] border-b-4 border-yellow-700 active:border-b-0 h-20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4">
                        <LogIn className="w-6 h-6" />
                        Acessar Sistema
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
