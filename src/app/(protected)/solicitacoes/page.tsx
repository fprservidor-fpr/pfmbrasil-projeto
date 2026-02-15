"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, User, ArrowRight, ShieldCheck, Search, HeartPulse, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";

export default function AdminSolicitacoesPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("data_update_requests")
        .select("*, students(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
      setPendingCount(data?.filter((r: any) => r.status === 'pendente').length || 0);
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (profile?.role !== "admin" && profile?.role !== "coord_geral" && profile?.role !== "coord_nucleo") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-zinc-400 text-sm">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const changes = selectedRequest.requested_changes;
      
      // Prepare update object for student
      const studentUpdate: any = {
        guardian1_name: changes.guardian1_name,
        guardian1_cpf: changes.guardian1_cpf,
        guardian1_titulo: changes.guardian1_titulo,
        guardian1_whatsapp: changes.guardian1_whatsapp,
        guardian2_name: changes.guardian2_name,
        guardian2_cpf: changes.guardian2_cpf,
        guardian2_titulo: changes.guardian2_titulo,
        guardian2_whatsapp: changes.guardian2_whatsapp,
      };

      // Ensure primary responsavel fields are updated too if they match guardian 1
      if (changes.guardian1_name) studentUpdate.responsavel_nome = changes.guardian1_name;
      if (changes.guardian1_cpf) studentUpdate.responsavel_cpf = changes.guardian1_cpf;
      if (changes.guardian1_whatsapp) studentUpdate.responsavel_whatsapp = changes.guardian1_whatsapp;

      // If health data is present, include it in the update
      if (changes.health_data) {
        Object.assign(studentUpdate, changes.health_data);
      }

      // 1. Update Student Data
      const { error: studentError } = await supabase
        .from("students")
        .update(studentUpdate)
        .eq("id", selectedRequest.student_id);

      if (studentError) throw studentError;

      // 2. Update Students' WhatsApp if present
      if (changes.students_whatsapp) {
        for (const [studentId, whatsapp] of Object.entries(changes.students_whatsapp)) {
          const { error: swError } = await supabase
            .from("students")
            .update({ whatsapp })
            .eq("id", studentId);
          
          if (swError) console.error(`Erro ao atualizar whatsapp do aluno ${studentId}:`, swError);
        }
      }

        // 3. Update Request Status
        const { error: requestError } = await supabase
          .from("data_update_requests")
          .update({
            status: "aprovado",
            admin_feedback: feedback || "Solicitação aprovada e dados atualizados.",
            reviewed_at: new Date().toISOString(),
            reviewed_by: profile?.id
          })
          .eq("id", selectedRequest.id);


      if (requestError) throw requestError;

      toast.success("Solicitação aprovada!");
      setSelectedRequest(null);
      setFeedback("");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao aprovar: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!feedback.trim()) return toast.error("Informe um motivo para a recusa");
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("data_update_requests")
        .update({
          status: "recusado",
          admin_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Solicitação recusada");
      setSelectedRequest(null);
      setFeedback("");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao recusar");
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.students?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.students?.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

    const getHealthFieldLabel = (id: string) => {
      const labels: Record<string, string> = {
        blood_type: "Tipo Sanguíneo",
        health_1_plano_saude: "Plano de Saúde",
        health_2_vacina_covid: "Vacina COVID",

      health_3_assistencia_social: "Assistência Social",
      health_4_psicologo: "Psicólogo",
      health_5_transtorno_psiquico: "Transtorno Psíquico",
      health_6_algum_problema: "Problema de Saúde",
      health_7_epiletico: "Epilético",
      health_8_diabetico: "Diabético",
      health_9_atividade_fisica: "Atividade Física",
      health_10_restricao_alimentar: "Restrição Alimentar",
      health_11_acompanhamento_nutricional: "Nutricional",
      health_12_alergia: "Alergia",
      health_13_medicamento: "Medicamento",
      health_14_cirurgia: "Cirurgia",
      health_plano_saude_descricao: "Descr. Plano",
      health_assistencia_social_descricao: "Descr. Assist. Social",
      health_transtorno_psiquico_descricao: "Descr. Transtorno",
      health_problema_saude_descricao: "Descr. Problema",
      health_restricao_alimentar_descricao: "Descr. Restrição",
      health_cirurgia_descricao: "Descr. Cirurgia",
      alergias: "Alergias",
      medicamentos: "Medicamentos",
      observacoes: "Obs. Médicas"
    };
    return labels[id] || id;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-500 w-8 h-8" />
            Triagem de Alterações
          </h1>
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-black border-none animate-pulse text-[10px] font-black uppercase">
              {pendingCount} Pendente(s)
            </Badge>
          )}
        </div>
        <p className="text-zinc-500 font-medium">Gerencie as solicitações de atualização cadastral dos responsáveis.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input 
          placeholder="Buscar por aluno..." 
          className="pl-12 bg-zinc-900 border-zinc-800 h-12 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          filteredRequests.map((request, idx) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6 group hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <div className="w-16 h-16 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
                  <User className="w-8 h-8 text-zinc-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-black uppercase">{request.students?.nome_guerra || "Aluno"}</h3>
                    <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500 uppercase">
                      #{request.id.split("-")[0]}
                    </Badge>
                  </div>
                  <p className="text-zinc-500 text-xs font-medium">{request.students?.nome_completo}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2 tracking-widest">
                    Solicitado em {new Date(request.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                <div className={cn(
                  "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                  request.status === 'pendente' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                  request.status === 'aprovado' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                  "bg-red-500/10 border-red-500/20 text-red-500"
                )}>
                  {request.status === 'pendente' ? <Clock className="w-3 h-3" /> :
                   request.status === 'aprovado' ? <CheckCircle2 className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {request.status}
                </div>

                <Button 
                  onClick={() => setSelectedRequest(request)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-white font-bold rounded-xl h-12 px-6"
                >
                  Analisar Dados
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Analysis Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl p-0 overflow-hidden shadow-2xl rounded-[2.5rem]">
          <DialogHeader className="p-8 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Análise de Solicitação</DialogTitle>
                <DialogDescription className="text-zinc-500">Compare os dados atuais com as alterações solicitadas.</DialogDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black px-4 py-1.5 rounded-xl uppercase">
                Protocolo #{selectedRequest?.id.split("-")[0]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Guardian 1 Comparison */}
              <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
                <CardHeader className="border-b border-zinc-800 p-4">
                  <CardTitle className="text-xs font-black uppercase text-emerald-500">Responsável 01</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[
                    { label: "Nome", current: selectedRequest?.students?.guardian1_name, requested: selectedRequest?.requested_changes?.guardian1_name },
                    { label: "CPF", current: selectedRequest?.students?.guardian1_cpf, requested: selectedRequest?.requested_changes?.guardian1_cpf },
                    { label: "WhatsApp", current: selectedRequest?.students?.guardian1_whatsapp, requested: selectedRequest?.requested_changes?.guardian1_whatsapp },
                    { label: "Título", current: selectedRequest?.students?.guardian1_titulo, requested: selectedRequest?.requested_changes?.guardian1_titulo },
                  ].map((field, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{field.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 line-through truncate">{field.current || "N/A"}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-700 shrink-0" />
                        <span className={cn(
                          "text-sm font-bold",
                          field.current !== field.requested ? "text-emerald-400" : "text-zinc-300"
                        )}>{field.requested || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Guardian 2 Comparison */}
              <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl">
                <CardHeader className="border-b border-zinc-800 p-4">
                  <CardTitle className="text-xs font-black uppercase text-blue-500">Responsável 02</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[
                    { label: "Nome", current: selectedRequest?.students?.guardian2_name, requested: selectedRequest?.requested_changes?.guardian2_name },
                    { label: "CPF", current: selectedRequest?.students?.guardian2_cpf, requested: selectedRequest?.requested_changes?.guardian2_cpf },
                    { label: "WhatsApp", current: selectedRequest?.students?.guardian2_whatsapp, requested: selectedRequest?.requested_changes?.guardian2_whatsapp },
                    { label: "Título", current: selectedRequest?.students?.guardian2_titulo, requested: selectedRequest?.requested_changes?.guardian2_titulo },
                  ].map((field, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{field.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 line-through truncate">{field.current || "N/A"}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-700 shrink-0" />
                        <span className={cn(
                          "text-sm font-bold",
                          field.current !== field.requested ? "text-blue-400" : "text-zinc-300"
                        )}>{field.requested || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Medical Data Comparison */}
            {selectedRequest?.requested_changes?.health_data && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Dados Médicos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(selectedRequest.requested_changes.health_data).map(([key, value]: [string, any]) => {
                    const currentValue = selectedRequest.students[key];
                    const hasChanged = currentValue !== value;
                    
                    if (!hasChanged) return null;

                    return (
                      <div key={key} className="bg-zinc-900/50 border border-rose-500/20 p-4 rounded-2xl space-y-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{getHealthFieldLabel(key)}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 line-through">
                            {typeof currentValue === 'boolean' ? (currentValue ? "Sim" : "Não") : (currentValue || "N/A")}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-700" />
                          <span className="text-xs font-black text-rose-400">
                            {typeof value === 'boolean' ? (value ? "Sim" : "Não") : (value || "N/A")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Student WhatsApp Comparison */}
            {selectedRequest?.requested_changes?.students_whatsapp && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Contatos dos Alunos</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedRequest.requested_changes.students_whatsapp).map(([studentId, requestedWhatsapp]: [string, any]) => {
                    return (
                      <div key={studentId} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                            WA
                          </div>
                          <p className="text-xs font-bold text-zinc-300">ID Aluno: {studentId.substring(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4 text-zinc-700" />
                          <span className="text-sm font-black text-yellow-500">{requestedWhatsapp || "N/A"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Observações do Responsável</label>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-400 italic">
                {selectedRequest?.requested_changes?.observations || "Nenhuma observação informada."}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Feedback do Administrador (Obrigatório para recusa)</label>
              <Textarea 
                placeholder="Informe o feedback ou motivo da recusa..."
                className="bg-zinc-900 border-zinc-800 min-h-[100px] rounded-2xl resize-none focus:ring-emerald-500/20"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-900 border-t border-zinc-800 flex gap-4">
            <Button 
              variant="ghost" 
              onClick={handleReject}
              disabled={processing || !selectedRequest || selectedRequest.status !== 'pendente'}
              className="flex-1 border border-red-500/20 text-red-500 hover:bg-red-500/10 font-black h-14 rounded-2xl uppercase"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recusar Solicitação"}
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={processing || !selectedRequest || selectedRequest.status !== 'pendente'}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 rounded-2xl uppercase shadow-xl shadow-emerald-900/20"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aprovar e Sincronizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
