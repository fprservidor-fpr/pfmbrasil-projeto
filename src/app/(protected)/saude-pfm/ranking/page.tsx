"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, 
  Medal, 
  Target, 
  Activity, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Calendar,
  Users,
  Timer,
  Zap,
  TrendingUp,
  Flame
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRADUACOES_LABELS: Record<string, string> = {
  "ASPIRANTE_MONITOR": "Aspirante a Monitor",
  "2_CMD_PELOTAO": "2º Comandante de Pelotão",
  "1_CMD_PELOTAO": "1º Comandante de Pelotão",
  "CHEFE_TURMA": "Chefe de Turma",
  "2_SENIOR": "2º Sênior",
  "1_SENIOR": "1º Sênior",
  "APRENDIZ": "Aprendiz"
};

export default function TafRankingPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [rankingData, setRankingData] = useState<any[]>([]);

  const isInstructor = ["admin", "coord_geral", "coord_nucleo", "instrutor"].includes(profile?.role || "");

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const startOfYear = `${selectedYear}-01-01T00:00:00Z`;
      const endOfYear = `${selectedYear}-12-31T23:59:59Z`;

      const { data, error } = await supabase
        .from("student_health_records")
        .select(`
          taf_run_12min,
          taf_jumping_jacks,
          taf_push_ups,
          taf_sit_ups,
          created_at,
          students (
            nome_guerra,
            nome_completo,
            graduacao,
            turmas (
              nome
            )
          )
        `)
        .gte("created_at", startOfYear)
        .lte("created_at", endOfYear);

      if (error) throw error;

      // Group by Turma (Pelotão)
      const groups: { [key: string]: any } = {};

      data?.forEach((record: any) => {
        const turmaName = record.students?.turmas?.nome || "Sem Pelotão";
        if (!groups[turmaName]) {
          groups[turmaName] = {
            name: turmaName,
            bestRun: { value: 0, student: null },
            bestJacks: { value: 0, student: null },
            bestPushups: { value: 0, student: null },
            bestSitups: { value: 0, student: null }
          };
        }

        const group = groups[turmaName];

        if (record.taf_run_12min > group.bestRun.value) {
          group.bestRun = { value: record.taf_run_12min, student: record.students };
        }
        if (record.taf_jumping_jacks > group.bestJacks.value) {
          group.bestJacks = { value: record.taf_jumping_jacks, student: record.students };
        }
        if (record.taf_push_ups > group.bestPushups.value) {
          group.bestPushups = { value: record.taf_push_ups, student: record.students };
        }
        if (record.taf_sit_ups > group.bestSitups.value) {
          group.bestSitups = { value: record.taf_sit_ups, student: record.students };
        }
      });

      setRankingData(Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error: any) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [selectedYear]);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/saude-pfm">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-3">
              Ranking TAF
              <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Os Melhores Desempenhos Físicos por Pelotão
            </p>
          </div>
        </div>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white rounded-2xl h-11 text-xs font-bold uppercase tracking-widest">
            <Calendar className="w-4 h-4 mr-2 text-rose-500" />
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            {years.map(year => (
              <SelectItem key={year} value={year} className="text-xs font-bold uppercase tracking-widest">{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : rankingData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed text-center">
          <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Sem registros para {selectedYear}</h2>
          <p className="text-zinc-500 max-w-sm uppercase text-[10px] font-bold tracking-widest">Ainda não há avaliações de TAF registradas neste ano.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {rankingData.map((group, idx) => (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-yellow-500/20 transition-all shadow-2xl">
                  <CardHeader className="p-8 bg-zinc-950/50 border-b border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <TrendingUp className="w-32 h-32 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-1">PELOTÃO</p>
                        <CardTitle className="text-3xl font-black text-white uppercase tracking-tighter">{group.name}</CardTitle>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Users className="w-7 h-7 text-yellow-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RankingItem 
                      icon={Timer} 
                      label="Corrida 12min" 
                      value={`${group.bestRun.value}m`} 
                      student={group.bestRun.student}
                      color="text-blue-500"
                      bg="bg-blue-500/10"
                    />
                    <RankingItem 
                      icon={Zap} 
                      label="Polichinelo" 
                      value={group.bestJacks.value} 
                      student={group.bestJacks.student}
                      color="text-amber-500"
                      bg="bg-amber-500/10"
                    />
                    <RankingItem 
                      icon={Flame} 
                      label="Flexão" 
                      value={group.bestPushups.value} 
                      student={group.bestPushups.student}
                      color="text-rose-500"
                      bg="bg-rose-500/10"
                    />
                    <RankingItem 
                      icon={Target} 
                      label="Abdominal" 
                      value={group.bestSitups.value} 
                      student={group.bestSitups.student}
                      color="text-emerald-500"
                      bg="bg-emerald-500/10"
                    />
                  </CardContent>
                  <div className="px-8 py-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ano Base: {selectedYear}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <Medal key={i} className={cn("w-3.5 h-3.5", i === 1 ? "text-yellow-500" : i === 2 ? "text-zinc-400" : "text-amber-700")} />
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function RankingItem({ icon: Icon, label, value, student, color, bg }: any) {
  if (!student) return (
    <div className="p-5 bg-zinc-950 rounded-3xl border border-zinc-800 flex items-center gap-4 opacity-50 grayscale">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
        <Icon className="w-6 h-6 text-zinc-700" />
      </div>
      <div>
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-zinc-700 uppercase">Sem Registro</p>
      </div>
    </div>
  );

  return (
    <div className="p-5 bg-zinc-950 rounded-[2rem] border border-zinc-800 flex items-center gap-4 group/item hover:border-zinc-700 transition-colors">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5", bg)}>
        <Icon className={cn("w-7 h-7", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
          <span className={cn("text-base font-black tracking-tighter", color)}>{value}</span>
        </div>
        <p className="text-sm font-black text-white uppercase tracking-tight truncate">
          {student.nome_guerra || student.nome_completo?.split(' ')[0]}
        </p>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            {GRADUACOES_LABELS[student.graduacao] || student.graduacao?.replace('_', ' ')}
          </p>
      </div>
    </div>
  );
}
