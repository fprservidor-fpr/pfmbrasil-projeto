"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { 
  Save, 
  Calendar, 
  Clock, 
  Loader2, 
  Info, 
  Trash2, 
  Plus,
  CheckCircle2,
  CalendarDays,
  Users,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = [
  { id: "Segunda", label: "Segunda" },
  { id: "Terça", label: "Terça" },
  { id: "Quarta", label: "Quarta" },
  { id: "Quinta", label: "Quinta" },
  { id: "Sexta", label: "Sexta" },
  { id: "Sábado", label: "Sábado" },
  { id: "Domingo", label: "Domingo" },
];

export default function SettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);

  // Modo B form state
  const [newDate, setNewDate] = useState("");
    const [newStartTime, setNewStartTime] = useState("08:00");
    const [newEndTime, setNewEndTime] = useState("17:00");

    useEffect(() => {
      async function fetchConfig() {
        const { data, error } = await supabase
          .from("configuracoes_sistema")
          .select("*")
          .single();

        if (data) {
          setConfig({
            ...data,
            dias_semana_fixos: data.dias_semana_fixos || [],
            datas_especificas: data.datas_especificas || [],
            endereco_institucional: data.endereco_institucional || "",
            horario_inicio_fixo: data.horario_inicio_fixo || "08:00",
            horario_fim_fixo: data.horario_fim_fixo || "17:00",
          });
        }
        setLoading(false);
      }
      fetchConfig();
    }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("configuracoes_sistema")
        .update({
          modo_agendamento: config.modo_agendamento,
          dias_semana_fixos: config.dias_semana_fixos,
          matriculas_abertas: config.matriculas_abertas,
          endereco_institucional: config.endereco_institucional,
          horario_inicio_fixo: config.horario_inicio_fixo,
          horario_fim_fixo: config.horario_fim_fixo,
          datas_especificas: config.datas_especificas,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const addSpecificDate = () => {
    if (!newDate) {
      toast.error("Selecione uma data");
      return;
    }

    const exists = config.datas_especificas.find((d: any) => d.date === newDate);
    if (exists) {
      toast.error("Esta data já foi configurada");
      return;
    }

    const updated = [
      ...config.datas_especificas,
      {
        date: newDate,
        startTime: newStartTime || "08:00",
        endTime: newEndTime || "17:00",
      },
    ].sort((a, b) => a.date.localeCompare(b.date));

    setConfig({ ...config, datas_especificas: updated });
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const removeSpecificDate = (date: string) => {
    const updated = config.datas_especificas.filter((d: any) => d.date !== date);
    setConfig({ ...config, datas_especificas: updated });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (profile?.role !== "admin" && profile?.role !== "instructor" && profile?.role !== "instrutor") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-zinc-400 text-sm">Apenas administradores e instrutores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações de Agendamento</h1>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-bold px-6 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden backdrop-blur-sm">
        <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
          <CardTitle className="text-xl text-white">Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="matriculas_abertas" 
              checked={config.matriculas_abertas}
              onCheckedChange={(val) => setConfig({ ...config, matriculas_abertas: !!val })}
              className="mt-1 border-emerald-500/50 data-[state=checked]:bg-emerald-500"
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="matriculas_abertas" className="text-white font-bold text-base cursor-pointer">
                Matrículas Abertas
              </Label>
              <p className="text-sm text-zinc-500">
                Quando desativado, o formulário público mostrará mensagem de encerramento
              </p>
            </div>
          </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Endereço Institucional</Label>
              <Input 
                value={config.endereco_institucional ?? ""}
                onChange={(e) => setConfig({ ...config, endereco_institucional: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white focus:border-yellow-500/50 transition-colors"
              />
            </div>

        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden backdrop-blur-sm">
        <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-yellow-500 w-5 h-5" />
            <CardTitle className="text-xl text-white">Modo de Agendamento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setConfig({ ...config, modo_agendamento: "fixo" })}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300",
                config.modo_agendamento === "fixo"
                  ? "bg-zinc-800/50 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 opacity-60"
              )}
            >
              <p className="text-white font-bold text-lg mb-1">Modo A: Dias Fixos</p>
              <p className="text-zinc-500 text-sm">Selecione dias da semana repetitivos</p>
            </button>

            <button
              onClick={() => setConfig({ ...config, modo_agendamento: "especifico" })}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300",
                config.modo_agendamento === "especifico"
                  ? "bg-zinc-800/50 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 opacity-60"
              )}
            >
              <p className="text-white font-bold text-lg mb-1">Modo B: Datas Específicas</p>
              <p className="text-zinc-500 text-sm">Configure datas únicas ou períodos</p>
            </button>
          </div>

          {config.modo_agendamento === "fixo" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Selecione os dias da semana</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = config.dias_semana_fixos?.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => {
                          const current = config.dias_semana_fixos || [];
                          if (isSelected) {
                            setConfig({ ...config, dias_semana_fixos: current.filter((d: string) => d !== day.id) });
                          } else {
                            setConfig({ ...config, dias_semana_fixos: [...current, day.id] });
                          }
                        }}
                        className={cn(
                          "py-3 px-4 rounded-lg text-sm font-medium transition-all",
                          isSelected
                            ? "bg-emerald-500/10 border-2 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "bg-zinc-900 border-2 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-bold">
                    <Clock className="w-3 h-3" />
                    Horário de Início
                  </div>
                    <Input 
                      type="time"
                      value={config.horario_inicio_fixo || ""}
                      onChange={(e) => setConfig({ ...config, horario_inicio_fixo: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-bold">
                      <Clock className="w-3 h-3" />
                      Horário de Término
                    </div>
                    <Input 
                      type="time"
                      value={config.horario_fim_fixo || ""}
                      onChange={(e) => setConfig({ ...config, horario_fim_fixo: e.target.value })}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex gap-3 items-start">
                <Info className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div className="text-sm">
                  <p className="text-emerald-500 font-bold mb-1">Informação sobre o agendamento:</p>
                  <p className="text-zinc-400">
                    No modo de dias fixos, o sistema atribuirá automaticamente a próxima data disponível baseada nos dias da semana selecionados.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-4">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Adicionar Data Específica</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-zinc-500 mb-2 block">Data</Label>
                    <Input 
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500 mb-2 block">Horário Início (opcional)</Label>
                    <Input 
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500 mb-2 block">Horário Fim (opcional)</Label>
                    <Input 
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addSpecificDate}
                  className="bg-yellow-500 hover:bg-yellow-600 text-zinc-950 font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Datas Configuradas</Label>
                {config.datas_especificas.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-xl">
                    <p className="text-zinc-500 text-sm">Nenhuma data específica cadastrada.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.datas_especificas.map((item: any) => (
                      <div 
                        key={item.date} 
                        className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <Calendar className="text-emerald-500 w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-bold">
                              {format(new Date(item.date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-zinc-500 text-sm">
                              {item.startTime} às {item.endTime}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeSpecificDate(item.date)}
                          className="text-red-500/50 hover:text-red-500 flex items-center gap-1 text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          </CardContent>
        </Card>

        {profile?.role === "admin" && (
          <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden backdrop-blur-sm border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Users className="text-blue-500 w-5 h-5" />
                <CardTitle className="text-xl text-white">Google Contatos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-white font-bold">Exportação de Contatos</p>
                  <p className="text-zinc-400 text-sm">
                    Gere o arquivo CSV para importar alunos e responsáveis no Google Contatos.
                  </p>
                </div>
                  <Link href="/configuracoes/contatos" className="w-full md:w-auto">
                    <Button variant="outline" className="w-full border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">

                    Acessar Ferramenta de Exportação
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
