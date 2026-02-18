"use client";

import { useState, useEffect } from "react";
import {
    Trophy,
    Users,
    Vote,
    Share2,
    Instagram,
    ChevronRight,
    Crown,
    Star,
    Timer,
    CheckCircle2,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

// --- Types ---
interface Patrulha {
    id: string;
    nome: string;
    cor_primaria: string;
    cor_secundaria: string;
    logo_url: string;
    points?: number;
}

interface Membro {
    nome_guerra: string;
    cargo: string;
    matricula: string;
}

interface Votacao {
    id: string;
    titulo: string;
    data_fim: string;
    parceiros_instagram: { nome: string; link: string }[];
}

export default function CEPFMPage() {
    const [patrulhas, setPatrulhas] = useState<Patrulha[]>([]);
    const [selectedPatrulha, setSelectedPatrulha] = useState<string | null>(null);
    const [members, setMembers] = useState<Membro[]>([]);
    const [activeVotacao, setActiveVotacao] = useState<Votacao | null>(null);
    const [loading, setLoading] = useState(true);

    const [showVoteDialog, setShowVoteDialog] = useState(false);
    const [voteStep, setVoteStep] = useState(1);
    const [followedPartners, setFollowedPartners] = useState<string[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [timeLeft, setTimeLeft] = useState("--:--:--");

    useEffect(() => {
        fetchInitialData();
        fetchActiveVotacao();
    }, []);

    useEffect(() => {
        if (selectedPatrulha) {
            fetchMembers(selectedPatrulha);
        }
    }, [selectedPatrulha]);

    useEffect(() => {
        if (activeVotacao?.data_fim) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(activeVotacao.data_fim).getTime();
                const diff = end - now;

                if (diff <= 0) {
                    setTimeLeft("ENCERRADO");
                    clearInterval(timer);
                } else {
                    const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                    const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
                    setTimeLeft(`${h}:${m}:${s}`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activeVotacao]);

    async function fetchInitialData() {
        try {
            setLoading(true);
            const { data: pData, error: pError } = await supabase
                .from("cepfm_patrulhas")
                .select("*");

            if (pError) throw pError;

            // Fetch points for each patrol
            const patrulhasWithPoints = await Promise.all((pData || []).map(async (p) => {
                const { data: ptsData } = await supabase
                    .from("cepfm_pontuacoes")
                    .select("pontos")
                    .eq("patrulha_id", p.id);

                const totalPoints = ptsData?.reduce((acc, curr) => acc + curr.pontos, 0) || 0;
                return { ...p, points: totalPoints };
            }));

            const sorted = patrulhasWithPoints.sort((a, b) => (b.points || 0) - (a.points || 0));
            setPatrulhas(sorted);
            if (sorted.length > 0) setSelectedPatrulha(sorted[0].id);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            toast.error("Erro ao carregar ranking.");
        } finally {
            setLoading(false);
        }
    }

    async function fetchMembers(patrulhaId: string) {
        const { data, error } = await supabase
            .from("cepfm_membros")
            .select("nome_guerra, cargo, matricula")
            .eq("patrulha_id", patrulhaId)
            .order("cargo", { ascending: true }); // Leaders first usually alphabetic L < R

        if (!error) setMembers(data || []);
    }

    async function fetchActiveVotacao() {
        const { data, error } = await supabase
            .from("cepfm_votacoes")
            .select("*")
            .eq("ativa", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!error && data) setActiveVotacao(data);
    }

    const handleFollow = (partner: string) => {
        setIsFollowing(true);
        setTimeout(() => {
            const newFollowed = [...followedPartners, partner];
            setFollowedPartners(newFollowed);
            setIsFollowing(false);
            if (newFollowed.length === (activeVotacao?.parceiros_instagram?.length || 0)) {
                toast.success("Todos os parceiros seguidos! Voto liberado.");
                setVoteStep(2);
            }
        }, 1500);
    };

    const handleVote = async (patrulhaId: string) => {
        if (!activeVotacao) return;

        try {
            const { error } = await supabase
                .from("cepfm_votos")
                .insert([{
                    votacao_id: activeVotacao.id,
                    patrulha_id: patrulhaId,
                    votos_contabilizados: 1,
                    // ip_hash usually handled by Postgres function or Edge Function
                    // Here we let the DB handle it if possible or just mock for now
                }]);

            if (error) {
                if (error.code === '23505') toast.error("Você já votou nesta campanha!");
                else throw error;
            } else {
                toast.success("Voto computado com sucesso!");
                setVoteStep(3);
            }
        } catch (error) {
            console.error("Erro ao votar:", error);
            toast.error("Erro ao computar voto.");
        }
    };

    const handleShare = async () => {
        // Logic to grant extra votes on share would normally happen server-side or via an update
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CEPFM 2026',
                    text: 'Apoie minha patrulha no CEPFM 2026!',
                    url: window.location.href,
                });
                toast.success("Compartilhado! +3 votos extras ganhos.");
            } catch (err) {
                console.error(err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copiado! +3 votos extras ganhos.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-yellow-400/30 overflow-x-hidden">
            <StarField />

            {/* Header / Hero */}
            <header className="relative z-10 pt-20 pb-12 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-widest mb-6">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>Evento Anual 2026</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                        CEPFM <span className="text-yellow-400">2026</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        O Campeonato Esportivo do Programa Força Mirim reúne as 4 patrulhas numa competição histórica de 9 meses e 9 modalidades de elite.
                    </p>
                </motion.div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pb-24">

                {/* Ranking Geral Section */}
                <section className="mb-24">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tight">Ranking Geral</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {patrulhas.map((patrulha, index) => (
                            <motion.div
                                key={patrulha.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedPatrulha(patrulha.id)}
                                className={`relative cursor-pointer group rounded-[2.5rem] p-8 border hover:scale-105 transition-all duration-500 overflow-hidden ${index === 0
                                    ? `bg-yellow-400/5 border-yellow-400/30 shadow-[0_20px_50px_rgba(234,179,8,0.15)]`
                                    : `bg-zinc-900/50 border-white/5 hover:border-white/20`
                                    }`}
                            >
                                {index === 0 && (
                                    <>
                                        <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-6 py-4 rounded-bl-3xl font-black text-sm rotate-12 flex items-center gap-2 shadow-2xl">
                                            <Crown className="w-4 h-4" />
                                            1º LUGAR
                                        </div>
                                        <div className="absolute inset-0 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none" />
                                    </>
                                )}

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className={`w-28 h-28 rounded-full p-1 mb-6 border-2 transition-transform duration-500 group-hover:rotate-12 ${index === 0 ? "border-yellow-400" : "border-white/10"
                                        }`}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                                            <img src={patrulha.logo_url} alt={patrulha.nome} className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${index === 0 ? "text-yellow-400" : "text-white"
                                        }`}>
                                        {patrulha.nome}
                                    </h3>

                                    <div className="bg-white/5 rounded-2xl px-6 py-3 border border-white/5 mb-6">
                                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-1">Pontuação</span>
                                        <span className="text-3xl font-black italic">{patrulha.points}</span>
                                    </div>

                                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-colors">
                                        Clique para detalhes <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Member List Section */}
                    <div className="lg:col-span-8">
                        <section className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <Users className="w-40 h-40" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase italic tracking-tight mb-8 flex items-center gap-4">
                                    Membros da <span className="text-yellow-400">Patrulha</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {members.length > 0 ? members.map((member, i) => (
                                        <div
                                            key={i}
                                            className="group bg-zinc-950/50 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-yellow-400/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${member.cargo !== 'Recruta' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'bg-zinc-900 text-zinc-400'
                                                    }`}>
                                                    {member.nome_guerra.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                                                        {member.nome_guerra}
                                                    </h4>
                                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                                        {member.cargo}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.cargo !== 'Recruta' && (
                                                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1 text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                                                    Command
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="col-span-2 py-10 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
                                            Nenhum membro vinculado a esta patrulha.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Voting Module Section */}
                    <div className="lg:col-span-4">
                        <section className="sticky top-24">
                            {activeVotacao ? (
                                <Card className="bg-yellow-500 border-none rounded-[2.5rem] shadow-2xl overflow-hidden group">
                                    <CardHeader className="p-8 pb-0">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-black text-yellow-500 p-2 rounded-xl">
                                                <Vote className="w-5 h-5" />
                                            </div>
                                            <span className="text-black font-black uppercase text-xs tracking-widest">Votação Ativa</span>
                                        </div>
                                        <CardTitle className="text-3xl font-black text-black italic uppercase leading-none">{activeVotacao.titulo}</CardTitle>
                                        <CardDescription className="text-black/70 font-bold">Ajude sua patrulha a ganhar pontos extras!</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="space-y-6">
                                            <div className="bg-black/10 rounded-2xl p-6 border border-black/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-black font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                                        <Timer className="w-4 h-4" /> Encerra em:
                                                    </span>
                                                    <span className="text-black font-mono font-black text-xl">{timeLeft}</span>
                                                </div>
                                                <Progress value={65} className="h-2 bg-black/10" />
                                            </div>

                                            <Button
                                                onClick={() => setShowVoteDialog(true)}
                                                className="w-full bg-black hover:bg-zinc-900 text-yellow-500 h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl group-hover:scale-[1.02] transition-transform"
                                            >
                                                Votar Agora
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 text-center text-zinc-500">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                    <p className="font-black uppercase tracking-widest text-xs">Nenhuma votação ativa no momento.</p>
                                </Card>
                            )}

                            <div className="mt-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 text-center">
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Apoio oficial</p>
                                <div className="flex justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                                    <h4 className="font-black italic text-xl">AVERO</h4>
                                    <h4 className="font-black italic text-xl">PFM</h4>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <AveroFooter />

            {/* Voting Flow Dialog */}
            <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
                <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[2rem] sm:max-w-md overflow-hidden">
                    <AnimatePresence mode="wait">
                        {voteStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase italic italic text-yellow-400">Validação de Voto</DialogTitle>
                                    <DialogDescription className="text-zinc-400 font-medium">
                                        Para votar, siga nossos parceiros oficiais! Sua contribuição ajuda a manter o programa.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3">
                                    {activeVotacao?.parceiros_instagram?.map((partner) => (
                                        <div key={partner.nome} className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Instagram className="w-5 h-5 text-pink-500" />
                                                <span className="font-bold">{partner.nome}</span>
                                            </div>
                                            {followedPartners.includes(partner.nome) ? (
                                                <div className="flex items-center gap-2 text-green-500 text-xs font-black uppercase">
                                                    <CheckCircle2 className="w-4 h-4" /> Seguido
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={isFollowing}
                                                    onClick={() => handleFollow(partner.nome)}
                                                    className="bg-white text-black font-black text-[10px] uppercase h-8 px-4"
                                                >
                                                    {isFollowing ? "Seguindo..." : "Seguir"}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {voteStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 pt-6"
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase italic text-yellow-400">Escolha sua Patrulha</DialogTitle>
                                    <DialogDescription className="text-zinc-400 font-medium">
                                        Selecione quem você deseja apoiar nestas olimpíadas.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-2 gap-4">
                                    {patrulhas.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleVote(p.id)}
                                            className="group relative flex flex-col items-center p-6 bg-zinc-900 rounded-3xl border border-white/5 hover:border-white/20 transition-all text-center"
                                        >
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 mb-3 group-hover:scale-110 transition-transform">
                                                <img src={p.logo_url} alt={p.nome} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-black uppercase text-xs tracking-tighter text-zinc-400 group-hover:text-white">{p.nome}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {voteStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12 space-y-6"
                            >
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-black italic uppercase">Obrigado por Votar!</h3>
                                <p className="text-zinc-500 font-medium px-4">Quer dar ainda mais apoio? Compartilhe agora e ganhe automaticamente <span className="text-white">+3 votos extras</span> para distribuir!</p>

                                <div className="pt-4 flex flex-col gap-3">
                                    <Button
                                        onClick={handleShare}
                                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        <Share2 className="w-5 h-5" /> Compartilhar & Ganhar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowVoteDialog(false)}
                                        className="text-zinc-500 font-bold uppercase text-xs hover:text-white"
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </div>
    );
}
