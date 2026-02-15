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
  ClipboardList,
  History,
  Search,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  User,
  Plus,
  Target,
  Award,
  Star,
  ShieldCheck,
  Medal,
  Eye,
  Pencil,
  Trash2,
  X,
  LayoutDashboard,
  Trophy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

const GRADUACOES = [
  { value: "ASPIRANTE_MONITOR", label: "Aspirante a Monitor", icon: ShieldCheck },
  { value: "2_CMD_PELOTAO", label: "2º Comandante de Pelotão", icon: Medal },
  { value: "1_CMD_PELOTAO", label: "1º Comandante de Pelotão", icon: Award },
  { value: "CHEFE_TURMA", label: "Chefe de Turma", icon: Medal },
  { value: "2_SENIOR", label: "2º Sênior", icon: Award },
  { value: "1_SENIOR", label: "1º Sênior", icon: Award },
  { value: "APRENDIZ", label: "Aprendiz", icon: User },
];

export default function SaudePFMPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [observations, setObservations] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  
  const [evalForm, setEvalForm] = useState({
    weight: "",
    height: "",
    taf_run_12min: "",
    taf_jumping_jacks: "",
    taf_push_ups: "",
    taf_sit_ups: "",
    difficulties: "",
    identified_problems: "",
    improvement_projects: "",
    instructor_notes: "",
    has_alert: false,
    alert_description: ""
  });

  const imcValue = useMemo(() => {
    const w = parseFloat(evalForm.weight);
    const h = parseFloat(evalForm.height);
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(2);
    }
    return null;
  }, [evalForm.weight, evalForm.height]);

  const getIMCCategory = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-amber-500" };
    if (imc < 25) return { label: "Peso normal", color: "text-emerald-500" };
    if (imc < 30) return { label: "Sobrepeso", color: "text-amber-500" };
    if (imc < 35) return { label: "Obesidade Grau I", color: "text-rose-500" };
    if (imc < 40) return { label: "Obesidade Grau II", color: "text-rose-600" };
    return { label: "Obesidade Grau III", color: "text-rose-700" };
  };

  const isInstructor = ["admin", "coord_geral", "coord_nucleo", "instrutor"].includes(profile?.role || "");
  const isGuardian = ["guardian", "responsavel"].includes(profile?.role || "");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let query = supabase.from("students").select("*, turmas(nome)");
      
      if (isGuardian) {
        query = query.eq("responsavel_cpf", profile?.cpf);
      } else if (profile?.role === "aluno" || profile?.role === "student") {
        query = query.eq("id", profile?.id);
      }

      const { data, error } = await query.order("data_matricula", { ascending: true });
      if (error) throw error;
      setStudents(data || []);
      
      if (data && data.length === 1 && !isInstructor) {
        handleSelectStudent(data[0]);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar alunos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setObservations(student.observacoes || "");
    setEditingId(null);
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("student_health_records")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHealthRecords(records || []);
      
      if (records && records.length > 0) {
        const latest = records[0];
        setEvalForm({
          weight: latest.weight?.toString() || "",
          height: latest.height?.toString() || "" ,
          taf_run_12min: latest.taf_run_12min?.toString() || "",
          taf_jumping_jacks: latest.taf_jumping_jacks?.toString() || "",
          taf_push_ups: latest.taf_push_ups?.toString() || "",
          taf_sit_ups: latest.taf_sit_ups?.toString() || "",
          difficulties: latest.difficulties || "",
          identified_problems: latest.identified_problems || "",
          improvement_projects: latest.improvement_projects || "",
          instructor_notes: latest.instructor_notes || "",
          has_alert: latest.has_alert || false,
          alert_description: latest.alert_description || ""
        });
      } else {
        setEvalForm({
          weight: "", height: "", taf_run_12min: "", taf_jumping_jacks: "", 
          taf_push_ups: "", taf_sit_ups: "", difficulties: "", identified_problems: "", 
          improvement_projects: "", instructor_notes: "", has_alert: false, alert_description: ""
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar registros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObservations = async () => {
    if (!selectedStudent) return;
    setSavingObs(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ observacoes: observations })
        .eq("id", selectedStudent.id);
      if (error) throw error;
      toast.success("Observações salvas com sucesso!");
      setSelectedStudent({ ...selectedStudent, observacoes: observations });
      setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, observacoes: observations } : s));
    } catch (error: any) {
      toast.error("Erro ao salvar observações: " + error.message);
    } finally {
      setSavingObs(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      const recordData: any = {
        student_id: selectedStudent.id,
        instructor_id: profile?.id,
        weight: evalForm.weight ? parseFloat(evalForm.weight) : null,
        height: evalForm.height ? parseFloat(evalForm.height) : null,
        taf_run_12min: evalForm.taf_run_12min ? parseFloat(evalForm.taf_run_12min) : null,
        taf_jumping_jacks: evalForm.taf_jumping_jacks ? parseInt(evalForm.taf_jumping_jacks) : null,
        taf_push_ups: evalForm.taf_push_ups ? parseInt(evalForm.taf_push_ups) : null,
        taf_sit_ups: evalForm.taf_sit_ups ? parseInt(evalForm.taf_sit_ups) : null,
        difficulties: evalForm.difficulties,
        identified_problems: evalForm.identified_problems,
        improvement_projects: evalForm.improvement_projects,
        instructor_notes: evalForm.instructor_notes,
        has_alert: evalForm.has_alert,
        alert_description: evalForm.alert_description,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from("student_health_records").update(recordData).eq("id", editingId);
        if (error) throw error;
        toast.success("Registro atualizado com sucesso!");
        setEditingId(null);
      } else {
        const { error } = await supabase.from("student_health_records").insert([recordData]);
        if (error) throw error;
        toast.success("Registro de saúde salvo com sucesso!");
      }

      await supabase.from("students").update({
        has_health_alert: evalForm.has_alert,
        health_alert_description: evalForm.alert_description
      }).eq("id", selectedStudent.id);

      handleSelectStudent(selectedStudent);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setEvalForm({
      weight: record.weight?.toString() || "",
      height: record.height?.toString() || "",
      taf_run_12min: record.taf_run_12min?.toString() || "",
      taf_jumping_jacks: record.taf_jumping_jacks?.toString() || "",
      taf_push_ups: record.taf_push_ups?.toString() || "",
      taf_sit_ups: record.taf_sit_ups?.toString() || "",
      difficulties: record.difficulties || "",
      identified_problems: record.identified_problems || "",
      improvement_projects: record.improvement_projects || "",
      instructor_notes: record.instructor_notes || "",
      has_alert: record.has_alert || false,
      alert_description: record.alert_description || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (healthRecords.length > 0) {
      const latest = healthRecords[0];
      setEvalForm({
        weight: latest.weight?.toString() || "",
        height: latest.height?.toString() || "",
        taf_run_12min: latest.taf_run_12min?.toString() || "",
        taf_jumping_jacks: latest.taf_jumping_jacks?.toString() || "",
        taf_push_ups: latest.taf_push_ups?.toString() || "",
        taf_sit_ups: latest.taf_sit_ups?.toString() || "",
        difficulties: latest.difficulties || "",
        identified_problems: latest.identified_problems || "",
        improvement_projects: latest.improvement_projects || "",
        instructor_notes: latest.instructor_notes || "",
        has_alert: latest.has_alert || false,
        alert_description: latest.alert_description || ""
      });
    } else {
      setEvalForm({
        weight: "", height: "", taf_run_12min: "", taf_jumping_jacks: "", 
        taf_push_ups: "", taf_sit_ups: "", difficulties: "", identified_problems: "", 
        improvement_projects: "", instructor_notes: "", has_alert: false, alert_description: ""
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      const { error } = await supabase.from("student_health_records").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registro excluído com sucesso!");
      handleSelectStudent(selectedStudent);
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
  };

  useEffect(() => {
    fetchStudents();
  }, [profile]);

  const filteredStudents = students.filter(s => 
    s.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Saúde PFM</h1>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Gestão e Acompanhamento de Saúde e Condição Física
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/saude-pfm/ranking">
              <Button className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest px-6 rounded-xl border flex items-center gap-2 h-11">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Ranking TAF
              </Button>
            </Link>
            {isInstructor && (
              <Link href="/saude-pfm/dashsaudepfm">
                <Button className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest px-6 rounded-xl border flex items-center gap-2 h-11">
                  <LayoutDashboard className="w-4 h-4 text-rose-500" />
                  Dashboard de Saúde
                </Button>
              </Link>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {isInstructor && (
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800 rounded-2xl overflow-hidden">
              <CardHeader className="p-4 border-b border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input 
                    placeholder="Buscar aluno..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-zinc-950 border-zinc-800 text-white h-10 rounded-xl text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loading && students.length === 0 ? (
                  <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" /></div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {filteredStudents.map(student => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={cn("w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5 text-left", selectedStudent?.id === student.id && "bg-rose-500/10 border-l-4 border-rose-500")}
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate uppercase tracking-tight">{student.nome_guerra || student.nome_completo?.split(' ')[0]}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{GRADUACOES.find(g => g.value === student.graduacao)?.label || "Aprendiz"} - {student.turmas?.nome || "Sem Turma"}</p>
                        </div>
                        {student.has_health_alert && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className={cn("space-y-6", isInstructor ? "lg:col-span-8" : "lg:col-span-12")}>
          {!selectedStudent ? (
            <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6 border border-zinc-700"><Stethoscope className="w-10 h-10 text-zinc-500" /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Selecione um Aluno</h2>
              <p className="text-zinc-500 max-w-sm mx-auto text-sm">Selecione um aluno na lista ao lado para visualizar e gerenciar as informações de saúde e condição física.</p>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-32 h-32 text-rose-500" /></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="w-24 h-24 rounded-3xl bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 shadow-2xl overflow-hidden"><User className="w-12 h-12 text-zinc-500" /></div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedStudent.nome_completo}</h2>
                        {selectedStudent.has_health_alert && <Badge className="bg-rose-500 text-white font-black px-3 py-1 rounded-full animate-pulse">ALERTA ATIVO</Badge>}
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-zinc-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                        <span className="flex items-center gap-1.5"><ClipboardList className="w-3 h-3 text-rose-500" /> {selectedStudent.matricula_pfm || "---"}</span>
                        <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-rose-500" /> {selectedStudent.blood_type || "N/A"}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-rose-500" /> {selectedStudent.gender || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-zinc-950/50 border-b border-zinc-800"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ClipboardList className="w-4 h-4 text-rose-500" />Informações do Responsável</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <HealthItem label="Plano de Saúde" value={selectedStudent.health_1_plano_saude} desc={selectedStudent.health_plano_saude_descricao} />
                        <HealthItem label="Vacina COVID" value={selectedStudent.health_2_vacina_covid} />
                        <HealthItem label="Assist. Social" value={selectedStudent.health_3_assistencia_social} />
                        <HealthItem label="Psicólogo" value={selectedStudent.health_4_psicologo} />
                        <HealthItem label="Transtorno Psíq." value={selectedStudent.health_5_transtorno_psiquico} />
                        <HealthItem label="Epilético" value={selectedStudent.health_7_epiletico} />
                        <HealthItem label="Diabético" value={selectedStudent.health_8_diabetico} />
                        <HealthItem label="Atividade Física" value={selectedStudent.health_9_atividade_fisica} />
                      </div>
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alergias</p>
                        <p className="text-xs text-white bg-zinc-950 p-3 rounded-xl border border-zinc-800 min-h-[40px]">{selectedStudent.alergias || "Nenhuma informada"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Medicamentos</p>
                        <p className="text-xs text-white bg-zinc-950 p-3 rounded-xl border border-zinc-800 min-h-[40px]">{selectedStudent.medicamentos || "Nenhum informado"}</p>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">Observações do Instrutor {isInstructor && <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Editável</span>}</p>
                          {isInstructor ? <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Adicione observações importantes sobre a saúde deste aluno..." className="bg-zinc-950 border-zinc-800 text-white min-h-[100px] rounded-xl text-xs resize-none focus:ring-rose-500/20" /> : <p className="text-xs text-white bg-zinc-950 p-3 rounded-xl border border-zinc-800 min-h-[40px]">{selectedStudent.observacoes || "Nenhuma observação registrada"}</p>}
                        </div>
                        {isInstructor && <Button onClick={handleSaveObservations} disabled={savingObs} size="sm" className="w-full bg-zinc-100 hover:bg-white text-black font-black text-[10px] uppercase tracking-widest h-10 rounded-xl transition-all">{savingObs ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar Observações</>}</Button>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-zinc-950/50 border-b border-zinc-800"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Stethoscope className="w-4 h-4 text-rose-500" />Avaliação Profissional / Instrutor</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    {isInstructor ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Peso (kg)</label>
                            <div className="relative"><Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" /><Input type="number" step="0.1" value={evalForm.weight} onChange={(e) => setEvalForm({...evalForm, weight: e.target.value})} className="pl-10 bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" /></div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Altura (m)</label>
                            <div className="relative"><Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" /><Input type="number" step="0.01" value={evalForm.height} onChange={(e) => setEvalForm({...evalForm, height: e.target.value})} className="pl-10 bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" /></div>
                          </div>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Activity className="w-5 h-5 text-blue-500" /></div>
                            <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">IMC (A cada 3 meses)</p><p className="text-lg font-black text-white leading-none mt-0.5">{imcValue || "---"}</p></div>
                          </div>
                          {imcValue && <Badge className={cn("font-black px-3 py-1 rounded-full bg-zinc-900 border-zinc-800", getIMCCategory(parseFloat(imcValue)).color)}>{getIMCCategory(parseFloat(imcValue)).label}</Badge>}
                        </div>
                        <div className="pt-4 border-t border-zinc-800 space-y-4">
                          <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-yellow-500" /><h3 className="text-xs font-black text-white uppercase tracking-widest">Teste de Aptidão Física (TAF)</h3></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Corrida 12 min (m)</label><Input type="number" value={evalForm.taf_run_12min} onChange={(e) => setEvalForm({...evalForm, taf_run_12min: e.target.value})} className="bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" placeholder="Ex: 2400" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Polichinelo (qtd)</label><Input type="number" value={evalForm.taf_jumping_jacks} onChange={(e) => setEvalForm({...evalForm, taf_jumping_jacks: e.target.value})} className="bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" placeholder="Ex: 50" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Flexão (qtd)</label><Input type="number" value={evalForm.taf_push_ups} onChange={(e) => setEvalForm({...evalForm, taf_push_ups: e.target.value})} className="bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" placeholder="Ex: 30" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Abdominal (qtd)</label><Input type="number" value={evalForm.taf_sit_ups} onChange={(e) => setEvalForm({...evalForm, taf_sit_ups: e.target.value})} className="bg-zinc-950 border-zinc-800 text-white h-11 rounded-2xl" placeholder="Ex: 40" /></div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dificuldades / Problemas Identificados</label><Textarea value={evalForm.difficulties} onChange={(e) => setEvalForm({...evalForm, difficulties: e.target.value})} placeholder="Descreva as dificuldades físicas ou problemas de saúde observados..." className="bg-zinc-950 border-zinc-800 text-white min-h-[80px] rounded-2xl resize-none" /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Projetos de Melhoria (Ex: Fisioterapia)</label><Textarea value={evalForm.improvement_projects} onChange={(e) => setEvalForm({...evalForm, improvement_projects: e.target.value})} placeholder="Plano de ação ou recomendações..." className="bg-zinc-950 border-zinc-800 text-white min-h-[80px] rounded-2xl resize-none" /></div>
                        </div>
                        <div className="pt-4 border-t border-zinc-800 space-y-4">
                          <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                            <div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", evalForm.has_alert ? "bg-rose-500/20" : "bg-zinc-800")}><AlertTriangle className={cn("w-5 h-5", evalForm.has_alert ? "text-rose-500" : "text-zinc-500")} /></div><div><p className="text-xs font-black text-white uppercase tracking-tight">Ativar Sinal de Alerta</p><p className="text-[9px] text-zinc-500 font-bold uppercase">Aparecerá no controle de frequência</p></div></div>
                            <Button onClick={() => setEvalForm({...evalForm, has_alert: !evalForm.has_alert})} variant={evalForm.has_alert ? "default" : "outline"} className={cn("rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest", evalForm.has_alert ? "bg-rose-600 hover:bg-rose-500 text-white border-none shadow-lg shadow-rose-600/20" : "border-zinc-800 text-zinc-500")}>{evalForm.has_alert ? "ATIVADO" : "DESATIVADO"}</Button>
                          </div>
                          {evalForm.has_alert && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5"><label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Descrição do Alerta</label><Input value={evalForm.alert_description} onChange={(e) => setEvalForm({...evalForm, alert_description: e.target.value})} placeholder="Por que este aluno deve ser monitorado?" className="bg-zinc-950 border-rose-500/30 text-white h-11 rounded-2xl focus:ring-rose-500/20" /></motion.div>}
                        </div>
                        <div className="flex flex-col gap-3">
                          {editingId && <Button onClick={handleCancelEdit} variant="outline" className="w-full border-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest h-10 rounded-xl"><X className="w-4 h-4 mr-2" />CANCELAR EDIÇÃO</Button>}
                          <Button onClick={handleSaveEvaluation} disabled={saving} className={cn("w-full h-12 text-white font-black rounded-2xl shadow-xl transition-all", editingId ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20" : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20")}>{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />{editingId ? "ATUALIZAR REGISTRO" : "SALVAR REGISTRO DE SAÚDE"}</>}</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {healthRecords.length > 0 ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <InfoBox label="Peso Atual" value={evalForm.weight ? `${evalForm.weight} kg` : "N/A"} icon={Weight} />
                              <InfoBox label="Altura Atual" value={evalForm.height ? `${evalForm.height} m` : "N/A"} icon={Ruler} />
                              <InfoBox label="IMC (3 Meses)" value={imcValue || "N/A"} icon={Activity} subtitle={imcValue ? getIMCCategory(parseFloat(imcValue)).label : undefined} subtitleColor={imcValue ? getIMCCategory(parseFloat(imcValue)).color : undefined} />
                            </div>
                            <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-4">
                              <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-yellow-500" /><h3 className="text-sm font-black text-white uppercase tracking-widest">Teste de Aptidão Física (TAF)</h3></div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Corrida</p><p className="text-sm font-black text-white">{evalForm.taf_run_12min ? `${evalForm.taf_run_12min}m` : "---"}</p></div>
                                <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Polichinelo</p><p className="text-sm font-black text-white">{evalForm.taf_jumping_jacks || "---"}</p></div>
                                <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Flexão</p><p className="text-sm font-black text-white">{evalForm.taf_push_ups || "---"}</p></div>
                                <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Abdominal</p><p className="text-sm font-black text-white">{evalForm.taf_sit_ups || "---"}</p></div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <InfoBlock label="Dificuldades Observadas" content={evalForm.difficulties} />
                              <InfoBlock label="Projetos de Melhoria" content={evalForm.improvement_projects} />
                              <InfoBlock label="Notas do Instrutor" content={evalForm.instructor_notes} />
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center bg-zinc-950 rounded-3xl border border-zinc-800 border-dashed">
                            <ClipboardList className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                            <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Nenhuma avaliação registrada</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden">
                <CardHeader className="bg-zinc-950/50 border-b border-zinc-800 flex flex-row items-center justify-between"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-rose-500" />Histórico de Avaliações</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="border-zinc-800 hover:bg-transparent"><TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Data</TableHead><TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Peso/Altura</TableHead><TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">TAF</TableHead><TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Status</TableHead><TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {healthRecords.map((record) => (
                          <TableRow key={record.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors">
                            <TableCell className="text-xs font-bold text-zinc-300">{format(new Date(record.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell className="text-xs font-black text-white"><div>{record.weight ? `${record.weight}kg` : "-"} / {record.height ? `${record.height}m` : "-"}</div>{record.weight && record.height && <span className={cn("text-[9px] font-bold uppercase", getIMCCategory(record.weight / (record.height * record.height)).color)}>IMC: {(record.weight / (record.height * record.height)).toFixed(2)}</span>}</TableCell>
                            <TableCell className="text-[10px] text-zinc-400 font-bold uppercase"><div className="flex flex-col gap-0.5"><span>Corr: {record.taf_run_12min ? `${record.taf_run_12min}m` : "-"}</span><span>Pol: {record.taf_jumping_jacks || "-"} | Flex: {record.taf_push_ups || "-"} | Abd: {record.taf_sit_ups || "-"}</span></div></TableCell>
                            <TableCell>{record.has_alert ? <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[9px] font-black px-2 py-0">ALERTA</Badge> : <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-black px-2 py-0">NORMAL</Badge>}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleView(record)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/50"><Eye className="w-4 h-4" /></Button>
                                {isInstructor && <><Button variant="ghost" size="icon" onClick={() => handleEdit(record)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-500 border border-zinc-700/50"><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 border border-zinc-700/50"><Trash2 className="w-4 h-4" /></Button></>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {healthRecords.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-600 text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl rounded-3xl overflow-hidden p-0">
          {viewingRecord && (
            <>
              <DialogHeader className="p-6 bg-zinc-900/50 border-b border-zinc-800">
                <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><Heart className="w-5 h-5 text-rose-500" /></div>Avaliação de Saúde - {format(new Date(viewingRecord.created_at), "dd/MM/yyyy")}</DialogTitle>
                <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Detalhes completos da avaliação física e de saúde</DialogDescription>
              </DialogHeader>
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Peso</p><p className="text-sm font-black text-white">{viewingRecord.weight ? `${viewingRecord.weight} kg` : "---"}</p></div>
                  <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Altura</p><p className="text-sm font-black text-white">{viewingRecord.height ? `${viewingRecord.height} m` : "---"}</p></div>
                  <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 col-span-2"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">IMC</p><div className="flex items-center justify-between"><p className="text-sm font-black text-white">{viewingRecord.weight && viewingRecord.height ? (viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).toFixed(2) : "---"}</p>{viewingRecord.weight && viewingRecord.height && <Badge className={cn("text-[9px] font-black", getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).color)}>{getIMCCategory(viewingRecord.weight / (viewingRecord.height * viewingRecord.height)).label}</Badge>}</div></div>
                </div>
                <div className="space-y-3"><h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" />Desempenho TAF</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Corrida</p><p className="text-sm font-black text-white">{viewingRecord.taf_run_12min ? `${viewingRecord.taf_run_12min}m` : "---"}</p></div><div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Polichinelo</p><p className="text-sm font-black text-white">{viewingRecord.taf_jumping_jacks || "---"}</p></div><div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Flexão</p><p className="text-sm font-black text-white">{viewingRecord.taf_push_ups || "---"}</p></div><div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Abdominal</p><p className="text-sm font-black text-white">{viewingRecord.taf_sit_ups || "---"}</p></div></div></div>
                <div className="space-y-4"><DetailBlock label="Dificuldades / Problemas" content={viewingRecord.difficulties} /><DetailBlock label="Identificação de Problemas" content={viewingRecord.identified_problems} /><DetailBlock label="Projetos de Melhoria" content={viewingRecord.improvement_projects} /><DetailBlock label="Notas do Instrutor" content={viewingRecord.instructor_notes} /></div>
                {viewingRecord.has_alert && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl"><div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-rose-500" /><p className="text-xs font-black text-rose-500 uppercase tracking-widest">Alerta Ativo</p></div><p className="text-sm text-zinc-300">{viewingRecord.alert_description}</p></div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HealthItem({ label, value, desc }: { label: string, value: boolean, desc?: string }) {
  return (
    <div className="bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        {value ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-zinc-800" />}
      </div>
      <p className={cn("text-[10px] font-bold uppercase tracking-tight", value ? "text-emerald-500" : "text-zinc-600")}>{value ? "Sim" : "Não"}</p>
      {desc && value && <p className="text-[9px] text-zinc-500 mt-1 italic leading-tight">{desc}</p>}
    </div>
  );
}

function InfoBox({ label, value, icon: Icon, subtitle, subtitleColor }: { label: string, value: string, icon: any, subtitle?: string, subtitleColor?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><Icon className="w-5 h-5 text-rose-500" /></div>
        <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p><p className="text-lg font-black text-white leading-none mt-0.5">{value}</p></div>
      </div>
      {subtitle && <Badge className={cn("text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-900 border-zinc-800", subtitleColor)}>{subtitle}</Badge>}
    </div>
  );
}

function InfoBlock({ label, content }: { label: string, content: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</p>
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs text-zinc-300 min-h-[60px] leading-relaxed">{content || "---"}</div>
    </div>
  );
}

function DetailBlock({ label, content }: { label: string, content: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</p>
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm text-zinc-300 min-h-[50px]">{content || "Nenhuma informação registrada."}</div>
    </div>
  );
}
