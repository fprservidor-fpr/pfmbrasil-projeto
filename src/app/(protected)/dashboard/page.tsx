"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Clock, 
  TrendingUp,
  AlertCircle,
  GraduationCap,
    CalendarDays,
    ClipboardCheck,
    Award,
    ChevronRight,
    Loader2,
    Activity,
    Shield,
    FileText,
    Settings,
    ArrowUpRight,
    Sparkles,
    Target,
    CheckCircle2,
    Megaphone
  } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, simulatedRole } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    activated: 0,
    cancelled: 0,
    totalAlunos: 0,
    totalInstrutores: 0,
    totalTurmas: 0,
    pendingDataRequests: 0,
    pendingDenuncias: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (profile?.role === "aluno") {
      router.push("/aluno/dossie");
      return;
    }

    if (profile?.role === "responsavel") {
      router.push("/responsavel");
      return;
    }

    fetchAllData();
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [profile, simulatedRole]);

  async function fetchAllData() {
    setLoading(true);
    
    // Only show test records when admin is in simulation mode
    const showTestRecords = !!simulatedRole;
    
    let preMatriculasQuery = supabase.from("pre_matriculas").select("status");
    let alunosQuery = supabase.from("students").select("id").eq("status", "ativo");
    let instrutoresQuery = supabase.from("instructors").select("id");
    let comportamentosQuery = supabase.from("comportamentos").select("*, students(nome_guerra, nome_completo)");
    
    if (!showTestRecords) {
      preMatriculasQuery = preMatriculasQuery.eq("is_test", false);
      alunosQuery = alunosQuery.eq("is_test", false);
      instrutoresQuery = instrutoresQuery.eq("is_test", false);
      comportamentosQuery = comportamentosQuery.eq("is_test", false);
    }
    
    const [preMatriculasRes, alunosRes, instrutoresRes, turmasRes, eventosRes, comportamentosRes, dataRequestsRes, denunciasRes] = await Promise.all([
      preMatriculasQuery,
      alunosQuery,
      instrutoresQuery,
      supabase.from("turmas").select("id"),
      supabase.from("calendario_letivo").select("*").gte("data", format(new Date(), "yyyy-MM-dd")).order("data", { ascending: true }).limit(5),
      comportamentosQuery.order("created_at", { ascending: false }).limit(5),
      supabase.from("data_update_requests").select("id").eq("status", "pendente"),
      supabase.from("denuncias").select("id").eq("status", "pendente"),
    ]);

    if (preMatriculasRes.data) {
      const counts = preMatriculasRes.data.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, { total: 0, pendente: 0, efetivada: 0, cancelada: 0 });

      setStats({
        total: counts.total || 0,
        pending: counts.pendente || 0,
        activated: counts.efetivada || 0,
        cancelled: counts.cancelada || 0,
        totalAlunos: alunosRes.data?.length || 0,
        totalInstrutores: instrutoresRes.data?.length || 0,
        totalTurmas: turmasRes.data?.length || 0,
        pendingDataRequests: dataRequestsRes.data?.length || 0,
        pendingDenuncias: denunciasRes.data?.length || 0,
      });
    }

    setUpcomingEvents(eventosRes.data || []);
    setRecentActivities(comportamentosRes.data || []);
    setLoading(false);
  }

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const quickActions = [
    { label: "Pré-Matrículas", href: "/pre-matriculas", icon: UserPlus, color: "from-blue-500 to-blue-700" },
    { label: "Alunos", href: "/alunos", icon: GraduationCap, color: "from-violet-500 to-indigo-700" },
    { label: "Frequência", href: "/frequencia", icon: ClipboardCheck, color: "from-emerald-500 to-emerald-700" },
    { label: "Comportamento", href: "/comportamento", icon: Award, color: "from-amber-500 to-amber-700" },
    { label: "Avisos", href: "/avisos", icon: Megaphone, color: "from-purple-500 to-indigo-700" },
  ];

  const hasAlerts = stats.pendingDataRequests > 0 || stats.pendingDenuncias > 0;

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
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                Sistema de Gestão PFM
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">
              {greeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">{profile?.full_name?.split(" ")[0] || "Comandante"}</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-4xl font-black text-white tracking-tighter">
                {format(currentTime, "HH:mm")}
              </p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Servidor Ativo</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alert Section */}
      <AnimatePresence>
        {hasAlerts && (profile?.role === "admin" || profile?.role === "coord_geral" || profile?.role === "coord_nucleo") && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.pendingDataRequests > 0 && (
                  <Link href="/solicitacoes">
                    <div className="group bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] flex items-center justify-between hover:bg-amber-500/15 transition-all shadow-lg shadow-amber-500/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <ClipboardCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-amber-200 font-black uppercase tracking-tight">Solicitações de Alteração</p>
                        <p className="text-amber-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">
                          {stats.pendingDataRequests} {stats.pendingDataRequests === 1 ? 'pendente' : 'pendentes'} para análise
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingDenuncias > 0 && (
                <Link href="/denuncias">
                  <div className="group bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] flex items-center justify-between hover:bg-red-500/15 transition-all shadow-lg shadow-red-500/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-red-200 font-black uppercase tracking-tight">Gestão de Denúncias</p>
                        <p className="text-red-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">
                          {stats.pendingDenuncias} {stats.pendingDenuncias === 1 ? 'pendente' : 'pendentes'} para análise
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, idx) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <Link href={action.href}>
                <div className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 hover:border-violet-500/50 transition-all shadow-xl active:scale-95">

                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg", action.color)}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{action.label}</h4>
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-violet-400 transition-colors">
                  <span>Acessar Módulo</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Alunos Ativos", value: stats.totalAlunos, icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Turmas", value: stats.totalTurmas, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Instrutores", value: stats.totalInstrutores, icon: Shield, color: "text-violet-400", bg: "bg-violet-400/10" },
          { label: "Pré-Matrículas", value: stats.total, icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
          { label: "Efetivadas", value: stats.activated, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shadow-inner">
                <Activity className="w-6 h-6 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Atividades Recentes</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Comportamento & Méritos</p>
              </div>
            </div>
            <Link href="/comportamento">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest hover:text-white flex items-center gap-1 group transition-colors">
                Ver todos <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
          
          <div className="p-4 divide-y divide-white/5">
            {recentActivities.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium">Nenhum registro encontrado nas últimas 24h.</p>
              </div>
            ) : (
              recentActivities.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="px-4 py-4 hover:bg-white/5 transition-colors rounded-2xl group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                      activity.tipo === "merito" ? "bg-emerald-500/10" : "bg-rose-500/10"
                    )}>
                      {activity.tipo === "merito" ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate group-hover:text-violet-400 transition-colors">
                        {activity.students?.nome_guerra || activity.students?.nome_completo?.split(" ")[0] || "Aluno"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{activity.descricao || "Sem descrição registrada"}</p>
                    </div>
                    <div className={cn(
                      "text-sm font-black tabular-nums",
                      activity.tipo === "merito" ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {activity.tipo === "merito" ? "+" : "-"}{activity.pontos}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                <CalendarDays className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Agenda Letiva</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Próximos Compromissos</p>
              </div>
            </div>
            <Link href="/calendario">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest hover:text-white flex items-center gap-1 group transition-colors">
                Ver todos <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
          
          <div className="p-4 divide-y divide-white/5">
            {upcomingEvents.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium">Nenhum evento agendado para o período.</p>
              </div>
            ) : (
              upcomingEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="px-4 py-4 hover:bg-white/5 transition-colors rounded-2xl group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 min-w-[60px] shadow-lg">
                      <p className="text-lg font-black text-white leading-none">
                        {format(new Date(event.data + "T00:00:00"), "dd")}
                      </p>
                      <p className="text-[9px] font-black text-slate-500 uppercase mt-0.5">
                        {format(new Date(event.data + "T00:00:00"), "MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate group-hover:text-violet-400 transition-colors">{event.descricao}</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{event.tipo}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-violet-600/20 via-indigo-600/10 to-transparent border border-white/10 rounded-[40px] p-10 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-600/20">
              <Target className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-1 uppercase">Sistema PFM Digital 2.0</h3>
              <p className="text-slate-400 font-medium">Versão otimizada com a nova identidade visual premium aplicada em todos os módulos.</p>
            </div>
          </div>
          <Link href="/gestao-sistema">
            <button className="px-8 py-4 bg-white text-black hover:bg-slate-200 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
              <Settings className="w-4 h-4" />
              Gestão Geral
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
