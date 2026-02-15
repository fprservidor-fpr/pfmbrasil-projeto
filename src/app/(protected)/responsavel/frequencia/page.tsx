"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Frequencia = {
  id: string;
  aluno_id: string;
  data: string;
  presenca: string;
  created_at: string;
};

export default function AlunoFrequenciaPage() {
  const { profile } = useAuth();
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const studentId = profile?.role === "aluno" ? profile.student_id : (typeof window !== "undefined" ? sessionStorage.getItem("selectedStudentId") : null);

  useEffect(() => {
    if (studentId) {
      fetchFrequencias(studentId);
    } else {
      setLoading(false);
    }
  }, [studentId]);

  async function fetchFrequencias(id: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("frequencias")
        .select("*")
        .eq("aluno_id", id)
        .order("data", { ascending: false });

      if (error) throw error;
      setFrequencias(data || []);
    } catch (error) {
      console.error("Erro ao buscar frequências:", error);
    } finally {
      setLoading(false);
    }
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPresencaForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return frequencias.find(f => f.data === dateStr);
  };

  const stats = {
    presentes: frequencias.filter(f => f.presenca === "presente").length,
    faltas: frequencias.filter(f => f.presenca === "falta").length,
    justificadas: frequencias.filter(f => f.presenca === "justificada").length,
  };

  const total = stats.presentes + stats.faltas + stats.justificadas;
  const percentual = total > 0 ? Math.round((stats.presentes / total) * 100) : 100;

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.presentes}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Presenças</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.faltas}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Faltas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.justificadas}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Justificadas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{percentual}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Frequência</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {days.map((day) => {
            const presenca = getPresencaForDate(day);
            const dayIsToday = isToday(day);
            
            return (
              <motion.div
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all cursor-default",
                  dayIsToday && "ring-2 ring-violet-500",
                  !presenca && "bg-slate-950/30 text-slate-500",
                  presenca?.presenca === "presente" && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                  presenca?.presenca === "falta" && "bg-red-500/20 text-red-400 border border-red-500/30",
                  presenca?.presenca === "justificada" && "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}
              >
                <span>{format(day, "d")}</span>
                {presenca && (
                  <span className="text-[8px] mt-0.5">
                    {presenca.presenca === "presente" && "P"}
                    {presenca.presenca === "falta" && "F"}
                    {presenca.presenca === "justificada" && "J"}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Presente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">Falta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">Justificada</span>
          </div>
        </div>
      </motion.div>

      {frequencias.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Histórico Recente</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {frequencias.slice(0, 10).map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    f.presenca === "presente" && "bg-emerald-500/20",
                    f.presenca === "falta" && "bg-red-500/20",
                    f.presenca === "justificada" && "bg-amber-500/20"
                  )}>
                    {f.presenca === "presente" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {f.presenca === "falta" && <XCircle className="w-4 h-4 text-red-400" />}
                    {f.presenca === "justificada" && <AlertCircle className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {format(parseISO(f.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase px-2 py-1 rounded-lg",
                  f.presenca === "presente" && "bg-emerald-500/10 text-emerald-400",
                  f.presenca === "falta" && "bg-red-500/10 text-red-400",
                  f.presenca === "justificada" && "bg-amber-500/10 text-amber-400"
                )}>
                  {f.presenca}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {frequencias.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5"
        >
          <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum registro de frequência encontrado.</p>
        </motion.div>
      )}
    </div>
  );
}
