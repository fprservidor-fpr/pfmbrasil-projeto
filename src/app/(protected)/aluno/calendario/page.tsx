"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
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
  subMonths,
  getDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  PartyPopper,
  BookOpen,
  AlertCircle,
  Clock,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Evento = {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  anotacoes?: string;
};

const tipoConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string; text: string; border: string }> = {
  aula: { label: "Aula", color: "emerald", icon: BookOpen, bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  feriado: { label: "Feriado", color: "red", icon: PartyPopper, bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  evento: { label: "Evento", color: "violet", icon: PartyPopper, bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  recesso: { label: "Recesso", color: "amber", icon: Clock, bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  reuniao: { label: "Reunião", color: "blue", icon: AlertCircle, bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  corte_cabelo: { label: "Corte", color: "cyan", icon: Clock, bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  campeonato: { label: "Campeonato", color: "orange", icon: PartyPopper, bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  provas: { label: "Provas", color: "pink", icon: BookOpen, bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  ponto_facultativo: { label: "Ponto Fac.", color: "yellow", icon: Clock, bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  ferias: { label: "Férias", color: "emerald", icon: PartyPopper, bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

const DayCard = memo(({ 
  day, 
  events, 
  isToday, 
  isSelected, 
  onClick,
  getTipoInfo 
}: { 
  day: Date; 
  events: Evento[]; 
  isToday: boolean; 
  isSelected: boolean; 
  onClick: () => void;
  getTipoInfo: (tipo: string) => any;
}) => {
  const hasEvents = events.length > 0;
  const firstEvent = events[0];
  const info = firstEvent ? getTipoInfo(firstEvent.tipo) : null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl p-2 flex flex-col items-start justify-between text-sm transition-all relative overflow-hidden group",
        isToday && "ring-2 ring-rose-500/50 ring-offset-2 ring-offset-slate-950",
        isSelected ? "bg-white/10 border-white/20 shadow-lg" : "bg-slate-900/40 border border-white/5",
        hasEvents && !isSelected && "hover:bg-slate-800/60"
      )}
    >
      <div className="flex justify-between w-full items-start">
        <span className={cn(
          "font-bold text-lg leading-none",
          isToday ? "text-rose-400" : isSelected ? "text-white" : "text-slate-400"
        )}>
          {format(day, "d")}
        </span>
        {hasEvents && (
          <div className="flex gap-1">
            {events.slice(0, 2).map((e, i) => (
              <div
                key={i}
                className={cn("w-1.5 h-1.5 rounded-full shadow-sm", getTipoInfo(e.tipo).bg.replace('10', '100'))}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        {hasEvents && (
          <div className={cn(
            "text-[9px] font-black uppercase tracking-tight py-0.5 px-1.5 rounded-md truncate w-full",
            info.bg,
            info.text,
            "border border-white/5"
          )}>
            {info.label}
          </div>
        )}
      </div>

      {isSelected && (
        <motion.div
          layoutId="day-highlight"
          className="absolute inset-0 bg-white/5 pointer-events-none"
        />
      )}
    </motion.button>
  );
});

DayCard.displayName = "DayCard";

export default function AlunoCalendarioPage() {
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

      const filteredData = (eventosRes.data || []).filter(e => e.visivel_aluno);
      setEventos(filteredData);
      setTipos(tiposRes.data || []);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTipoInfo = useMemo(() => (tipo: string) => {
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

      const config = tipoConfig[tipo] || { label: dbTipo.label, color: colorName, icon: Calendar, bg: `bg-${colorName}-500/10`, text: `text-${colorName}-400`, border: `border-${colorName}-500/20` };
      return {
        ...config,
        label: dbTipo.label,
      };
    }
    return tipoConfig[tipo] || { label: tipo, color: "slate", icon: Calendar, bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" };
  }, [tipos]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [currentDate]);

  const eventosMap = useMemo(() => {
    const map = new Map<string, Evento[]>();
    eventos.forEach(e => {
      const existing = map.get(e.data) || [];
      map.set(e.data, [...existing, e]);
    });
    return map;
  }, [eventos]);

  const getEventosForDate = (date: Date) => {
    return eventosMap.get(format(date, "yyyy-MM-dd")) || [];
  };

  const selectedDateEvents = useMemo(() => 
    selectedDate ? getEventosForDate(selectedDate) : [], 
    [selectedDate, eventosMap]
  );

    const upcomingEvents = useMemo(() => 
      eventos
        .filter(e => new Date(e.data + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0)))
        .slice(0, 5),
      [eventos]
    );

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white capitalize tracking-tight">
                  {format(currentDate, "MMMM", { locale: ptBR })}
                </h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{format(currentDate, "yyyy")}</p>
              </div>
            </div>
            <div className="flex gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl w-10 h-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl w-10 h-10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
              <div key={day} className="text-center text-[11px] font-black uppercase tracking-widest text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {Array.from({ length: getDay(monthStart) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-20 bg-slate-900/10 rounded-xl" />
            ))}
            
            {days.map((day) => (
              <DayCard
                key={day.toISOString()}
                day={day}
                events={getEventosForDate(day)}
                isToday={isToday(day)}
                isSelected={!!selectedDate && isSameDay(day, selectedDate)}
                onClick={() => setSelectedDate(day)}
                getTipoInfo={getTipoInfo}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 pt-6 border-t border-white/5">
            {tipos.map((tipo) => {
              const info = getTipoInfo(tipo.value);
              return (
                <div key={tipo.value} className="flex items-center gap-2 group cursor-default">
                  <div className={cn("w-2 h-2 rounded-full shadow-sm transition-transform group-hover:scale-125", info.bg.replace('10', '100'))} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{info.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
                  </div>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-950/50 flex items-center justify-center mb-3">
                      <Info className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Nenhum evento agendado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => {
                      const info = getTipoInfo(event.tipo);
                      const Icon = info.icon;
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                            info.bg,
                            info.border
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={cn("w-4 h-4", info.text)} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", info.text)}>{info.label}</span>
                          </div>
                          <p className="text-white text-sm font-semibold mb-1 leading-tight">{event.descricao}</p>
                          {event.anotacoes && (
                            <p className="text-slate-400/80 text-xs italic">{event.anotacoes}</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Próximos Eventos</h3>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-slate-500 text-sm font-medium text-center py-4">Fique atento às novidades!</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, idx) => {
                  const info = getTipoInfo(event.tipo);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className="flex items-center gap-4 group cursor-pointer"
                      onClick={() => setSelectedDate(parseISO(event.data))}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-all group-hover:scale-110 shadow-lg",
                        info.bg,
                        info.border
                      )}>
                        <span className={cn("text-lg font-black leading-none", info.text)}>
                          {format(parseISO(event.data), "dd")}
                        </span>
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter opacity-70", info.text)}>
                          {format(parseISO(event.data), "MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold truncate group-hover:text-rose-400 transition-colors">{event.descricao}</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", info.bg.replace('10', '100'))} />
                          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                            {info.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
