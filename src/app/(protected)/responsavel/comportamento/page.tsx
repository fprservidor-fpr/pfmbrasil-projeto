"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Medal,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { ClassificationTable } from "@/components/classification-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Comportamento = {
  id: string;
  aluno_id: string;
  tipo: string;
  pontos: number;
  descricao: string;
  created_at: string;
  instrutor_id: string;
};

export default function ResponsavelComportamentoPage() {
  const { profile } = useAuth();
  const [comportamentos, setComportamentos] = useState<Comportamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todos" | "meritos" | "demeritos">("todos");
  const [lastFinalizedDate, setLastFinalizedDate] = useState<Date | null>(null);

  const selectedStudentId = typeof window !== "undefined" ? sessionStorage.getItem("selectedStudentId") : null;

  const [ciclos, setCiclos] = useState<any[]>([]);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("current_cycle");

  useEffect(() => {
    if (selectedStudentId) {
      fetchDadosGerais(selectedStudentId);
    } else {
      setLoading(false);
    }
  }, [selectedStudentId]);

  async function fetchDadosGerais(id: string) {
    try {
      setLoading(true);
      const [compRes, ciclosRes, historyRes] = await Promise.all([
        supabase.from("comportamentos").select("*").eq("aluno_id", id).order("created_at", { ascending: false }),
        supabase.from("comportamento_ciclos").select("*").order("data_fechamento", { ascending: false }),
        supabase.from("behavior_history").select("*").eq("student_id", id).order("created_at", { ascending: false })
      ]);

      if (compRes.error) throw compRes.error;

      setComportamentos(compRes.data || []);
      setCiclos(ciclosRes.data || []);
      setStudentHistory(historyRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados de comportamento:", error);
    } finally {
      setLoading(false);
    }
  }

  const getCycleRegistros = () => {
    let registros = [...comportamentos];

    if (selectedCycle && selectedCycle !== "current_cycle") {
      const targetIndex = ciclos.findIndex(c => c.nome === selectedCycle);
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

  const cycleRegistros = getCycleRegistros();

  const calculateRawScore = () => {
    let rawScore = 100;
    cycleRegistros.forEach(r => {
      const pontos = r.pontos || 0;
      if (r.tipo === "merito") rawScore = Math.min(100, rawScore + pontos);
      else rawScore = Math.max(0, rawScore - pontos);
    });
    return rawScore;
  };

  const rawScore = calculateRawScore();
  const score = selectedCycle === "current_cycle"
    ? rawScore
    : (studentHistory.find(h => h.periodo === selectedCycle)?.pontos_periodo ?? rawScore);

  const stats = {
    meritos: cycleRegistros.filter(c => c.tipo === "merito"),
    demeritos: cycleRegistros.filter(c => c.tipo === "demerito"),
    totalMeritos: cycleRegistros.filter(c => c.tipo === "merito").reduce((acc, c) => acc + (c.pontos || 0), 0),
    totalDemeritos: cycleRegistros.filter(c => c.tipo === "demerito").reduce((acc, c) => acc + (c.pontos || 0), 0),
  };

  const getBehaviorLabel = (s: number) => {
    if (s >= 90) return { label: "Excepcional", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (s >= 75) return { label: "Ótimo", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (s >= 60) return { label: "Bom", color: "text-violet-400", bg: "bg-violet-500/20" };
    if (s >= 40) return { label: "Regular", color: "text-amber-400", bg: "bg-amber-500/20" };
    if (s >= 30) return { label: "Insuficiente", color: "text-red-400", bg: "bg-red-500/20" };
    return { label: "Mau", color: "text-zinc-400", bg: "bg-zinc-500/20" };
  };

  const getBehaviorLabelMapping = (level: string) => {
    const map: any = {
      "EXCEPCIONAL": { label: "Excepcional", color: "text-emerald-400", bg: "bg-emerald-500/20" },
      "ÓTIMO": { label: "Ótimo", color: "text-blue-400", bg: "bg-blue-500/20" },
      "BOM": { label: "Bom", color: "text-violet-400", bg: "bg-violet-500/20" },
      "REGULAR": { label: "Regular", color: "text-amber-400", bg: "bg-amber-500/20" },
      "INSUFICIENTE": { label: "Insuficiente", color: "text-red-400", bg: "bg-red-500/20" },
      "MAU": { label: "Mau", color: "text-zinc-400", bg: "bg-zinc-500/20" }
    };
    return map[level?.toUpperCase()] || getBehaviorLabel(score);
  };

  const behavior = selectedCycle === "current_cycle"
    ? getBehaviorLabel(score)
    : getBehaviorLabelMapping(studentHistory.find(h => h.periodo === selectedCycle)?.nivel_anterior || getBehaviorLabel(score).label);

  const filteredItems = activeTab === "todos"
    ? cycleRegistros
    : cycleRegistros.filter(c => c.tipo === (activeTab === "meritos" ? "merito" : "demerito"));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-black/40"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-slate-950/50 border-4 border-white/10 flex items-center justify-center">
              <span className="text-4xl font-black text-white">{score}</span>
            </div>
            <svg className="absolute inset-0 w-32 h-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 364} 364`}
                className={cn(
                  score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500"
                )}
              />
            </svg>
          </div>

          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {selectedCycle === "current_cycle" ? "Status de Comportamento do Dependente" : `Ciclo: ${selectedCycle}`}
                </p>
                <h2 className={cn("text-3xl font-black", behavior.color)}>{behavior.label}</h2>
              </div>

              <div className="md:ml-auto w-full md:w-auto">
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-full md:w-[220px] bg-slate-900/50 border-white/10 text-white rounded-xl h-10">
                    <SelectValue placeholder="Selecione o Ciclo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white shadow-xl shadow-black/50">
                    <SelectItem value="current_cycle" className="focus:bg-slate-800 focus:text-white cursor-pointer transition-colors">
                      Ciclo Atual (Em Andamento)
                    </SelectItem>
                    {ciclos.map(c => (
                      <SelectItem key={c.id} value={c.nome} className="focus:bg-slate-800 focus:text-white cursor-pointer transition-colors">
                        {c.nome} (Fechado)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-2">Baseado na pontuação {selectedCycle === "current_cycle" ? "mensal" : "do ciclo"} de {score} pontos</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-black text-white">+{stats.totalMeritos}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Méritos</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center shadow-lg shadow-red-500/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xl font-black text-white">-{stats.totalDemeritos}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Deméritos</p>
            </div>
          </div>
        </div>
      </motion.div>

      <ClassificationTable />

      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-white/5">
        {[
          { key: "todos", label: "Histórico", count: cycleRegistros.length },
          { key: "meritos", label: "Méritos", count: stats.meritos.length },
          { key: "demeritos", label: "Deméritos", count: stats.demeritos.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-white/10 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            )}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-slate-900/30 rounded-2xl border border-dashed border-white/5"
          >
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-20" />
            <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
          </motion.div>
        ) : (
          filteredItems.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-slate-900/50 border rounded-2xl p-4 transition-all hover:scale-[1.01] hover:bg-slate-900/80",
                c.tipo === "merito" ? "border-emerald-500/10 hover:border-emerald-500/30" : "border-red-500/10 hover:border-red-500/30"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                  c.tipo === "merito" ? "bg-emerald-500/10" : "bg-red-500/10"
                )}>
                  {c.tipo === "merito" ? (
                    <Medal className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-lg font-black",
                      c.tipo === "merito" ? "text-emerald-400" : "text-red-400"
                    )}>
                      {c.tipo === "merito" ? "+" : "-"}{c.pontos} pts
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                      c.tipo === "merito" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {c.tipo}
                    </span>
                  </div>
                  <p className="text-white text-sm mb-2 font-medium leading-relaxed">{c.descricao || "Sem descrição"}</p>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    {format(parseISO(c.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-700 shrink-0 self-center" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
