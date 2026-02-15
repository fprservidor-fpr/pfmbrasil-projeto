"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { 
  ClipboardEdit, 
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  ShieldAlert,
  Loader2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  HeartPulse,
  Plus,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type UpdateRequest = {
  id: string;
  requested_changes: any;
  status: string;
  admin_feedback: string;
  created_at: string;
};

export default function SolicitarAlteracaoPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPrimaryGuardian, setIsPrimaryGuardian] = useState<boolean | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  
    const [formData, setFormData] = useState({
      guardian1_name: "",
      guardian1_cpf: "",
      guardian1_titulo: "",
      guardian1_whatsapp: "",
      guardian2_name: "",
      guardian2_cpf: "",
      guardian2_titulo: "",
      guardian2_whatsapp: "",
      observations: "",
      students_whatsapp: {} as Record<string, string>,
      health_data: {} as Record<string, any>,
      selected_student_id: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      fetchLinkedStudents();
      fetchRequests();
    }, [profile]);

    async function fetchLinkedStudents() {
      if (!profile) return;
      
      if (profile.role !== "responsavel") {
        setIsPrimaryGuardian(true);
        return;
      }

        try {
          const userCpf = profile.cpf?.replace(/\D/g, "").padStart(11, '0');
          if (!userCpf) {
            setIsPrimaryGuardian(false);
            return;
          }

          const { data: linkedStudents, error } = await supabase
            .from("students")
            .select("*")
            .or(`guardian1_cpf.eq.${userCpf},guardian2_cpf.eq.${userCpf},responsavel_cpf.eq.${userCpf}`);

        if (error) throw error;

        if (linkedStudents && linkedStudents.length > 0) {
          setStudents(linkedStudents);
          
          const storedStudentId = sessionStorage.getItem("selectedStudentId");
          const currentStudent = linkedStudents.find(s => s.id === storedStudentId) || linkedStudents[0];
          
            setFormData(prev => ({
              ...prev,
              guardian1_name: currentStudent.guardian1_name || "",
              guardian1_cpf: currentStudent.guardian1_cpf || "",
              guardian1_titulo: currentStudent.guardian1_titulo || "",
              guardian1_whatsapp: currentStudent.guardian1_whatsapp || "",
              guardian2_name: currentStudent.guardian2_name || "",
              guardian2_cpf: currentStudent.guardian2_cpf || "",
              guardian2_titulo: currentStudent.guardian2_titulo || "",
              guardian2_whatsapp: currentStudent.guardian2_whatsapp || "",
              selected_student_id: currentStudent.id,
              students_whatsapp: linkedStudents.reduce((acc, s) => {
                acc[s.id] = s.whatsapp || "";
                return acc;
              }, {} as Record<string, string>),
              health_data: {
                blood_type: currentStudent.blood_type || "",
                health_1_plano_saude: currentStudent.health_1_plano_saude || false,
                health_2_vacina_covid: currentStudent.health_2_vacina_covid || false,
                health_3_assistencia_social: currentStudent.health_3_assistencia_social || false,
                health_4_psicologo: currentStudent.health_4_psicologo || false,
                health_5_transtorno_psiquico: currentStudent.health_5_transtorno_psiquico || false,
                health_6_algum_problema: currentStudent.health_6_algum_problema || false,
                health_7_epiletico: currentStudent.health_7_epiletico || false,
                health_8_diabetico: currentStudent.health_8_diabetico || false,
                health_9_atividade_fisica: currentStudent.health_9_atividade_fisica || false,
                health_10_restricao_alimentar: currentStudent.health_10_restricao_alimentar || false,
                health_11_acompanhamento_nutricional: currentStudent.health_11_acompanhamento_nutricional || false,
                health_12_alergia: currentStudent.health_12_alergia || false,
                health_13_medicamento: currentStudent.health_13_medicamento || false,
                health_14_cirurgia: currentStudent.health_14_cirurgia || false,
                health_plano_saude_descricao: currentStudent.health_plano_saude_descricao || "",
                health_assistencia_social_descricao: currentStudent.health_assistencia_social_descricao || "",
                health_transtorno_psiquico_descricao: currentStudent.health_transtorno_psiquico_descricao || "",
                health_problema_saude_descricao: currentStudent.health_problema_saude_descricao || "",
                health_restricao_alimentar_descricao: currentStudent.health_restricao_alimentar_descricao || "",
                health_cirurgia_descricao: currentStudent.health_cirurgia_descricao || "",
                alergias: currentStudent.alergias || "",
                medicamentos: currentStudent.medicamentos || "",
                observacoes: currentStudent.observacoes || ""
              }
            }));

          const g1Cpf = currentStudent.guardian1_cpf?.replace(/\D/g, "");
          setIsPrimaryGuardian(userCpf === g1Cpf);
        } else {
          setIsPrimaryGuardian(false);
        }
      } catch (error) {
        console.error("Erro ao buscar alunos vinculados:", error);
        setIsPrimaryGuardian(false);
      }
    }

    const handleStudentChange = (studentId: string) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const userCpf = profile?.cpf?.replace(/\D/g, "");
      const g1Cpf = student.guardian1_cpf?.replace(/\D/g, "");
      setIsPrimaryGuardian(userCpf === g1Cpf);

      setFormData(prev => ({
        ...prev,
        selected_student_id: studentId,
        health_data: {
          blood_type: student.blood_type || "",
          health_1_plano_saude: student.health_1_plano_saude || false,
          health_2_vacina_covid: student.health_2_vacina_covid || false,
          health_3_assistencia_social: student.health_3_assistencia_social || false,
          health_4_psicologo: student.health_4_psicologo || false,
          health_5_transtorno_psiquico: student.health_5_transtorno_psiquico || false,
          health_6_algum_problema: student.health_6_algum_problema || false,
          health_7_epiletico: student.health_7_epiletico || false,
          health_8_diabetico: student.health_8_diabetico || false,
          health_9_atividade_fisica: student.health_9_atividade_fisica || false,
          health_10_restricao_alimentar: student.health_10_restricao_alimentar || false,
          health_11_acompanhamento_nutricional: student.health_11_acompanhamento_nutricional || false,
          health_12_alergia: student.health_12_alergia || false,
          health_13_medicamento: student.health_13_medicamento || false,
          health_14_cirurgia: student.health_14_cirurgia || false,
          health_plano_saude_descricao: student.health_plano_saude_descricao || "",
          health_assistencia_social_descricao: student.health_assistencia_social_descricao || "",
          health_transtorno_psiquico_descricao: student.health_transtorno_psiquico_descricao || "",
          health_problema_saude_descricao: student.health_problema_saude_descricao || "",
          health_restricao_alimentar_descricao: student.health_restricao_alimentar_descricao || "",
          health_cirurgia_descricao: student.health_cirurgia_descricao || "",
          alergias: student.alergias || "",
          medicamentos: student.medicamentos || "",
          observacoes: student.observacoes || ""
        }
      }));
    };

    async function fetchRequests() {
      if (!profile) return;
      try {
        setLoading(true);
        let query = supabase
          .from("data_update_requests")
          .select("*, students(nome_completo, nome_guerra)");
        
        if (profile.role === 'responsavel') {
          query = query.eq("guardian_id", profile.id);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
      } finally {
        setLoading(false);
      }
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!isPrimaryGuardian) {
        return toast.error("Apenas o responsável titular (01) pode solicitar alterações.");
      }

      try {
        setIsSubmitting(true);
        
        const selectedStudentId = formData.selected_student_id;
        if (!selectedStudentId) {
          return toast.error("Selecione um aluno primeiro.");
        }

        const { error } = await supabase.from("data_update_requests").insert({
          student_id: selectedStudentId,
          guardian_id: profile?.id,
          requested_changes: formData,
          status: "pendente"
        });


      if (error) throw error;

      toast.success("Solicitação enviada com sucesso!");
      setShowForm(false);
      fetchRequests();
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao processar sua solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado": return <CheckCircle2 className="w-4 h-4" />;
      case "recusado": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "recusado": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    }
  };

  if (isPrimaryGuardian === false && profile?.role === "responsavel") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full" />
          <div className="relative w-24 h-24 rounded-[2rem] bg-slate-900 border border-rose-500/30 flex items-center justify-center shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">ACESSO RESTRITO</h1>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
          Você está logado como <span className="text-white font-bold">Responsável 02</span>. 
          Por questões de segurança, apenas o <span className="text-white font-bold">Responsável Titular (01)</span> pode solicitar alterações nos dados cadastrais.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="rounded-2xl px-8 h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all font-bold"
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Fluxo de Atendimento</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            Alteração de <span className="text-purple-500">Dados</span>
          </h1>
          <p className="text-slate-400 font-medium">Mantenha as informações da família sempre atualizadas.</p>
        </div>

        <Button 
          onClick={() => setShowForm(prev => !prev)}
          disabled={isPrimaryGuardian === null}
          className={cn(
            "h-14 px-8 rounded-2xl font-black transition-all duration-500 shadow-2xl",
            showForm 
              ? "bg-slate-800 hover:bg-slate-700 text-white border border-white/10" 
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20"
          )}
        >
          {isPrimaryGuardian === null ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : showForm ? (
            <div className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5 rotate-180" />
              Ver Histórico
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Nova Solicitação
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Alert Info */}
              <div className="bg-amber-500/10 border-b border-white/5 p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200 uppercase tracking-tight">Processo de Aprovação</h4>
                  <p className="text-xs text-amber-200/60 font-medium">As alterações serão analisadas pela administração antes de serem efetivadas no sistema.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Guardian 1 */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Responsável 01</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Titular da Conta</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-purple-400 transition-colors">Nome Completo</label>
                          <Input 
                            value={formData.guardian1_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, guardian1_name: e.target.value }))}
                            className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/30 transition-all text-white font-medium"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-purple-400 transition-colors">CPF</label>
                            <Input 
                              value={formData.guardian1_cpf}
                              onChange={(e) => setFormData(prev => ({ ...prev, guardian1_cpf: e.target.value }))}
                              className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/30 transition-all text-white font-medium"
                            />
                          </div>
                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-purple-400 transition-colors">WhatsApp</label>
                            <Input 
                              value={formData.guardian1_whatsapp}
                              onChange={(e) => setFormData(prev => ({ ...prev, guardian1_whatsapp: e.target.value }))}
                              className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/30 transition-all text-white font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-purple-400 transition-colors">Título de Eleitor</label>
                          <Input 
                            value={formData.guardian1_titulo}
                            onChange={(e) => setFormData(prev => ({ ...prev, guardian1_titulo: e.target.value }))}
                            className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/30 transition-all text-white font-medium"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Guardian 2 */}
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Responsável 02</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Representante</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-400 transition-colors">Nome Completo</label>
                          <Input 
                            value={formData.guardian2_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, guardian2_name: e.target.value }))}
                            className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-white font-medium"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-400 transition-colors">CPF</label>
                            <Input 
                              value={formData.guardian2_cpf}
                              onChange={(e) => setFormData(prev => ({ ...prev, guardian2_cpf: e.target.value }))}
                              className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-white font-medium"
                            />
                          </div>
                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-400 transition-colors">WhatsApp</label>
                            <Input 
                              value={formData.guardian2_whatsapp}
                              onChange={(e) => setFormData(prev => ({ ...prev, guardian2_whatsapp: e.target.value }))}
                              className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-white font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-400 transition-colors">Título de Eleitor</label>
                          <Input 
                            value={formData.guardian2_titulo}
                            onChange={(e) => setFormData(prev => ({ ...prev, guardian2_titulo: e.target.value }))}
                            className="bg-slate-950/50 border-white/5 h-14 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-white font-medium"
                          />
                        </div>
                    </div>
                  </section>
                </div>

                  {/* Medical Data Section */}
                  <section className="space-y-8 pt-12 border-t border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center">
                          <HeartPulse className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Dados Médicos</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Informações de Saúde do Aluno</p>
                        </div>
                      </div>

                      {students.length > 1 && (
                        <div className="flex flex-col gap-2 min-w-[240px]">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Alterar dados de:</label>
                          <select 
                            value={formData.selected_student_id}
                            onChange={(e) => handleStudentChange(e.target.value)}
                            className="bg-slate-950/50 border border-white/10 h-12 rounded-xl text-white text-xs px-4 focus:ring-emerald-500/20 focus:border-emerald-500/30 outline-none appearance-none cursor-pointer"
                          >
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.nome_completo}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div 
                          onClick={() => document.getElementById('blood_type_input')?.focus()}
                          className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl group hover:border-emerald-500/20 transition-all cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight group-hover:text-white transition-colors">Tipo Sanguíneo</label>
                            <p className="text-[10px] text-slate-600 font-bold uppercase">Incluindo fator RH</p>
                          </div>
                            <div className="relative flex items-center">
                              <Input 
                                  id="blood_type_input"
                                  value={formData.health_data.blood_type || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      health_data: { ...prev.health_data, blood_type: value }
                                    }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="O+"
                                  className="bg-slate-900 border-white/10 w-24 h-10 rounded-xl text-center font-black text-emerald-400 uppercase placeholder:text-slate-800 focus:ring-emerald-500/20"
                                />
                                {!formData.health_data.blood_type && (
                                  <Plus className="absolute -left-2 -top-2 w-4 h-4 text-emerald-500 bg-slate-950 rounded-full p-0.5 border border-emerald-500/50 shadow-lg animate-pulse pointer-events-none" />
                                )}
                              </div>
                            </div>
  
                            {[
                              { id: "health_1_plano_saude", label: "Possui Plano de Saúde?" },
                              { id: "health_2_vacina_covid", label: "Vacina COVID em dia?" },
                              { id: "health_3_assistencia_social", label: "Possui Assistência Social?" },
                              { id: "health_4_psicologo", label: "Faz acompanhamento Psicológico?" },
                              { id: "health_5_transtorno_psiquico", label: "Possui Transtorno Psíquico?" },
                              { id: "health_6_algum_problema", label: "Possui algum Problema de Saúde?" },
                              { id: "health_7_epiletico", label: "É Epilético?" },
                              { id: "health_8_diabetico", label: "É Diabético?" },
                              { id: "health_9_atividade_fisica", label: "Pode realizar Atividade Física?" },
                              { id: "health_10_restricao_alimentar", label: "Possui Restrição Alimentar?" },
                              { id: "health_11_acompanhamento_nutricional", label: "Faz Acompanhamento Nutricional?" },
                              { id: "health_12_alergia", label: "Possui Alergias?" },
                              { id: "health_13_medicamento", label: "Toma algum Medicamento?" },
                              { id: "health_14_cirurgia", label: "Já realizou alguma Cirurgia?" },
                            ].map((item) => {
                              const isActive = formData.health_data[item.id] || false;
                              return (
                                <div 
                                  key={item.id} 
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      health_data: { ...prev.health_data, [item.id]: !isActive }
                                    }));
                                  }}
                                  className={cn(
                                    "flex items-center justify-between p-4 bg-slate-950/40 border rounded-2xl group transition-all cursor-pointer select-none",
                                    isActive ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]" : "border-white/5 hover:border-emerald-500/20"
                                  )}
                                >
                                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-tight group-hover:text-white transition-colors cursor-pointer">{item.label}</label>
                                  <div className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black transition-all min-w-[60px] text-center",
                                    isActive 
                                      ? "bg-emerald-500 text-white shadow-[0_0_15px_-5px_rgba(16,185,129,0.5)]" 
                                      : "bg-slate-900 text-slate-600 border border-white/5"
                                  )}>
                                    {isActive ? "SIM" : "NÃO"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
  
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                              { id: "health_plano_saude_descricao", label: "Detalhes do Plano de Saúde", placeholder: "Nome do plano, carência, etc.", toggleId: "health_1_plano_saude" },
                              { id: "health_assistencia_social_descricao", label: "Detalhes Assistência Social", placeholder: "Qual programa ou benefício?", toggleId: "health_3_assistencia_social" },
                              { id: "health_transtorno_psiquico_descricao", label: "Detalhes Transtorno Psíquico", placeholder: "Descreva o transtorno ou condição", toggleId: "health_5_transtorno_psiquico" },
                              { id: "health_problema_saude_descricao", label: "Detalhes Problema de Saúde", placeholder: "Qual a condição ou diagnóstico?", toggleId: "health_6_algum_problema" },
                              { id: "health_restricao_alimentar_descricao", label: "Detalhes Restrição Alimentar", placeholder: "Quais alimentos devem ser evitados?", toggleId: "health_10_restricao_alimentar" },
                              { id: "alergias", label: "Detalhes das Alergias", placeholder: "Descreva as alergias se houver", toggleId: "health_12_alergia" },
                              { id: "medicamentos", label: "Detalhes dos Medicamentos", placeholder: "Quais medicamentos o aluno toma?", toggleId: "health_13_medicamento" },
                              { id: "health_cirurgia_descricao", label: "Detalhes das Cirurgias", placeholder: "Quais cirurgias e quando?", toggleId: "health_14_cirurgia" },
                              { id: "observacoes", label: "Outras Observações Médicas", placeholder: "Informações adicionais importantes", toggleId: null },
                            ].map((field) => {
                              const isToggled = field.toggleId ? (formData.health_data[field.toggleId] || false) : true;
                              if (!isToggled) return null;

                              return (
                                <div key={field.id} className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-500">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 group-focus-within:text-emerald-400 transition-colors">
                                    {field.label}
                                  </label>
                                  <div className="relative group/field">
                                    <Textarea 
                                      value={formData.health_data[field.id] || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData(prev => ({
                                          ...prev,
                                          health_data: { ...prev.health_data, [field.id]: value }
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder={field.placeholder}
                                      className="bg-slate-950/50 border-white/5 min-h-[100px] rounded-2xl text-white font-medium pl-10 pt-4 transition-all focus:border-emerald-500/30"
                                    />
                                    <Plus className={cn(
                                      "absolute left-4 top-4 w-4 h-4 transition-all pointer-events-none",
                                      formData.health_data[field.id] ? "text-emerald-500" : "text-slate-600 group-hover/field:text-emerald-400"
                                    )} />
                                    {!formData.health_data[field.id] && (
                                      <span className="absolute left-10 top-4 text-[10px] font-black text-slate-700 uppercase tracking-widest pointer-events-none group-hover/field:text-emerald-500/50 transition-colors">Incluir informação</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                  </section>

                  {/* Student Contacts */}
                  {students.length > 0 && (
                    <section className="space-y-6 pt-12 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">WhatsApp dos Dependentes</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {students.map((student) => (
                          <div 
                            key={student.id}
                            className="group relative p-4 bg-slate-950/40 border border-white/5 rounded-[1.5rem] hover:bg-slate-900/60 hover:border-purple-500/30 transition-all duration-500"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-slate-600 text-xs group-hover:text-purple-400 group-hover:border-purple-500/20 transition-all">
                                {student.nome_guerra?.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white leading-tight">{student.nome_completo}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{student.nome_guerra}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Input 
                                value={formData.students_whatsapp[student.id] || ""}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  students_whatsapp: {
                                    ...prev.students_whatsapp,
                                    [student.id]: e.target.value
                                  }
                                }))}
                                placeholder="WhatsApp do aluno"
                                className="bg-slate-950/50 border-white/5 h-11 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-4 pt-8 border-t border-white/5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Observações Adicionais para a Administração</label>
                    <Textarea 
                      placeholder="Descreva o motivo da mudança ou outras observações importantes..."
                      className="bg-slate-950/50 border-white/5 text-white min-h-[120px] rounded-[1.5rem] resize-none focus:ring-purple-500/20 font-medium"
                      value={formData.observations}
                      onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                    />
                </section>
                
                <div className="flex justify-center pt-8">
                  <Button 
                    disabled={isSubmitting}
                    className="relative group h-16 px-16 rounded-[1.5rem] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg transition-all shadow-[0_20px_40px_-10px_rgba(147,51,234,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-3">
                        Enviar Solicitação
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-[2rem] border border-white/5" />
                ))}
              </div>
            ) : requests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {requests.map((request, i) => (
                  <motion.div 
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] hover:bg-slate-900/60 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-purple-500/20 transition-all shadow-inner">
                        <ClipboardEdit className="w-7 h-7 text-slate-700 group-hover:text-purple-500 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-black uppercase tracking-tight">Solicitação #{request.id.split("-")[0].toUpperCase()}</h3>
                          <div className={cn("px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", getStatusColor(request.status))}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </div>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                          Enviada em {new Date(request.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    {request.admin_feedback && (
                      <div className="flex-1 md:max-w-[40%] bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1 text-slate-500">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Feedback Administrativo</span>
                        </div>
                        <p className="text-xs text-slate-300 italic font-medium">"{request.admin_feedback}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-slate-600 group-hover:border-purple-500/20 group-hover:text-purple-400 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-white/5"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-slate-500/10 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center">
                    <ClipboardEdit className="w-10 h-10 text-slate-800" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Sem histórico de solicitações</h3>
                <p className="text-slate-600 mt-2 font-medium">Você ainda não realizou nenhuma solicitação de alteração.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
