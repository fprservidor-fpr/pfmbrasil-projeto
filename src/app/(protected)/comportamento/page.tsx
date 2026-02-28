"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Medal,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Loader2,
  User,
  Award,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Filter,
  ArrowUpRight,
  Trash2,
  Sparkles,
  CalendarCheck,
  Check,
  ChevronsUpDown,
  Settings
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ClassificationTable } from "@/components/classification-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import Link from "next/link";

const BEHAVIOR_LEVELS: Record<string, any> = {
  "EXCEPCIONAL": {
    label: "EXCEPCIONAL",
    color: "from-blue-600/20 to-blue-600/5",
    accent: "bg-blue-600",
    textColor: "text-blue-400",
    border: "border-blue-500/30",
    shadow: "shadow-blue-500/10"
  },
  "ÓTIMO": {
    label: "ÓTIMO",
    color: "from-emerald-600/20 to-emerald-600/5",
    accent: "bg-emerald-600",
    textColor: "text-emerald-400",
    border: "border-emerald-500/30",
    shadow: "shadow-emerald-500/10"
  },
  "BOM": {
    label: "BOM",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "bg-amber-500",
    textColor: "text-amber-400",
    border: "border-amber-500/30",
    shadow: "shadow-amber-500/10"
  },
  "REGULAR": {
    label: "REGULAR",
    color: "from-orange-600/20 to-orange-600/5",
    accent: "bg-orange-600",
    textColor: "text-orange-400",
    border: "border-orange-500/30",
    shadow: "shadow-orange-500/10"
  },
  "INSUFICIENTE": {
    label: "INSUFICIENTE",
    color: "from-red-600/20 to-red-600/5",
    accent: "bg-red-600",
    textColor: "text-red-400",
    border: "border-red-500/30",
    shadow: "shadow-red-500/10"
  },
  "MAU": {
    label: "MAU",
    color: "from-zinc-700/20 to-zinc-700/5",
    accent: "bg-zinc-600",
    textColor: "text-zinc-400",
    border: "border-zinc-500/30",
    shadow: "shadow-zinc-500/10"
  },
};

const getNextBehavior = (currentLevel: string, score: number) => {
  switch (currentLevel) {
    case "EXCEPCIONAL":
      return score >= 80 ? "EXCEPCIONAL" : "ÓTIMO";
    case "ÓTIMO":
      if (score >= 70) return "EXCEPCIONAL";
      if (score >= 40) return "ÓTIMO";
      return "BOM";
    case "BOM":
      if (score >= 70) return "ÓTIMO";
      if (score >= 40) return "BOM";
      return "REGULAR";
    case "REGULAR":
      if (score >= 70) return "BOM";
      if (score >= 40) return "REGULAR";
      return "INSUFICIENTE";
    case "INSUFICIENTE":
      if (score >= 60) return "REGULAR";
      if (score >= 30) return "INSUFICIENTE";
      return "MAU";
    case "MAU":
      return "MAU";
    default:
      return "EXCEPCIONAL";
  }
};

export default function ComportamentoPage() {
  const { profile, simulatedRole } = useAuth();
  const [alunos, setAlunos] = useState<any[]>([]);
  const [comportamentos, setComportamentos] = useState<any[]>([]);
  const [occurrenceTypes, setOccurrenceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newRegistro, setNewRegistro] = useState({
    aluno_id: "",
    tipo: "merito",
    descricao: "",
    pontos: 5,
  });

  const [occurrenceTab, setOccurrenceTab] = useState<"merito" | "demerito">("merito");
  const [openStudentSelect, setOpenStudentSelect] = useState(false);

  const [ciclos, setCiclos] = useState<any[]>([]);
  const [showGerenciarCiclos, setShowGerenciarCiclos] = useState(false);
  const [newCicloName, setNewCicloName] = useState("");

  const [manualUpdate, setManualUpdate] = useState({
    aluno_id: "",
    novo_nivel: "EXCEPCIONAL",
    justificativa: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const showTestRecords = !!simulatedRole;

    let studentsQuery = supabase.from("students").select("*").eq("status", "ativo");
    let behaviorsQuery = supabase.from("comportamentos").select("*, profiles(full_name)");

    if (!showTestRecords) {
      studentsQuery = studentsQuery.eq("is_test", false);
      behaviorsQuery = behaviorsQuery.eq("is_test", false);
    }

    const [{ data: alunosData }, { data: comportamentosData }, { data: typesData }, { data: ciclosData }] = await Promise.all([
      studentsQuery,
      behaviorsQuery.order("created_at", { ascending: false }),
      supabase.from("occurrence_types").select("*").order("label"),
      supabase.from("comportamento_ciclos").select("*").order("data_fechamento", { ascending: false })
    ]);

    if (alunosData) {
      const sorted = [...alunosData].sort((a, b) => {
        const matA = a.matricula_pfm || "";
        const matB = b.matricula_pfm || "";

        if (!matA && !matB) return a.nome_completo?.localeCompare(b.nome_completo);
        if (!matA) return 1;
        if (!matB) return -1;

        const [numA, yearA] = matA.split("/").map(Number);
        const [numB, yearB] = matB.split("/").map(Number);

        if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
        return (numA || 0) - (numB || 0);
      });
      setAlunos(sorted);
    }
    if (comportamentosData) setComportamentos(comportamentosData);
    if (typesData) setOccurrenceTypes(typesData);
    if (ciclosData) setCiclos(ciclosData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedAluno) {
      setSelectedMonth("current_cycle"); // current_cycle means current opened cycle
      fetchStudentHistory(selectedAluno.id);
    }
  }, [selectedAluno]);

  const fetchStudentHistory = async (alunoId: string) => {
    const { data } = await supabase
      .from("behavior_history")
      .select("*")
      .eq("student_id", alunoId)
      .order("periodo", { ascending: false });
    if (data) setStudentHistory(data);
  };

  const calculateMonthlyScore = (alunoId: string, targetCicloNome?: string) => {
    let registros = comportamentos.filter(c => c.aluno_id === alunoId);

    if (targetCicloNome && targetCicloNome !== "current_cycle") {
      const targetIndex = ciclos.findIndex(c => c.nome === targetCicloNome);
      if (targetIndex !== -1) {
        const targetCiclo = ciclos[targetIndex];
        const prevCiclo = ciclos[targetIndex + 1];
        registros = registros.filter(r => new Date(r.created_at) <= new Date(targetCiclo.data_fechamento));
        if (prevCiclo) {
          registros = registros.filter(r => new Date(r.created_at) > new Date(prevCiclo.data_fechamento));
        }
      }
    } else {
      if (ciclos.length > 0) {
        registros = registros.filter(r => new Date(r.created_at) > new Date(ciclos[0].data_fechamento));
      }
    }

    const sortedRegistros = [...registros].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let score = 100;
    sortedRegistros.forEach(r => {
      if (r.tipo === "merito") {
        score = Math.min(100, score + r.pontos);
      } else {
        score = Math.max(0, score - r.pontos);
      }
    });
    return score;
  };

  const getAlunoHistory = (alunoId: string, targetCicloNome?: string) => {
    let registros = comportamentos.filter(c => c.aluno_id === alunoId);

    if (targetCicloNome && targetCicloNome !== "current_cycle") {
      const targetIndex = ciclos.findIndex(c => c.nome === targetCicloNome);
      if (targetIndex !== -1) {
        const targetCiclo = ciclos[targetIndex];
        const prevCiclo = ciclos[targetIndex + 1];
        registros = registros.filter(r => new Date(r.created_at) <= new Date(targetCiclo.data_fechamento));
        if (prevCiclo) {
          registros = registros.filter(r => new Date(r.created_at) > new Date(prevCiclo.data_fechamento));
        }
      }
    } else {
      if (ciclos.length > 0) {
        registros = registros.filter(r => new Date(r.created_at) > new Date(ciclos[0].data_fechamento));
      }
    }

    const sortedRegistros = [...registros].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let score = 100;
    const history: any[] = [{ date: "Início", score: 100 }];

    sortedRegistros.forEach(r => {
      if (r.tipo === "merito") {
        score = Math.min(100, score + r.pontos);
      } else {
        score = Math.max(0, score - r.pontos);
      }
      history.push({
        date: format(new Date(r.created_at), "dd/MM", { locale: ptBR }),
        score,
      });
    });

    return history;
  };

  const getFilteredComportamentos = (alunoId: string, targetCicloNome?: string) => {
    let registros = comportamentos.filter(c => c.aluno_id === alunoId);

    if (targetCicloNome && targetCicloNome !== "current_cycle") {
      const targetIndex = ciclos.findIndex(c => c.nome === targetCicloNome);
      if (targetIndex !== -1) {
        const targetCiclo = ciclos[targetIndex];
        const prevCiclo = ciclos[targetIndex + 1];
        registros = registros.filter(r => new Date(r.created_at) <= new Date(targetCiclo.data_fechamento));
        if (prevCiclo) {
          registros = registros.filter(r => new Date(r.created_at) > new Date(prevCiclo.data_fechamento));
        }
      }
    } else {
      if (ciclos.length > 0) {
        registros = registros.filter(r => new Date(r.created_at) > new Date(ciclos[0].data_fechamento));
      }
    }
    return registros.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const handleAddRegistro = async () => {
    if (!newRegistro.aluno_id || !newRegistro.descricao.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("comportamentos")
          .update({
            ...newRegistro,
            instrutor_id: profile?.id,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Registro atualizado com sucesso!");
      } else {
        const { data: newComp, error } = await supabase.from("comportamentos").insert([{
          ...newRegistro,
          instrutor_id: profile?.id,
        }]).select().single();
        if (error) throw error;

        // Add notification event
        await supabase.from("eventos_notificacoes").insert([{
          aluno_id: newRegistro.aluno_id,
          tipo: newRegistro.tipo,
          descricao: `${newRegistro.tipo === 'merito' ? 'Mérito' : 'Demérito'}: ${newRegistro.descricao} (${newRegistro.pontos} pontos)`,
        }]);

        toast.success("Registro salvo com sucesso!");
      }
      setShowModal(false);
      setEditingId(null);
      setNewRegistro({ aluno_id: "", tipo: "merito", descricao: "", pontos: 5 });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleEditRegistro = (registro: any) => {
    setEditingId(registro.id);
    setNewRegistro({
      aluno_id: registro.aluno_id,
      tipo: registro.tipo,
      descricao: registro.descricao,
      pontos: registro.pontos,
    });
    setOccurrenceTab(registro.tipo as "merito" | "demerito");
    setShowModal(true);
  };

  const handleManualUpdate = async () => {
    if (!manualUpdate.aluno_id || !manualUpdate.justificativa.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          comportamento_atual: manualUpdate.novo_nivel,
          comportamento_justificativa: manualUpdate.justificativa
        })
        .eq("id", manualUpdate.aluno_id);

      if (error) throw error;

      await supabase.from("behavior_history").insert([{
        student_id: manualUpdate.aluno_id,
        nivel_anterior: alunos.find(a => a.id === manualUpdate.aluno_id)?.comportamento_atual,
        nivel_novo: manualUpdate.novo_nivel,
        tipo_mudanca: 'MANUAL',
        justificativa: manualUpdate.justificativa,
        periodo: format(new Date(), 'yyyy-MM')
      }]);

      await supabase.from("eventos_notificacoes").insert([{
        aluno_id: manualUpdate.aluno_id,
        tipo: 'comunicado',
        descricao: `Seu comportamento foi atualizado manualmente para ${manualUpdate.novo_nivel}. Justificativa: ${manualUpdate.justificativa}`,
      }]);

      toast.success("Comportamento atualizado manualmente!");
      setShowManualModal(false);
      setManualUpdate({ aluno_id: "", novo_nivel: "EXCEPCIONAL", justificativa: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevertCiclo = async (cicloId: string) => {
    setSaving(true);
    try {
      const { data: histories } = await supabase.from("behavior_history").select("*").eq("ciclo_id", cicloId);

      if (histories && histories.length > 0) {
        for (const history of histories) {
          if (history.student_id && history.nivel_anterior) {
            await supabase.from("students").update({ comportamento_atual: history.nivel_anterior }).eq("id", history.student_id);
          }
        }
      }

      const { error } = await supabase.from("comportamento_ciclos").delete().eq("id", cicloId);
      if (error) throw error;

      toast.success("Ciclo revertido com sucesso! A pontuação voltou para o limite anterior.");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao tentar reverter o ciclo.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeMonth = async () => {
    if (profile?.role !== 'admin' && profile?.role !== 'instrutor' && profile?.role !== 'instructor') return;
    if (!newCicloName.trim()) {
      toast.error("Informe o nome para registrar no dossiê.");
      return;
    }

    setSaving(true);
    try {
      const { data: novoCiclo, error: cicloError } = await supabase.from("comportamento_ciclos").insert([{
        nome: newCicloName,
        fechado_por: profile?.id
      }]).select().single();

      if (cicloError) throw cicloError;

      const transitions = alunos.map(aluno => {
        const score = calculateMonthlyScore(aluno.id, "current_cycle");
        const nextLevel = getNextBehavior(aluno.comportamento_atual || "EXCEPCIONAL", score);
        return {
          id: aluno.id,
          comportamento_atual: nextLevel,
          score,
          prevLevel: aluno.comportamento_atual
        };
      });

      for (const t of transitions) {
        await supabase.from("students").update({ comportamento_atual: t.comportamento_atual }).eq("id", t.id);

        await supabase.from("behavior_history").insert([{
          student_id: t.id,
          nivel_anterior: t.prevLevel || 'EXCEPCIONAL',
          nivel_novo: t.comportamento_atual,
          pontos_periodo: t.score,
          periodo: newCicloName,
          tipo_mudanca: 'AUTO',
          justificativa: `Fechamento de ciclo: ${newCicloName}`,
          ciclo_id: novoCiclo.id
        }]);
      }

      toast.success("Transições aplicadas e ciclo salvo com sucesso!");
      setShowConfirmFinalize(false);
      setNewCicloName("");
      fetchData();
    } catch (error: any) {
      console.error("Erro no fechamento:", error);
      toast.error("Erro ao processar transições: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredAlunos = useMemo(() => {
    return [...alunos]
      .filter(a => {
        const matchesSearch = a.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === "all") return matchesSearch;
        if (activeTab === "critical") return matchesSearch && (a.comportamento_atual === 'MAU' || a.comportamento_atual === 'INSUFICIENTE' || a.comportamento_atual === 'REGULAR');
        if (activeTab === "top") return matchesSearch && a.comportamento_atual === 'EXCEPCIONAL';
        return matchesSearch;
      });
  }, [alunos, searchTerm, activeTab]);

  const handleDeleteRegistro = async (id: string) => {
    try {
      const { error } = await supabase.from("comportamentos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registro excluído!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  return (
    <div className="relative min-h-screen pb-24 text-zinc-100 space-y-8">
      <header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Medal className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">Gestão de Comportamento</h1>
                <p className="text-zinc-500 text-sm">Méritos, deméritos e transições de classificação</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-xl">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                {comportamentos.filter(r => r.tipo === 'merito').length} méritos
              </Badge>
              <Badge className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-xl">
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                {comportamentos.filter(r => r.tipo === 'demerito').length} deméritos
              </Badge>
            </div>
          </div>
        </motion.div>
      </header>

      <div className="flex flex-wrap gap-3">
        {(profile?.role === 'admin' || profile?.role === 'instrutor' || profile?.role === 'instructor') && (
          <>
            <Button
              variant="outline"
              onClick={() => setShowGerenciarCiclos(true)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all backdrop-blur-sm rounded-xl h-12"
            >
              <Settings className="w-4 h-4 mr-2 text-zinc-400" />
              Ver Ciclos Salvos
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualModal(true)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all backdrop-blur-sm rounded-xl h-12"
            >
              <TrendingUp className="w-4 h-4 mr-2 text-amber-500" />
              Intervenção Manual
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmFinalize(true)}
              disabled={saving}
              className="bg-zinc-900/50 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all backdrop-blur-sm rounded-xl h-12"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Finalizar Ciclo Atual
            </Button>
          </>
        )}
        <Button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 px-8 rounded-xl h-12 ml-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Lançar Ocorrência
        </Button>
      </div>

      <div className="min-h-[200px]">
        <ClassificationTable />
      </div>

      <AnimatePresence mode="wait">
        {selectedAluno ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedAluno(null)}
                className="text-zinc-500 hover:text-white hover:bg-zinc-800/50"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Retornar ao Quadro Geral
              </Button>
              <div className="flex items-center gap-4">
                {(profile?.role === 'admin' || profile?.role === 'coordenador_geral' || profile?.role === 'nucleo' || profile?.role === 'instrutor' || profile?.role === 'instructor') && (
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px] bg-zinc-900/40 border-zinc-800 text-white rounded-xl">
                      <SelectValue placeholder="Selecione o Ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_cycle">Ciclo Atual (Em Andamento)</SelectItem>
                      {ciclos.map(c => (
                        <SelectItem key={c.id} value={c.nome}>
                          {c.nome} (Fechado em {format(new Date(c.data_fechamento), "dd/MM", { locale: ptBR })})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="border-zinc-800 text-zinc-500 px-4 py-1">
                    MATRÍCULA: {selectedAluno.matricula_pfm || "N/A"}
                  </Badge>
                  <Badge variant="outline" className="border-zinc-800 text-zinc-400/50 px-4 py-1 text-[10px]">
                    ID: {selectedAluno.numero_ordem ? `${String(selectedAluno.numero_ordem).padStart(2, '0')}/${String(selectedAluno.ano_ingresso || 26).slice(-2)}` : selectedAluno.pre_matricula_id?.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-4 bg-zinc-900/40 border-zinc-800 backdrop-blur-xl overflow-hidden rounded-3xl">
                <div className={cn("h-2 w-full", (BEHAVIOR_LEVELS[selectedMonth && selectedMonth !== 'current_cycle' ? studentHistory.find(h => h.periodo === selectedMonth)?.nivel_novo || "EXCEPCIONAL" : selectedAluno.comportamento_atual || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).accent)} />
                <CardContent className="p-8">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-20",
                      (BEHAVIOR_LEVELS[selectedAluno.comportamento_atual || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).accent
                    )} />
                    <div className="relative w-full h-full rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center overflow-hidden">
                      <User className="w-16 h-16 text-zinc-700" strokeWidth={1} />
                    </div>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 p-2 rounded-xl shadow-2xl",
                      (BEHAVIOR_LEVELS[selectedAluno.comportamento_atual || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).accent
                    )}>
                      <Award className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="text-center space-y-1 mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                      {selectedAluno.nome_guerra || selectedAluno.nome_completo.split(' ')[0]}
                    </h3>
                    <p className="text-zinc-500 font-medium">{selectedAluno.nome_completo}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mb-1">Status Global</p>
                      <p className={cn("text-lg font-black", (BEHAVIOR_LEVELS[selectedMonth && selectedMonth !== format(new Date(), 'yyyy-MM') ? studentHistory.find(h => h.periodo === selectedMonth)?.nivel_novo || "EXCEPCIONAL" : selectedAluno.comportamento_atual || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).textColor)}>
                        {selectedMonth && selectedMonth !== 'current_cycle' ? studentHistory.find(h => h.periodo === selectedMonth)?.nivel_novo || "EXCEPCIONAL" : selectedAluno.comportamento_atual || "EXCEPCIONAL"}
                      </p>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl text-center">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mb-1">Pontuação</p>
                      <p className="text-2xl font-black text-white">
                        {selectedMonth && selectedMonth !== 'current_cycle' && studentHistory.find(h => h.periodo === selectedMonth)
                          ? studentHistory.find(h => h.periodo === selectedMonth)?.pontos_periodo
                          : calculateMonthlyScore(selectedAluno.id, selectedMonth)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 space-y-6">
                <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white uppercase tracking-wider">Prontuário de Desempenho</CardTitle>
                      <p className="text-zinc-500 text-xs">Variação de pontos no ciclo vigente</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getAlunoHistory(selectedAluno.id, selectedMonth)}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            domain={[0, 100]}
                            stroke="#52525b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "12px", fontSize: "12px" }}
                            itemStyle={{ color: "#10b981" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {(profile?.role === 'admin' || profile?.role === 'coordenador_geral' || profile?.role === 'nucleo') && studentHistory.length > 0 && (
                  <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl rounded-3xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-amber-500" />
                        Dossiê de Ciclos Anteriores
                      </CardTitle>
                      <p className="text-zinc-500 text-xs">Linha do tempo oficial de comportamentos fechados</p>
                    </CardHeader>
                    <CardContent>
                      <div className="relative border-l border-zinc-800 ml-3 pl-6 space-y-6 mb-4">
                        {studentHistory.map((h, i) => (
                          <div key={h.id} className="relative">
                            <div className={cn(
                              "absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-zinc-900",
                              (BEHAVIOR_LEVELS[h.nivel_novo || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).accent
                            )} />
                            <div>
                              <h4 className="text-white font-black text-sm uppercase">{h.periodo}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-zinc-500 text-xs font-medium">Nível: <span className={cn("font-bold uppercase", (BEHAVIOR_LEVELS[h.nivel_novo || "EXCEPCIONAL"] || BEHAVIOR_LEVELS["EXCEPCIONAL"]).textColor)}>{h.nivel_novo}</span></p>
                                <p className="text-zinc-500 text-xs font-medium">Pontuação: <span className="text-white font-bold">{h.pontos_periodo} pts</span></p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      {selectedMonth && selectedMonth !== 'current_cycle' ? `Ocorrências do Ciclo (${selectedMonth})` : 'Ocorrências do Ciclo Atual'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      {getFilteredComportamentos(selectedAluno.id, selectedMonth).map((c, i) => (
                        <div
                          key={c.id}
                          className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-2xl flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              c.tipo === "merito" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {c.tipo === "merito" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{c.descricao}</p>
                              <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1">
                                {format(new Date(c.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-sm font-black",
                              c.tipo === "merito" ? "text-emerald-500" : "text-red-500"
                            )}>
                              {c.tipo === "merito" ? "+" : "-"}{c.pontos} PONTOS
                            </span>
                            {(profile?.role === 'admin' || profile?.role === 'instrutor') && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditRegistro(c)}
                                  className="p-2 text-zinc-600 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRegistro(c.id)}
                                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="IDENTIFICAR ALUNO OU MATRÍCULA..."
                  className="pl-12 bg-zinc-900/40 border-zinc-800 text-white h-12 rounded-2xl focus:ring-emerald-500/20 placeholder:text-zinc-600 font-medium shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm">
                {[
                  { id: "all", label: "Todos", icon: Filter },
                  { id: "critical", label: "Críticos", icon: AlertTriangle },
                  { id: "top", label: "Excepcionais", icon: Award },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      activeTab === t.id ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-zinc-500 font-medium animate-pulse">Sincronizando registros disciplinares...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAlunos.map((aluno, i) => {
                  const score = calculateMonthlyScore(aluno.id);
                  const levelKey = aluno.comportamento_atual || "EXCEPCIONAL";
                  const level = BEHAVIOR_LEVELS[levelKey] || BEHAVIOR_LEVELS["EXCEPCIONAL"];

                  return (
                    <motion.div
                      key={aluno.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedAluno(aluno)}
                      className="bg-zinc-900/30 border border-zinc-800 hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer group transition-all"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                          <User className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-black uppercase truncate text-xs tracking-tight">
                            {aluno.nome_guerra || aluno.nome_completo.split(' ')[0]}
                          </h3>
                          <p className="text-zinc-600 text-[9px] font-mono">
                            ID: {aluno.matricula_pfm || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/50 text-center">
                          <p className="text-[8px] text-zinc-600 uppercase font-black mb-0.5">Pontos</p>
                          <p className={cn("text-lg font-black tabular-nums", level.textColor)}>{score}</p>
                        </div>
                        <div className={cn("p-2 rounded-xl text-center flex flex-col justify-center", level.accent)}>
                          <p className="text-[8px] text-white/50 uppercase font-black mb-0.5">Nível</p>
                          <p className="text-white text-[9px] font-black leading-none">{level.label}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-600 font-bold uppercase">
                        <span>Progressão</span>
                        <ArrowUpRight className="w-3 h-3 group-hover:text-emerald-500" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Intervention Modal */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="bg-amber-600 p-6 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Intervenção Disciplinar</DialogTitle>
              <DialogDescription className="text-amber-100/70 text-xs">Alteração imediata do status hierárquico.</DialogDescription>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Selecionar Aluno</Label>
              <Select value={manualUpdate.aluno_id} onValueChange={(val) => setManualUpdate({ ...manualUpdate, aluno_id: val })}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {alunos.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome_guerra || a.nome_completo} ({a.comportamento_atual || "EXCEPCIONAL"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Nova Classificação</Label>
              <Select value={manualUpdate.novo_nivel} onValueChange={(val) => setManualUpdate({ ...manualUpdate, novo_nivel: val })}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {Object.keys(BEHAVIOR_LEVELS).map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Justificativa do Comando</Label>
              <Textarea
                value={manualUpdate.justificativa}
                onChange={(e) => setManualUpdate({ ...manualUpdate, justificativa: e.target.value })}
                placeholder="Motivo formal da intervenção..."
                className="bg-zinc-900/50 border-zinc-800 rounded-xl resize-none min-h-[100px] text-sm"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowManualModal(false)} className="flex-1 text-zinc-500 hover:text-white">
                CANCELAR
              </Button>
              <Button onClick={handleManualUpdate} disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "APLICAR"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Occurrence Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) {
          setEditingId(null);
          setNewRegistro({ aluno_id: "", tipo: "merito", descricao: "", pontos: 5 });
        }
      }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className={cn(
            "p-6 flex items-center justify-between transition-colors",
            editingId ? "bg-amber-600" : "bg-emerald-600"
          )}>
            <div className="flex items-center gap-4">
              {editingId ? <AlertTriangle className="w-8 h-8 text-white" /> : <Award className="w-8 h-8 text-white" />}
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingId ? "Editar Ocorrência" : "Nova Ocorrência"}
                </DialogTitle>
                <DialogDescription className={cn(
                  "text-xs",
                  editingId ? "text-amber-100/70" : "text-emerald-100/70"
                )}>
                  {editingId ? "Alterar registro existente." : "Registro oficial no histórico disciplinar."}
                </DialogDescription>
              </div>
            </div>
            {(profile?.role === 'admin' || profile?.role === 'coordenador') && (
              <Link href="/comportamento/configuracoes">
                <Button variant="ghost" size="sm" className="text-emerald-100 hover:text-white hover:bg-emerald-500/20 rounded-xl font-black text-[10px] uppercase">
                  Configurar
                </Button>
              </Link>
            )}
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Identificar Aluno</Label>
              <Popover open={openStudentSelect} onOpenChange={setOpenStudentSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudentSelect}
                    className="w-full justify-between bg-zinc-900/50 border-zinc-800 h-12 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  >
                    {newRegistro.aluno_id
                      ? alunos.find((a) => a.id === newRegistro.aluno_id)?.nome_guerra || alunos.find((a) => a.id === newRegistro.aluno_id)?.nome_completo
                      : "Selecione o aluno..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-zinc-900 border-zinc-800" align="start">
                  <Command className="bg-transparent text-white">
                    <CommandInput placeholder="Pesquisar aluno..." className="h-10 text-white" />
                    <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      <CommandEmpty className="py-6 text-center text-sm text-zinc-500">Nenhum aluno encontrado.</CommandEmpty>
                      <CommandGroup>
                        {alunos.map((a) => (
                          <CommandItem
                            key={a.id}
                            value={a.nome_guerra || a.nome_completo}
                            onSelect={() => {
                              setNewRegistro({ ...newRegistro, aluno_id: a.id });
                              setOpenStudentSelect(false);
                            }}
                            className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer flex items-center justify-between py-3"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">{a.nome_guerra || a.nome_completo}</span>
                              {a.nome_guerra && <span className="text-[10px] text-zinc-500 uppercase">{a.nome_completo}</span>}
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                newRegistro.aluno_id === a.id ? "opacity-100 text-emerald-500" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Selecione o Fato Disciplinar</Label>

              <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setOccurrenceTab("merito")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-all",
                    occurrenceTab === "merito"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Méritos
                </button>
                <button
                  onClick={() => setOccurrenceTab("demerito")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-all",
                    occurrenceTab === "demerito"
                      ? "bg-red-600 text-white shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <TrendingDown className="w-4 h-4" />
                  Deméritos
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {occurrenceTypes
                  .filter(type => type.type === occurrenceTab)
                  .map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setNewRegistro({
                          ...newRegistro,
                          tipo: type.type,
                          pontos: type.points,
                          descricao: type.label
                        });
                      }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/item",
                        newRegistro.descricao === type.label
                          ? occurrenceTab === "merito"
                            ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5"
                            : "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/5"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          type.type === 'merito' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        )} />
                        <span className="text-xs font-bold uppercase tracking-tight">{type.label}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black tabular-nums",
                        type.type === 'merito' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {type.type === 'merito' ? "+" : "-"}{type.points} PTS
                      </span>
                    </button>
                  ))}
                {occurrenceTypes.filter(type => type.type === occurrenceTab).length === 0 && (
                  <div className="text-center py-8 text-zinc-600 text-xs font-medium">
                    Nenhum {occurrenceTab === "merito" ? "mérito" : "demérito"} cadastrado.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Narrativa da Ocorrência</Label>
              <Textarea
                value={newRegistro.descricao}
                onChange={(e) => setNewRegistro({ ...newRegistro, descricao: e.target.value })}
                placeholder="Descreva detalhadamente o fato..."
                className="bg-zinc-900/50 border-zinc-800 rounded-xl resize-none min-h-[100px] text-sm"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-zinc-500 hover:text-white font-black uppercase text-xs">
                CANCELAR
              </Button>
              <Button onClick={handleAddRegistro} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "REGISTRAR FATO"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cycle Confirmation Modal */}
      <Dialog open={showConfirmFinalize} onOpenChange={setShowConfirmFinalize}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <AlertTriangle className="text-emerald-500" />
              Finalizar Novo Ciclo
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Isso salvará a lista atual de pontos, criará o dossiê na linha do tempo, e resetará todos os alunos de volta aos 100 pontos para começar o próximo ciclo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Nome Oficial do Ciclo</Label>
            <Input
              value={newCicloName}
              onChange={(e) => setNewCicloName(e.target.value)}
              placeholder="Exemplo: Fevereiro 2026, 1º Trimestre..."
              className="bg-zinc-900 border-zinc-800 font-bold mt-2 h-12"
            />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmFinalize(false)}>CANCELAR</Button>
            <Button onClick={handleFinalizeMonth} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
              APLICAR REINÍCIO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Cycles Modal */}
      <Dialog open={showGerenciarCiclos} onOpenChange={setShowGerenciarCiclos}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Settings className="text-amber-500" />
              Gerenciar Ciclos
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Visualize, recupere ou delete os encerramentos realizados no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {ciclos.length === 0 && (
              <p className="text-center text-sm text-zinc-500 py-8">Não há nenhum ciclo salvo.</p>
            )}
            {ciclos.map((c, idx) => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white uppercase text-sm">{c.nome}</h4>
                  <p className="text-[10px] tracking-wider font-bold text-zinc-500 uppercase mt-1">Registrado em: {format(new Date(c.data_fechamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                <div className="flex flex-col items-end">
                  {idx === 0 ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevertCiclo(c.id)}
                      disabled={saving}
                      className="h-8 shadow-lg shadow-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reverter
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-zinc-800 text-zinc-600 text-[10px]">Trancado</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowGerenciarCiclos(false)}>FECHAR CONSOLE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
