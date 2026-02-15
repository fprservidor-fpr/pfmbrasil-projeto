"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Target
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIPO_COLORS: Record<string, string> = {
  feriado: "bg-red-500/10 text-red-500 border-red-500/20",
  recesso: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  evento: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reuniao: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ferias: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  corte_cabelo: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  campeonato: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  provas: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  interno: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  ponto_facultativo: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  missao: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  atividade: "bg-blue-600/10 text-blue-400 border-blue-600/20",
};

const TIPO_LABELS: Record<string, string> = {
  feriado: "Feriado",
  recesso: "Recesso",
  evento: "Evento",
  reuniao: "Reunião de Pais",
  ferias: "Férias",
  corte_cabelo: "Corte de Cabelo",
  campeonato: "Campeonato",
  provas: "Provas",
  interno: "Interno",
  ponto_facultativo: "Ponto Facultativo",
  missao: "Missões",
  atividade: "Atividades",
};

const TIPOS_PUBLICOS = ['reuniao', 'recesso', 'provas', 'feriado', 'ponto_facultativo', 'corte_cabelo', 'campeonato', 'ferias', 'missao', 'atividade'];

type Evento = {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  anotacoes?: string;
  visivel_instrutor: boolean;
  visivel_responsavel: boolean;
  visivel_aluno: boolean;
  category?: 'calendario' | 'missao';
};

export default function CalendarioPage() {
  const { profile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [tipos, setTipos] = useState<{ value: string; label: string; color_class: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [typeModalOpen, setTypeModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [editingType, setEditingType] = useState<any | null>(null);
    const [newType, setNewType] = useState({ label: "", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
  const [formData, setFormData] = useState({
    data: "",
    tipo: "evento",
    descricao: "",
    anotacoes: "",
    visivel_instrutor: true,
    visivel_responsavel: true,
    visivel_aluno: true,
  });

  const isAdmin = ["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || "");
  const isAdminOrStaff = ["admin", "coord_geral", "coord_nucleo", "instrutor", "instructor"].includes(profile?.role || "");

    const fetchEventos = async () => {
      setLoading(true);
      try {
        const { data: tiposData } = await supabase.from("calendario_tipos").select("value, publico");
        const publicTypes = tiposData?.filter(t => t.publico).map(t => t.value) || [];

        const [eventosRes, missoesRes] = await Promise.all([
          supabase.from("calendario_letivo").select("*").order("data", { ascending: true }),
          supabase.from("missoes_atividades").select("*").order("data_entrega", { ascending: true })
        ]);
        
        let allData: Evento[] = [];

        if (eventosRes.data) {
          const filteredEventos = eventosRes.data.filter(e => {
            if (profile?.role === 'admin' || profile?.role === 'coord_geral' || profile?.role === 'coord_nucleo') return true;
            if (profile?.role === 'instrutor' || profile?.role === 'instructor') return e.visivel_instrutor;
            if (profile?.role === 'responsavel') return e.visivel_responsavel;
            if (profile?.role === 'aluno') return e.visivel_aluno;
            return publicTypes.includes(e.tipo);
          }).map(e => ({ ...e, category: 'calendario' as const }));
          allData = [...allData, ...filteredEventos];
        }

        if (missoesRes.data) {
          const studentTurma = profile?.role === 'aluno' ? (await supabase.from("students").select("turma").eq("id", profile.student_id).single()).data?.turma : null;
          
          const filteredMissoes = missoesRes.data.filter(m => {
            if (profile?.role === 'aluno') {
              return !m.turma_id || m.turma_id === studentTurma;
            }
            return true;
          }).map(m => ({
            id: m.id,
            data: m.data_entrega,
            tipo: m.tipo,
            descricao: m.titulo,
            anotacoes: m.descricao,
            visivel_instrutor: true,
            visivel_responsavel: true,
            visivel_aluno: true,
            category: 'missao' as const
          }));
          allData = [...allData, ...filteredMissoes];
        }

        setEventos(allData);
      } catch (error) {
        console.error("Erro ao buscar calendário:", error);
      } finally {
        setLoading(false);
      }
    };

  const fetchTipos = async () => {
    const { data } = await supabase
      .from("calendario_tipos")
      .select("*")
      .order("label", { ascending: true });
    
    if (data) {
      setTipos(data);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchEventos();
      fetchTipos();
    }
  }, [profile]);

  const handleSaveType = async () => {
    if (!newType.label.trim()) {
      toast.error("Informe o nome do tópico");
      return;
    }

    const value = newType.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");

    try {
      if (editingType) {
        const { error } = await supabase
          .from("calendario_tipos")
          .update({
            label: newType.label,
            color_class: newType.color,
          })
          .eq("id", editingType.id);

        if (error) throw error;
        toast.success("Tópico atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("calendario_tipos")
          .insert({
            value,
            label: newType.label,
            color_class: newType.color,
            publico: true
          });

        if (error) throw error;
        toast.success("Tópico criado com sucesso!");
      }
      
      await fetchTipos();
      if (!editingType) setFormData(prev => ({ ...prev, tipo: value }));
      setTypeModalOpen(false);
      setEditingType(null);
      setNewType({ label: "", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar tópico");
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipos.find(t => t.value === tipo)?.color_class || TIPO_COLORS[tipo] || "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  const getTipoLabel = (tipo: string) => {
    return tipos.find(t => t.value === tipo)?.label || TIPO_LABELS[tipo] || tipo;
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    return eventos.filter(e => isSameDay(new Date(e.data + "T00:00:00"), day));
  };

  const openModal = (evento?: Evento, day?: Date) => {
    if (evento?.category === 'missao') {
      router.push('/materiais');
      return;
    }

    if (evento) {
      setEditingEvento(evento);
      setFormData({
        data: evento.data,
        tipo: evento.tipo,
        descricao: evento.descricao,
        anotacoes: evento.anotacoes || "",
        visivel_instrutor: evento.visivel_instrutor ?? true,
        visivel_responsavel: evento.visivel_responsavel ?? true,
        visivel_aluno: evento.visivel_aluno ?? true,
      });
    } else {
      setEditingEvento(null);
      setFormData({
        data: day ? format(day, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        tipo: "evento",
        descricao: "",
        anotacoes: "",
        visivel_instrutor: true,
        visivel_responsavel: true,
        visivel_aluno: true,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvento(null);
    setSelectedDay(null);
    setFormData({ 
      data: "", 
      tipo: "evento", 
      descricao: "", 
      anotacoes: "",
      visivel_instrutor: true,
      visivel_responsavel: true,
      visivel_aluno: true,
    });
  };

  const handleSave = async () => {
    if (!formData.data || !formData.descricao.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        anotacoes: formData.anotacoes || null,
        visivel_instrutor: formData.visivel_instrutor,
        visivel_responsavel: formData.visivel_responsavel,
        visivel_aluno: formData.visivel_aluno,
      };

      if (editingEvento) {
        const { error } = await supabase
          .from("calendario_letivo")
          .update(payload)
          .eq("id", editingEvento.id);

        if (error) throw error;
        toast.success("Evento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("calendario_letivo")
          .insert(payload);

        if (error) throw error;
        toast.success("Evento criado com sucesso!");
      }
      closeModal();
      fetchEventos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evento: Evento) => {
    if (evento.category === 'missao') {
      toast.error("Missões devem ser excluídas na Central de Materiais");
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o evento "${evento.descricao}"?`)) return;

    try {
      const { error } = await supabase
        .from("calendario_letivo")
        .delete()
        .eq("id", evento.id);

      if (error) throw error;
      toast.success("Evento excluído com sucesso!");
      fetchEventos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir evento");
    }
  };

  const handleDayClick = (day: Date) => {
    if (isAdminOrStaff) {
      setSelectedDay(day);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Calendário Escolar</h1>
          <p className="text-zinc-500 mt-1">Planejamento anual, eventos e missões táticas.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrStaff && (
            <Button 
              onClick={() => openModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          )}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-bold text-white min-w-[140px] text-center uppercase tracking-widest text-sm">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/50">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                  <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-32 border-b border-r border-zinc-800 bg-zinc-950/20" />
                ))}
                
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isTodayDay = isToday(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  
                  return (
                    <div 
                      key={day.toString()} 
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "h-32 border-b border-r border-zinc-800 p-2 transition-colors group relative",
                        isTodayDay && "bg-blue-500/5",
                        isAdminOrStaff && "cursor-pointer hover:bg-zinc-800/30",
                        isSelected && "bg-emerald-500/10 ring-1 ring-emerald-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          isTodayDay ? "text-blue-500" : "text-zinc-500 group-hover:text-zinc-300"
                        )}>
                          {format(day, "d")}
                        </span>
                        {isAdminOrStaff && isSelected && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal(undefined, day); }}
                            className="p-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] no-scrollbar">
                        {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); openModal(event); }}
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded border leading-tight font-medium truncate flex items-center gap-1",
                                getTipoColor(event.tipo),
                                "cursor-pointer hover:opacity-80"
                              )}
                              title={event.descricao}
                            >
                              {event.category === 'missao' && <Target className="w-2 h-2 shrink-0" />}
                              {event.descricao}
                            </div>

                        ))}
                      </div>

                      {isTodayDay && (
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </div>
                  );
                })}

                {Array.from({ length: (7 - (monthEnd.getDay() + 1)) % 7 }).map((_, i) => (
                  <div key={`empty-next-${i}`} className="h-32 border-b border-r border-zinc-800 bg-zinc-950/20" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="border-b border-zinc-800/50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Próximos Compromissos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {eventos.filter(e => new Date(e.data + "T00:00:00") >= new Date()).slice(0, 10).map(event => (
                  <div key={event.id} className="p-4 hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 flex items-center gap-1", getTipoColor(event.tipo))}>
                              {event.category === 'missao' && <Target className="w-2 h-2" />}
                              {getTipoLabel(event.tipo)}
                            </Badge>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {format(new Date(event.data + "T00:00:00"), "dd/MM/yyyy")}
                            </span>
                          </div>

                        <h4 className="text-sm font-bold text-white leading-snug">{event.descricao}</h4>
                        {event.anotacoes && (
                          <p className="text-xs text-zinc-500 line-clamp-2">{event.anotacoes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(event)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          {event.category === 'missao' ? <Target className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        </button>
                        {isAdminOrStaff && event.category === 'calendario' && (
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-1.5 bg-zinc-800 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {eventos.length === 0 && (
                  <div className="p-8 text-center text-zinc-600">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Nenhum evento futuro registrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Legenda
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {tipos.map((tipo) => (
                <div key={tipo.value} className={cn("flex items-center gap-2 text-xs px-2 py-1.5 rounded border", tipo.color_class)}>
                  <div className={cn("w-2 h-2 rounded-full", tipo.color_class.replace('/10', ''))} />
                  {tipo.label}
                </div>
              ))}
              {tipos.length === 0 && Object.entries(TIPO_LABELS).filter(([key]) => isAdminOrStaff || TIPOS_PUBLICOS.includes(key)).map(([key, label]) => (
                <div key={key} className={cn("flex items-center gap-2 text-xs px-2 py-1.5 rounded border", TIPO_COLORS[key])}>
                  <div className={cn("w-2 h-2 rounded-full", TIPO_COLORS[key].replace('/10', ''))} />
                  {label}
                </div>
              ))}
            </CardContent>
          </Card>

          {isAdminOrStaff && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-6 flex gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-xl h-fit">
                  <Info className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-tight">Painel de Gestão</h4>
                  <p className="text-xs text-emerald-200/60 leading-relaxed">
                    Clique em um dia para adicionar eventos escolares ou vá para Materiais para lançar novas missões táticas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar Evento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">
                {editingEvento ? "Editar Evento" : "Novo Evento"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Data *</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Tipo *</Label>
                    <button 
                      onClick={() => setTypeModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Novo Tópico
                    </button>
                  </div>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {tipos.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                    {tipos.length === 0 && Object.entries(TIPO_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>


              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: 1ª Reunião de Pais"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                />
              </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Anotações</Label>
                  <Textarea
                    value={formData.anotacoes}
                    onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
                    placeholder="Ex: 19h - Auditório Principal"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[80px]"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Visibilidade</Label>
                  <div className="grid grid-cols-1 gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="visivel_instrutor" 
                        checked={formData.visivel_instrutor}
                        onCheckedChange={(checked) => setFormData({ ...formData, visivel_instrutor: !!checked })}
                        className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor="visivel_instrutor" className="text-sm font-medium text-zinc-300 cursor-pointer">Instrutor</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="visivel_responsavel" 
                        checked={formData.visivel_responsavel}
                        onCheckedChange={(checked) => setFormData({ ...formData, visivel_responsavel: !!checked })}
                        className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor="visivel_responsavel" className="text-sm font-medium text-zinc-300 cursor-pointer">Responsável</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="visivel_aluno" 
                        checked={formData.visivel_aluno}
                        onCheckedChange={(checked) => setFormData({ ...formData, visivel_aluno: !!checked })}
                        className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor="visivel_aluno" className="text-sm font-medium text-zinc-300 cursor-pointer">Aluno</Label>
                    </div>
                  </div>
                </div>
              </div>


            <div className="flex items-center gap-3 p-6 border-t border-zinc-800">
              {editingEvento && (
                <Button
                  variant="outline"
                  onClick={() => { handleDelete(editingEvento); closeModal(); }}
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={closeModal} className="border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Novo Tópico */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-white">
                  {editingType ? "Editar Tópico" : "Novo Tópico"}
                </h2>
                <button 
                  onClick={() => {
                    setTypeModalOpen(false);
                    setEditingType(null);
                    setNewType({ label: "", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
                  }} 
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

                <div className="p-6 space-y-5">
                  {!editingType && (
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2 mb-6 border-b border-zinc-800 pb-6">
                      <Label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tópicos Existentes</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {tipos.map((tipo) => (
                          <div key={tipo.value} className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800 group/item">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", tipo.color_class.replace('/10', ''))} />
                              <span className="text-xs font-bold text-white">{tipo.label}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingType(tipo);
                                  setNewType({ label: tipo.label, color: tipo.color_class });
                                }}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!confirm(`Excluir tópico "${tipo.label}"?`)) return;
                                  const { error } = await supabase.from("calendario_tipos").delete().eq("value", tipo.value);
                                  if (error) toast.error("Erro ao excluir");
                                  else {
                                    toast.success("Tópico excluído");
                                    fetchTipos();
                                  }
                                }}
                                className="p-1 hover:bg-red-900/30 rounded text-zinc-500 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
                      {editingType ? "Nome do Tópico" : "Novo Tópico"}
                    </Label>
                    <Input
                      value={newType.label}
                      onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                      placeholder="Ex: Rematrícula"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    />
                  </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Cor de Destaque</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    "bg-red-500/10 text-red-500 border-red-500/20",
                    "bg-purple-500/10 text-purple-500 border-purple-500/20",
                    "bg-pink-500/10 text-pink-500 border-pink-500/20",
                    "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
                    "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewType({ ...newType, color })}
                      className={cn(
                        "h-8 rounded-lg border flex items-center justify-center transition-all",
                        color,
                        newType.color === color ? "ring-2 ring-white scale-110" : "opacity-50 hover:opacity-100"
                      )}
                    >
                      {newType.color === color && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setTypeModalOpen(false)} className="flex-1 border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button onClick={handleSaveType} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingType ? "Salvar" : "Criar Tópico"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
