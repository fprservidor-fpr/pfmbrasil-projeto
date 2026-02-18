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
        if (profile?.id) {
            fetchStudentData();
        }
    }, [profile?.id]);

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
                .eq("aluno_id", profile?.id)
                .single();

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
            "min-h-screen transition-colors duration-1000",
            isVIP ? `bg-zinc-1000` : "bg-zinc-950"
        )}>
            {/* Background VIP Effect */}
            <div className={cn(
                "fixed inset-0 z-0 opacity-40 blur-[120px] transition-all duration-1000",
                (isVIP && myPatrulha) ? `bg-${myColor}-500/10` : "hidden"
            )} />

            <div className="relative z-10 p-6 md:p-10 space-y-10">
                {/* VIP Banner / Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "relative p-8 md:p-12 rounded-[3rem] border overflow-hidden",
                        isVIP
                            ? `bg-gradient-to-br ${myColor === 'yellow' ? 'from-yellow-400 to-yellow-600' : myColor === 'blue' ? 'from-blue-400 to-blue-600' : myColor === 'red' ? 'from-red-400 to-red-600' : 'from-zinc-700 to-zinc-900'} border-white/20 shadow-2xl`
                            : "bg-zinc-900/40 border-white/5"
                    )}
                >
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Trophy className="w-48 h-48 text-white" />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className={cn(
                            "w-32 h-32 md:w-40 md:h-40 rounded-full p-1 border-4 shadow-2xl",
                            isVIP ? "border-white" : "border-yellow-400"
                        )}>
                            <img src={myPatrulha?.logo_url} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>

                        <div className="text-center md:text-left">
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                                <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    isVIP ? "bg-white/20 text-white backdrop-blur-md" : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                                )}>
                                    {isVIP ? `COMANDO VIP: ${myRole}` : (myPatrulha ? "Sua Patrulha" : "Aguardando Vínculo")}
                                </span>
                                {isVIP && (
                                    <span className="px-4 py-1.5 bg-black/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                                        <Crown className="w-3 h-3" /> Gestão Premium
                                    </span>
                                )}
                            </div>
                            <h1 className={cn(
                                "text-4xl md:text-7xl font-black italic tracking-tighter uppercase mb-2",
                                isVIP ? "text-white" : "text-white"
                            )}>
                                PATRULHA <span className={isVIP ? "text-white" : "text-yellow-400"}>{myPatrulha?.nome || "---"}</span>
                            </h1>
                            <p className={isVIP ? "text-white/80 font-medium" : "text-zinc-500 font-medium"}>
                                {isVIP
                                    ? "Lidere sua equipe rumo à vitória. Seus privilégios VIP estão ativos."
                                    : "Acompanhe o desempenho da sua equipe no campeonato CEPFM 2026."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Teammates Section */}
                    <div className="lg:col-span-8">
                        <section className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight mb-8 flex items-center gap-4">
                                    Seus <span className="text-yellow-400">Guerreiros</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {members.length > 0 ? members.map((member, i) => (
                                        <div
                                            key={member.id}
                                            className={cn(
                                                "group border rounded-2xl p-6 flex items-center justify-between transition-all",
                                                member.cargo !== 'Recruta'
                                                    ? "bg-white/5 border-yellow-400/30"
                                                    : "bg-zinc-950/50 border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                                                    member.cargo !== 'Recruta' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-zinc-900 text-zinc-400'
                                                )}>
                                                    {member.nome_guerra.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tight text-white transition-colors">
                                                        {member.nome_guerra}
                                                    </h4>
                                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                                        {member.cargo}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.cargo !== 'Recruta' && (
                                                <Crown className="w-5 h-5 text-yellow-400" />
                                            )}
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-10 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
                                            Aguardando cadastro de membros da patrulha.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Performance / Ranking Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="bg-zinc-950 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-yellow-400/10 text-yellow-400 p-2 rounded-xl">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <span className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Performance Global</span>
                                </div>
                                <CardTitle className="text-3xl font-black italic uppercase leading-none">Ranking <span className="text-yellow-400">Geral</span></CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-6">
                                {patrulhas.map((p, i) => (
                                    <div key={p.id} className="space-y-3">
                                        <div className="flex items-center justify-between font-black uppercase tracking-widest text-[9px]">
                                            <span className={p.id === myPatrulha?.id ? "text-yellow-400" : "text-white"}>
                                                {p.id === myPatrulha?.id && <Star className="w-3 h-3 inline mr-2 fill-yellow-400" />}
                                                {p.nome}
                                            </span>
                                            <span className="text-zinc-400">{(p.total_pontos || 0)} PTS</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, ((p.total_pontos || 0) / 1500) * 100)}%` }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    p.id === myPatrulha?.id ? "bg-yellow-400" : "bg-zinc-700"
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-white/5">
                                    <button className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest">
                                        Ver Painel Completo <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-gradient-to-br from-zinc-900 to-black p-8 rounded-[2.5rem] border border-white/5 text-center">
                            <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-400/20">
                                <Medal className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h4 className="text-xl font-black uppercase italic text-white mb-2">Resumo da Patrulha</h4>
                            <p className="text-zinc-500 text-sm font-medium mb-6 px-4">
                                Sua patrulha está em {patrulhas.findIndex(p => p.id === myPatrulha?.id) + 1}º lugar na classificação geral.
                            </p>
                            <Progress value={85} className="h-1 bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
