"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { 
  Megaphone, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Search,
  Users,
  User,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AvisosPage() {
  const { profile } = useAuth();
  const [avisos, setAvisos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const isManagement = ["admin", "coord_geral", "coord_nucleo", "instrutor", "instructor"].includes(profile?.role || "");
  
  const [newAviso, setNewAviso] = useState({
    tipo: "geral",
    titulo: "",
    mensagem: "",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: "",
    destinatario_tipo: "todos",
    turma_id: "all",
    aluno_id: ""
  });

  const [turmas, setTurmas] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const studentId = profile?.role === "aluno" ? profile.student_id : sessionStorage.getItem("selectedStudentId");
      
      let avisosQuery = supabase.from("avisos").select("*, profiles(full_name)").order("created_at", { ascending: false });
      
      // Filter for students/guardians
      if (!isManagement && studentId) {
        // Find student's turma
        const { data: studentData } = await supabase.from("students").select("turma_id").eq("id", studentId).single();
        const turmaId = studentData?.turma_id;
        
        avisosQuery = avisosQuery.or(`destinatario_tipo.eq.todos,and(destinatario_tipo.eq.turma,turma_id.eq.${turmaId}),and(destinatario_tipo.eq.aluno,aluno_id.eq.${studentId})`);
      }

      const [{ data: avisosData }, { data: eventosData }, { data: turmasData }, { data: studentsData }] = await Promise.all([
        avisosQuery,
        studentId ? supabase.from("eventos_notificacoes").select("*").eq("aluno_id", studentId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
        isManagement ? supabase.from("turmas").select("*").order("nome") : Promise.resolve({ data: [] }),
        isManagement ? supabase.from("students").select("id, nome_completo, nome_guerra").eq("status", "ativo").order("nome_completo") : Promise.resolve({ data: [] })
      ]);

      if (avisosData) setAvisos(avisosData);
      if (eventosData) setEventos(eventosData);
      if (turmasData) setTurmas(turmasData);
      if (studentsData) setStudents(studentsData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleSaveAviso = async () => {
    if (!newAviso.titulo.trim() || !newAviso.mensagem.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        titulo: newAviso.titulo,
        mensagem: newAviso.mensagem,
        tipo: newAviso.tipo,
        data_inicio: newAviso.data_inicio,
        data_fim: newAviso.data_fim || null,
        destinatario_tipo: newAviso.destinatario_tipo,
        created_by: profile?.id
      };

      if (newAviso.destinatario_tipo === "turma" && newAviso.turma_id !== "all") {
        payload.turma_id = newAviso.turma_id;
      }
      if (newAviso.destinatario_tipo === "aluno" && newAviso.aluno_id) {
        payload.aluno_id = newAviso.aluno_id;
      }

      const { error } = await supabase.from("avisos").insert([payload]);
      if (error) throw error;
      
      toast.success("Aviso enviado com sucesso!");
      setNewAviso({
        tipo: "geral",
        titulo: "",
        mensagem: "",
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        data_fim: "",
        destinatario_tipo: "todos",
        turma_id: "all",
        aluno_id: ""
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar aviso");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAviso = async (id: string) => {
    try {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aviso removido!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao remover");
    }
  };

  const filteredAvisos = avisos.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.mensagem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 md:p-12 rounded-[40px] bg-slate-900/40 backdrop-blur-3xl border border-white/5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
              <Megaphone className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Avisos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Comunicados</span></h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Central de informações, eventos e notificações do sistema</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input 
                placeholder="Pesquisar comunicados..."
                className="pl-12 bg-slate-900/40 backdrop-blur-xl border-white/5 text-white h-14 rounded-2xl focus:ring-violet-500/20 placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
              </div>
            ) : filteredAvisos.length === 0 && eventos.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 rounded-[40px] border border-dashed border-white/5">
                <Megaphone className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-500">Nenhum comunicado no momento</h3>
              </div>
            ) : (
              <>
                {/* Eventos Automáticos (Méritos, Presença, etc) */}
                {eventos.map((ev, idx) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex gap-6 relative group overflow-hidden"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                      ev.tipo === 'merito' ? "bg-emerald-500/10 text-emerald-500" :
                      ev.tipo === 'demerito' ? "bg-red-500/10 text-red-500" :
                      ev.tipo === 'falta' ? "bg-amber-500/10 text-amber-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {ev.tipo === 'merito' ? <TrendingUp className="w-7 h-7" /> :
                       ev.tipo === 'demerito' ? <TrendingDown className="w-7 h-7" /> :
                       ev.tipo === 'falta' ? <Clock className="w-7 h-7" /> :
                       <CalendarCheck className="w-7 h-7" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={cn(
                          "uppercase text-[9px] font-black tracking-[0.2em] px-3 py-1",
                          ev.tipo === 'merito' ? "bg-emerald-500 text-white" :
                          ev.tipo === 'demerito' ? "bg-red-500 text-white" :
                          "bg-zinc-800 text-zinc-400"
                        )}>
                          {ev.tipo}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {format(new Date(ev.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-lg mb-1">{ev.descricao}</h4>
                    </div>
                  </motion.div>
                ))}

                {/* Avisos Criados */}
                {filteredAvisos.map((aviso, idx) => (
                  <motion.div
                    key={aviso.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (eventos.length + idx) * 0.05 }}
                    className={cn(
                      "p-8 rounded-[40px] border relative group overflow-hidden transition-all duration-500",
                      aviso.tipo === 'urgente' ? "bg-red-500/5 border-red-500/20" : 
                      aviso.tipo === 'informativo' ? "bg-blue-500/5 border-blue-500/20" :
                      "bg-slate-900/40 border-white/5"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          aviso.tipo === 'urgente' ? "bg-red-500/20 text-red-500" : 
                          aviso.tipo === 'informativo' ? "bg-blue-500/20 text-blue-500" :
                          "bg-violet-500/20 text-violet-500"
                        )}>
                          {aviso.tipo === 'urgente' ? <AlertTriangle className="w-6 h-6" /> : 
                           aviso.tipo === 'informativo' ? <Info className="w-6 h-6" /> :
                           <Megaphone className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {aviso.tipo} • {format(new Date(aviso.data_inicio), "dd/MM/yyyy")}
                          </span>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mt-1">{aviso.titulo}</h3>
                        </div>
                      </div>
                      
                      {isManagement && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteAviso(aviso.id)}
                          className="text-slate-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>

                    <p className="text-slate-400 leading-relaxed font-medium mb-6">
                      {aviso.mensagem}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 uppercase">
                          {aviso.profiles?.full_name?.charAt(0) || "S"}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Enviado por: {aviso.profiles?.full_name || "Sistema"}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-white/5 text-slate-500">
                        {aviso.destinatario_tipo === 'todos' ? 'Público' : 
                         aviso.destinatario_tipo === 'turma' ? 'Turma Específica' : 'Privado'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>

        {isManagement ? (
          <div className="space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-3xl border-white/5 rounded-[32px] overflow-hidden sticky top-8">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-violet-500" />
                  </div>
                  Novo Comunicado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Público Alvo</Label>
                  <Select 
                    value={newAviso.destinatario_tipo} 
                    onValueChange={(val) => setNewAviso({ ...newAviso, destinatario_tipo: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="todos">Todos (Geral)</SelectItem>
                      <SelectItem value="turma">Por Turma</SelectItem>
                      <SelectItem value="aluno">Por Aluno (Privado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAviso.destinatario_tipo === 'turma' && (
                  <div className="space-y-2">
                    <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Selecionar Turma</Label>
                    <Select value={newAviso.turma_id} onValueChange={(val) => setNewAviso({ ...newAviso, turma_id: val })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="all">Todas as Turmas</SelectItem>
                        {turmas.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newAviso.destinatario_tipo === 'aluno' && (
                  <div className="space-y-2">
                    <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Pesquisar Aluno</Label>
                    <Select value={newAviso.aluno_id} onValueChange={(val) => setNewAviso({ ...newAviso, aluno_id: val })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                        <SelectValue placeholder="Escolha o aluno" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.nome_guerra} ({s.nome_completo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Tipo</Label>
                  <Select value={newAviso.tipo} onValueChange={(val) => setNewAviso({ ...newAviso, tipo: val })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="urgente">Urgente (Destaque Vermelho)</SelectItem>
                      <SelectItem value="informativo">Informativo (Destaque Azul)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Título</Label>
                  <Input 
                    value={newAviso.titulo}
                    onChange={(e) => setNewAviso({ ...newAviso, titulo: e.target.value })}
                    placeholder="Resumo do comunicado..."
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-violet-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Mensagem Detalhada</Label>
                  <Textarea 
                    value={newAviso.mensagem}
                    onChange={(e) => setNewAviso({ ...newAviso, mensagem: e.target.value })}
                    placeholder="Descreva as orientações..."
                    className="bg-white/5 border-white/10 text-white min-h-[150px] rounded-2xl focus:ring-violet-500/20 resize-none"
                  />
                </div>

                <Button 
                  onClick={handleSaveAviso} 
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-violet-500/20 transition-all active:scale-95"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Disparar Comunicado"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 backdrop-blur-3xl border-violet-500/10 rounded-[32px] p-8 sticky top-8">
              <h4 className="text-white font-black uppercase tracking-widest text-sm mb-4">Informação Rápida</h4>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Esta central exibe comunicados oficiais da coordenação e instrutores, além de registrar méritos, demeritos e eventos importantes da sua jornada.
              </p>
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Urgente</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Informativo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Mérito Operacional</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
