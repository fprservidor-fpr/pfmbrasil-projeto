"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Calendar,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Activity,
  User,
  GraduationCap,
  Bell,
  Target,
  Scissors,
  Users,
  Trophy,
  FileText,
  Download,
  ExternalLink,
  LogOut,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const StatCard = memo(({ title, value, icon: Icon, color, description }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group"
  >
    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20", `bg-${color}-500`)} />
    <div className="flex items-start justify-between relative z-10">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", `bg-${color}-500/10`)}>
        <Icon className={cn("w-6 h-6", `text-${color}-500`)} />
      </div>
    </div>
    <div className="mt-4 relative z-10">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-3xl font-black text-white mt-1">{value}</h3>
      <p className="text-slate-400 text-xs mt-2 font-medium">{description}</p>
    </div>
  </motion.div>
));
StatCard.displayName = "StatCard";

export default function ResponsavelInicioPage() {
  const { profile, signOut } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [comportamentos, setComportamentos] = useState<any[]>([]);
  const [activeMissoes, setActiveMissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = typeof window !== "undefined" ? sessionStorage.getItem("selectedStudentId") : null;

  useEffect(() => {
    if (studentId) {
      fetchData(studentId);
    } else {
      setLoading(false);
    }
  }, [studentId]);

  async function fetchData(id: string) {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = addDays(new Date(), 7).toISOString().split('T')[0];

      const [studentRes, eventsRes, behaviorRes, missoesRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("calendario_letivo").select("*").eq("visivel_responsavel", true).gte("data", today).order("data", { ascending: true }),
        supabase.from("comportamentos").select("*").eq("aluno_id", id).order("created_at", { ascending: false }),
        supabase.from("missoes_atividades").select("*, missoes_materiais(material:study_materials(*))").gte("data_entrega", today).order("data_entrega", { ascending: true })
      ]);

      if (studentRes.data) {
        setStudent(studentRes.data);

        const filteredMissoes = (missoesRes.data || []).filter(m => {
          if (!m.turma_id) return true;
          if (m.turma_id === studentRes.data.turma_id) return true;
          if (studentRes.data.turma && m.turma_id === studentRes.data.turma) return true;
          return false;
        });

        setActiveMissoes(filteredMissoes);

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

        const missionReminders = filteredMissoes.map(m => ({
          ...m,
          data: m.data_entrega,
          descricao: m.titulo,
          tipo: m.tipo,
          category: 'missao'
        }));

        setReminders([...urgentReminders, ...missionReminders].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4));
        setNextEvents(allEvents.slice(0, 3));
      }

      if (behaviorRes.data) setComportamentos(behaviorRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const score = useMemo(() => {
    if (!comportamentos.length) return 100;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const registros = comportamentos.filter(c => new Date(c.created_at) >= start);

    let currentScore = 100;
    registros.forEach(r => {
      const pontos = r.pontos || 0;
      if (r.tipo === "merito") currentScore = Math.min(100, currentScore + pontos);
      else currentScore = Math.max(0, currentScore - pontos);
    });
    return currentScore;
  }, [comportamentos]);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full"
      />
    </div>
  );

  if (!studentId) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-slate-700/50 p-12 rounded-3xl max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-violet-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Selecione um Aluno</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Para visualizar o resumo individual, selecione um dos alunos vinculados.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white">
            <a href="/responsavel">Voltar para Seleção</a>
          </Button>
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

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-violet-500 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl relative">
              {student?.nome_completo?.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 border-4 border-slate-950 rounded-2xl flex items-center justify-center shadow-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
              <span className="px-4 py-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20 backdrop-blur-md">
                {student?.graduacao || "Aprendiz"}
              </span>
              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 backdrop-blur-md">
                Dependente Ativo
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 uppercase">
              {student?.nome_guerra || student?.nome_completo?.split(" ")[0]}
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
              Acompanhe o resumo operacional e pedagógico do seu dependente.
            </p>
          </div>

          <Button asChild variant="outline" className="border-white/10 text-slate-400 hover:text-white rounded-2xl h-12 px-6">
            <Link href="/responsavel">Alterar Aluno</Link>
          </Button>
        </div>
      </motion.div>

      {/* Reminders / Alerts Section */}
      <AnimatePresence>
        {reminders.length > 0 && (
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
                    {reminder.category === 'missao' ? 'Missão / Atividade' : 'Lembrete Operacional'}
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
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pontuação Mensal"
          value={score}
          icon={Activity}
          color="violet"
          description="Desempenho no ciclo atual"
        />
        <StatCard
          title="Méritos"
          value={comportamentos.filter(c => c.tipo === "merito").length}
          icon={Award}
          color="emerald"
          description="Ações exemplares"
        />
        <StatCard
          title="Deméritos"
          value={comportamentos.filter(c => c.tipo === "demerito").length}
          icon={AlertCircle}
          color="rose"
          description="Pontos de atenção"
        />
        <StatCard
          title="Status"
          value={student?.graduacao?.split(" ")[0] || "Aprendiz"}
          icon={GraduationCap}
          color="amber"
          description="Patente atual"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Missões Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-rose-500" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Atividades e Missões</h2>
              </div>
              <Link href="/responsavel/materiais" className="text-xs font-black text-rose-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
                Ver tudo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {activeMissoes.length === 0 ? (
                <div className="py-10 text-center text-slate-500 font-medium">Nenhuma atividade agendada.</div>
              ) : (
                activeMissoes.slice(0, 3).map((missao, idx) => (
                  <motion.div
                    key={missao.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-rose-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest",
                              missao.tipo === "missao" ? "bg-rose-500 text-white" : "bg-blue-500 text-white"
                            )}>
                              {missao.tipo === "missao" ? "Missão" : "Atividade"}
                            </span>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                              Prazo: {format(parseISO(missao.data_entrega), "dd MMM", { locale: ptBR })}
                            </span>
                          </div>
                          <h4 className="text-white font-black uppercase tracking-tight group-hover:text-rose-400 transition-colors truncate">
                            {missao.titulo}
                          </h4>
                          <p className="text-slate-500 text-xs mt-1 font-medium line-clamp-1">
                            {missao.descricao}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {missao.missoes_materiais?.filter((mm: any) => mm.material).slice(0, 1).map((mm: any) => (
                            <Button
                              key={mm.material.id}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              onClick={() => window.open(mm.material.file_url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          ))}
                          <Link href="/responsavel/materiais">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Calendário Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Calendário Escolar</h2>
              </div>
              <Link href="/calendario" className="text-xs font-black text-violet-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group">
                Ver tudo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {nextEvents.length === 0 ? (
                <div className="py-10 text-center text-slate-500 font-medium">Nenhum evento agendado.</div>
              ) : (
                nextEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-6 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-black text-white leading-none">{format(parseISO(event.data), "dd")}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{format(parseISO(event.data), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold group-hover:text-violet-400 transition-colors">{event.descricao}</h4>
                      <p className="text-slate-500 text-xs mt-1 font-medium flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(event.data), "EEEE", { locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-violet-900/20 group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ffffff20_0%,transparent_70%)]" />
            <h3 className="text-lg font-black uppercase tracking-widest relative z-10">Acesso Rápido</h3>

            <div className="grid grid-cols-1 gap-3 mt-8 relative z-10">
              <Link href="/cepfm2026" className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 transition-all group/link border border-yellow-500/20 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">CEPFM 2026</span>
                <ChevronRight className="w-4 h-4 ml-auto group-hover/link:translate-x-1 transition-transform" />
              </Link>
              <Link href="/responsavel/materiais" className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group/link border border-white/10">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Materiais de Estudo</span>
                <ChevronRight className="w-4 h-4 ml-auto group-hover/link:translate-x-1 transition-transform" />
              </Link>
              <Link href="/responsavel/dossie" className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all group/link border border-white/10">
                <User className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Dossiê Detalhado</span>
                <ChevronRight className="w-4 h-4 ml-auto group-hover/link:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 transition-all group/link border border-rose-500/20 text-rose-400 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Sair da Conta</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
