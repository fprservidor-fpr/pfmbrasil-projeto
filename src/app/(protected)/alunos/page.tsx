"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Loader2,
  Filter,
  BadgeCheck,
  Eye,
  Save,
  Award,
  Calendar,
  Medal,
  TrendingUp,
  TrendingDown,
  X,
  ChevronRight,
  ShieldCheck,
  Star,
  Users,
  LayoutDashboard,
  Clock,
  ThumbsUp,
  History,
  Home,
  Heart,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  MousePointer2,
  Trash2,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInYears, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { deleteStudent, updateStudentStatus } from "./actions";

const GRADUACOES = [
  { value: "ASPIRANTE_MONITOR", label: "Aspirante a Monitor", ordem: 1, color: "bg-orange-500", textColor: "text-orange-400", border: "border-orange-500/30", icon: ShieldCheck },
  { value: "2_CMD_PELOTAO", label: "2º Comandante de Pelotão", ordem: 2, color: "bg-red-500", textColor: "text-red-400", border: "border-red-500/30", icon: Medal },
  { value: "1_CMD_PELOTAO", label: "1º Comandante de Pelotão", ordem: 3, color: "bg-yellow-500", textColor: "text-yellow-400", border: "border-yellow-500/30", icon: Award },
  { value: "CHEFE_TURMA", label: "Chefe de Turma", ordem: 4, color: "bg-rose-500", textColor: "text-rose-400", border: "border-rose-500/30", icon: Medal },
  { value: "2_SENIOR", label: "2º Sênior", ordem: 5, color: "bg-amber-500", textColor: "text-amber-400", border: "border-amber-500/30", icon: Award },
  { value: "1_SENIOR", label: "1º Sênior", ordem: 6, color: "bg-blue-500", textColor: "text-blue-400", border: "border-blue-500/30", icon: Award },
  { value: "APRENDIZ", label: "Aprendiz", ordem: 7, color: "bg-zinc-500", textColor: "text-zinc-400", border: "border-zinc-500/30", icon: User },
];

const BEHAVIOR_LEVELS: Record<string, any> = {
  "EXCEPCIONAL": { label: "EXCEPCIONAL", color: "bg-blue-500", textColor: "text-blue-400" },
  "ÓTIMO": { label: "ÓTIMO", color: "bg-emerald-500", textColor: "text-emerald-400" },
  "BOM": { label: "BOM", color: "bg-amber-500", textColor: "text-amber-400" },
  "REGULAR": { label: "REGULAR", color: "bg-orange-500", textColor: "text-orange-400" },
  "INSUFICIENTE": { label: "INSUFICIENTE", color: "bg-red-500", textColor: "text-red-400" },
  "MAU": { label: "MAU", color: "bg-zinc-600", textColor: "text-zinc-400" },
};

const calculateAge = (birthDate: string) => {
  if (!birthDate || birthDate === "0000-00-00") return null;
  const today = new Date();
  const birth = new Date(birthDate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function StudentsPage() {
  const { profile, simulatedRole } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const canEditPersonalData = ["admin", "coord_geral", "coord_nucleo", "instrutor", "instructor"].includes(profile?.role || "");

  const [filterGraduacao, setFilterGraduacao] = useState("all");
  const [filterTurma, setFilterTurma] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterComportamento, setFilterComportamento] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDossie, setShowDossie] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [frequenciasAluno, setFrequenciasAluno] = useState<any[]>([]);
  const [comportamentosAluno, setComportamentosAluno] = useState<any[]>([]);
  const [reunioesAluno, setReunioesAluno] = useState<any[]>([]);
  const [missoesAluno, setMissoesAluno] = useState<any[]>([]);
  const [editedStudent, setEditedStudent] = useState<any>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Only show test records when admin is in simulation mode
      const showTestRecords = !!simulatedRole;

      let studentsQuery = supabase.from("students").select("*");
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }

      const [{ data: studentsData, error: sError }, { data: turmasData, error: tError }] = await Promise.all([
        studentsQuery,
        supabase.from("turmas").select("*").order("nome")
      ]);

      if (sError) throw sError;
      if (tError) throw tError;

      if (studentsData) {
        const sorted = [...studentsData].sort((a, b) => {
          // Sort by ano_ingresso ASC (Oldest to Newest)
          const yearA = a.ano_ingresso || 0;
          const yearB = b.ano_ingresso || 0;
          if (yearA !== yearB) {
            return yearA - yearB;
          }

          // Helper to get order number (xx part of xx/aa)
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
        });
        setStudents(sorted);
      }
      if (turmasData) setTurmas(turmasData);
    } catch (error: any) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Erro ao carregar lista de alunos");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (student: any) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const [{ data: freqData }, { data: compData }, { data: reunioesData }, { data: missoesData }] = await Promise.all([
      supabase.from("frequencias").select("*").eq("aluno_id", student.id).order("data", { ascending: false }),
      supabase.from("comportamentos").select("*, profiles(full_name)").eq("aluno_id", student.id).order("created_at", { ascending: false }),
      supabase.from("reunioes_presenca").select("*, calendario_letivo(data, descricao)").contains("student_ids", [student.id]).order("created_at", { ascending: false }),
      supabase.from("missoes_atividades").select("*, missoes_materiais(study_materials(*))").or(`turma_id.is.null,turma_id.eq.${student.turma_id},turma_id.eq.${student.turma}`).order("data_entrega", { ascending: true })
    ]);

    if (freqData) setFrequenciasAluno(freqData);
    if (compData) setComportamentosAluno(compData);
    if (reunioesData) setReunioesAluno(reunioesData);
    if (missoesData) setMissoesAluno(missoesData);
  };

  useEffect(() => {
    fetchStudents();
  }, [simulatedRole]);

  const handleOpenDossie = async (student: any) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setActiveTab("resumo");
    await fetchStudentDetails(student);
    setShowDossie(true);
  };

  const handleSaveStudent = async () => {
    if (!editedStudent) return;

    // Check if status has changed
    if (editedStudent.status !== selectedStudent.status) {
      setPendingStatus(editedStudent.status);
      setShowStatusDialog(true);
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        nome_guerra: editedStudent.nome_guerra,
        graduacao: editedStudent.graduacao,
        turma: editedStudent.turma,
        turma_id: editedStudent.turma_id,
        status: editedStudent.status,
      };

      if (canEditPersonalData) {
        updateData.nome_completo = editedStudent.nome_completo;
        updateData.data_nascimento = editedStudent.data_nascimento;
        updateData.whatsapp = editedStudent.whatsapp;
        updateData.gender = editedStudent.gender;
        updateData.blood_type = editedStudent.blood_type;
        updateData.mother_name = editedStudent.mother_name;
        updateData.father_name = editedStudent.father_name;
        updateData.address_street = editedStudent.address_street;
        updateData.address_neighborhood = editedStudent.address_neighborhood;
        updateData.address_city = editedStudent.address_city;
        updateData.address_state = editedStudent.address_state;
        updateData.family_income = editedStudent.family_income;
        updateData.guardian1_name = editedStudent.guardian1_name;
        updateData.guardian1_cpf = editedStudent.guardian1_cpf;
        updateData.guardian1_titulo = editedStudent.guardian1_titulo;
        updateData.guardian1_whatsapp = editedStudent.guardian1_whatsapp;
        updateData.guardian2_name = editedStudent.guardian2_name;
        updateData.guardian2_cpf = editedStudent.guardian2_cpf;
        updateData.guardian2_titulo = editedStudent.guardian2_titulo;
        updateData.guardian2_whatsapp = editedStudent.guardian2_whatsapp;
      }

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", editedStudent.id);

      if (error) throw error;
      toast.success("Dados do aluno atualizados!");
      fetchStudents();
      setShowDossie(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkGraduacao = async (newGraduacao: string) => {
    const selectedIds = filteredStudents.map(s => s.id);
    if (selectedIds.length === 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ graduacao: newGraduacao })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`${selectedIds.length} alunos atualizados para ${GRADUACOES.find(g => g.value === newGraduacao)?.label}`);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGraduacao = filterGraduacao === "all" || s.graduacao === filterGraduacao;
    const matchesTurma = filterTurma === "all" || s.turma === filterTurma;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesGender = filterGender === "all" || (s.gender?.toUpperCase() || "MASCULINO") === filterGender.toUpperCase();
    const matchesComportamento = filterComportamento === "all" || s.comportamento_atual === filterComportamento;

    return matchesSearch && matchesGraduacao && matchesTurma && matchesStatus && matchesGender && matchesComportamento;
  });

  const getMonthlyStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthFreq = frequenciasAluno.filter(f => {
      const d = new Date(f.data);
      return d >= monthStart && d <= monthEnd;
    });

    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthFreq = frequenciasAluno.filter(f => {
      const d = new Date(f.data);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const presencasAtual = thisMonthFreq.filter(f => f.presenca === "presente").length;
    const faltasAtual = thisMonthFreq.filter(f => f.presenca === "falta").length;
    const justificadasAtual = thisMonthFreq.filter(f => f.presenca === "justificada").length;
    const presencasAnterior = lastMonthFreq.filter(f => f.presenca === "presente").length;
    const faltasAnterior = lastMonthFreq.filter(f => f.presenca === "falta").length;

    return {
      presencasAtual,
      faltasAtual,
      justificadasAtual,
      presencasAnterior,
      faltasAnterior,
      totalAtual: thisMonthFreq.length,
      totalAnterior: lastMonthFreq.length
    };
  };

  const handleConfirmStatusChange = async () => {
    if (!editedStudent || !pendingStatus || !statusReason) {
      toast.error("Por favor, informe o motivo da alteração.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateStudentStatus(editedStudent.id, pendingStatus, statusReason);

      if (!result.success) throw new Error(result.error);

      // Now save the rest of the student data
      const updateData: any = {
        nome_guerra: editedStudent.nome_guerra,
        graduacao: editedStudent.graduacao,
        turma: editedStudent.turma,
        turma_id: editedStudent.turma_id,
        status: pendingStatus,
        status_reason: statusReason
      };

      if (canEditPersonalData) {
        updateData.nome_completo = editedStudent.nome_completo;
        updateData.data_nascimento = editedStudent.data_nascimento;
        updateData.whatsapp = editedStudent.whatsapp;
        updateData.gender = editedStudent.gender;
        updateData.blood_type = editedStudent.blood_type;
        updateData.mother_name = editedStudent.mother_name;
        updateData.father_name = editedStudent.father_name;
        updateData.address_street = editedStudent.address_street;
        updateData.address_neighborhood = editedStudent.address_neighborhood;
        updateData.address_city = editedStudent.address_city;
        updateData.address_state = editedStudent.address_state;
        updateData.family_income = editedStudent.family_income;
        updateData.guardian1_name = editedStudent.guardian1_name;
        updateData.guardian1_cpf = editedStudent.guardian1_cpf;
        updateData.guardian1_titulo = editedStudent.guardian1_titulo;
        updateData.guardian1_whatsapp = editedStudent.guardian1_whatsapp;
        updateData.guardian2_name = editedStudent.guardian2_name;
        updateData.guardian2_cpf = editedStudent.guardian2_cpf;
        updateData.guardian2_titulo = editedStudent.guardian2_titulo;
        updateData.guardian2_whatsapp = editedStudent.guardian2_whatsapp;
      }

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", editedStudent.id);

      if (error) throw error;

      toast.success(`Status do aluno atualizado para ${pendingStatus === 'ativo' ? 'Ativo' : 'Inativo'}`);
      setShowStatusDialog(false);
      setStatusReason("");
      setPendingStatus(null);
      setShowDossie(false);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteStudent(studentToDelete.id);
      if (result.success) {
        toast.success("Aluno excluído com sucesso!");
        setShowDeleteDialog(false);
        setStudentToDelete(null);
        fetchStudents();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir aluno");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        {...fadeInUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Gestão de Contingente</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            CONTROLE DE <span className="text-emerald-500">ALUNOS</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl">
            Monitoramento completo do efetivo, histórico de comportamento e evolução de graduação.
          </p>
        </div>
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-none">{students.filter(s => s.status === 'ativo').length}</p>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Efetivo Ativo</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-zinc-900/50 border-zinc-800 p-4 backdrop-blur-sm hover:border-emerald-500/30 transition-all group animate-in slide-in-from-top-2 duration-500 delay-75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Alunos</p>
              <p className="text-xl font-black text-white">{students.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4 backdrop-blur-sm hover:border-blue-500/30 transition-all group animate-in slide-in-from-top-2 duration-500 delay-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <BadgeCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Ativos</p>
              <p className="text-xl font-black text-white">{students.filter(s => s.status === 'ativo').length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4 backdrop-blur-sm hover:border-amber-500/30 transition-all group animate-in slide-in-from-top-2 duration-500 delay-150">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Graduados</p>
              <p className="text-xl font-black text-white">{students.filter(s => s.graduacao !== 'APRENDIZ').length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-4 backdrop-blur-sm hover:border-purple-500/30 transition-all group animate-in slide-in-from-top-2 duration-500 delay-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Liderança</p>
              <p className="text-xl font-black text-white">{students.filter(s => ['CHEFE_TURMA', '1_CMD_PELOTAO', '2_CMD_PELOTAO', 'ASPIRANTE_MONITOR'].includes(s.graduacao)).length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm animate-in fade-in duration-1000">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Buscar por nome ou nome de guerra..."
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`border-zinc-700 ${showFilters ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'text-zinc-400'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Graduação</Label>
                  <Select value={filterGraduacao} onValueChange={setFilterGraduacao}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Todas</SelectItem>
                      {GRADUACOES.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Turma</Label>
                  <Select value={filterTurma} onValueChange={setFilterTurma}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Todas</SelectItem>
                      {turmas.map(t => (
                        <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Gênero</Label>
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Comportamento</Label>
                  <Select value={filterComportamento} onValueChange={setFilterComportamento}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.keys(BEHAVIOR_LEVELS).map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-500 uppercase">Ação em Lote</Label>
                  <Select onValueChange={handleBulkGraduacao}>
                    <SelectTrigger className="bg-amber-500/10 border-amber-500/30 text-amber-500 h-9">
                      <SelectValue placeholder="Alterar Grad." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {GRADUACOES.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto no-scrollbar">
              <Table className="min-w-[950px] lg:min-w-full border-collapse">
                <TableHeader className="bg-zinc-800/30">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 w-24">Turma</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-2 h-11 w-24">ID</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-2 h-11 w-12 hidden xl:table-cell">Sangue</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 min-w-[160px]">Candidato</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 w-40">Graduação</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 w-20">Idade</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 w-28 hidden 2xl:table-cell">Gênero</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-2 h-11 w-24">Compor.</TableHead>
                    <TableHead className="text-zinc-500 text-[10px] uppercase font-black tracking-widest px-4 h-11 w-20 text-center sticky right-0 bg-zinc-800/80 backdrop-blur-sm z-10 border-l border-zinc-800">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20 text-zinc-600 font-bold uppercase tracking-widest text-xs">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((s) => {
                      const age = calculateAge(s.data_nascimento);
                      const behaviorLevel = BEHAVIOR_LEVELS[s.comportamento_atual] || BEHAVIOR_LEVELS["EXCEPCIONAL"];
                      const graduacao = GRADUACOES.find(g => g.value === s.graduacao) || GRADUACOES[0];
                      const isFemale = s.gender?.toUpperCase() === 'FEMININO';
                      const isInactive = s.status === 'inativo';

                      return (
                        <TableRow key={s.id} className={cn(
                          "border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group",
                          isInactive && "bg-red-500/5 hover:bg-red-500/10"
                        )}>
                          <TableCell className="relative px-4 py-3">
                            <div className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-r-full", graduacao.color)} />
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-300 text-xs font-black uppercase tracking-tight whitespace-nowrap">{s.turma || "N/A"}</span>
                              {isInactive && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded-md animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">Inativo</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-red-600 text-white border-none shadow-2xl">
                                      <p className="text-xs font-bold uppercase">Aluno Inativo / Desligado</p>
                                      {s.status_reason && <p className="text-[10px] opacity-90 mt-1 border-t border-white/20 pt-1">{s.status_reason}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3">
                            <span className="font-mono text-[10px] text-emerald-500/70 font-bold bg-emerald-500/5 px-1.5 py-1 rounded border border-emerald-500/10 whitespace-nowrap">
                              {s.matricula_pfm || "---"}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-3 hidden xl:table-cell">
                            <span className="text-[9px] font-black text-red-500 bg-red-500/5 px-1.5 py-1 rounded border border-red-500/10 whitespace-nowrap">
                              {s.blood_type || "-"}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-white uppercase truncate text-sm tracking-tight">{s.nome_guerra || "-"}</span>
                              <span className="text-[10px] text-zinc-500 truncate max-w-[180px] font-medium">{s.nome_completo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Select
                              value={s.graduacao || "APRENDIZ"}
                              onValueChange={async (val) => {
                                await supabase.from("students").update({ graduacao: val }).eq("id", s.id);
                                fetchStudents();
                                toast.success("Graduação atualizada!");
                              }}
                            >
                              <SelectTrigger className={cn(
                                "h-8 w-full bg-zinc-900 border-zinc-800 text-[10px] uppercase font-black tracking-widest px-2",
                                graduacao.textColor
                              )}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", graduacao.color)} />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                {GRADUACOES.map(g => (
                                  <SelectItem key={g.value} value={g.value} className="text-[10px] uppercase font-black focus:bg-emerald-500">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", g.color)} />
                                      {g.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-zinc-400 text-xs font-bold">
                            {age ? `${age} ANOS` : "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 hidden 2xl:table-cell">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase tracking-tighter px-2 py-1 border-zinc-800 flex items-center gap-1 w-fit",
                              isFemale ? "text-pink-400 bg-pink-400/5 border-pink-400/20" : "text-blue-400 bg-blue-400/5 border-blue-400/20"
                            )}>
                              {isFemale ? <Heart className="w-2.5 h-2.5 fill-current" /> : <User className="w-2.5 h-2.5" />}
                              {s.gender || "MASCULINO"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5",
                              behaviorLevel.color,
                              behaviorLevel.textColor,
                              "border-none"
                            )}>
                              {behaviorLevel.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center w-20 sticky right-0 bg-zinc-900/95 backdrop-blur-sm z-10 border-l border-zinc-800/50">
                            <div className="flex items-center justify-center gap-1">
                              {["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || "") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
                                  onClick={() => {
                                    setStudentToDelete(s);
                                    setShowDeleteDialog(true);
                                  }}
                                  title="Excluir Aluno"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all rounded-lg"
                                onClick={() => handleOpenDossie(s)}
                                title="Ver Dossiê"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

      </Card>

      <Dialog open={showDossie} onOpenChange={setShowDossie}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-[95vw] lg:max-w-[90vw] xl:max-w-[1400px] max-h-[98vh] h-[95vh] overflow-hidden flex flex-col p-0 shadow-2xl selection:bg-emerald-500/30">
          {(() => {
            const graduacao = GRADUACOES.find(g => g.value === selectedStudent?.graduacao) || GRADUACOES[0];
            const GradIcon = graduacao.icon;
            const age = selectedStudent?.data_nascimento ? calculateAge(selectedStudent.data_nascimento) : null;
            const stats = getMonthlyStats();

            const merits = comportamentosAluno.filter(c => c.tipo === 'merito').reduce((acc, c) => acc + (c.pontos || 0), 0);
            const demerits = comportamentosAluno.filter(c => c.tipo === 'demerito').reduce((acc, c) => acc + (c.pontos || 0), 0);
            const score = Math.min(100, Math.max(0, 100 + merits - demerits));

            return (
              <>
                {/* Header Premium - Ampliado e Refinado */}
                <div className="relative overflow-hidden p-10 border-b border-zinc-800 bg-zinc-900/40">
                  {/* Background Accents Complexos */}
                  <div className="absolute top-0 right-0 w-[600px] h-full bg-emerald-500/5 blur-[120px] -rotate-12 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-[400px] h-[200px] bg-blue-500/5 blur-[100px] rotate-12 pointer-events-none" />

                  <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
                    {/* Avatar/Escudo Magnificado */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      className={cn(
                        "w-44 h-44 rounded-[3.5rem] flex items-center justify-center border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group overflow-hidden",
                        graduacao.color.replace('bg-', 'bg-') + "/10",
                        graduacao.border
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <GradIcon className={cn("w-20 h-20", graduacao.textColor)} />
                      <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 shadow-2xl">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                    </motion.div>

                    <div className="flex-1 text-center lg:text-left">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6"
                      >
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/70 mb-2">Dossiê Individual do Aluno</p>
                          <DialogTitle className="text-6xl font-black uppercase tracking-tighter leading-[0.9] bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                            {selectedStudent?.nome_guerra || selectedStudent?.nome_completo}
                          </DialogTitle>
                        </div>
                        <Badge className={cn(
                          "w-fit mx-auto lg:mx-0 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest h-fit mb-2",
                          BEHAVIOR_LEVELS[selectedStudent?.comportamento_atual]?.color || 'bg-emerald-500',
                          "text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] border-none"
                        )}>
                          {selectedStudent?.comportamento_atual || "EXCEPCIONAL"}
                        </Badge>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-zinc-400 font-medium"
                      >
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 rounded-2xl border border-zinc-800/50 shadow-lg">
                          <BadgeCheck className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-200">
                            {graduacao.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 rounded-2xl border border-zinc-800/50 shadow-lg">
                          <Users className="w-5 h-5 text-blue-500" />
                          <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-200">
                            Turma {selectedStudent?.turmas?.nome || selectedStudent?.turma || "A definir"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 rounded-2xl border border-zinc-800/50 shadow-lg">
                          <Clock className="w-5 h-5 text-amber-500" />
                          <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-200">
                            {age ? `${age} anos` : "N/D"}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-zinc-500 bg-zinc-950/80 px-4 py-2 rounded-2xl border border-zinc-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          ID MILITAR: <span className="text-emerald-500 font-black">{selectedStudent?.matricula_pfm || "-"}</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Stats Destacados no Header */}
                    <div className="hidden xl:flex items-center gap-4 shrink-0">
                      <div className="bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[140px] shadow-xl">
                        <span className="text-4xl font-black text-emerald-500">{stats.totalAtual > 0 ? Math.round((stats.presencasAtual / stats.totalAtual) * 100) : 0}%</span>
                        <span className="text-[10px] uppercase font-black text-emerald-500/70 tracking-widest mt-1">Frequência</span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20 p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[140px] shadow-xl">
                        <span className="text-4xl font-black text-blue-500">{comportamentosAluno.filter(c => c.tipo === 'merito').length}</span>
                        <span className="text-[10px] uppercase font-black text-blue-500/70 tracking-widest mt-1">Méritos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-10 pt-6 bg-zinc-900/10">
                    <TabsList className="bg-zinc-900/60 border border-zinc-800/50 p-1.5 flex w-full mb-0 rounded-b-none border-b-0 gap-2 h-14">
                      <TabsTrigger value="resumo" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Resumo Operacional
                      </TabsTrigger>
                      <TabsTrigger value="dados" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <User className="w-4 h-4 mr-2" />
                        Ficha Cadastral
                      </TabsTrigger>
                      <TabsTrigger value="frequencia" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <Calendar className="w-4 h-4 mr-2" />
                        Engajamento
                      </TabsTrigger>
                      <TabsTrigger value="comportamento" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <Medal className="w-4 h-4 mr-2" />
                        Comportamento
                      </TabsTrigger>
                      <TabsTrigger value="missoes" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <Target className="w-4 h-4 mr-2" />
                        Missões
                      </TabsTrigger>
                      <TabsTrigger value="ficha" className="flex-1 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] h-full transition-all duration-300">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Prontuário
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-zinc-950/50 scrollbar-hide">
                    <AnimatePresence mode="wait">
                      {activeTab === "resumo" && (
                        <TabsContent key="resumo" value="resumo" forceMount className="mt-0 outline-none">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-10"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                              <Card className="bg-zinc-900/60 border-zinc-800/50 p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 rounded-[2rem] shadow-xl">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Clock className="w-20 h-20 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mb-6">Assiduidade</p>
                                <div className="flex items-end gap-3 mb-4">
                                  <span className="text-6xl font-black text-white leading-none tracking-tighter">{stats.presencasAtual}</span>
                                  <span className="text-zinc-500 font-bold mb-1 uppercase text-xs tracking-widest">/ {stats.totalAtual} dias</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                    <span>Aproveitamento</span>
                                    <span className="text-emerald-500">{stats.totalAtual > 0 ? Math.round((stats.presencasAtual / stats.totalAtual) * 100) : 0}%</span>
                                  </div>
                                  <Progress value={stats.totalAtual > 0 ? (stats.presencasAtual / stats.totalAtual) * 100 : 0} className="h-2 bg-zinc-800/50" />
                                </div>
                              </Card>

                              <Card className="bg-zinc-900/60 border-zinc-800/50 p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 rounded-[2rem] shadow-xl">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <ThumbsUp className="w-20 h-20 text-blue-500" />
                                </div>
                                <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-[0.2em] mb-6">Equilíbrio</p>
                                <div className="flex items-center gap-6 mb-6">
                                  <div className="flex flex-col">
                                    <span className="text-4xl font-black text-emerald-500">+{comportamentosAluno.filter(c => c.tipo === 'merito').reduce((acc, c) => acc + (c.pontos || 0), 0)}</span>
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Méritos</span>
                                  </div>
                                  <div className="w-px h-12 bg-zinc-800" />
                                  <div className="flex flex-col">
                                    <span className="text-4xl font-black text-red-500">-{comportamentosAluno.filter(c => c.tipo === 'demerito').reduce((acc, c) => acc + (c.pontos || 0), 0)}</span>
                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Deméritos</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                                  {score >= 80 ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Tendência de Progressão</span>
                                    </>
                                  ) : score >= 50 ? (
                                    <>
                                      <Activity className="w-4 h-4 text-blue-500" />
                                      <span className="text-[10px] font-bold text-blue-500 uppercase">Manutenção de Nível</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                      <span className="text-[10px] font-bold text-red-500 uppercase">Risco de Regressão</span>
                                    </>
                                  )}
                                </div>
                              </Card>

                              <Card className="bg-zinc-900/60 border-zinc-800/50 p-8 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500 rounded-[2rem] shadow-xl">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <Award className="w-20 h-20 text-amber-500" />
                                </div>
                                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] mb-6">Progressão</p>
                                {(() => {
                                  const nextGrad = GRADUACOES[GRADUACOES.indexOf(graduacao) - 1];
                                  return nextGrad ? (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-black text-white uppercase tracking-tight">{nextGrad.label}</span>
                                        <Badge variant="outline" className="text-[8px] border-amber-500/20 text-amber-500 uppercase font-black">Em curso</Badge>
                                      </div>
                                      <Progress value={65} className="h-2 bg-zinc-800/50" />
                                      <p className="text-[10px] text-zinc-500 font-bold uppercase leading-tight">Faltam aproximadamente <span className="text-white">3 meses</span> para avaliação</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-24 text-emerald-500 gap-3">
                                      <Star className="w-8 h-8 fill-emerald-500 animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nível Elite Alcançado</span>
                                    </div>
                                  );
                                })()}
                              </Card>

                              <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/50 p-8 relative overflow-hidden rounded-[2rem] shadow-xl">
                                <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Próximo Objetivo</p>
                                <div className="space-y-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                      <Target className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-white uppercase">Graduação 2º Sênior</p>
                                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Meta: Julho 2024</p>
                                    </div>
                                  </div>
                                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[9px] h-10 rounded-xl border border-zinc-700/50">
                                    Definir Novo Objetivo
                                  </Button>
                                </div>
                              </Card>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                              <div className="xl:col-span-3 space-y-6">
                                <div className="flex items-center justify-between px-2">
                                  <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    Log de Atividades Estratégicas
                                  </h4>
                                  <Button variant="ghost" className="text-[10px] text-emerald-500 font-black p-0 h-auto uppercase tracking-widest hover:bg-transparent hover:text-emerald-400">Expandir Histórico</Button>
                                </div>
                                <div className="space-y-4">
                                  {comportamentosAluno.slice(0, 5).map((c, i) => (
                                    <motion.div
                                      key={c.id || i}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex items-center gap-6 p-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 group hover:bg-zinc-900/60 hover:border-zinc-700/50 transition-all duration-300"
                                    >
                                      <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2",
                                        c.tipo === 'merito' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                      )}>
                                        {c.tipo === 'merito' ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-base font-black text-white uppercase tracking-tight truncate">{c.descricao}</p>
                                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">{format(new Date(c.created_at), "dd MMM, HH:mm")}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <Badge className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-lg",
                                            c.tipo === 'merito' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                          )}>
                                            {c.tipo === 'merito' ? '+' : '-'}{c.pontos} PONTOS OPERACIONAIS
                                          </Badge>
                                          <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500 font-black">
                                              {c.profiles?.full_name?.charAt(0)}
                                            </div>
                                            <span className="text-[10px] text-zinc-600 font-black uppercase italic tracking-tighter">Autoridade: {c.profiles?.full_name || "Sistema"}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                  {comportamentosAluno.length === 0 && (
                                    <div className="py-20 text-center bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-800/50">
                                      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                                        <History className="w-10 h-10 text-zinc-500" />
                                      </div>
                                      <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">Ausência de registros recentes</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="xl:col-span-2 space-y-6">
                                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                  Monitoramento de Frequência
                                </h4>
                                <div className="p-8 bg-zinc-900/40 rounded-[2.5rem] border border-zinc-800/50">
                                  <div className="grid grid-cols-7 gap-3 mb-8">
                                    {frequenciasAluno.slice(0, 28).map((f, i) => (
                                      <TooltipProvider key={f.id || i}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <motion.div
                                              initial={{ opacity: 0, scale: 0.5 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              transition={{ delay: i * 0.02 }}
                                              className={cn(
                                                "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer group relative",
                                                f.presenca === 'presente' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                              )}
                                            >
                                              <span className="text-[9px] font-black uppercase tracking-tighter leading-none">{format(new Date(f.data + "T00:00:00"), "dd")}</span>
                                              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shadow-sm", f.presenca === 'presente' ? "bg-emerald-500" : "bg-red-500")} />
                                            </motion.div>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-zinc-900 border-zinc-800 text-white p-3 rounded-xl shadow-2xl">
                                            <div className="space-y-1">
                                              <p className="text-[10px] font-black text-zinc-500 uppercase">{format(new Date(f.data + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                              <p className={cn("text-xs font-black uppercase", f.presenca === 'presente' ? "text-emerald-500" : "text-red-500")}>{f.presenca}</p>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                    {Array.from({ length: Math.max(0, 28 - frequenciasAluno.length) }).map((_, i) => (
                                      <div key={`empty-${i}`} className="aspect-square rounded-xl border border-zinc-900 bg-zinc-900/20 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                                      <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Presenças Confirmadas</span>
                                      </div>
                                      <span className="text-sm font-black text-white">{stats.presencasAtual}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-5 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                                      <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Faltas Registradas</span>
                                      </div>
                                      <span className="text-sm font-black text-white">{stats.faltasAtual}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "dados" && (
                        <TabsContent key="dados" value="dados" forceMount className="mt-0 outline-none">
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 max-w-3xl mx-auto"
                          >
                            <div className="grid grid-cols-2 gap-6 p-8 bg-zinc-900/30 rounded-[2rem] border border-zinc-800">
                              <div className="space-y-2 col-span-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo</Label>
                                <Input
                                  value={editedStudent?.nome_completo || ""}
                                  onChange={(e) => canEditPersonalData && setEditedStudent({ ...editedStudent, nome_completo: e.target.value })}
                                  disabled={!canEditPersonalData}
                                  className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome de Guerra</Label>
                                <Input
                                  value={editedStudent?.nome_guerra || ""}
                                  onChange={(e) => setEditedStudent({ ...editedStudent, nome_guerra: e.target.value })}
                                  className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Data Nascimento</Label>
                                <Input
                                  type="date"
                                  value={editedStudent?.data_nascimento || ""}
                                  onChange={(e) => canEditPersonalData && setEditedStudent({ ...editedStudent, data_nascimento: e.target.value })}
                                  disabled={!canEditPersonalData}
                                  className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Gênero</Label>
                                <Select
                                  value={editedStudent?.gender?.toUpperCase() || "MASCULINO"}
                                  onValueChange={(val) => canEditPersonalData && setEditedStudent({ ...editedStudent, gender: val })}
                                  disabled={!canEditPersonalData}
                                >
                                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    <SelectItem value="MASCULINO" className="focus:bg-emerald-500 focus:text-white rounded-lg">Masculino</SelectItem>
                                    <SelectItem value="FEMININO" className="focus:bg-emerald-500 focus:text-white rounded-lg">Feminino</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Graduação</Label>
                                <Select value={editedStudent?.graduacao || "APRENDIZ"} onValueChange={(val) => setEditedStudent({ ...editedStudent, graduacao: val })}>
                                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    {GRADUACOES.map(g => (
                                      <SelectItem key={g.value} value={g.value} className="focus:bg-emerald-500 focus:text-white rounded-lg">
                                        {g.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Turma</Label>
                                <Select
                                  value={editedStudent?.turma_id || ""}
                                  onValueChange={(val) => {
                                    const selectedTurma = turmas.find(t => t.id === val);
                                    setEditedStudent({
                                      ...editedStudent,
                                      turma_id: val,
                                      turma: selectedTurma?.nome || ""
                                    });
                                  }}
                                >
                                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    {turmas.map(t => (
                                      <SelectItem key={t.id} value={t.id} className="focus:bg-emerald-500 focus:text-white rounded-lg">{t.nome}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Status</Label>
                                <Select value={editedStudent?.status || "ativo"} onValueChange={(val) => setEditedStudent({ ...editedStudent, status: val })}>
                                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    <SelectItem value="ativo" className="focus:bg-emerald-500 focus:text-white rounded-lg uppercase font-bold text-xs">Ativo</SelectItem>
                                    <SelectItem value="inativo" className="focus:bg-red-500 focus:text-white rounded-lg uppercase font-bold text-xs">Inativo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">WhatsApp Aluno</Label>
                                <Input
                                  value={editedStudent?.whatsapp || ""}
                                  onChange={(e) => canEditPersonalData && setEditedStudent({ ...editedStudent, whatsapp: e.target.value })}
                                  disabled={!canEditPersonalData}
                                  placeholder="(00) 00000-0000"
                                  className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Tipo Sanguíneo</Label>
                                <Select
                                  value={editedStudent?.blood_type || ""}
                                  onValueChange={(val) => canEditPersonalData && setEditedStudent({ ...editedStudent, blood_type: val })}
                                  disabled={!canEditPersonalData}
                                >
                                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não informado"].map(type => (
                                      <SelectItem key={type} value={type} className="focus:bg-emerald-500 focus:text-white rounded-lg">{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {canEditPersonalData && (
                              <>
                                <div className="grid grid-cols-2 gap-6 p-8 bg-zinc-900/30 rounded-[2rem] border border-zinc-800">
                                  <h4 className="col-span-2 text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4" /> Dados Familiares
                                  </h4>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome da Mãe</Label>
                                    <Input
                                      value={editedStudent?.mother_name || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, mother_name: e.target.value })}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome do Pai</Label>
                                    <Input
                                      value={editedStudent?.father_name || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, father_name: e.target.value })}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Renda Familiar</Label>
                                    <Select value={editedStudent?.family_income || ""} onValueChange={(val) => setEditedStudent({ ...editedStudent, family_income: val })}>
                                      <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus:ring-emerald-500">
                                        <SelectValue placeholder="Selecione" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                        <SelectItem value="ate_1_salario">Até 1 salário</SelectItem>
                                        <SelectItem value="1_a_2_salarios">1 a 2 salários</SelectItem>
                                        <SelectItem value="2_a_3_salarios">2 a 3 salários</SelectItem>
                                        <SelectItem value="3_a_5_salarios">3 a 5 salários</SelectItem>
                                        <SelectItem value="acima_5_salarios">Acima de 5 salários</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="col-span-2 border-t border-zinc-800 pt-4 mt-2">
                                    <p className="text-[10px] text-amber-500/70 font-black uppercase mb-4">Responsável Principal</p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome</Label>
                                        <Input
                                          value={editedStudent?.guardian1_name || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian1_name: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">CPF</Label>
                                        <Input
                                          value={editedStudent?.guardian1_cpf || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian1_cpf: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Título de Eleitor</Label>
                                        <Input
                                          value={editedStudent?.guardian1_titulo || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian1_titulo: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">WhatsApp</Label>
                                        <Input
                                          value={editedStudent?.guardian1_whatsapp || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian1_whatsapp: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-2 border-t border-zinc-800 pt-4 mt-2">
                                    <p className="text-[10px] text-zinc-500/70 font-black uppercase mb-4">Responsável Secundário (Opcional)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nome</Label>
                                        <Input
                                          value={editedStudent?.guardian2_name || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian2_name: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">CPF</Label>
                                        <Input
                                          value={editedStudent?.guardian2_cpf || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian2_cpf: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Título de Eleitor</Label>
                                        <Input
                                          value={editedStudent?.guardian2_titulo || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian2_titulo: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">WhatsApp</Label>
                                        <Input
                                          value={editedStudent?.guardian2_whatsapp || ""}
                                          onChange={(e) => setEditedStudent({ ...editedStudent, guardian2_whatsapp: e.target.value })}
                                          className="bg-zinc-950 border-zinc-700 text-white h-10 rounded-xl focus-visible:ring-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-8 bg-zinc-900/30 rounded-[2rem] border border-zinc-800">
                                  <h4 className="col-span-2 text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Home className="w-4 h-4" /> Endereço
                                  </h4>
                                  <div className="space-y-2 col-span-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Logradouro</Label>
                                    <Input
                                      value={editedStudent?.address_street || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, address_street: e.target.value })}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Bairro</Label>
                                    <Input
                                      value={editedStudent?.address_neighborhood || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, address_neighborhood: e.target.value })}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Cidade</Label>
                                    <Input
                                      value={editedStudent?.address_city || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, address_city: e.target.value })}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Estado</Label>
                                    <Input
                                      value={editedStudent?.address_state || ""}
                                      onChange={(e) => setEditedStudent({ ...editedStudent, address_state: e.target.value })}
                                      placeholder="UF"
                                      maxLength={2}
                                      className="bg-zinc-950 border-zinc-700 text-white h-12 rounded-xl focus-visible:ring-emerald-500 uppercase"
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            <Button
                              onClick={handleSaveStudent}
                              disabled={saving}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                            >
                              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Confirmar Alterações
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "frequencia" && (
                        <TabsContent key="frequencia" value="frequencia" forceMount className="mt-0 outline-none">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <Card className="bg-zinc-900/40 border-zinc-800 p-6 text-center group hover:border-emerald-500/30 transition-all">
                                <p className="text-4xl font-black text-emerald-500 mb-1">{stats.presencasAtual}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Presenças</p>
                              </Card>
                              <Card className="bg-zinc-900/40 border-zinc-800 p-6 text-center group hover:border-red-500/30 transition-all">
                                <p className="text-4xl font-black text-red-500 mb-1">{stats.faltasAtual}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Faltas</p>
                              </Card>
                              <Card className="bg-zinc-900/40 border-zinc-800 p-6 text-center group hover:border-amber-500/30 transition-all">
                                <p className="text-4xl font-black text-amber-500 mb-1">{stats.justificadasAtual}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Justificadas</p>
                              </Card>
                              <Card className="bg-zinc-900/40 border-zinc-800 p-6 text-center group transition-all">
                                <p className="text-4xl font-black text-white mb-1">{stats.totalAtual > 0 ? Math.round(((stats.presencasAtual + stats.justificadasAtual) / stats.totalAtual) * 100) : 0}%</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Aproveitamento</p>
                              </Card>
                            </div>

                            <div className="bg-zinc-900/30 rounded-[2rem] border border-zinc-800 overflow-hidden">
                              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Registro Histórico</h4>
                                <Badge variant="outline" className="text-zinc-600 border-zinc-800 font-mono text-[10px]">{frequenciasAluno.length} registros</Badge>
                              </div>
                              <div className="divide-y divide-zinc-800/50">
                                {frequenciasAluno.map((f, i) => (
                                  <div key={f.id || i} className="flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative",
                                        f.presenca === 'presente' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                                          f.presenca === 'justificada' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                            "bg-red-500/10 border-red-500/20 text-red-500"
                                      )}>
                                        <Calendar className="w-5 h-5" />
                                        {f.presenca === 'justificada' && (
                                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                                            <AlertCircle className="w-2 h-2 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">{format(new Date(f.data + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                        <div className="flex items-center gap-2">
                                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{format(new Date(f.data + "T00:00:00"), "yyyy")}</p>
                                          {f.presenca === 'justificada' && f.observacoes && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5 mt-1">
                                                <p className="text-[11px] text-amber-200/90 font-medium leading-relaxed">
                                                  <span className="text-amber-500 font-black uppercase text-[8px] tracking-widest mr-2">Justificativa:</span>
                                                  {f.observacoes}
                                                </p>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge className={cn(
                                      "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                      f.presenca === 'presente' ? "bg-emerald-500 text-white" :
                                        f.presenca === 'justificada' ? "bg-amber-500 text-white" :
                                          "bg-red-500 text-white"
                                    )}>
                                      {f.presenca}
                                    </Badge>
                                  </div>
                                ))}
                                {frequenciasAluno.length === 0 && (
                                  <div className="p-20 text-center">
                                    <Calendar className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "comportamento" && (
                        <TabsContent key="comportamento" value="comportamento" forceMount className="mt-0 outline-none">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="bg-emerald-500/5 border-emerald-500/20 p-8 flex flex-col items-center justify-center text-center group hover:bg-emerald-500/10 transition-all">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-5xl font-black text-emerald-500 mb-2">{comportamentosAluno.filter(c => c.tipo === 'merito').length}</p>
                                <p className="text-xs font-black text-emerald-500/70 uppercase tracking-[0.2em]">Total de Méritos</p>
                              </Card>
                              <Card className="bg-red-500/5 border-red-500/20 p-8 flex flex-col items-center justify-center text-center group hover:bg-red-500/10 transition-all">
                                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                  <TrendingDown className="w-8 h-8 text-red-500" />
                                </div>
                                <p className="text-5xl font-black text-red-500 mb-2">{comportamentosAluno.filter(c => c.tipo === 'demerito').length}</p>
                                <p className="text-xs font-black text-red-500/70 uppercase tracking-[0.2em]">Total de Deméritos</p>
                              </Card>
                            </div>

                            <div className="bg-zinc-900/30 rounded-[2rem] border border-zinc-800 overflow-hidden">
                              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Dossiê de Ocorrências</h4>
                                <Badge variant="outline" className="text-zinc-600 border-zinc-800 font-mono text-[10px]">{comportamentosAluno.length} eventos</Badge>
                              </div>
                              <div className="divide-y divide-zinc-800/50">
                                {comportamentosAluno.map((c, i) => (
                                  <div key={c.id || i} className="p-6 hover:bg-zinc-900/40 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
                                          c.tipo === 'merito' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                                        )}>
                                          <Star className="w-6 h-6" />
                                        </div>
                                        <div>
                                          <p className="text-lg font-black text-white uppercase tracking-tight">{c.tipo === 'merito' ? 'Mérito' : 'Demérito'}</p>
                                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{format(new Date(c.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                        </div>
                                      </div>
                                      <Badge className={cn(
                                        "px-6 py-2 rounded-full text-sm font-black shadow-lg",
                                        c.tipo === 'merito' ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                      )}>
                                        {c.tipo === 'merito' ? '+' : '-'}{c.pontos} PTS
                                      </Badge>
                                    </div>
                                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 mb-4">
                                      <p className="text-zinc-300 text-sm leading-relaxed">{c.descricao}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                                          {c.profiles?.full_name?.charAt(0)}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Registrado por {c.profiles?.full_name || "Sistema"}</span>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-8 text-[10px] text-zinc-600 hover:text-white uppercase font-black tracking-widest">
                                        Imprimir Registro
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                {comportamentosAluno.length === 0 && (
                                  <div className="p-20 text-center">
                                    <Medal className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum evento registrado</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "missoes" && (
                        <TabsContent key="missoes" value="missoes" forceMount className="mt-0 outline-none">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between px-2">
                              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                Atividades & Missões Designadas
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {missoesAluno.length > 0 ? (
                                missoesAluno.map((m, i) => (
                                  <div key={m.id || i} className="p-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 group hover:border-violet-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                      <Badge className={cn(
                                        "uppercase text-[9px] font-black tracking-widest px-3 py-1",
                                        m.tipo === 'missao' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                                      )}>
                                        {m.tipo}
                                      </Badge>
                                      <div className="text-right">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Prazo de Entrega</p>
                                        <p className="text-xs font-black text-white">{format(parseISO(m.data_entrega), "dd/MM/yyyy")}</p>
                                      </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{m.titulo}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-4">{m.descricao}</p>

                                    {m.missoes_materiais && m.missoes_materiais.length > 0 && (
                                      <div className="pt-4 border-t border-zinc-800/50 space-y-2">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Materiais de Apoio</p>
                                        <div className="flex flex-wrap gap-2">
                                          {m.missoes_materiais.map(({ study_materials: mat }: any) => (
                                            <a
                                              key={mat.id}
                                              href={mat.file_url}
                                              target="_blank"
                                              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[10px] font-bold text-violet-400 hover:bg-violet-500/10 transition-colors"
                                            >
                                              <FileText className="w-3 h-3" />
                                              {mat.title}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 py-20 text-center bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-800/50">
                                  <Target className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                  <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.3em]">Nenhuma missão ativa para este aluno</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "ficha" && (
                        <TabsContent key="ficha" value="ficha" forceMount className="mt-0 outline-none pb-12">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                          >
                            {/* Grid de Informações Detalhadas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Responsáveis */}
                              <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden rounded-[2rem]">
                                <div className="p-6 bg-zinc-900/60 border-b border-zinc-800">
                                  <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Responsáveis e Família
                                  </h4>
                                </div>
                                <div className="p-6 space-y-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">Pai / Mãe</p>
                                    <p className="text-sm text-white font-medium uppercase">{selectedStudent?.mother_name || "Mãe não informada"}</p>
                                    <p className="text-sm text-white font-medium uppercase">{selectedStudent?.father_name || "Pai não informado"}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Gênero</p>
                                      <Badge variant="outline" className={cn(
                                        "text-[10px] font-black uppercase tracking-tighter px-3 py-1 border-zinc-800 flex items-center gap-2 w-fit",
                                        selectedStudent?.gender?.toUpperCase() === 'FEMININO' ? "text-pink-400 bg-pink-400/5 border-pink-400/20" : "text-blue-400 bg-blue-400/5 border-blue-400/20"
                                      )}>
                                        {selectedStudent?.gender?.toUpperCase() === 'FEMININO' ? <Heart className="w-3 h-3 fill-current" /> : <User className="w-3 h-3" />}
                                        {selectedStudent?.gender || "MASCULINO"}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Data Nascimento</p>
                                      <p className="text-sm text-white font-medium">
                                        {selectedStudent?.data_nascimento ? format(new Date(selectedStudent.data_nascimento + "T00:00:00"), "dd/MM/yyyy") : "---"}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Renda Familiar</p>
                                      <p className="text-sm text-white font-medium">{selectedStudent?.family_income || "Não inf."}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">WhatsApp Aluno</p>
                                      <p className="text-sm text-white font-medium">{selectedStudent?.whatsapp || "---"}</p>
                                    </div>
                                  </div>
                                  <div className="pt-4 border-t border-zinc-800/50 space-y-4">
                                    <div>
                                      <p className="text-[10px] text-emerald-500/70 font-black uppercase mb-3">Responsável 1 (Principal)</p>
                                      <div className="space-y-2">
                                        <p className="text-sm text-white font-bold uppercase">{selectedStudent?.guardian1_name}</p>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                                          <span>CPF: {selectedStudent?.guardian1_cpf}</span>
                                          <span>TÍTULO: {selectedStudent?.guardian1_titulo || "---"}</span>
                                          <span className="col-span-2">WHATSAPP: {selectedStudent?.guardian1_whatsapp}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {selectedStudent?.guardian2_name && (
                                      <div className="pt-4 border-t border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase mb-3">Responsável 2</p>
                                        <div className="space-y-2">
                                          <p className="text-sm text-white font-bold uppercase">{selectedStudent?.guardian2_name}</p>
                                          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                                            <span>CPF: {selectedStudent?.guardian2_cpf}</span>
                                            <span>TÍTULO: {selectedStudent?.guardian2_titulo || "---"}</span>
                                            <span className="col-span-2">WHATSAPP: {selectedStudent?.guardian2_whatsapp}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>

                              {/* Endereço */}
                              <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden rounded-[2rem]">
                                <div className="p-6 bg-zinc-900/60 border-b border-zinc-800">
                                  <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                    <Home className="w-4 h-4" /> Endereço Residencial
                                  </h4>
                                </div>
                                <div className="p-6 space-y-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">Logradouro</p>
                                    <p className="text-sm text-white font-medium uppercase">
                                      {selectedStudent?.address_street ? `${selectedStudent.address_street}, ${selectedStudent.address_number}` : "Endereço não informado"}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Bairro</p>
                                      <p className="text-sm text-white font-medium uppercase">{selectedStudent?.address_neighborhood || "---"}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase">Cidade/UF</p>
                                      <p className="text-sm text-white font-medium uppercase">{selectedStudent?.address_city}/{selectedStudent?.address_state}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase">CEP</p>
                                    <p className="text-sm text-white font-medium">{selectedStudent?.address_cep || "---"}</p>
                                  </div>
                                </div>
                              </Card>

                              {/* Saúde */}
                              <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden rounded-[2rem] md:col-span-2">
                                <div className="p-6 bg-zinc-900/60 border-b border-zinc-800 flex justify-between items-center">
                                  <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                    <Heart className="w-4 h-4" /> Ficha Médica e Saúde
                                  </h4>
                                  <Badge variant="outline" className="text-red-500 border-red-500/20 font-black uppercase text-[10px]">
                                    Sangue: {selectedStudent?.blood_type || "N/D"}
                                  </Badge>
                                </div>
                                <div className="p-6">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                      { label: "Plano Saúde", val: selectedStudent?.health_1_plano_saude },
                                      { label: "Vacina COVID", val: selectedStudent?.health_2_vacina_covid },
                                      { label: "Assis. Social", val: selectedStudent?.health_3_assistencia_social },
                                      { label: "Psicólogo", val: selectedStudent?.health_4_psicologo },
                                      { label: "Epilético", val: selectedStudent?.health_7_epiletico },
                                      { label: "Diabético", val: selectedStudent?.health_8_diabetico },
                                      { label: "Alergia", val: selectedStudent?.health_12_alergia },
                                      { label: "Cirurgia", val: selectedStudent?.health_14_cirurgia },
                                    ].map((item, i) => (
                                      <div key={i} className={cn(
                                        "p-3 rounded-xl border flex flex-col items-center justify-center gap-1",
                                        item.val ? "bg-red-500/10 border-red-500/20" : "bg-zinc-900/50 border-zinc-800"
                                      )}>
                                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", item.val ? "text-red-500" : "text-zinc-500")}>{item.label}</span>
                                        <span className={cn("text-xs font-bold uppercase", item.val ? "text-white" : "text-zinc-700")}>{item.val ? "SIM" : "NÃO"}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {(selectedStudent?.health_descriptions || selectedStudent?.health_plano_saude_descricao) && (
                                    <div className="mt-6 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Observações de Saúde</p>
                                      <p className="text-zinc-400 text-sm italic">
                                        {selectedStudent?.health_plano_saude_descricao && `Plano: ${selectedStudent.health_plano_saude_descricao}. `}
                                        {selectedStudent?.health_descriptions && Object.entries(selectedStudent.health_descriptions)
                                          .filter(([_, v]) => v && v !== "")
                                          .map(([k, v]) => `${v}`).join(". ")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </Card>

                              {/* Reuniões de Pais */}
                              <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden rounded-[2rem] md:col-span-2">
                                <div className="p-6 bg-zinc-900/60 border-b border-zinc-800 flex justify-between items-center">
                                  <h4 className="text-xs font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Presença em Reuniões de Pais
                                  </h4>
                                  <Badge variant="outline" className="text-purple-500 border-purple-500/20 font-black uppercase text-[10px]">
                                    {reunioesAluno.filter(r => r.present).length}/{reunioesAluno.length} Presenças
                                  </Badge>
                                </div>
                                <div className="p-6">
                                  {reunioesAluno.length > 0 ? (
                                    <div className="space-y-3">
                                      {reunioesAluno.map((r, i) => (
                                        <div
                                          key={r.id || i}
                                          className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border",
                                            r.present
                                              ? "bg-emerald-500/5 border-emerald-500/20"
                                              : "bg-red-500/5 border-red-500/20"
                                          )}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={cn(
                                              "w-10 h-10 rounded-xl flex items-center justify-center border",
                                              r.present
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                : "bg-red-500/10 border-red-500/20 text-red-500"
                                            )}>
                                              {r.present ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                              <p className="text-sm font-bold text-white">
                                                {r.calendario_letivo?.descricao || "Reunião de Pais"}
                                              </p>
                                              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                                {r.calendario_letivo?.data
                                                  ? format(new Date(r.calendario_letivo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
                                                  : format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <Badge className={cn(
                                              "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                                              r.present
                                                ? "bg-emerald-500 text-white"
                                                : "bg-red-500 text-white"
                                            )}>
                                              {r.present ? "Presente" : "Ausente"}
                                            </Badge>
                                            {r.present && r.guardian_name && (
                                              <p className="text-[9px] text-zinc-500 mt-1 uppercase">
                                                Assinado por: {r.guardian_name}
                                              </p>
                                            )}
                                            {!r.present && r.falta_registrada && (
                                              <p className="text-[9px] text-red-500 mt-1 uppercase font-bold">
                                                -100 pts demérito
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8">
                                      <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhuma reunião registrada</p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </div>
                          </motion.div>
                        </TabsContent>
                      )}
                    </AnimatePresence>
                  </div>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Excluir Aluno</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">Esta ação não pode ser desfeita.</DialogDescription>
            </div>
          </div>
          <div className="p-4 bg-zinc-800/50 rounded-xl mb-4">
            <p className="text-zinc-300 text-sm mb-2">
              Tem certeza que deseja excluir o aluno:
            </p>
            <p className="text-white font-bold uppercase">{studentToDelete?.nome_completo}</p>
            <p className="text-emerald-500 font-mono text-xs">{studentToDelete?.matricula_pfm}</p>
          </div>
          <p className="text-xs text-red-400 mb-4">
            Serão excluídos: registros de frequência, comportamento e todos os dados do aluno.
          </p>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1 border-zinc-700 text-zinc-400">
              Cancelar
            </Button>
            <Button onClick={handleDeleteStudent} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              pendingStatus === 'inativo' ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Confirmar Alteração de Status
              </DialogTitle>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Ação: Alterar para {pendingStatus === 'ativo' ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
              <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
                {pendingStatus === 'inativo'
                  ? "Ao inativar o aluno, o acesso dele e dos responsáveis vinculados será desativado (exceto se o responsável possuir outros alunos ativos)."
                  : "Ao reativar o aluno, o acesso dele e dos responsáveis será habilitado novamente."}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-1">
                Motivo da {pendingStatus === 'ativo' ? 'Reativação' : 'Inativação'}
              </Label>
              <Input
                placeholder="Descreva o motivo detalhadamente..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowStatusDialog(false);
                setStatusReason("");
              }}
              className="flex-1 text-zinc-500 font-black uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={saving || !statusReason}
              className={cn(
                "flex-1 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl",
                pendingStatus === 'inativo' ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
