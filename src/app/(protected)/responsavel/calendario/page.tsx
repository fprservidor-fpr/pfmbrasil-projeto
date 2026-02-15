"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  parseISO,
  addMonths,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  PartyPopper,
  BookOpen,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Evento = {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  anotacoes?: string;
};

const tipoConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  aula: { label: "Dia de Aula", color: "emerald", icon: BookOpen },
  feriado: { label: "Feriado", color: "red", icon: PartyPopper },
  evento: { label: "Evento Especial", color: "violet", icon: PartyPopper },
  recesso: { label: "Recesso", color: "amber", icon: Clock },
  reuniao: { label: "Reunião", color: "blue", icon: AlertCircle },
  corte_cabelo: { label: "Corte de Cabelo", color: "cyan", icon: Clock },
  campeonato: { label: "Campeonato", color: "orange", icon: PartyPopper },
  provas: { label: "Provas", color: "pink", icon: BookOpen },
  ponto_facultativo: { label: "Ponto Facultativo", color: "yellow", icon: Clock },
  ferias: { label: "Férias", color: "emerald", icon: PartyPopper },
};

const TIPOS_PUBLICOS = ['reuniao', 'recesso', 'provas', 'feriado', 'ponto_facultativo', 'corte_cabelo', 'campeonato', 'ferias'];

export default function ResponsavelCalendarioPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tipos, setTipos] = useState<{ value: string; label: string; color_class: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [eventosRes, tiposRes] = await Promise.all([
        supabase
          .from("calendario_letivo")
          .select("*")
          .order("data", { ascending: true }),
        supabase
          .from("calendario_tipos")
          .select("*")
          .order("label", { ascending: true })
      ]);

      if (eventosRes.error) throw eventosRes.error;
      if (tiposRes.error) throw tiposRes.error;

      const filteredData = (eventosRes.data || []).filter(e => e.visivel_responsavel);
      setEventos(filteredData);
      setTipos(tiposRes.data || []);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTipoInfo = (tipo: string) => {
    const dbTipo = tipos.find(t => t.value === tipo);
    if (dbTipo) {
      const colorClass = dbTipo.color_class;
      let colorName = 'slate';
      if (colorClass.includes('emerald')) colorName = 'emerald';
      else if (colorClass.includes('red')) colorName = 'red';
      else if (colorClass.includes('amber')) colorName = 'amber';
      else if (colorClass.includes('blue')) colorName = 'blue';
      else if (colorClass.includes('purple')) colorName = 'violet';
      else if (colorClass.includes('orange')) colorName = 'orange';
      else if (colorClass.includes('pink')) colorName = 'pink';
      else if (colorClass.includes('cyan')) colorName = 'cyan';
      else if (colorClass.includes('indigo')) colorName = 'indigo';
      else if (colorClass.includes('yellow')) colorName = 'yellow';
      else if (colorClass.includes('violet')) colorName = 'violet';

      return {
        label: dbTipo.label,
        color: colorName,
        icon: Calendar,
        bg: `bg-${colorName}-500/10`,
        text: `text-${colorName}-400`,
        border: `border-${colorName}-500/20`
      };
    }
    const config = tipoConfig[tipo] || { label: tipo, color: "slate", icon: Calendar };
    return {
      ...config,
      bg: `bg-${config.color}-500/10`,
      text: `text-${config.color}-400`,
      border: `border-${config.color}-500/20`
    };
  };


  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventosForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return eventos.filter(e => e.data === dateStr);
  };

  const selectedDateEvents = selectedDate ? getEventosForDate(selectedDate) : [];

  const upcomingEvents = eventos
    .filter(e => new Date(e.data + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0)))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {days.map((day) => {
              const dayEvents = getEventosForDate(day);
              const dayIsToday = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasEvents = dayEvents.length > 0;
              
              return (
                <motion.button
                  key={day.toISOString()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all relative",
                    dayIsToday && "ring-2 ring-rose-500",
                    isSelected && "bg-rose-500/20 border border-rose-500/50",
                    !isSelected && !hasEvents && "bg-slate-950/30 text-slate-500 hover:bg-slate-800/50",
                    !isSelected && hasEvents && "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                getTipoInfo(e.tipo).bg.replace('/10', '')
                              )}
                            />
                          ))}

                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-white/5">
                {tipos.map((tipo) => {
                  const info = getTipoInfo(tipo.value);
                  return (
                    <div key={tipo.value} className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        info.bg.replace('/10', '')
                      )} />
                      <span className="text-[10px] text-slate-500">{info.label}</span>
                    </div>
                  );
                })}
                {tipos.length === 0 && Object.entries(tipoConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      `bg-${config.color}-500`
                    )} />
                    <span className="text-[10px] text-slate-500">{config.label}</span>
                  </div>
                ))}
              </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {selectedDate && (
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum evento nesta data</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map((event) => {
                      const info = getTipoInfo(event.tipo);
                      const Icon = info.icon;
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "p-3 rounded-xl border",
                            info.bg,
                            info.border
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={cn(
                              "w-4 h-4",
                              info.text
                            )} />
                            <span className={cn("text-xs font-bold uppercase", info.text)}>{info.label}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{event.descricao}</p>
                          {event.anotacoes && (
                            <p className="text-slate-500 text-xs mt-1">{event.anotacoes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Próximos Eventos</h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum evento próximo</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const info = getTipoInfo(event.tipo);
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-950/50"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          info.bg.replace('10', '20')
                        )}>
                          <span className={cn("text-xs font-black", info.text.replace('400', 'white'))}>
                            {format(parseISO(event.data), "dd")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{event.descricao}</p>
                          <p className="text-slate-500 text-[10px] uppercase">
                            {format(parseISO(event.data), "MMMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
      </div>
    </div>
  );
}
