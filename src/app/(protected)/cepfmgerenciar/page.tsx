"use client";

import { useState, useEffect, useRef } from "react";
import {
    Users,
    Vote,
    Plus,
    Trash2,
    Save,
    Search,
    UserPlus,
    Crown,
    Instagram,
    Upload,
    Loader2,
    CheckCircle2,
    Info,
    BarChart3,
    Target,
    Printer,
    FileText
} from "lucide-react";
import { generatePDF } from "@/lib/pdf-utils";
import { PrintableCEPFMAlunoList } from "@/components/printable-cepfm-aluno-list";
import { motion, AnimatePresence } from "framer-motion";
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
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";

// --- Types ---
interface Patrulha {
    id: string;
    nome: string;
    logo_url: string;
}

interface Modalidade {
    id: string;
    nome: string;
    ordem: number;
}

interface Membro {
    id: string;
    patrulha_id: string;
    nome_guerra: string;
    matricula: string;
    cargo: string;
    aluno_id: string;
    created_at: string;
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

    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [addingMember, setAddingMember] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const studentListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchBaseData();
    }, []);

    async function seedDatabase() {
        try {
            setIsSeeding(true);
            const loadId = toast.loading("Semeando Banco de Dados...");

            const patrulhasToSeed = [
                { nome: 'Águia', cor_primaria: '#EAB308', cor_secundaria: '#000000', logo_url: 'https://drive.google.com/uc?export=view&id=13PTKh7TkeMkLxsCH-P0uJhDiQXhkoE_J' },
                { nome: 'Tubarão', cor_primaria: '#3B82F6', cor_secundaria: '#FFFFFF', logo_url: 'https://drive.google.com/uc?export=view&id=1TJS8Hp2MANkhEyxPgJM8TbiTQ8kRF8QE' },
                { nome: 'Leão', cor_primaria: '#EF4444', cor_secundaria: '#FFFFFF', logo_url: 'https://drive.google.com/uc?export=view&id=1fxTgTV1UaSTpHVE0ocZPh8_3HDIluMg7' },
                { nome: 'Tigre', cor_primaria: '#18181B', cor_secundaria: '#FFFFFF', logo_url: 'https://drive.google.com/uc?export=view&id=1f--InolEggB5vFmeT5ckvftbf-EbqVIQ' }
            ];

            const modalidadesToSeed = [
                { nome: 'ATLETISMO', ordem: 1 },
                { nome: 'QUEIMADA', ordem: 2 },
                { nome: 'ORDEM UNIDA', ordem: 3 },
                { nome: 'QUIZ', ordem: 4 },
                { nome: 'BATALHA LÚDICA', ordem: 5 },
                { nome: 'FUTSAL', ordem: 6 },
                { nome: 'VÔLEI', ordem: 7 },
                { nome: 'CIRCUITO', ordem: 8 },
                { nome: 'DESAFIO SURPRESA', ordem: 9 }
            ];

            // 1. Patrulhas
            const { error: pErr } = await supabase.from("cepfm_patrulhas").upsert(patrulhasToSeed, { onConflict: 'nome' });
            if (pErr) throw pErr;

            // 2. Modalidades
            const { error: mErr } = await supabase.from("cepfm_modalidades").upsert(modalidadesToSeed, { onConflict: 'nome' });
            if (mErr) throw mErr;

            toast.dismiss(loadId);
            toast.success("Dados semeados com sucesso!");
            fetchBaseData();
        } catch (error: any) {
            toast.dismiss();
            toast.error("Erro ao semear: " + error.message);
        } finally {
            setIsSeeding(false);
        }
    }

    async function fetchBaseData() {
        try {
            setLoading(true);
            const [pRes, mRes, ptsRes, memRes, vRes, sRes] = await Promise.all([
                supabase.from("cepfm_patrulhas").select("*").order("nome"),
                supabase.from("cepfm_modalidades").select("*").order("ordem"),
                supabase.from("cepfm_pontuacoes").select("*"),
                supabase.from("cepfm_membros").select("*"),
                supabase.from("cepfm_votacoes").select("*").eq("ativa", true).single(),
                supabase.from("students").select("id, nome_guerra, nome_completo, matricula_pfm, status, turma, ano_ingresso, numero_ordem")
            ]);

            if (pRes.data) {
                setPatrulhas(pRes.data);
                if (pRes.data.length > 0 && !selectedPatrulhaId) {
                    setSelectedPatrulhaId(pRes.data[0].id);
                }
            }
            if (mRes.data) setModalidades(mRes.data);
            if (memRes.data) setMembers(memRes.data);
            if (vRes.data) {
                setActiveVoting(vRes.data);
                setVotingTitle(vRes.data.titulo);
                setStartDate(vRes.data.data_inicio ? new Date(vRes.data.data_inicio).toISOString().slice(0, 16) : "");
                setEndDate(vRes.data.data_fim ? new Date(vRes.data.data_fim).toISOString().slice(0, 16) : "");
                setInstaLinks(vRes.data.parceiros_instagram || []);
                fetchVoteCounts(vRes.data.id);
            }

            const initialScores: Record<string, Record<string, number>> = {};
            pRes.data?.forEach((p: any) => {
                initialScores[p.id] = {};
                mRes.data?.forEach((m: any) => initialScores[p.id][m.id] = 0);
            });

            ptsRes.data?.forEach((pt: any) => {
                if (initialScores[pt.patrulha_id]) {
                    initialScores[pt.patrulha_id][pt.modalidade_id] = pt.pontos;
                }
            });

            if (sRes.data) setAllStudents(sRes.data);
            setScores(initialScores);
        } catch (error) {
            console.error("Error fetching base data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchVoteCounts(votacaoId: string) {
        const { data } = await supabase
            .from("cepfm_votos")
            .select("patrulha_id, votos_contabilizados")
            .eq("votacao_id", votacaoId);

        if (data) {
            const counts: Record<string, number> = {};
            data.forEach((v: any) => {
                counts[v.patrulha_id] = (counts[v.patrulha_id] || 0) + v.votos_contabilizados;
            });
            setVotosContabilizados(counts);
        } else {
            setVotosContabilizados({});
        }
    }

    async function deactivateVoting() {
        if (!activeVoting) return;
        try {
            const { error } = await supabase
                .from("cepfm_votacoes")
                .update({ ativa: false })
                .eq("id", activeVoting.id);

            if (error) throw error;
            toast.success("Votação desativada!");
            fetchBaseData();
        } catch (error) {
            toast.error("Erro ao desativar votação.");
        }
    }

    async function deleteVoting() {
        if (!activeVoting) return;
        if (!confirm("Isso excluirá permanentemente a votação e TODOS os votos vinculados. Continuar?")) return;

        try {
            // First delete votes (due to FK)
            await supabase.from("cepfm_votos").delete().eq("votacao_id", activeVoting.id);

            // Then delete campaign
            const { error } = await supabase.from("cepfm_votacoes").delete().eq("id", activeVoting.id);

            if (error) throw error;
            toast.success("Campanha e votos excluídos!");
            setActiveVoting(null);
            fetchBaseData();
        } catch (error) {
            toast.error("Erro ao excluir campanha.");
        }
    }

    async function updateVoting() {
        if (!activeVoting) return;
        try {
            const { error } = await supabase
                .from("cepfm_votacoes")
                .update({
                    titulo: votingTitle,
                    data_inicio: new Date(startDate).toISOString(),
                    data_fim: new Date(endDate).toISOString(),
                    parceiros_instagram: instaLinks
                })
                .eq("id", activeVoting.id);

            if (error) throw error;
            toast.success("Alterações salvas!");
            fetchBaseData();
        } catch (error) {
            toast.error("Erro ao atualizar campanha.");
        }
    }

    const calculateTotal = (patrulhaId: string) => {
        const pScores = scores[patrulhaId];
        if (!pScores) return 0;
        return Object.values(pScores).reduce((a, b) => a + b, 0) + (votosContabilizados[patrulhaId] || 0);
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
            fetchBaseData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar pontuações.");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, patrulhaId: string) => {
        const file = e.target.files?.[0];
        if (!file || !patrulhaId) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Por favor, selecione um arquivo de imagem.");
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${patrulhaId}-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('cepfm')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('cepfm')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from("cepfm_patrulhas")
                .update({ logo_url: publicUrl })
                .eq("id", patrulhaId);

            if (updateError) throw updateError;

            toast.success("Logo atualizada com sucesso!");
            fetchBaseData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao carregar imagem.");
        } finally {
            setIsUploading(false);
        }
    };

    const confirmInclusion = async () => {
        if (selectedStudentIds.length === 0 || !selectedPatrulhaId) {
            toast.error("Selecione os alunos e a patrulha.");
            return;
        }

        setAddingMember(true);
        try {
            const newMembers = selectedStudentIds.map(id => {
                const student = allStudents.find(s => s.id === id);
                return {
                    patrulha_id: selectedPatrulhaId,
                    aluno_id: student.id,
                    nome_guerra: student.nome_guerra || student.nome_completo.split(' ')[0],
                    matricula: student.matricula_pfm || '---',
                    cargo: 'Recruta'
                };
            });

            const { error } = await supabase.from("cepfm_membros").insert(newMembers);
            if (error) throw error;

            toast.success("Membros adicionados com sucesso!");
            setSelectedStudentIds([]);
            setIsDialogOpen(false);
            fetchBaseData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao incluir membros.");
        } finally {
            setAddingMember(false);
        }
    };

    const updateMemberRole = async (id: string, newRole: string) => {
        try {
            const { error } = await supabase.from("cepfm_membros").update({ cargo: newRole }).eq("id", id);
            if (error) throw error;
            toast.success(`Cargo atualizado!`);
            fetchBaseData();
        } catch (error) {
            console.error(error);
        }
    };

    const removeMember = async (id: string) => {
        try {
            const { error } = await supabase.from("cepfm_membros").delete().eq("id", id);
            if (error) throw error;
            toast.success("Membro removido.");
            fetchBaseData();
        } catch (error) {
            console.error(error);
        }
    };

    const availableStudents = allStudents.filter(s => {
        if (s.status !== "ativo") return false;
        const isAlreadyMember = members.some(m => m.aluno_id === s.id);
        const matchesSearch = (
            s.nome_guerra?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.nome_completo?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.matricula_pfm?.toLowerCase().includes(studentSearch.toLowerCase())
        );
        return !isAlreadyMember && matchesSearch;
    });

    const currentPatrulha = patrulhas.find(p => p.id === selectedPatrulhaId);

    const handleExportPDF = async () => {
        const activeCount = allStudents.filter(s => s.status === 'ativo').length;
        if (activeCount === 0) {
            toast.error("Não há alunos ativos para gerar a lista.");
            return;
        }

        if (!studentListRef.current) {
            toast.error("Ocorreu um erro ao preparar o documento.");
            return;
        }

        setExportingPDF(true);
        const loadingToast = toast.loading("Gerando PDF da lista de alunos...");

        try {
            await generatePDF(studentListRef.current, "Lista_Alunos_CEPFM.pdf");
            toast.success("PDF gerado com sucesso!", { id: loadingToast });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Erro ao gerar PDF. Tente novamente.", { id: loadingToast });
        } finally {
            setExportingPDF(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                <p className="text-yellow-500 font-black uppercase tracking-[0.3em] text-xs">Carregando Sistema</p>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 md:p-8 lg:p-12 selection:bg-yellow-500/30 font-sans overflow-x-hidden">
            {/* --- PREMIUM HEADER --- */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Sistema Live | Admin 2026</span>
                        </div>
                        {patrulhas.length === 0 && (
                            <Button
                                onClick={seedDatabase}
                                disabled={isSeeding}
                                className="h-6 rounded-full bg-red-500 text-white text-[8px] font-black uppercase px-2 hover:bg-red-400"
                            >
                                {isSeeding ? "Processando..." : "Semear Dados Iniciais"}
                            </Button>
                        )}
                        {patrulhas.length > 0 && (
                            <Button
                                onClick={handleExportPDF}
                                disabled={exportingPDF}
                                className="h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase px-4 hover:bg-emerald-500/30 transition-all flex items-center gap-2"
                            >
                                {exportingPDF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                                Lista Alunos (PDF)
                            </Button>
                        )}
                    </motion.div>

                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none"
                        >
                            Painel <span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">CEPFM</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-zinc-500 font-bold uppercase text-xs tracking-[0.4em] mt-2"
                        >
                            Comissão de Eventos Polícia Forças Mirins
                        </motion.p>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl min-w-[140px]">
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total Equipes</p>
                        <p className="text-2xl font-black text-white">{patrulhas.length}</p>
                    </div>
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl min-w-[140px]">
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total Alunos</p>
                        <p className="text-2xl font-black text-white">{members.length}</p>
                    </div>
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl min-w-[140px] hidden md:block">
                        <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Votação</p>
                        <p className={`text-sm font-black uppercase ${activeVoting ? 'text-green-500' : 'text-red-500'}`}>
                            {activeVoting ? 'Ativa' : 'Inativa'}
                        </p>
                    </div>
                </motion.div>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                <Tabs defaultValue="ranking" className="space-y-10">
                    <TabsList className="bg-zinc-900/40 backdrop-blur-xl p-1.5 border border-white/5 rounded-2xl h-16 w-full max-w-xl mx-auto flex items-stretch">
                        <TabsTrigger value="ranking" className="rounded-xl font-black uppercase text-[10px] tracking-widest flex-1 transition-all data-[state=active]:bg-yellow-500 data-[state=active]:text-black gap-2">
                            <BarChart3 className="w-4 h-4" /> Ranking
                        </TabsTrigger>
                        <TabsTrigger value="patrulhas" className="rounded-xl font-black uppercase text-[10px] tracking-widest flex-1 transition-all data-[state=active]:bg-yellow-500 data-[state=active]:text-black gap-2">
                            <Users className="w-4 h-4" /> Patrulhas
                        </TabsTrigger>
                        <TabsTrigger value="votacao" className="rounded-xl font-black uppercase text-[10px] tracking-widest flex-1 transition-all data-[state=active]:bg-yellow-500 data-[state=active]:text-black gap-2">
                            <Vote className="w-4 h-4" /> Votação
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB: RANKING --- */}
                    <TabsContent value="ranking" className="outline-none">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="bg-zinc-900/20 backdrop-blur-2xl border-white/5 rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="text-center md:text-left">
                                        <CardTitle className="text-3xl font-black uppercase italic text-white flex items-center gap-3 justify-center md:justify-start">
                                            <Target className="w-8 h-8 text-yellow-500" />
                                            Gestão de Pontos
                                        </CardTitle>
                                        <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">Atribuição de pontos por modalidade esportiva</CardDescription>
                                    </div>
                                    <Button
                                        onClick={saveRanking}
                                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl px-8 h-14 transition-all shadow-lg shadow-yellow-500/10 hover:scale-105 active:scale-95 flex items-center gap-3"
                                    >
                                        <Save className="w-5 h-5" /> Salvar Tudo
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <Table className="border-collapse">
                                        <TableHeader className="bg-zinc-950/50 sticky top-0 z-30">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="w-[220px] min-w-[220px] p-6 text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] sticky left-0 z-40 bg-zinc-950">Patrulha</TableHead>
                                                {modalidades.map(m => (
                                                    <TableHead key={m.id} className="text-zinc-500 font-black uppercase text-[9px] tracking-[0.2em] text-center min-w-[140px] whitespace-nowrap px-4">{m.nome}</TableHead>
                                                ))}
                                                <TableHead className="text-yellow-500 font-black uppercase text-[10px] tracking-[0.3em] text-center min-w-[110px] bg-yellow-500/5 sticky right-0 z-40 bg-zinc-950">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AnimatePresence>
                                                {patrulhas.map((p, idx) => (
                                                    <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                                                        <TableCell className="p-6 sticky left-0 z-20 bg-zinc-950/90 backdrop-blur-sm group-hover:bg-zinc-900 transition-colors border-r border-white/5">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-zinc-700 font-black italic text-xl group-hover:text-yellow-500 transition-colors">0{idx + 1}</span>
                                                                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 p-1.5 overflow-hidden shadow-inner shrink-0 group-hover:border-yellow-500/30 transition-all">
                                                                    <img src={p.logo_url} alt="" className="w-full h-full object-contain" />
                                                                </div>
                                                                <span className="font-black uppercase tracking-tight text-sm text-zinc-300 group-hover:text-white transition-all whitespace-nowrap">{p.nome}</span>
                                                            </div>
                                                        </TableCell>
                                                        {modalidades.map(m => (
                                                            <TableCell key={m.id} className="px-4 py-6">
                                                                <div className="relative group/input flex justify-center">
                                                                    <Input
                                                                        type="number"
                                                                        value={scores[p.id]?.[m.id] || 0}
                                                                        onChange={(e) => handleScoreChange(p.id, m.id, e.target.value)}
                                                                        className="bg-zinc-950/50 border-white/10 text-center font-black focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl h-11 w-20 transition-all text-white p-0"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="text-center font-black text-xl text-yellow-500 bg-yellow-500/[0.03] sticky right-0 z-20 bg-zinc-950/90 backdrop-blur-sm border-l border-white/5">
                                                            {calculateTotal(p.id)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </AnimatePresence>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* --- TAB: PATRULHAS --- */}
                    <TabsContent value="patrulhas" className="outline-none">
                        <div className="grid lg:grid-cols-12 gap-8 items-start">
                            {/* Lateral Config */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Selector Premium */}
                                <Card className="bg-zinc-900/20 backdrop-blur-2xl border-white/5 rounded-[2.5rem] overflow-hidden p-8 space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Painel de Controle</h3>
                                        <h4 className="text-xl font-black uppercase italic text-white underline decoration-yellow-500 decoration-4 underline-offset-8">Configurar Equipe</h4>
                                    </div>

                                    <Select value={selectedPatrulhaId} onValueChange={setSelectedPatrulhaId}>
                                        <SelectTrigger className="w-full h-20 bg-zinc-950 border border-white/5 rounded-3xl text-xl font-black uppercase tracking-tighter hover:border-yellow-500 transition-all px-6 text-white text-center">
                                            <SelectValue placeholder="Escolha a equipe" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden p-2 z-[99999]">
                                            {patrulhas.map(p => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={p.id}
                                                    className="rounded-xl font-black uppercase tracking-tight py-4 px-4 focus:bg-yellow-500 focus:text-black text-white cursor-pointer group/item mb-1"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 p-1.5 group-focus/item:border-black/20">
                                                            <img src={p.logo_url} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className="text-lg">{p.nome}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Logo Upload Section */}
                                    <div className="space-y-6 pt-4">
                                        <div className="w-48 h-48 mx-auto rounded-[3rem] bg-zinc-950 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group/logo">
                                            <AnimatePresence mode="wait">
                                                {currentPatrulha?.logo_url ? (
                                                    <motion.img
                                                        key={currentPatrulha.logo_url}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        src={currentPatrulha.logo_url}
                                                        alt="Logo"
                                                        className="w-full h-full object-contain p-8"
                                                    />
                                                ) : (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-4">
                                                        <Plus className="w-10 h-10 mx-auto mb-4 text-zinc-800" />
                                                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Aguardando Imagem</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                                                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                                                    <span className="text-[10px] font-black text-yellow-500 uppercase animate-pulse">Enviando</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="file"
                                                id="logo-upload-btn"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, selectedPatrulhaId)}
                                                disabled={isUploading || !selectedPatrulhaId}
                                            />
                                            <Button
                                                onClick={() => document.getElementById('logo-upload-btn')?.click()}
                                                disabled={isUploading || !selectedPatrulhaId}
                                                className="w-full bg-white hover:bg-zinc-200 text-black font-black uppercase text-[10px] tracking-[0.2em] h-14 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5"
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                                Trocar Identidade Visual
                                            </Button>
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase italic text-center">Fomatos Suportados: PNG, JPG, WEBP (Max 2MB)</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Quick Add Member Card */}
                                <Card className="bg-yellow-500 rounded-[2.5rem] p-10 border-none overflow-hidden group shadow-2xl shadow-yellow-500/10 relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all pointer-events-none">
                                        <UserPlus className="w-32 h-32 text-black" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-black uppercase italic mb-2 leading-none">Novo Recruta</h3>
                                        <p className="text-black/60 text-xs font-bold mb-8 uppercase tracking-widest">Vincular aluno à equipe {currentPatrulha?.nome}</p>

                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-black hover:bg-zinc-900 text-yellow-500 h-16 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-black/20 transition-all hover:scale-[1.02]">
                                                    Lançar Inclusão
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-[#0a0a0a] border-white/5 text-white rounded-[2.5rem] max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[99999]">
                                                <DialogHeader className="p-10 pb-6 bg-yellow-500/5">
                                                    <DialogTitle className="text-4xl font-black uppercase italic text-white leading-none">
                                                        <span className="text-yellow-500 italic block text-lg tracking-[0.2em] mb-2">Procedimento de</span>
                                                        Inclusão de Membro
                                                    </DialogTitle>
                                                    <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 flex items-center gap-2">
                                                        <Info className="w-4 h-4 text-yellow-500" />
                                                        Defina a equipe e selecione os alunos marcados como ativos.
                                                    </CardDescription>
                                                </DialogHeader>

                                                <div className="flex-1 overflow-y-auto px-10 py-6 space-y-10 custom-scrollbar">
                                                    <div className="grid md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">01. Equipe Destino</label>
                                                            <Select value={selectedPatrulhaId} onValueChange={setSelectedPatrulhaId}>
                                                                <SelectTrigger className="bg-zinc-900/50 border-white/10 h-14 rounded-2xl text-white font-black uppercase">
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-zinc-950 border border-white/10 z-[100000] min-w-[200px]">
                                                                    {patrulhas.map(p => (
                                                                        <SelectItem key={p.id} value={p.id} className="text-white hover:text-yellow-500 focus:bg-yellow-500 focus:text-black font-black uppercase py-4 cursor-pointer">
                                                                            {p.nome}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block opacity-40">02. Cargo Inicial</label>
                                                            <div className="bg-zinc-900/30 border border-white/10 h-14 rounded-2xl flex items-center px-6 text-zinc-600 font-black uppercase text-xs">
                                                                RECRUTA
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">03. Triagem de Alunos ({availableStudents.length} disponíveis)</label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative w-64 group">
                                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-yellow-500 transition-colors" />
                                                                    <Input
                                                                        className="bg-zinc-900/50 border-white/5 pl-12 h-12 rounded-2xl focus:border-yellow-500/50 text-xs text-white"
                                                                        placeholder="Buscar Guerra ou Matricula..."
                                                                        value={studentSearch}
                                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                {selectedStudentIds.length > 0 && (
                                                                    <Button variant="ghost" onClick={() => setSelectedStudentIds([])} className="text-red-500 text-[10px] font-black uppercase hover:bg-red-500/10">Limpar</Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                                            {availableStudents.slice(0, 40).map(s => (
                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    key={s.id}
                                                                    onClick={() => {
                                                                        setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                                                                    }}
                                                                    className={`p-4 rounded-3xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedStudentIds.includes(s.id)
                                                                        ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/10'
                                                                        : 'bg-zinc-900/30 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-zinc-900/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center gap-4 min-w-0">
                                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${selectedStudentIds.includes(s.id) ? 'bg-black text-yellow-500' : 'bg-zinc-800 text-zinc-500'
                                                                            }`}>
                                                                            {s.nome_guerra?.charAt(0) || '?'}
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="font-black uppercase text-xs tracking-tight truncate">{s.nome_guerra || s.nome_completo.split(' ')[0]}</span>
                                                                            <span className={`text-[9px] font-bold uppercase opacity-50 ${selectedStudentIds.includes(s.id) ? 'text-black' : 'text-zinc-600'}`}>{s.matricula_pfm || 'SEM MAT'}</span>
                                                                        </div>
                                                                    </div>
                                                                    {selectedStudentIds.includes(s.id) && <CheckCircle2 className="w-5 h-5 text-black shrink-0" />}
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <DialogFooter className="p-10 pt-6 bg-white/[0.02] border-t border-white/5">
                                                    <Button
                                                        onClick={confirmInclusion}
                                                        disabled={addingMember || selectedStudentIds.length === 0}
                                                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-sm tracking-[0.3em] w-full h-16 rounded-3xl shadow-2xl shadow-yellow-500/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
                                                    >
                                                        {addingMember ? <Loader2 className="animate-spin" /> : `Habilitar ${selectedStudentIds.length} Aluno(s)`}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </Card>
                            </div>

                            {/* Members Table */}
                            <div className="lg:col-span-8">
                                <Card className="bg-zinc-900/20 backdrop-blur-2xl border-white/5 rounded-[3rem] overflow-hidden">
                                    <div className="p-10 md:p-14 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 border border-white/5 p-3 shrink-0">
                                                    <img src={currentPatrulha?.logo_url} className="w-full h-full object-contain" alt="" />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black uppercase leading-none text-white tracking-tighter">
                                                        Integrantes: <span className="text-yellow-500 italic">{currentPatrulha?.nome}</span>
                                                    </h2>
                                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-yellow-500/50" />
                                                        Efetivo total de {members.filter(m => m.patrulha_id === selectedPatrulhaId).length} membros ativos
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-zinc-950 text-yellow-500 border border-yellow-500/20 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                            Patrulha Homologada
                                        </Badge>
                                    </div>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableBody>
                                                <AnimatePresence>
                                                    {members
                                                        .filter(m => m.patrulha_id === selectedPatrulhaId)
                                                        .sort((a, b) => {
                                                            const d1 = a.created_at ? new Date(a.created_at).getTime() : 0;
                                                            const d2 = b.created_at ? new Date(b.created_at).getTime() : 0;
                                                            return d1 - d2;
                                                        })
                                                        .map((member, idx) => (
                                                            <TableRow key={member.id} className="border-white/5 hover:bg-white/[0.02] transition-all group">
                                                                <TableCell className="p-10">
                                                                    <div className="flex items-center gap-8">
                                                                        <div className="relative">
                                                                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-2xl transition-all group-hover:rotate-6 ${member.cargo !== 'Recruta'
                                                                                ? 'bg-yellow-500 text-black'
                                                                                : 'bg-zinc-900 border border-white/5 text-zinc-500'
                                                                                }`}>
                                                                                {member.nome_guerra?.charAt(0) || '?'}
                                                                            </div>
                                                                            <span className="absolute -top-2 -right-2 bg-zinc-950 text-zinc-500 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center font-black text-[10px] tracking-tighter italic">
                                                                                #{idx + 1}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <h4 className="font-black uppercase tracking-tight text-2xl text-white group-hover:text-yellow-500 transition-colors">
                                                                                {member.nome_guerra}
                                                                            </h4>
                                                                            <div className="flex flex-wrap items-center gap-4">
                                                                                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.02] px-3 py-1 rounded-lg border border-white/5">
                                                                                    Registro: {member.matricula}
                                                                                </span>
                                                                                {member.cargo !== 'Recruta' && (
                                                                                    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-yellow-500/20">
                                                                                        <Crown className="w-3.5 h-3.5" /> {member.cargo}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right p-10">
                                                                    <div className="flex items-center justify-end gap-6">
                                                                        <div className="flex items-center bg-zinc-950 p-2 rounded-2xl border border-white/5 shadow-inner">
                                                                            <button
                                                                                onClick={() => updateMemberRole(member.id, 'Líder')}
                                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${member.cargo === 'Líder' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-zinc-600 hover:text-white'}`}
                                                                            >
                                                                                Líder
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateMemberRole(member.id, 'Vice-Líder')}
                                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${member.cargo === 'Vice-Líder' ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-white'}`}
                                                                            >
                                                                                Vice
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateMemberRole(member.id, 'Recruta')}
                                                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${member.cargo === 'Recruta' ? 'bg-zinc-800 text-zinc-400' : 'text-zinc-600 hover:text-white'}`}
                                                                            >
                                                                                Recruta
                                                                            </button>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => removeMember(member.id)}
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="w-14 h-14 rounded-2xl text-zinc-700 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                                                                        >
                                                                            <Trash2 className="w-6 h-6" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </AnimatePresence>
                                                {members.filter(m => m.patrulha_id === selectedPatrulhaId).length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="py-32 text-center">
                                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                                                                <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center grayscale opacity-30">
                                                                    <Users className="w-10 h-10" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="font-black uppercase tracking-[0.4em] text-xs text-zinc-500">Unidade Vazia</p>
                                                                    <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest italic">Aguardando alocação de novos cadetes</p>
                                                                </div>
                                                            </motion.div>
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

                    {/* --- TAB: VOTACAO --- */}
                    <TabsContent value="votacao" className="outline-none">
                        <div className="grid lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-7 space-y-8">
                                <Card className="bg-zinc-900/20 backdrop-blur-2xl border-white/5 rounded-[3rem] overflow-hidden">
                                    <CardHeader className="p-10 md:p-14 bg-white/[0.01] border-b border-white/5">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                                <Vote className="w-6 h-6 text-black" />
                                            </div>
                                            <CardTitle className="text-3xl font-black uppercase italic text-white leading-none">Status da Campanha</CardTitle>
                                        </div>
                                        <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest ml-16 italic">Configuração e acompanhamento da votação de popularidade</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-10 md:p-14 space-y-10">
                                        {/* Configuration Grid */}
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Título da Votação</label>
                                                <Input
                                                    value={votingTitle}
                                                    onChange={(e) => setVotingTitle(e.target.value)}
                                                    className="bg-zinc-950 border-white/5 h-16 rounded-2xl font-black uppercase text-sm focus:border-yellow-500 transition-all text-white px-6"
                                                    placeholder="EX: CEPEF 2026 - SEMANA 01"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Placar em Tempo Real</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {patrulhas.map(p => (
                                                        <div key={p.id} className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase text-zinc-400">{p.nome}</span>
                                                            <span className="text-sm font-black text-yellow-500 tabular-nums">
                                                                {votosContabilizados[p.id] || 0}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Início Previsto</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="bg-zinc-950 border-white/5 h-16 rounded-2xl font-black uppercase text-xs focus:border-yellow-500 transition-all text-white px-6"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Encerramento</label>
                                                <Input
                                                    type="datetime-local"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="bg-zinc-950 border-white/5 h-16 rounded-2xl font-black uppercase text-xs focus:border-yellow-500 transition-all text-white px-6"
                                                />
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-4 h-4 rounded-full animate-pulse ${activeVoting ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500'}`} />
                                                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                                    Sistema {activeVoting ? 'Operando' : 'Em Standby'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center gap-4">
                                                {activeVoting ? (
                                                    <>
                                                        <Button
                                                            onClick={updateVoting}
                                                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xs tracking-[0.3em] h-16 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
                                                        >
                                                            <Save className="w-5 h-5 mr-2" /> Salvar Alterações
                                                        </Button>
                                                        <Button
                                                            onClick={deactivateVoting}
                                                            variant="outline"
                                                            className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase text-[10px] tracking-[0.3em] h-16 px-8 rounded-2xl transition-all"
                                                        >
                                                            Desativar
                                                        </Button>
                                                        <Button
                                                            onClick={deleteVoting}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-16 h-16 rounded-2xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="w-6 h-6" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        onClick={async () => {
                                                            try {
                                                                await supabase.from("cepfm_votacoes").update({ ativa: false }).eq("ativa", true);
                                                                const { data, error } = await supabase.from("cepfm_votacoes").insert({
                                                                    titulo: votingTitle,
                                                                    data_inicio: new Date(startDate).toISOString(),
                                                                    data_fim: new Date(endDate).toISOString(),
                                                                    ativa: true,
                                                                    parceiros_instagram: instaLinks
                                                                }).select().single();
                                                                if (error) throw error;
                                                                toast.success("Campanha Iniciada!");
                                                                setActiveVoting(data);
                                                                fetchBaseData();
                                                            } catch (e) {
                                                                toast.error("Falha ao lançar votação");
                                                            }
                                                        }}
                                                        className="bg-white hover:bg-zinc-100 text-black font-black uppercase text-xs tracking-[0.3em] h-16 px-12 rounded-2xl shadow-2xl shadow-white/5 transition-all active:scale-95"
                                                    >
                                                        Lançar Nova Campanha
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Social / Partners Panel */}
                            <div className="lg:col-span-5 space-y-8">
                                <Card className="bg-zinc-900/20 backdrop-blur-2xl border-white/5 rounded-[3rem] overflow-hidden p-10 md:p-14">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Instagram className="w-8 h-8 text-pink-500" />
                                        <h3 className="text-xl font-black uppercase italic text-white leading-none">Social Hub</h3>
                                    </div>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-10 leading-relaxed">Gerencie os links patrocinados e parceiros oficiais que aparecerão na interface de votação dos alunos.</p>

                                    <div className="space-y-6">
                                        {instaLinks.map((link, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={i}
                                                className="flex items-center gap-4 bg-zinc-950/50 p-6 rounded-3xl border border-white/5"
                                            >
                                                <div className="flex-1 space-y-4">
                                                    <Input
                                                        className="bg-black/40 border-white/5 h-12 rounded-xl text-xs text-white"
                                                        placeholder="NOME DO PARCEIRO"
                                                        value={link.nome}
                                                        onChange={(e) => {
                                                            const newLinks = [...instaLinks];
                                                            newLinks[i].nome = e.target.value.toUpperCase();
                                                            setInstaLinks(newLinks);
                                                        }}
                                                    />
                                                    <Input
                                                        className="bg-black/40 border-white/5 h-12 rounded-xl text-[10px] text-zinc-500"
                                                        placeholder="LINK DO INSTAGRAM"
                                                        value={link.link}
                                                        onChange={(e) => {
                                                            const newLinks = [...instaLinks];
                                                            newLinks[i].link = e.target.value;
                                                            setInstaLinks(newLinks);
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-12 h-12 rounded-2xl text-zinc-700 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                                                    onClick={() => setInstaLinks(instaLinks.filter((_, idx) => idx !== i))}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </motion.div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="w-full h-16 border-white/5 bg-zinc-950/30 hover:bg-white/[0.05] rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 text-zinc-500 hover:text-white transition-all border-dashed"
                                            onClick={() => setInstaLinks([...instaLinks, { nome: '', link: '' }])}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Acoplar Novo Parceiro
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <footer className="max-w-7xl mx-auto mt-32 pb-12 border-t border-white/5 pt-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">© 2026 Forças Mirins Maranhão</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-700">Desenvolvido com tecnologia de ponta para gestão esportiva</p>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Servidores Seguros</span>
                    </div>
                </div>
            </footer>

            {/* Hidden Printable Area - Using opacity/fixed for better capture reliability */}
            <div style={{ position: 'fixed', left: '-10000px', top: '0', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                <div ref={studentListRef}>
                    <PrintableCEPFMAlunoList
                        students={allStudents.filter(s => s.status === 'ativo').sort((a: any, b: any) => {
                            // Sort by ano_ingresso ASC (Oldest to Newest)
                            const yearA = a.ano_ingresso || 0;
                            const yearB = b.ano_ingresso || 0;
                            if (yearA !== yearB) {
                                return yearA - yearB;
                            }

                            // Helper to get order number from field or matricula (xx part of xx/aa)
                            const getOrder = (s: any) => {
                                if (s.numero_ordem !== null && s.numero_ordem !== undefined) return s.numero_ordem;
                                if (s.matricula_pfm) {
                                    const parts = s.matricula_pfm.split("/");
                                    const num = parseInt(parts[0]);
                                    if (!isNaN(num)) return num;
                                }
                                return 0;
                            };

                            const orderA = getOrder(a);
                            const orderB = getOrder(b);
                            return orderA - orderB;
                        })}
                    />
                </div>
            </div>
        </div>
    );
}
