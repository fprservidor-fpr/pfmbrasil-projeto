"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ChevronRight,
  Shield,
  Search,
  GraduationCap,
  Sparkles,
  Loader2,
  Calendar,
  Bell,
  Scissors,
  Trophy,
  FileText,
  Target,
  BookOpen,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

type Student = {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  turma: string;
  graduacao: string;
};

export default function ResponsavelPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (profile?.cpf || profile?.student_id) {
      fetchData(profile?.cpf || "");
    } else {
      setLoading(false);
    }
  }, [profile]);

  async function fetchData(cpf: string) {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = addDays(new Date(), 7).toISOString().split('T')[0];

      // Build conditions array
      let conditions = [];

      // Add CPF conditions if provided
      if (cpf && cpf.replace(/\D/g, '').length > 0) {
        const normalizedCpf = cpf.replace(/\D/g, '').padStart(11, '0');
        const formattedCpf = normalizedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

        conditions.push(
          `guardian1_cpf.eq.${normalizedCpf}`,
          `guardian2_cpf.eq.${normalizedCpf}`,
          `responsavel_cpf.eq.${normalizedCpf}`,
          `guardian1_cpf.eq.${formattedCpf}`,
          `guardian2_cpf.eq.${formattedCpf}`,
          `responsavel_cpf.eq.${formattedCpf}`
        );
      }

      // If profile has a direct student_id link, add it to the search
      if (profile?.student_id) {
        conditions.push(`id.eq.${profile.student_id}`);
      }

      // If no conditions, just stop here
      if (conditions.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const orConditions = conditions.join(',');

      const [studentsRes, eventsRes, missoesRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, nome_completo, nome_guerra, matricula_pfm, turma, turma_id, graduacao, status")
          .or(orConditions)
          .eq("status", "ativo"),
        supabase.from("calendario_letivo").select("*").eq("visivel_responsavel", true).gte("data", today).order("data", { ascending: true }),
        supabase.from("missoes_atividades").select("*").gte("data_entrega", today).order("data_entrega", { ascending: true })
      ]);

      if (studentsRes.error) throw studentsRes.error;
      setStudents(studentsRes.data || []);

      // Filter important reminders
      const allEvents = eventsRes.data || [];
      const importantTypes = ["feriado", "reuniao", "corte_cabelo", "campeonato", "provas"];

      const urgentReminders = allEvents.filter(e => {
        const isSoon = isBefore(parseISO(e.data), parseISO(nextWeek));
        const isImportant = importantTypes.includes(e.tipo);
        return isSoon || isImportant;
      }).map(e => ({
        ...e,
        category: 'calendario'
      }));

      const studentTurmaIds = (studentsRes.data || []).map(s => s.turma_id);
      const missionReminders = (missoesRes.data || []).filter(m => {
        if (!m.turma_id) return true;
        return studentTurmaIds.includes(m.turma_id);
      }).map(m => ({
        ...m,
        data: m.data_entrega,
        descricao: m.titulo,
        tipo: m.tipo,
        category: 'missao'
      }));

      setReminders([...urgentReminders, ...missionReminders].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar informações.");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectStudent = (studentId: string) => {
    sessionStorage.setItem("selectedStudentId", studentId);
    toast.success("Aluno selecionado com sucesso!");
    router.push("/responsavel/inicio");
  };

  const getReminderIcon = (tipo: string) => {
    switch (tipo) {
      case 'feriado': return <Calendar className="w-5 h-5 text-red-400" />;
      case 'reuniao': return <Users className="w-5 h-5 text-purple-400" />;
      case 'corte_cabelo': return <Scissors className="w-5 h-5 text-cyan-400" />;
      case 'campeonato': return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'provas': return <FileText className="w-5 h-5 text-pink-400" />;
      case 'missao': return <Target className="w-5 h-5 text-rose-400" />;
      case 'atividade': return <BookOpen className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-violet-400" />;
    }
  };

  const filteredStudents = students.filter(s =>
    s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-violet-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 md:p-12 rounded-[40px] bg-slate-900/40 backdrop-blur-3xl border border-white/5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
              <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                  Portal do Responsável
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Dependente <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">PFM</span></h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Olá, acompanhe o desempenho de seus filhos abaixo.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reminders / Alerts Section */}
      <AnimatePresence>
        {reminders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Lembretes Prioritários</h2>
            </div>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {reminders.map((reminder, idx) => (
                <motion.div
                  key={`${reminder.category}-${reminder.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex items-center gap-4 group hover:border-violet-500/30 transition-all cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    {getReminderIcon(reminder.tipo)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">
                      {reminder.category === 'missao' ? 'Missão / Atividade' : 'Aviso Geral'}
                    </p>
                    <h4 className="text-white font-bold text-xs truncate uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                      {reminder.descricao}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {format(parseISO(reminder.data), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-2xl"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <Input
          placeholder="Buscar dependente pelo nome..."
          className="pl-12 bg-slate-900/40 backdrop-blur-xl border-white/5 text-white h-14 rounded-2xl focus:ring-violet-500/20 placeholder:text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>

      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student, idx) => (
            <motion.button
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => handleSelectStudent(student.id)}
              className="group text-left bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] hover:border-violet-500/50 transition-all shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />

              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-all duration-300">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-violet-400 transition-colors mb-1 uppercase tracking-tighter">
                {student.nome_guerra}
              </h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                ID MILITAR: <span className="text-emerald-500">{student.matricula_pfm}</span>
              </p>
              <p className="text-slate-400 text-xs font-medium truncate mb-6 border-t border-white/5 pt-4">
                {student.nome_completo}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  {student.turma}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/10">
                  {student.graduacao || "Aprendiz"}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-24 bg-slate-900/20 rounded-[40px] border border-dashed border-white/5"
        >
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Shield className="w-10 h-10 text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Nenhum aluno vinculado</h3>
          <p className="text-slate-500 text-sm font-medium">
            Não encontramos dependentes vinculados ao CPF: <span className="text-violet-400">{profile?.cpf || "Não informado"}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
