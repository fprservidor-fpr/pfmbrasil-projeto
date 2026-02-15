"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Calendar, 
  PenTool, 
  X,
  Eye,
  Trash2,
  Lock,
  Unlock,
  Printer,
  Loader2,
  ShieldCheck,
  Star,
  FileSignature,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, eachMonthOfInterval, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";


interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  comportamento_atual: string;
  guardian1_name: string;
  guardian1_cpf: string;
  guardian1_titulo: string;
  guardian2_name: string;
  guardian2_cpf: string;
  guardian2_titulo: string;
}

interface FamilyGroup {
  id: string;
  guardian1: { name: string; cpf: string; titulo: string };
  guardian2?: { name: string; cpf: string; titulo: string };
  students: Student[];
  signed: boolean;
  signatureUrl?: string;
  signedByCpf?: string;
  signedByName?: string;
}

interface Event {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
}

interface Fechamento {
  id: string;
  mes_ano: string;
  fechado_em: string;
  fechado_por: string;
  observacoes: string;
  profiles?: { full_name: string };
}

interface AssinaturaCadastrada {
  id: string;
  cpf: string;
  nome_completo: string;
  assinatura_url: string;
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export default function ReuniaoPaisPage() {
  const { simulatedRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [availableMonths, setAvailableMonths] = useState<Date[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [monthClosed, setMonthClosed] = useState(false);
  const [fechamentoData, setFechamentoData] = useState<Fechamento | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closingMonth, setClosingMonth] = useState(false);
  
  const [showConfirmPresence, setShowConfirmPresence] = useState<FamilyGroup | null>(null);
  const [loadingAssinatura, setLoadingAssinatura] = useState(false);
  const [assinaturasCadastradas, setAssinaturasCadastradas] = useState<AssinaturaCadastrada[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<{ name: string; cpf: string; titulo: string } | null>(null);
  const [deletingPresence, setDeletingPresence] = useState<FamilyGroup | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkUserRole();
      await fetchConfigAndMonths();
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchEvents();
      checkMonthClosed();
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedEvent) {
      fetchStudentsAndPresence();
    }
  }, [selectedEvent]);

    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setIsAdmin(["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || ""));
      }
    };

  const checkMonthClosed = async () => {
    const { data } = await supabase
      .from("reunioes_fechamento")
      .select("*, profiles(full_name)")
      .eq("mes_ano", selectedMonth)
      .single();
    
    setMonthClosed(!!data);
    setFechamentoData(data);
  };

  const fetchConfigAndMonths = async () => {
    const { data: config } = await supabase
      .from("configuracoes_sistema")
      .select("*")
      .single();

    if (config?.data_inicio_letivo && config?.data_fim_letivo) {
      const start = new Date(config.data_inicio_letivo + "T00:00:00");
      const end = new Date(config.data_fim_letivo + "T00:00:00");
      
      const months = eachMonthOfInterval({ start, end });
      setAvailableMonths(months);

      const now = new Date();
      if (now >= start && now <= end) {
        setSelectedMonth(format(now, "yyyy-MM"));
      } else {
        setSelectedMonth(format(start, "yyyy-MM"));
      }
    }
  };

  const fetchEvents = async () => {
    const [year, month] = selectedMonth.split("-");
    const startDate = `${selectedMonth}-01`;
    const endDate = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), "yyyy-MM-dd");

    const { data } = await supabase
      .from("calendario_letivo")
      .select("*")
      .eq("tipo", "reuniao")
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: false });
    
    if (data && data.length > 0) {
      setEvents(data);
      setSelectedEvent(data[0]);
    } else {
      setEvents([]);
      setSelectedEvent(null);
      setLoading(false);
    }
  };

  const fetchStudentsAndPresence = async () => {
    setLoading(true);
    try {
      const showTestRecords = !!simulatedRole;
      
      let studentsQuery = supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, matricula_pfm, comportamento_atual, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
        .eq("status", "ativo");
        
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }

      const { data: studentsData } = await studentsQuery;

      const { data: presenceData } = await supabase
        .from("reunioes_presenca")
        .select("*")
        .eq("evento_id", selectedEvent?.id);

      if (studentsData) {
        const familyGroupsMap = new Map<string, FamilyGroup>();

        studentsData.forEach((student: Student) => {
          const cpfs = [student.guardian1_cpf, student.guardian2_cpf].filter(Boolean).sort();
          const familyKey = cpfs.join(":") || `sem-responsavel-${student.id}`;
          
          if (!familyGroupsMap.has(familyKey)) {
            familyGroupsMap.set(familyKey, {
              id: familyKey,
              guardian1: { 
                name: student.guardian1_name || "NÃO INFORMADO", 
                cpf: student.guardian1_cpf || "", 
                titulo: student.guardian1_titulo || "Responsável" 
              },
              guardian2: student.guardian2_cpf ? { 
                name: student.guardian2_name, 
                cpf: student.guardian2_cpf, 
                titulo: student.guardian2_titulo || "Responsável" 
              } : undefined,
              students: [],
              signed: false
            });
          }
          familyGroupsMap.get(familyKey)!.students.push(student);
        });

        familyGroupsMap.forEach((group, key) => {
          const cpfs = key.split(":").filter(c => !c.startsWith("sem-responsavel") && c !== "");
          const presence = presenceData?.find(p => cpfs.includes(p.guardian_cpf) || p.guardian_cpf === `AUSENTE_${group.students[0].id}`);
          if (presence) {
            group.signed = presence.present;
            group.signatureUrl = presence.signature_url;
            group.signedByCpf = presence.guardian_cpf;
            group.signedByName = presence.guardian_name;
          }
        });

        const sortMatricula = (a: string, b: string) => {
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          const [numA, yearA] = a.split("/").map(Number);
          const [numB, yearB] = b.split("/").map(Number);
          if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
          return (numA || 0) - (numB || 0);
        };

        const getMinMatricula = (group: FamilyGroup) => {
          return group.students.reduce((min, student) => {
            const current = student.matricula_pfm || "";
            if (!min) return current;
            return sortMatricula(current, min) < 0 ? current : min;
          }, "");
        };

        setGroups(Array.from(familyGroupsMap.values()).sort((a, b) => {
          if (a.guardian1.name === "RESPONSÁVEL AUSENTE") return 1;
          if (b.guardian1.name === "RESPONSÁVEL AUSENTE") return -1;
          const matA = getMinMatricula(a);
          const matB = getMinMatricula(b);
          return sortMatricula(matA, matB);
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresenceClick = async (group: FamilyGroup) => {
    if (monthClosed && !isAdmin) {
      toast.error("Este mês está fechado.");
      return;
    }

    setLoadingAssinatura(true);
    setShowConfirmPresence(group);
    setSelectedGuardian(group.guardian2 ? null : group.guardian1);
    setAssinaturasCadastradas([]);

    try {
      const cpfsToCheck = [group.guardian1.cpf, group.guardian2?.cpf]
        .filter(Boolean)
        .map(cpf => cpf!.replace(/\D/g, ""))
        .filter(cpf => cpf.length > 0);
      
      if (cpfsToCheck.length > 0) {
        const res = await fetch(`/api/assinatura?cpfs=${cpfsToCheck.join(",")}`);
        const { data } = await res.json();
        if (data && data.length > 0) {
          setAssinaturasCadastradas(data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAssinatura(false);
    }
  };

  const handleConfirmPresence = async () => {
    const guardian = selectedGuardian || showConfirmPresence?.guardian1;
    if (!showConfirmPresence || !selectedEvent || !guardian) return;

    const foundAssinatura = assinaturasCadastradas.find(a => a.cpf.replace(/\D/g, "") === guardian.cpf.replace(/\D/g, ""));
    
    if (!foundAssinatura) {
      toast.error("Responsável não possui autorização de assinatura eletrônica. Cadastre o termo físico primeiro.");
      return;
    }

    setIsSaving(true);
    try {
      const signingCpf = guardian.cpf;
      const signingName = guardian.name;

      const { error: dbError } = await supabase
        .from("reunioes_presenca")
        .upsert({
          evento_id: selectedEvent.id,
          guardian_cpf: signingCpf,
          guardian_name: signingName,
          student_ids: showConfirmPresence.students.map(s => s.id),
          signature_url: "FISICO", // Indicates electronic signature methodology
          present: true
        });

      if (dbError) throw dbError;

      toast.success(`Presença de ${signingName} confirmada!`);
      fetchStudentsAndPresence();
      setShowConfirmPresence(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar presença.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePresence = async () => {
    if (!deletingPresence || !selectedEvent) return;
    
    if (monthClosed && !isAdmin) {
      toast.error("Este mês está fechado.");
      setDeletingPresence(null);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("reunioes_presenca")
        .delete()
        .eq("evento_id", selectedEvent.id)
        .eq("guardian_cpf", deletingPresence.signedByCpf);

      if (error) throw error;

      toast.success(`Registro de presença removido.`);
      fetchStudentsAndPresence();
      setDeletingPresence(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!currentUserId) return;
    setClosingMonth(true);

    try {
      const { data: presenceData } = await supabase
        .from("reunioes_presenca")
        .select("student_ids")
        .in("evento_id", events.map(e => e.id))
        .eq("present", true);

      const signedStudentIds = new Set<string>();
      presenceData?.forEach(p => {
        p.student_ids?.forEach((sid: string) => signedStudentIds.add(sid));
      });

      const { data: allStudents } = await supabase
        .from("students")
        .select("id, nome_completo, nome_guerra")
        .eq("status", "ativo");

      const absentStudents = allStudents?.filter(s => !signedStudentIds.has(s.id)) || [];
      const [year, month] = selectedMonth.split("-");
      const monthName = format(new Date(parseInt(year), parseInt(month) - 1), "MMMM/yyyy", { locale: ptBR });

      for (const student of absentStudents) {
        await supabase.from("comportamentos").insert({
          aluno_id: student.id,
          tipo: "demerito",
          pontos: 100,
          descricao: `Falta do responsável na reunião de pais - ${monthName}.`,
          instrutor_id: currentUserId
        });

        for (const event of events) {
          await supabase.from("reunioes_presenca").upsert({
            evento_id: event.id,
            guardian_cpf: `AUSENTE_${student.id}`,
            guardian_name: "RESPONSÁVEL AUSENTE",
            student_ids: [student.id],
            present: false,
            falta_registrada: true
          }, { onConflict: "evento_id,guardian_cpf", ignoreDuplicates: true });
        }
      }

      await supabase
        .from("reunioes_fechamento")
        .insert({
          mes_ano: selectedMonth,
          fechado_por: currentUserId,
          observacoes: `Fechamento automático 2026.`
        });

      toast.success(`Mês fechado com sucesso!`);
      setShowCloseConfirm(false);
      checkMonthClosed();
      fetchStudentsAndPresence();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fechar o mês.");
    } finally {
      setClosingMonth(false);
    }
  };

  const handleReopenMonth = async () => {
    if (!isAdmin) return;
    try {
      const { error } = await supabase
        .from("reunioes_fechamento")
        .delete()
        .eq("mes_ano", selectedMonth);
      if (error) throw error;
      toast.success("Mês reaberto!");
      checkMonthClosed();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao reabrir.");
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.guardian1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.guardian1.cpf.includes(searchTerm) ||
      g.guardian2?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.guardian2?.cpf.includes(searchTerm) ||
      g.students.some(s => 
        s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.matricula_pfm.includes(searchTerm)
      )
    );
  }, [groups, searchTerm]);

  const canEdit = !monthClosed || isAdmin;

  return (
    <div className="space-y-6 min-h-full relative pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="no-print space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-400/10 rounded-2xl flex items-center justify-center border border-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Calendar className="text-blue-400 w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Reunião de Pais</h1>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                  PFM SYSTEM • ATA DIGITAL 2026
                </div>
              </div>
            </div>
              <div className="flex gap-4">
                <Link href={`/reuniao-pais/imprimir?month=${selectedMonth}&eventId=${selectedEvent?.id || ""}`}>
                  <Button 
                    className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Printer className="w-4 h-4 mr-3 text-blue-500" />
                    Imprimir Ata
                  </Button>
                </Link>

            {!monthClosed && (
              <Button
                onClick={() => setShowCloseConfirm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-black h-12 px-8 rounded-2xl shadow-xl shadow-red-600/20 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest"
              >
                <Lock className="w-4 h-4 mr-3" />
                Fechar Mês
              </Button>
            )}
          </div>
        </div>

        {monthClosed && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-[2rem] border backdrop-blur-xl flex items-center justify-between gap-6 shadow-2xl",
              isAdmin ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", isAdmin ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className={cn("font-black uppercase text-sm tracking-tighter", isAdmin ? "text-amber-500" : "text-red-500")}>Ciclo de Reuniões Encerrado</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Fechado em {fechamentoData?.fechado_em && format(new Date(fechamentoData.fechado_em), "dd/MM/yyyy")}</div>
              </div>
            </div>
            {isAdmin && (
              <Button onClick={handleReopenMonth} variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-black uppercase text-[10px] rounded-xl h-10 px-5">
                <Unlock className="w-4 h-4 mr-2" />
                Reabrir Ciclo
              </Button>
            )}
          </motion.div>
        )}

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-400/10 transition-colors duration-500" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-3 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Mês</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 h-14 text-sm font-bold focus:ring-2 focus:ring-blue-400/20 outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {availableMonths.map(month => (
                  <option key={format(month, "yyyy-MM")} value={format(month, "yyyy-MM")}>
                    {format(month, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Evento / Reunião</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 h-14 text-sm font-bold focus:ring-2 focus:ring-blue-400/20 outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all disabled:opacity-50"
                value={selectedEvent?.id || ""}
                onChange={(e) => setSelectedEvent(events.find(ev => ev.id === e.target.value) || null)}
                disabled={events.length === 0}
              >
                {events.length === 0 ? (
                  <option value="">Nenhum evento este mês</option>
                ) : (
                  events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {format(new Date(ev.data + "T00:00:00"), "dd/MM")} - {ev.descricao.toUpperCase()}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="md:col-span-5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Filtrar Participantes</label>
              <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within/search:text-blue-400 transition-colors" />
                <Input 
                  placeholder="Responsável, CPF ou Matrícula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-zinc-950 border-zinc-800 text-white h-14 rounded-2xl focus:ring-blue-400/20 text-sm font-medium shadow-inner transition-all hover:border-zinc-700 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] shadow-2xl overflow-hidden no-print">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Alunos</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Responsáveis</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Status / Assinatura</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando registros...</div>
                        </td>
                      </tr>
                    ) : filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-50" />
                          <div className="text-zinc-500 font-black uppercase tracking-widest text-xs">Nenhum registro encontrado</div>
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((group, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              {group.students.map((student, sidx) => (
                                <div key={sidx} className="flex items-center gap-2">
                                  <span className="text-[9px] font-black font-mono text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">#{student.matricula_pfm}</span>
                                  <span className="text-xs font-black text-white uppercase truncate max-w-[150px]">{student.nome_guerra}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-white uppercase leading-none">{group.guardian1.name}</span>
                                <span className="text-[10px] font-mono font-bold text-zinc-500 mt-1">{formatCPF(group.guardian1.cpf)}</span>
                              </div>
                              {group.guardian2 && (
                                <div className="flex flex-col pt-2 border-t border-zinc-800/50">
                                  <span className="text-[11px] font-bold text-zinc-400 uppercase leading-none">{group.guardian2.name}</span>
                                  <span className="text-[9px] font-mono font-bold text-zinc-600 mt-1">{formatCPF(group.guardian2.cpf)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {group.guardian1.name === "RESPONSÁVEL AUSENTE" ? (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-black text-[9px] uppercase px-3 py-0.5 rounded-full">Falta</Badge>
                            ) : group.signed ? (
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black text-[9px] uppercase px-3 py-0.5 rounded-full mb-1">Assinado</Badge>
                                <span className="text-[8px] text-zinc-500 uppercase font-bold italic tracking-tighter">Eletronicamente</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-zinc-600 border-zinc-800 font-black text-[9px] uppercase px-3 py-0.5 rounded-full">Pendente</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {group.guardian1.name !== "RESPONSÁVEL AUSENTE" && (
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  onClick={() => canEdit ? handlePresenceClick(group) : toast.error("Período encerrado")}
                                  disabled={!canEdit}
                                  className={cn(
                                    "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                    group.signed 
                                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white" 
                                      : "bg-blue-600 hover:bg-blue-500 text-white"
                                  )}
                                >
                                  <UserCheck className="w-3.5 h-3.5 mr-2" />
                                  {group.signed ? "Atualizar" : "Confirmar"}
                                </Button>
                                {group.signed && canEdit && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setDeletingPresence(group)} 
                                    className="h-9 w-9 rounded-xl border-zinc-800 bg-zinc-950 hover:bg-red-500/10 hover:border-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

      </div>

      {showConfirmPresence && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-2xl no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Confirmar Presença</h2>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    {showConfirmPresence.students.map(s => s.nome_guerra).join(", ")}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { setShowConfirmPresence(null); setAssinaturasCadastradas([]); setSelectedGuardian(null); }} 
                  className="rounded-2xl hover:bg-zinc-800"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {loadingAssinatura ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verificando autorizações...</div>
                </div>
              ) : !selectedGuardian && showConfirmPresence.guardian2 ? (
                <div className="space-y-6">
                  <div className="text-zinc-400 text-sm">Selecione qual responsável esteve presente:</div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedGuardian(showConfirmPresence.guardian1)}
                      className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-left hover:bg-zinc-800 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="text-white font-black uppercase text-sm group-hover:text-blue-400 transition-colors">{showConfirmPresence.guardian1.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">{formatCPF(showConfirmPresence.guardian1.cpf)}</div>
                      {assinaturasCadastradas.find(a => a.cpf.replace(/\D/g, "") === showConfirmPresence.guardian1.cpf.replace(/\D/g, "")) && (
                        <Badge className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Autorização Ativa</Badge>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedGuardian(showConfirmPresence.guardian2!)}
                      className="w-full p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-left hover:bg-zinc-800 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="text-white font-black uppercase text-sm group-hover:text-blue-400 transition-colors">{showConfirmPresence.guardian2.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">{formatCPF(showConfirmPresence.guardian2.cpf)}</div>
                      {assinaturasCadastradas.find(a => a.cpf.replace(/\D/g, "") === showConfirmPresence.guardian2!.cpf.replace(/\D/g, "")) && (
                        <Badge className="mt-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Autorização Ativa</Badge>
                      )}
                    </button>
                  </div>
                </div>
              ) : (() => {
                const guardian = selectedGuardian || showConfirmPresence.guardian1;
                const foundAssinatura = assinaturasCadastradas.find(a => a.cpf.replace(/\D/g, "") === guardian.cpf.replace(/\D/g, ""));
                
                return foundAssinatura ? (
                  <div className="space-y-6">
                    {showConfirmPresence.guardian2 && (
                      <button 
                        onClick={() => { setSelectedGuardian(null); }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1"
                      >
                        ← Trocar responsável
                      </button>
                    )}
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-emerald-500 font-black text-sm uppercase">Autorização Encontrada</div>
                          <div className="text-[10px] text-zinc-500">{guardian.name}</div>
                        </div>
                      </div>
                      <div className="text-white text-xs leading-relaxed italic border-t border-emerald-500/10 pt-4">
                        Este responsável entregou o termo físico e está habilitado para assinatura eletrônica.
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirmPresence}
                      disabled={isSaving}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Confirmar Presença Eletrônica
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {showConfirmPresence.guardian2 && (
                      <button 
                        onClick={() => { setSelectedGuardian(null); }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1"
                      >
                        ← Trocar responsável
                      </button>
                    )}
                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <div className="text-amber-500 font-bold text-sm">Sem Autorização</div>
                      </div>
                      <p className="text-zinc-500 text-sm mt-4">
                        O responsável <strong className="text-zinc-300">{guardian.name}</strong> ainda não possui o termo físico de autorização cadastrado no sistema.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link href="/cadastro-assinatura" className="w-full">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-12 rounded-xl"
                        >
                          Ir para Cadastro de Assinatura
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => setShowConfirmPresence(null)}
                        className="w-full text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 rounded-[2rem] p-8 no-print">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white uppercase tracking-tighter">Encerrar Ciclo Mensal?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed mt-4">
              Esta ação aplicará automaticamente deméritos (-100 pts) para todos os alunos cujos responsáveis não compareceram à reunião. O ciclo será bloqueado para novas assinaturas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 mt-8">
            <AlertDialogCancel className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white rounded-2xl h-12 font-black uppercase text-xs tracking-widest">Abortar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseMonth} disabled={closingMonth} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-2xl h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20">
              {closingMonth ? "Encerrando..." : "Confirmar Bloqueio"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPresence} onOpenChange={() => setDeletingPresence(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 rounded-[2rem] p-8 no-print">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white uppercase tracking-tighter">Remover Presença?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm mt-4">
              O registro de presença eletrônica será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 mt-8">
            <AlertDialogCancel className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white rounded-2xl h-12 font-black uppercase text-xs tracking-widest">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePresence} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-2xl h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/20">Excluir</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
