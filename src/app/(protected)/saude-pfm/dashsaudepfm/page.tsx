"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Heart,
  Activity,
  Stethoscope,
  Weight,
  Ruler,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  History,
  Search,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
  Award,
  Star,
  ShieldCheck,
  Medal,
  Target,
  Eye,
  Pencil,
  Trash2,
  FileText,
  LayoutDashboard,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRADUACOES = [
  { value: "ASPIRANTE_MONITOR", label: "Aspirante a Monitor", icon: ShieldCheck },
  { value: "2_CMD_PELOTAO", label: "2º Comandante de Pelotão", icon: Medal },
  { value: "1_CMD_PELOTAO", label: "1º Comandante de Pelotão", icon: Award },
  { value: "CHEFE_TURMA", label: "Chefe de Turma", icon: Medal },
  { value: "2_SENIOR", label: "2º Sênior", icon: Award },
  { value: "1_SENIOR", label: "1º Sênior", icon: Award },
  { value: "APRENDIZ", label: "Aprendiz", icon: User },
];

export default function DashSaudePFMPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  const isInstructor = ["admin", "coord_geral", "coord_nucleo", "instrutor"].includes(profile?.role || "");

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, graduacao, matricula_pfm, data_matricula")
        .neq("nome_completo", "ALUNO TESTE")
        .order("data_matricula", { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar alunos: " + error.message);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(selectedDate).toISOString();
      const end = endOfMonth(selectedDate).toISOString();

      let query = supabase
        .from("student_health_records")
        .select("*, students(id, nome_completo, nome_guerra, graduacao, matricula_pfm, blood_type, gender, has_health_alert, health_alert_description, data_matricula)")
        .gte("created_at", start)
        .lte("created_at", end);

      if (selectedStudentId !== "all") {
        query = query.eq("student_id", selectedStudentId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setHealthRecords(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar avaliações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInstructor) {
      fetchStudents();
    }
  }, [isInstructor]);

  useEffect(() => {
    fetchRecords();
  }, [selectedStudentId, selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      const { error } = await supabase
        .from("student_health_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Registro excluído com sucesso!");
      fetchRecords();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const nextMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  const filteredRecords = useMemo(() => {
    return healthRecords.filter(record =>
      record.students?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.students?.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const dateA = new Date(a.students?.data_matricula || 0).getTime();
      const dateB = new Date(b.students?.data_matricula || 0).getTime();
      return dateA - dateB;
    });
  }, [healthRecords, searchTerm]);

  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: any } = {};
    filteredRecords.forEach(record => {
      if (!groups[record.student_id]) {
        groups[record.student_id] = {
          student: record.students,
          records: []
        };
      }
      groups[record.student_id].records.push(record);
    });
    return Object.values(groups);
  }, [filteredRecords]);

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (imc < 25) return { label: "Peso normal", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (imc < 35) return { label: "Obesidade I", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    return { label: "Obesidade II/III", color: "text-rose-600", bg: "bg-rose-600/10", border: "border-rose-600/20" };
  };

  if (!isInstructor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Acesso Restrito</h1>
        <p className="text-zinc-500 max-w-sm">Esta página é exclusiva para instrutores e coordenadores do sistema PFM.</p>
        <Link href="/saude-pfm" className="mt-8">
          <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white rounded-xl">
            Voltar para Saúde PFM
          </Button>
        </Link>
      </div>
    );
  }

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
              Dashboard de Saúde
              <Badge className="bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md">DOSSIÊ MENSAL</Badge>
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Acompanhamento Profissional de Saúde e Condição Física
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/saude-pfm/ranking">
            <Button className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest px-6 rounded-xl border flex items-center gap-2 h-11">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Ranking TAF
            </Button>
          </Link>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
            <Button onClick={prevMonth} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-500 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 text-center min-w-[140px]">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
            </div>
            <Button onClick={nextMonth} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-500 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-[240px] bg-zinc-900 border-zinc-800 text-white rounded-2xl h-11 text-xs font-bold uppercase tracking-widest">
              <SelectValue placeholder="Filtrar por Aluno" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest">Todos os Alunos</SelectItem>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id} className="text-xs font-bold uppercase tracking-widest">
                  {student.nome_guerra || student.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total de Avaliações"
          value={healthRecords.length.toString()}
          icon={ClipboardList}
          color="text-rose-500"
          bg="bg-rose-500/10"
        />
        <StatCard
          label="Alertas Ativos"
          value={healthRecords.filter(r => r.has_alert).length.toString()}
          icon={AlertTriangle}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <StatCard
          label="Média IMC"
          value={(() => {
            const valid = healthRecords.filter(r => r.weight && r.height && r.height > 0);
            return valid.length > 0
              ? (valid.reduce((acc, r) => acc + (r.weight / (r.height * r.height)), 0) / valid.length).toFixed(1)
              : "0.0";
          })()}
          icon={Activity}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="Alunos Avaliados"
          value={new Set(healthRecords.map(r => r.student_id)).size.toString()}
          icon={User}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Search and List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-500" />
            Listagem de Dossiês
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Buscar no dossiê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-white h-10 rounded-xl text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-3xl border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Carregando dados de saúde...</p>
          </div>
        ) : groupedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-3xl border-dashed text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Nenhuma avaliação encontrada para este período</p>
            <p className="text-zinc-600 text-[10px] uppercase mt-2">Tente mudar o filtro ou o mês selecionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {groupedRecords.map((group: any) => (
                <motion.div
                  key={group.student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <DossierCard
                    group={group}
                    onView={(record: any) => setViewingRecord(record)}
                    onDelete={(id: string) => handleDelete(id)}
                    getIMCCategory={getIMCCategory}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
          {viewingRecord && (
            <>
              <DialogHeader className="p-8 bg-zinc-900/50 border-b border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Activity className="w-40 h-40 text-rose-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 shadow-xl">
                    <User className="w-10 h-10 text-zinc-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">
                      {viewingRecord.students?.nome_completo}
                    </DialogTitle>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black text-[9px] uppercase tracking-widest px-2">
                        {format(new Date(viewingRecord.created_at), "dd/MM/yyyy HH:mm")}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-rose-500" />
                        Mat: {viewingRecord.students?.matricula_pfm || "---"}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8">
                {viewingRecord.identified_problems === "ENFERMAGEM" ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <ClipboardList className="w-5 h-5 text-blue-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Dossiê de Enfermagem</h3>
                    </div>
                    {/* Qualitative Data */}
                    <div className="space-y-6">
                      <QualitativeBlock label="Observações de Enfermagem" content={viewingRecord.instructor_notes?.replace("[ENFERMAGEM] - ", "")} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <Stethoscope className="w-5 h-5 text-rose-500" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Avaliação de Educação Física</h3>
                    </div>
                    {/* Physical Data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DataPoint icon={Weight} label="Peso" value={`${viewingRecord.weight || "---"} kg`} />
                      <DataPoint icon={Ruler} label="Altura" value={`${viewingRecord.height || "---"} m`} />
                      <div className={cn(
                        "col-span-2 p-4 rounded-3xl border flex items-center justify-between",
                        getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).bg,
                        getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).border
                      )}>
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">IMC Profissional</p>
                          <p className="text-2xl font-black text-white">{(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).toFixed(2)}</p>
                        </div>
                        <Badge className={cn("font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full", getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).color)}>
                          {getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).label}
                        </Badge>
                      </div>
                    </div>

                    {/* TAF Results */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        Resultados do TAF
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <TafItem label="Corrida 12m" value={viewingRecord.taf_run_12min ? `${viewingRecord.taf_run_12min}m` : "---"} />
                        <TafItem label="Polichinelo" value={viewingRecord.taf_jumping_jacks || "---"} />
                        <TafItem label="Flexão" value={viewingRecord.taf_push_ups || "---"} />
                        <TafItem label="Abdominal" value={viewingRecord.taf_sit_ups || "---"} />
                      </div>
                    </div>

                    {/* Qualitative Data */}
                    <div className="space-y-6">
                      <QualitativeBlock label="Dificuldades e Problemas Identificados" content={viewingRecord.difficulties} />
                      <QualitativeBlock label="Ações e Projetos de Melhoria" content={viewingRecord.improvement_projects} />
                      <QualitativeBlock label="Observações Adicionais do Instrutor" content={viewingRecord.instructor_notes} />
                    </div>
                  </div>
                )}

                {/* Alerts */}
                {viewingRecord.has_alert && (
                  <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Sinal de Alerta Ativo</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{viewingRecord.alert_description || "Monitoramento necessário sem descrição específica."}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl overflow-hidden p-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white leading-none mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function DossierCard({ group, onView, onDelete, getIMCCategory }: any) {
  const { student, records } = group;
  // Use most recent record for summary
  const latestRecord = records[0];
  const imc = latestRecord.weight && latestRecord.height ? latestRecord.weight / (latestRecord.height * latestRecord.height) : 0;
  const imcCat = getIMCCategory(imc);

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 rounded-[2rem] overflow-hidden group hover:border-rose-500/30 transition-all hover:bg-zinc-900">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex-1">
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] leading-none mb-1">
              MAT: {student.matricula_pfm || "---"}
            </p>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">
              {student.nome_guerra || student.nome_completo?.split(' ')[0]}
            </h3>
          </div>
          <Badge className={cn("text-[8px] font-black uppercase tracking-tighter px-2", student.has_health_alert ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500")}>
            {student.has_health_alert ? "ALERTA" : "NORMAL"}
          </Badge>
        </div>

        <div className="bg-zinc-950/30 rounded-2xl border border-zinc-800/50 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Avaliações no Mês</span>
            <Badge className="bg-zinc-800 text-zinc-400 text-[8px] font-black">{records.length}</Badge>
          </div>
          <div className="divide-y divide-zinc-800/30 max-h-[300px] overflow-y-auto custom-scrollbar">
            {records.map((r: any) => {
              const rImc = r.weight && r.height ? r.weight / (r.height * r.height) : 0;
              const rImcCat = getIMCCategory(rImc);

              return (
                <div key={r.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-rose-500" />
                        Ref: {format(new Date(r.created_at), "dd/MM/yyyy")}
                      </span>
                      <Badge className={cn(
                        "text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 w-fit",
                        r.identified_problems === "ENFERMAGEM" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      )}>
                        {r.identified_problems || "AVALIAÇÃO"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button onClick={() => onView(r)} variant="ghost" size="icon" className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white"><Eye className="w-3.5 h-3.5" /></Button>
                      <Link href={`/saude-pfm?student=${r.student_id}&edit=${r.id}`}><Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-amber-500/10 text-zinc-500 hover:text-amber-500"><Pencil className="w-3.5 h-3.5" /></Button></Link>
                      <Button onClick={() => onDelete(r.id)} variant="ghost" size="icon" className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  {r.identified_problems !== "ENFERMAGEM" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Peso/Alt</p>
                          <p className="text-[10px] font-black text-white tracking-tight">{r.weight}kg / {r.height}m</p>
                        </div>
                        <div className={cn("p-2 rounded-xl border", rImcCat.bg, rImcCat.border)}>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">IMC</p>
                          <p className={cn("text-[10px] font-black tracking-tight", rImcCat.color)}>{rImc.toFixed(1)} - {rImcCat.label}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-1.5">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Award className="w-2.5 h-2.5 text-yellow-500" /> TAF
                        </p>
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                          <span>Corr: {r.taf_run_12min || 0}m</span>
                          <span>Pol: {r.taf_jumping_jacks || 0}</span>
                          <span>Flex: {r.taf_push_ups || 0}</span>
                          <span>Abd: {r.taf_sit_ups || 0}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {r.identified_problems === "ENFERMAGEM" && (
                    <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                      <p className="text-[9px] text-zinc-400 italic line-clamp-2">
                        {r.instructor_notes?.replace("[ENFERMAGEM] - ", "") || "Registro de enfermagem realizado."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-zinc-950/50 border-t border-zinc-800/50 flex items-center justify-between">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Alcunha:</span>
        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
          {student.nome_guerra || "N/I"}
        </span>
      </div>
    </Card>
  );
}

function DataPoint({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-rose-500" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-base font-black text-white tracking-tight">{value}</p>
    </div>
  );
}

function TafItem({ label, value }: any) {
  return (
    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}

function QualitativeBlock({ label, content }: any) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</h4>
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-3xl text-sm text-zinc-300 leading-relaxed min-h-[80px]">
        {content || "Nenhuma informação detalhada registrada para este campo."}
      </div>
    </div>
  );
}
