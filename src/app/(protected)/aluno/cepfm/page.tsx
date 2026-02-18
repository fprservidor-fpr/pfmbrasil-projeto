"use client";

import { useAuth } from "@/components/auth-provider";
import { useState, useEffect } from "react";
import {
    Trophy,
    Users,
    Crown,
    Star,
    Medal,
    Shield,
    TrendingUp,
    LayoutDashboard,
    ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { StarField } from "@/components/StarField";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

interface Patrulha {
    id: string;
    nome: string;
    logo_url: string;
    cor_primaria: string;
    cor_secundaria: string;
    total_pontos?: number;
}

interface Membro {
    id: string;
    patrulha_id: string;
    nome_guerra: string;
    cargo: string;
    aluno_id: string;
}

export default function StudentCEPFMPage() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [patrulhas, setPatrulhas] = useState<Patrulha[]>([]);
    const [myPatrulha, setMyPatrulha] = useState<Patrulha | null>(null);
    const [myRole, setMyRole] = useState<string>("Recruta");
    const [members, setMembers] = useState<Membro[]>([]);

    useEffect(() => {
        if (profile?.student_id) {
            fetchStudentData();
        }
    }, [profile?.student_id]);

    async function fetchStudentData() {
        try {
            setLoading(true);

            // 1. Get all patrols
            const { data: pData } = await supabase.from("cepfm_patrulhas").select("*");

            // 2. Get all points to calculate global ranking
            const { data: ptsData } = await supabase.from("cepfm_pontuacoes").select("*");

            // 3. Find this specific student and their patrol
            const { data: memberData } = await supabase
                .from("cepfm_membros")
                .select("*")
                .eq("aluno_id", profile?.student_id)
                .maybeSingle();

            // Calculate total points for each patrol
            const patrolPoints: Record<string, number> = {};
            ptsData?.forEach(pt => {
                patrolPoints[pt.patrulha_id] = (patrolPoints[pt.patrulha_id] || 0) + pt.pontos;
            });

            const enrichedPatrulhas = (pData || []).map(p => ({
                ...p,
                total_pontos: patrolPoints[p.id] || 0
            })).sort((a, b) => b.total_pontos - a.total_pontos);

            setPatrulhas(enrichedPatrulhas);

            if (memberData) {
                setMyRole(memberData.cargo);
                const foundPatrulha = enrichedPatrulhas.find(p => p.id === memberData.patrulha_id);
                if (foundPatrulha) setMyPatrulha(foundPatrulha);

                // 4. Get teammates
                const { data: teammates } = await supabase
                    .from("cepfm_membros")
                    .select("*")
                    .eq("patrulha_id", memberData.patrulha_id);

                if (teammates) setMembers(teammates);
            }

        } catch (error) {
            console.error("Erro ao carregar dados do portal do aluno:", error);
        } finally {
            setLoading(false);
        }
    }

    const isVIP = myRole === "Líder" || myRole === "Vice-Líder";

    if (loading || !profile) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const getColorName = (patrulhaNome: string) => {
        switch (patrulhaNome) {
            case 'Águia': return 'yellow';
            case 'Tubarão': return 'blue';
            case 'Leão': return 'red';
            case 'Tigre': return 'zinc';
            default: return 'yellow';
        }
    };

    const myColor = myPatrulha ? getColorName(myPatrulha.nome) : 'yellow';

    return (
        <div className={cn(
            "min-h-screen transition-all duration-1000 relative overflow-hidden",
            isVIP ? `bg-slate-950` : "bg-transparent"
        )}>
            {/* VIP Backdrop Effects */}
            {isVIP && (
                <>
                    <div className={cn(
                        "absolute inset-0 z-0 opacity-20 blur-[150px] animate-pulse transition-colors duration-1000",
                        myColor === 'yellow' ? 'bg-yellow-500' : myColor === 'blue' ? 'bg-blue-600' : myColor === 'red' ? 'bg-red-600' : 'bg-slate-500'
                    )} />
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)]" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
                </>
            )}

            <div className="relative z-10 px-4 md:px-8 py-10 space-y-10">
                {/* Stunning VIP/Standard Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "relative p-10 md:p-16 rounded-[4rem] border transition-all duration-700 overflow-hidden group shadow-2xl",
                        isVIP
                            ? `bg-gradient-to-br ${myColor === 'yellow' ? 'from-yellow-400 via-amber-500 to-yellow-600' : myColor === 'blue' ? 'from-blue-400 via-indigo-500 to-blue-700' : myColor === 'red' ? 'from-red-400 via-rose-500 to-red-700' : 'from-slate-700 to-slate-900'} border-white/30`
                            : "bg-slate-900/40 border-white/5 backdrop-blur-2xl"
                    )}
                >
                    {/* Background Trophy Glow */}
                    <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-110">
                        <Trophy className="w-80 h-80 text-white" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="relative">
                            <motion.div
                                animate={isVIP ? { rotate: 360 } : {}}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className={cn(
                                    "absolute inset-0 rounded-full blur-2xl opacity-40",
                                    isVIP ? "bg-white" : "bg-yellow-400"
                                )}
                            />
                            <div className={cn(
                                "w-40 h-40 md:w-52 md:h-52 rounded-full p-2 border-4 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105",
                                isVIP ? "border-white bg-white/10 backdrop-blur-md" : "border-yellow-400 bg-slate-800"
                            )}>
                                {myPatrulha?.logo_url ? (
                                    <img src={myPatrulha.logo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                        <Users className="w-16 h-16 text-slate-700" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className={cn(
                                        "px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg",
                                        isVIP ? "bg-white text-slate-950" : "bg-yellow-400 text-black"
                                    )}
                                >
                                    {isVIP ? `COMANDO VIP: ${myRole}` : (myPatrulha ? "Guerreiro da Equipe" : "Recruta")}
                                </motion.span>
                                {isVIP && (
                                    <span className="px-6 py-2 bg-black/20 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-xl">
                                        <Crown className="w-4 h-4 text-yellow-300 animate-bounce" /> Status Premium Ativo
                                    </span>
                                )}
                            </div>
                            <h1 className={cn(
                                "text-6xl md:text-9xl font-black italic tracking-tighter uppercase mb-4 leading-none drop-shadow-2xl",
                                "text-white"
                            )}>
                                {myPatrulha?.nome ? `PATRULHA ${myPatrulha.nome}` : "Batalhão CEPFM"}
                            </h1>
                            <p className={cn(
                                "text-xl md:text-2xl font-medium max-w-3xl leading-tight",
                                isVIP ? "text-white/90" : "text-slate-400"
                            )}>
                                {isVIP
                                    ? "Lidere com honra. O destino do campeonato está em suas mãos."
                                    : "Acompanhe cada ponto conquistado e lute por sua patrulha até o fim."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Teammates Section */}
                    <div className="lg:col-span-8">
                        <section className={cn(
                            "rounded-[3.5rem] p-10 md:p-14 border transition-all duration-700 relative overflow-hidden shadow-xl",
                            isVIP ? "bg-white/5 border-white/10 backdrop-blur-md" : "bg-slate-900/30 border-white/5"
                        )}>
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black uppercase italic tracking-tight mb-12 flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                                        <Users className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <span>Seus <span className="text-yellow-400">Guerreiros</span></span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {members.length > 0 ? members.map((member, i) => (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            className={cn(
                                                "group border rounded-[2rem] p-7 flex items-center justify-between transition-all duration-300",
                                                member.cargo !== 'Recruta'
                                                    ? "bg-yellow-400/10 border-yellow-400/30 shadow-lg shadow-yellow-400/5 ring-1 ring-yellow-400/20"
                                                    : "bg-slate-950/40 border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl transition-all duration-500",
                                                    member.cargo !== 'Recruta' ? 'bg-yellow-400 text-black scale-110' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800'
                                                )}>
                                                    {member.nome_guerra?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tight text-white transition-colors text-lg">
                                                        {member.nome_guerra}
                                                    </h4>
                                                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mt-1">
                                                        {member.cargo}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.cargo !== 'Recruta' && (
                                                <div className="relative">
                                                    <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse" />
                                                </div>
                                            )}
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-2 py-20 text-center flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6 border border-white/5">
                                                <Users className="w-10 h-10 text-slate-800 animate-pulse" />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Os nomes de batalha estão sendo computados.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Performance / Ranking Section */}
                    <div className="lg:col-span-4 space-y-10">
                        <Card className={cn(
                            "border rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700",
                            isVIP ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-slate-950 border-white/5"
                        )}>
                            <CardHeader className="p-12 pb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-yellow-400/10 text-yellow-400 p-3.5 rounded-2xl border border-yellow-400/20">
                                        <TrendingUp className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">Competição de Elite</p>
                                        <CardTitle className="text-3xl font-black italic uppercase leading-none tracking-tight">Ranking <span className="text-yellow-400">Global</span></CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-12 pb-12 space-y-8">
                                {patrulhas.map((p, i) => (
                                    <div key={p.id} className="space-y-4">
                                        <div className="flex items-center justify-between font-black uppercase tracking-widest text-[11px]">
                                            <span className={p.id === myPatrulha?.id ? "text-yellow-400 flex items-center gap-2" : "text-white"}>
                                                {p.id === myPatrulha?.id && <Star className="w-3.5 h-3.5 fill-yellow-400 animate-spin-slow" />}
                                                {p.nome}
                                            </span>
                                            <span className="text-slate-500">{(p.total_pontos || 0)} PTS</span>
                                        </div>
                                        <div className="h-3.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (((p.total_pontos || 0) + 1) / 1500) * 100)}%` }}
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    p.id === myPatrulha?.id ? "bg-gradient-to-r from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(234,179,8,0.4)]" : "bg-slate-700"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-10 border-t border-white/5 text-center">
                                    <Link href="/cepfm2026" className="w-full flex items-center justify-center gap-3 text-slate-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.2em] group">
                                        Abrir Painel de Votação <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className={cn(
                                "p-12 rounded-[3.5rem] border text-center relative overflow-hidden transition-all duration-700 group",
                                isVIP ? "bg-white/5 border-white/20 shadow-2xl" : "bg-gradient-to-br from-slate-900 to-slate-950 border-white/5"
                            )}
                        >
                            <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
                            <div className="w-24 h-24 bg-yellow-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-yellow-400/20 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                                <Medal className="w-12 h-12 text-yellow-400" />
                            </div>
                            <h4 className="text-3xl font-black uppercase italic text-white mb-4">Resumo Tático</h4>
                            <p className="text-slate-400 text-lg font-medium mb-10 px-6 leading-snug">
                                Sua patrulha detém a <span className="text-white font-black">{patrulhas.findIndex(p => p.id === myPatrulha?.id) + 1}ª posição</span> no ranking militar.
                            </p>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "0%" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full w-[70%] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
