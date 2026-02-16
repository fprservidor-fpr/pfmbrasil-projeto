"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import {
  UserCircle,
  Calendar,
  MapPin,
  Phone,
  Shield,
  Award,
  FileText,
  Star,
  Users,
  Heart,
  Droplets,
  GraduationCap,
  BadgeCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
  Scissors,
  Trophy,
  Target,
  BookOpen,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Student = {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  data_nascimento: string;
  gender: string;
  blood_type: string;
  whatsapp: string;
  address_street: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  guardian1_name: string;
  guardian1_whatsapp: string;
  guardian1_cpf: string;
  guardian1_titulo: string;
  guardian2_name: string;
  guardian2_whatsapp: string;
  guardian2_cpf: string;
  guardian2_titulo: string;
  turma: string;
  graduacao: string;
  comportamento_atual: string;
  status: string;
};

export default function AlunoDossiePage() {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [comportamentos, setComportamentos] = useState<any[]>([]);
  const [frequencias, setFrequencias] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [missoes, setMissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = profile?.role === "aluno" ? profile.student_id : (typeof window !== "undefined" ? sessionStorage.getItem("selectedStudentId") : null);

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

      const [studentRes, behaviorRes, freqRes, eventosRes, calendarRes, missoesRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("comportamentos").select("*").eq("aluno_id", id).order("created_at", { ascending: false }),
        supabase.from("frequencias").select("*").eq("aluno_id", id).eq("presenca", "justificada").order("data", { ascending: false }),
        supabase.from("eventos_notificacoes").select("*").eq("aluno_id", id).eq("lida", false).order("created_at", { ascending: false }).limit(3),
        supabase.from("calendario_letivo").select("*").gte("data", today).order("data", { ascending: true }).limit(10),
        supabase.from("missoes_atividades").select("*, missoes_materiais(study_materials(*))").gte("data_entrega", today).order("data_entrega", { ascending: true })
      ]);

      if (studentRes.error) throw studentRes.error;
      const studentData = studentRes.data;
      setStudent(studentData);
      if (behaviorRes.data) setComportamentos(behaviorRes.data);
      if (freqRes.data) setFrequencias(freqRes.data);
      if (eventosRes.data) setEventos(eventosRes.data);

      // Filter important reminders
      const allEvents = calendarRes.data || [];
      const importantTypes = ["feriado", "reuniao", "corte_cabelo", "campeonato", "provas"];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const urgentReminders = allEvents.filter(e => {
        const isSoon = e.data <= nextWeekStr;
        const isImportant = importantTypes.includes(e.tipo);
        return isSoon || isImportant;
      }).map(e => ({ ...e, category: 'calendario' }));

      const missionReminders = (missoesRes.data || []).filter(m => {
        if (!m.turma_id) return true;
        return m.turma_id === studentData.turma_id || m.turma_id === studentData.turma;
      });

      setMissoes(missionReminders);

      const missionAsReminders = missionReminders.map(m => ({
        ...m,
        data: m.data_entrega,
        descricao: m.titulo,
        tipo: m.tipo,
        category: 'missao'
      }));

      setReminders([...urgentReminders, ...missionAsReminders].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4));

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id: string) => {
    await supabase.from("eventos_notificacoes").update({ lida: true }).eq("id", id);
    setEventos(prev => prev.filter(e => e.id !== id));
  };

  const calculateMonthlyScore = () => {
    if (!student) return 100;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const registros = comportamentos.filter(c =>
      new Date(c.created_at) >= start &&
      new Date(c.created_at) <= end
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let score = 100;
    registros.forEach(r => {
      const pontos = r.pontos || 0;
      if (r.tipo === "merito") {
        score = Math.min(100, score + pontos);
      } else {
        score = Math.max(0, score - pontos);
      }
    });
    return score;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!studentId && (profile?.role === "responsavel" || profile?.role === "guardian")) {
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
            Para visualizar o dossiê individual, selecione um dos alunos vinculados.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white">
            <a href="/selecionar-aluno">Acessar Lista de Alunos</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Dados não encontrados</h2>
        <p className="text-slate-500 mt-2">Os registros deste perfil não foram localizados.</p>
      </div>
    );
  }

  const getGraduacaoLabel = (val: string) => {
    const mapping: Record<string, string> = {
      "ASPIRANTE_MONITOR": "Aspirante a Monitor",
      "2_CMD_PELOTAO": "2º Comandante de Pelotão",
      "1_CMD_PELOTAO": "1º Comandante de Pelotão",
      "CHEFE_TURMA": "Chefe de Turma",
      "2_SENIOR": "2º Sênior",
      "1_SENIOR": "1º Sênior",
      "APRENDIZ": "Aprendiz"
    };
    return mapping[val] || val || "Aprendiz";
  };

  const score = calculateMonthlyScore();
  const meritos = comportamentos.filter(c => c.tipo === 'merito').length;
  const demeritos = comportamentos.filter(c => c.tipo === 'demerito').length;

  const getBehaviorTrend = () => {
    if (score >= 80) return { label: "Tendência de Progressão / Manutenção Alta", color: "text-emerald-400", icon: TrendingUp };
    if (score >= 60) return { label: "Manutenção de Nível", color: "text-blue-400", icon: Minus };
    return { label: "Risco de Regressão Disciplinar", color: "text-red-400", icon: TrendingDown };
  };

  const trend = getBehaviorTrend();
  const TrendIcon = trend.icon;

  const getReminderIcon = (tipo: string) => {
    switch (tipo) {
      case 'feriado': return <Calendar className="w-4 h-4 text-red-400" />;
      case 'reuniao': return <Users className="w-4 h-4 text-purple-400" />;
      case 'corte_cabelo': return <Scissors className="w-4 h-4 text-cyan-400" />;
      case 'campeonato': return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'provas': return <FileText className="w-4 h-4 text-pink-400" />;
      case 'missao': return <Target className="w-4 h-4 text-rose-400" />;
      case 'atividade': return <BookOpen className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {eventos.length > 0 && (
          <div className="space-y-3 mb-6">
            {eventos.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "p-4 rounded-2xl border flex items-center justify-between shadow-lg backdrop-blur-xl",
                  ev.tipo === 'merito' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    ev.tipo === 'demerito' || ev.tipo === 'falta' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      "bg-blue-500/10 border-blue-500/20 text-blue-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    ev.tipo === 'merito' ? "bg-emerald-500/20" :
                      ev.tipo === 'demerito' || ev.tipo === 'falta' ? "bg-red-500/20" : "bg-blue-500/20"
                  )}>
                    {ev.tipo === 'merito' ? <Star className="w-5 h-5" /> :
                      ev.tipo === 'demerito' || ev.tipo === 'falta' ? <AlertTriangle className="w-5 h-5" /> :
                        <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Nova Notificação</p>
                    <p className="text-sm font-bold">{ev.descricao}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(ev.id)}
                  className="hover:bg-white/10"
                >
                  <BadgeCheck className="w-4 h-4 mr-2" /> Entendido
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Lembretes Prioritários */}
      <AnimatePresence>
        {reminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {reminders.map((reminder, idx) => (
              <div
                key={`${reminder.category}-${reminder.id}`}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 group hover:border-violet-500/30 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  {getReminderIcon(reminder.tipo)}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 truncate">
                    {reminder.category === 'missao' ? 'Missão / Atividade' : 'Evento Próximo'}
                  </p>
                  <h4 className="text-white font-bold text-[11px] truncate uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                    {reminder.descricao}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {format(parseISO(reminder.data), "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-2xl shadow-violet-500/30 border-2 border-white/20">
            {student.nome_guerra?.charAt(0) || student.nome_completo?.charAt(0) || "A"}
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
              <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-violet-500/30">
                {getGraduacaoLabel(student.graduacao)}
              </span>
              <span className="px-4 py-1 bg-emerald-500 text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] rounded-full border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                ID MILITAR: {student.matricula_pfm}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-1 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {student.nome_guerra || student.nome_completo.split(" ")[0]}
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">{student.nome_completo}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase">
                <Shield className="w-3.5 h-3.5 text-violet-500" />
                TURMA {student.turma || "A DEFINIR"}
              </span>
              <div className={cn("flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-white/5 border border-white/5", trend.color)}>
                <TrendIcon className="w-3.5 h-3.5" />
                {trend.label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 backdrop-blur p-4 rounded-2xl border border-white/10 text-center min-w-[120px] shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pontos Ciclo</p>
              <p className={cn("text-3xl font-black", trend.color)}>{score}</p>
            </div>
            <div className="bg-slate-950/80 backdrop-blur p-4 rounded-2xl border border-white/10 text-center min-w-[120px] shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Méritos</p>
              <p className="text-3xl font-black text-emerald-400">+{meritos}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Atividades e Missões Section */}
          {missoes.length > 0 && (
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                Atividades & Missões
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missoes.map((missao) => (
                  <div key={missao.id} className="bg-slate-950/50 rounded-xl p-4 border border-white/5 group hover:border-violet-500/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase",
                        missao.tipo === 'missao' ? "border-rose-500/20 text-rose-500 bg-rose-500/5" : "border-blue-500/20 text-blue-500 bg-blue-500/5"
                      )}>
                        {missao.tipo === 'missao' ? 'Missão' : 'Atividade'}
                      </Badge>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{format(parseISO(missao.data_entrega), "dd/MM/yyyy")}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1 uppercase truncate">{missao.titulo}</h3>
                    <p className="text-slate-400 text-[10px] line-clamp-2 mb-3">{missao.descricao}</p>

                    {missao.missoes_materiais && missao.missoes_materiais.filter((mm: any) => mm.study_materials).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                        {missao.missoes_materiais.filter((mm: any) => mm.study_materials).map(({ study_materials: m }: any) => (
                          <a
                            key={m.id}
                            href={m.file_url}
                            target="_blank"
                            className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-black text-violet-400 hover:bg-white/10 transition-colors uppercase flex items-center gap-1"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            Material
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Data de Nascimento</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  {student.data_nascimento ? format(new Date(student.data_nascimento + "T00:00:00"), "dd/MM/yyyy") : "---"}
                </p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Gênero</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Heart className={cn("w-4 h-4", student.gender?.toUpperCase() === 'FEMININO' ? "text-pink-500" : "text-blue-500")} />
                  {student.gender || 'MASCULINO'}
                </p>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo Sanguíneo</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-red-500" />
                  {student.blood_type || "Não informado"}
                </p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">WhatsApp</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  {student.whatsapp || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              Endereço
            </h2>
            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
              <p className="text-white font-semibold mb-1">{student.address_street || "Endereço não informado"}</p>
              <p className="text-slate-400 text-sm">
                {student.address_neighborhood && `${student.address_neighborhood} • `}
                {student.address_city && `${student.address_city}`}
                {student.address_state && ` - ${student.address_state}`}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              Informações Militares
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Graduação</p>
                <p className="text-violet-400 font-bold text-sm">{student.graduacao || "Aprendiz"}</p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Turma</p>
                <p className="text-white font-bold text-sm">{student.turma || "---"}</p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Comportamento</p>
                <p className="text-emerald-400 font-bold text-sm">{student.comportamento_atual || "Excepcional"}</p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</p>
                <p className="text-emerald-400 font-bold text-sm">{student.status || "Ativo"}</p>
              </div>
            </div>
          </div>

          {frequencias.length > 0 && (
            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                </div>
                Justificativas de Frequência
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frequencias.map((f, i) => (
                  <div key={i} className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 group hover:border-amber-500/30 transition-all hover:bg-amber-500/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">DATA DA FALTA</span>
                        <span className="text-base font-black text-white uppercase tracking-tight">
                          {format(new Date(f.data + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 mt-0.5">Ano Letivo {format(new Date(f.data + "T00:00:00"), "yyyy")}</span>
                      </div>
                      <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">JUSTIFICADA</span>
                      </div>
                    </div>
                    <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-4 relative z-10">
                      <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                        <span className="text-amber-500/50 font-black uppercase text-[9px] tracking-widest block mb-2 border-b border-white/5 pb-1">Justificativa Registrada:</span>
                        {f.observacoes || "Sem descrição detalhada disponível."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Responsáveis
            </h2>
            <div className="space-y-4">
              {student.guardian1_name && (
                <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-violet-400 mb-2">Principal</p>
                  <p className="text-white font-semibold text-sm mb-1">{student.guardian1_name}</p>
                  <p className="text-slate-400 text-xs">{student.guardian1_whatsapp || "Sem telefone"}</p>
                  {student.guardian1_cpf && (
                    <p className="text-slate-500 text-[10px] mt-1 font-mono">CPF: {student.guardian1_cpf}</p>
                  )}
                </div>
              )}

              {student.guardian2_name && (
                <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">Secundário</p>
                  <p className="text-white font-semibold text-sm mb-1">{student.guardian2_name}</p>
                  <p className="text-slate-400 text-xs">{student.guardian2_whatsapp || "Sem telefone"}</p>
                  {student.guardian2_cpf && (
                    <p className="text-slate-500 text-[10px] mt-1 font-mono">CPF: {student.guardian2_cpf}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Desempenho
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-xs">Pontuação Mensal</span>
                <span className={cn(
                  "font-bold text-sm",
                  score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"
                )}>{score}/100</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-xs">Méritos Totais</span>
                <span className="font-bold text-emerald-400 text-sm">+{meritos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-xs">Deméritos Totais</span>
                <span className="font-bold text-red-400 text-sm">-{comportamentos.filter(c => c.tipo === 'demerito').length}</span>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <span className="text-slate-400 text-xs block mb-2">Avaliação</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn(
                      "w-4 h-4",
                      i < Math.round(score / 20) ? "text-amber-400 fill-amber-400" : "text-slate-700"
                    )} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
