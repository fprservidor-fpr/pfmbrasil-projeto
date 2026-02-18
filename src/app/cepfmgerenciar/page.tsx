"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    Trophy,
    Users,
    Vote,
    Plus,
    Trash2,
    Save,
    Edit3,
    Search,
    UserPlus,
    Crown,
    Instagram,
    Calendar,
    Settings,
    TrendingUp,
    ChevronRight,
    Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

// --- Types ---
interface Patrulha {
    id: string;
    nome: string;
    logo_url: string;
}

interface Modalidade {
    id: string;
    nome: string;
}

interface Membro {
    id: string;
    patrulha_id: string;
    nome_guerra: string;
    matricula: string;
    cargo: string;
}

export default function CEPFMAdminPage() {
    const [patrulhas, setPatrulhas] = useState<Patrulha[]>([]);
    const [modalidades, setModalidades] = useState<Modalidade[]>([]);
    const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
    const [members, setMembers] = useState<Membro[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatrulhaId, setSelectedPatrulhaId] = useState<string>('');
    const [instaLinks, setInstaLinks] = useState<{ nome: string; link: string }[]>([]);

    const [votosContabilizados, setVotosContabilizados] = useState<Record<string, number>>({});
    const [activeVoting, setActiveVoting] = useState<any>(null);
    const [votingTitle, setVotingTitle] = useState("Votação da Semana");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchBaseData();
    }, []);

    async function fetchBaseData() {
        try {
            setLoading(true);
            const [pRes, mRes, ptsRes, memRes, vRes] = await Promise.all([
                supabase.from("cepfm_patrulhas").select("*"),
                supabase.from("cepfm_modalidades").select("*").order("ordem"),
                supabase.from("cepfm_pontuacoes").select("*"),
                supabase.from("cepfm_membros").select("*"),
                supabase.from("cepfm_votacoes").select("*").eq("ativa", true).single()
            ]);

            if (pRes.data) {
                setPatrulhas(pRes.data);
                if (pRes.data.length > 0) setSelectedPatrulhaId(pRes.data[0].id);
            }
            if (mRes.data) setModalidades(mRes.data);
            if (memRes.data) setMembers(memRes.data);
            if (vRes.data) {
                setActiveVoting(vRes.data);
                setVotingTitle(vRes.data.titulo);
                setStartDate(new Date(vRes.data.data_inicio).toISOString().slice(0, 16));
                setEndDate(new Date(vRes.data.data_fim).toISOString().slice(0, 16));
                setInstaLinks(vRes.data.parceiros_instagram || []);
                fetchVoteCounts(vRes.data.id);
            }

            // Structure scores: { patrulhaId: { modalidadeId: pontos } }
            const initialScores: Record<string, Record<string, number>> = {};
            pRes.data?.forEach(p => {
                initialScores[p.id] = {};
                mRes.data?.forEach(m => initialScores[p.id][m.id] = 0);
            });

            ptsRes.data?.forEach(pt => {
                if (initialScores[pt.patrulha_id]) {
                    initialScores[pt.patrulha_id][pt.modalidade_id] = pt.pontos;
                }
            });

            setScores(initialScores);
        } catch (error) {
            console.error(error);
            // vRes error might just mean no active voting found
        } finally {
            setLoading(false);
        }
    }

    async function fetchVoteCounts(votacaoId: string) {
        const { data, error } = await supabase
            .from("cepfm_votos")
            .select("patrulha_id, votos_contabilizados")
            .eq("votacao_id", votacaoId);

        if (data) {
            const counts: Record<string, number> = {};
            data.forEach(v => {
                counts[v.patrulha_id] = (counts[v.patrulha_id] || 0) + v.votos_contabilizados;
            });
            setVotosContabilizados(counts);
        }
    }

    const launchVoting = async () => {
        try {
            // First deactivate all
            await supabase.from("cepfm_votacoes").update({ ativa: false }).eq("ativa", true);

            const { data, error } = await supabase.from("cepfm_votacoes").insert({
                titulo: votingTitle,
                data_inicio: new Date(startDate).toISOString(),
                data_fim: new Date(endDate).toISOString(),
                parceiros_instagram: instaLinks,
                ativa: true
            }).select().single();

            if (error) throw error;
            toast.success("Nova votação lançada com sucesso!");
            setActiveVoting(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao lançar votação.");
        }
    };

    const handleScoreChange = (patrulhaId: string, modId: string, val: string) => {
        const num = parseInt(val) || 0;
        setScores(prev => ({
            ...prev,
            [patrulhaId]: { ...prev[patrulhaId], [modId]: num }
        }));
    };

    const saveRanking = async () => {
        try {
            const updates = [];
            for (const pId in scores) {
                for (const mId in scores[pId]) {
                    updates.push({
                        patrulha_id: pId,
                        modalidade_id: mId,
                        pontos: scores[pId][mId]
                    });
                }
            }

            const { error } = await supabase
                .from("cepfm_pontuacoes")
                .upsert(updates, { onConflict: 'patrulha_id,modalidade_id' });

            if (error) throw error;
            toast.success("Ranking atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar pontuações.");
        }
    };

    const calculateTotal = (patrulhaId: string) => {
        if (!scores[patrulhaId]) return 0;
        return Object.values(scores[patrulhaId]).reduce((a, b) => a + b, 0);
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10 selection:bg-yellow-400/30">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <Trophy className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight italic">Painel <span className="text-yellow-400">CEPFM 2026</span></h1>
                        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Gestão Administrativa do Campeonato</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="ranking" className="space-y-8">
                <TabsList className="bg-zinc-900/50 p-1 border border-white/5 rounded-2xl h-16 w-full max-w-2xl">
                    <TabsTrigger value="ranking" className="rounded-xl font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
                        <Trophy className="w-4 h-4 mr-2" /> Ranking Geral
                    </TabsTrigger>
                    <TabsTrigger value="patrulhas" className="rounded-xl font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
                        <Users className="w-4 h-4 mr-2" /> Patrulhas
                    </TabsTrigger>
                    <TabsTrigger value="votacao" className="rounded-xl font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
                        <Vote className="w-4 h-4 mr-2" /> Votação
                    </TabsTrigger>
                </TabsList>

                {/* --- Tab 1: Ranking Geral --- */}
                <TabsContent value="ranking">
                    <Card className="bg-zinc-900/30 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                        <CardHeader className="p-8 border-b border-white/5 bg-white/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase italic italic text-white">Lançamento de Pontos</CardTitle>
                                    <CardDescription className="text-zinc-500 font-bold">Atualize as pontuações de cada modalidade em tempo real.</CardDescription>
                                </div>
                                <Button
                                    onClick={saveRanking}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xs tracking-widest rounded-xl px-6 h-12 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Salvar Ranking
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-zinc-950/50">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="w-[200px] text-zinc-400 font-black uppercase text-[10px] tracking-widest p-6">Patrulha</TableHead>
                                        {modalidades.map(m => (
                                            <TableHead key={m.id} className="text-zinc-400 font-black uppercase text-[10px] tracking-widest text-center min-w-[120px]">{m.nome}</TableHead>
                                        ))}
                                        <TableHead className="text-yellow-400 font-black uppercase text-[10px] tracking-widest text-center min-w-[120px] bg-yellow-400/5">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patrulhas.map(p => (
                                        <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="p-6 font-black uppercase tracking-tight flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                                    <img src={p.logo_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                {p.nome}
                                            </TableCell>
                                            {modalidades.map(m => (
                                                <TableCell key={m.id} className="p-2">
                                                    <Input
                                                        type="number"
                                                        value={scores[p.id]?.[m.id] || 0}
                                                        onChange={(e) => handleScoreChange(p.id, m.id, e.target.value)}
                                                        className="bg-zinc-950 border-white/5 text-center font-bold focus:border-yellow-400/50 rounded-lg h-10 w-full"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-black text-xl text-yellow-400 bg-yellow-400/5">
                                                {calculateTotal(p.id)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Tab 2: Gestão de Patrulhas --- */}
                <TabsContent value="patrulhas">
                    <div className="grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="bg-zinc-900/30 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                                <CardHeader className="p-8 bg-white/5 border-b border-white/5">
                                    <CardTitle className="text-xl font-black uppercase italic text-white">Selecionar Equipe</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {patrulhas.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPatrulhaId(p.id)}
                                            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedPatrulhaId === p.id
                                                ? 'bg-yellow-400 border-yellow-400 text-black'
                                                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden ${selectedPatrulhaId === p.id ? 'bg-black/10' : 'bg-zinc-800'}`}>
                                                    <img src={p.logo_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-black uppercase tracking-tight">{p.nome}</span>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedPatrulhaId === p.id ? 'translate-x-1' : ''}`} />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-yellow-400 rounded-[2.5rem] p-8 border-none overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                    <UserPlus className="w-24 h-24 text-black" />
                                </div>
                                <h3 className="text-xl font-black text-black uppercase italic mb-4">Adicionar Membro</h3>
                                <p className="text-black/70 text-sm font-bold mb-6">Insira novos alunos na patrulha {patrulhas.find(p => p.id === selectedPatrulhaId)?.nome}.</p>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-black hover:bg-zinc-900 text-yellow-400 h-14 rounded-xl font-black uppercase text-xs tracking-widest">
                                            Abrir Formulário
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[2rem]">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black uppercase italic text-yellow-400">Novo Membro</DialogTitle>
                                            <CardDescription className="text-zinc-500">Busque o aluno por matrícula ou nome de guerra.</CardDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Busca Rápida</label>
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <Input className="bg-zinc-900 border-white/10 pl-11 h-12 rounded-xl focus:border-yellow-400" placeholder="Ex: 0127 ou GOLIAS" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Definir Cargo</label>
                                                <Select defaultValue="Recruta">
                                                    <SelectTrigger className="bg-zinc-900 border-white/10 h-12 rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-white/10">
                                                        <SelectItem value="Líder">Líder</SelectItem>
                                                        <SelectItem value="Vice-Líder">Vice-Líder</SelectItem>
                                                        <SelectItem value="Recruta">Recruta (Padrão)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xs tracking-widest w-full h-14 rounded-xl">
                                                Confirmar Inclusão
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </Card>
                        </div>

                        <div className="lg:col-span-8">
                            <Card className="bg-zinc-900/30 border-white/5 rounded-[3rem] overflow-hidden">
                                <CardHeader className="p-10 bg-white/5 border-b border-white/5 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black uppercase italic text-white">
                                            Membros: <span className="text-yellow-400">{patrulhas.find(p => p.id === selectedPatrulhaId)?.nome}</span>
                                        </CardTitle>
                                        <CardDescription className="text-zinc-500">Gerencie a hierarquia e os participantes da equipe.</CardDescription>
                                    </div>
                                    <Badge className="bg-zinc-950 text-zinc-400 border-white/5 px-4 py-2 font-black">
                                        {members.filter(m => m.patrulha_id === selectedPatrulhaId).length} ALUNOS
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableBody>
                                            {members.filter(m => m.patrulha_id === selectedPatrulhaId).map(member => (
                                                <TableRow key={member.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                    <TableCell className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${member.cargo !== 'Recruta' ? 'bg-yellow-400 text-black' : 'bg-zinc-950 text-zinc-500'
                                                                }`}>
                                                                {member.nome_guerra.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black uppercase tracking-tight text-lg text-white group-hover:text-yellow-400 transition-colors">
                                                                    {member.nome_guerra}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">MAT: {member.matricula}</span>
                                                                    {member.cargo !== 'Recruta' && (
                                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-yellow-400/20">
                                                                            <Crown className="w-3 h-3" /> {member.cargo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right p-8">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white hover:bg-white/5">
                                                                <Edit3 className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {members.filter(m => m.patrulha_id === selectedPatrulhaId).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="p-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 grayscale opacity-20">
                                                            <Users className="w-16 h-16" />
                                                            <p className="font-black uppercase tracking-widest text-xs">Nenhum membro cadastrado</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Tab 3: Gestão de Votação --- */}
                <TabsContent value="votacao">
                    <div className="grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-8">
                            <Card className="bg-zinc-900/30 border-white/5 rounded-[3rem] overflow-hidden">
                                <CardHeader className="p-10 bg-white/5 border-b border-white/5">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                            <Settings className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">Configurar Campanha</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <Timer className="w-3.5 h-3.5" /> Título da Votação
                                            </label>
                                            <Input
                                                value={votingTitle}
                                                onChange={(e) => setVotingTitle(e.target.value)}
                                                className="bg-zinc-950 border-white/10 h-14 rounded-xl focus:border-yellow-400"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Início
                                            </label>
                                            <Input
                                                type="datetime-local"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-zinc-950 border-white/10 h-14 rounded-xl focus:border-yellow-400"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" /> Término
                                            </label>
                                            <Input
                                                type="datetime-local"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-zinc-950 border-white/10 h-14 rounded-xl focus:border-yellow-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                                <Instagram className="w-3.5 h-3.5" /> Parceiros de Validação
                                            </label>
                                            <Button
                                                onClick={() => setInstaLinks([...instaLinks, { nome: '', link: '' }])}
                                                variant="ghost"
                                                size="sm"
                                                className="text-yellow-400 font-black uppercase text-[9px] tracking-widest"
                                            >
                                                + ADICIONAR LINK
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {instaLinks.map((item, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <Input
                                                        placeholder="Nome (Ex: @pfm.oficial)"
                                                        className="bg-zinc-950 border-white/10 h-14 rounded-xl flex-1 focus:border-yellow-400"
                                                        value={item.nome}
                                                        onChange={(e) => {
                                                            const newLinks = [...instaLinks];
                                                            newLinks[i].nome = e.target.value;
                                                            setInstaLinks(newLinks);
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder="Link do Instagram"
                                                        className="bg-zinc-950 border-white/10 h-14 rounded-xl flex-[2] focus:border-yellow-400"
                                                        value={item.link}
                                                        onChange={(e) => {
                                                            const newLinks = [...instaLinks];
                                                            newLinks[i].link = e.target.value;
                                                            setInstaLinks(newLinks);
                                                        }}
                                                    />
                                                    <Button
                                                        onClick={() => setInstaLinks(instaLinks.filter((_, idx) => idx !== i))}
                                                        variant="ghost" size="icon" className="h-14 w-14 rounded-xl border border-white/5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <Button
                                            onClick={launchVoting}
                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black h-16 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-yellow-400/10"
                                        >
                                            Lançar Nova Votação
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-5 space-y-8">
                            <Card className="bg-zinc-900/40 border-white/5 rounded-[3rem] p-10 backdrop-blur-md relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic text-white tracking-tight">Status em Tempo Real</h3>
                                        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Apuração de votos atualizada</p>
                                    </div>

                                    <div className="space-y-8">
                                        {patrulhas.map((p, i) => (
                                            <div key={p.id} className="space-y-3">
                                                <div className="flex items-center justify-between font-black uppercase tracking-widest text-[10px]">
                                                    <span className="text-white flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-yellow-400" /> {p.nome}
                                                    </span>
                                                    <span className="text-yellow-400">{votosContabilizados[p.id] || 0} votos</span>
                                                </div>
                                                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[1.5px]">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (votosContabilizados[p.id] || 0) / 10)}%` }}
                                                        className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-white/5">
                                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                <Save className="w-5 h-5 text-green-500" />
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-black">Liderança Atual</h5>
                                                <p className="text-sm font-black text-white italic">
                                                    {Object.entries(votosContabilizados).sort((a, b) => b[1] - a[1])[0]
                                                        ? `${patrulhas.find(p => p.id === Object.entries(votosContabilizados).sort((a, b) => b[1] - a[1])[0][0])?.nome} (+${Object.entries(votosContabilizados).sort((a, b) => b[1] - a[1])[0][1]} Votos)`
                                                        : "Aguardando Votos"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
