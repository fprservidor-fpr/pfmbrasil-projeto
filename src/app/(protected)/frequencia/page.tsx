"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar,
  Loader2,
  Save,
  Users,
  Info,
  CalendarCheck,
  Search,
  AlertTriangle,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  Download,
  Heart
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const MONTHS = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

export default function FrequenciaPage() {
  const { simulatedRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [frequencias, setFrequencias] = useState<Record<string, any>>({});
  const [behaviorRecords, setBehaviorRecords] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("all");
    const [turmas, setTurmas] = useState<any[]>([]);
    const [justifying, setJustifying] = useState<{ alunoId: string, date: string, alunoNome: string } | null>(null);
    const [tempObs, setTempObs] = useState("");
    
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth()));
    const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
    const [showHaircutModal, setShowHaircutModal] = useState<{ alunoNome: string, records: any[] } | null>(null);


  const classDays = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    
    const allDays = eachDayOfInterval({ start, end });
    return allDays.filter(day => {
      const dayOfWeek = getDay(day);
      return (dayOfWeek === 2 || dayOfWeek === 4); // Terça (2) e Quinta (4)
    });
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const showTestRecords = !!simulatedRole;

        let studentsQuery = supabase
          .from("students")
          .select("*, turmas(nome)")
          .eq("status", "ativo");
        
        let behaviorsQuery = supabase
          .from("comportamentos")
          .select("*")
          .gte("created_at", startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))).toISOString())
          .lte("created_at", endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))).toISOString());

        if (!showTestRecords) {
          studentsQuery = studentsQuery.eq("is_test", false);
          behaviorsQuery = behaviorsQuery.eq("is_test", false);
        }

        const [
          { data: alumnosData }, 
          { data: turmasData },
          { data: behaviorData },
          { data: calendarData }
        ] = await Promise.all([
          studentsQuery,
          supabase.from("turmas").select("*").eq("ativa", true).order("nome"),
          behaviorsQuery,
          supabase
            .from("calendario_letivo")
            .select("*")
            .gte("data", startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))).toISOString().split('T')[0])
            .lte("data", endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))).toISOString().split('T')[0])
      ]);
      
        if (alumnosData) {
          const sorted = [...alumnosData].sort((a, b) => {
            const matA = a.matricula_pfm || "";
            const matB = b.matricula_pfm || "";
            
            if (!matA && !matB) return a.nome_completo?.localeCompare(b.nome_completo);
            if (!matA) return 1;
            if (!matB) return -1;

            const [numA, yearA] = matA.split("/").map(Number);
            const [numB, yearB] = matB.split("/").map(Number);

            if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
            return (numA || 0) - (numB || 0);
          });
          setAlunos(sorted);
        }
      if (turmasData) setTurmas(turmasData);
      if (behaviorData) setBehaviorRecords(behaviorData);
      if (calendarData) setCalendarEvents(calendarData);

      // Fetch frequencies for all class days in the month
      const startStr = format(startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))), "yyyy-MM-dd");
      const endStr = format(endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth))), "yyyy-MM-dd");
      
      const { data: freqData } = await supabase
        .from("frequencias")
        .select("*")
        .gte("data", startStr)
        .lte("data", endStr);

      const freqMap: Record<string, any> = {};
      freqData?.forEach(f => {
        const key = `${f.aluno_id}_${f.data}`;
        freqMap[key] = f;
      });
      setFrequencias(freqMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

    const handleFrequenciaToggle = (alunoId: string, date: string, alunoNome: string, currentStatus: string) => {
      // Cycle logic: "" -> presente -> falta -> justificada -> ""
      let nextStatus = "";
      if (currentStatus === "") nextStatus = "presente";
      else if (currentStatus === "presente") nextStatus = "falta";
      else if (currentStatus === "falta") {
        nextStatus = "justificada";
        const key = `${alunoId}_${date}`;
        setTempObs(frequencias[key]?.observacoes || "");
        setJustifying({ alunoId, date, alunoNome });
        return;
      } else if (currentStatus === "justificada") {
        // Se já está justificado, abrir para edição
        const key = `${alunoId}_${date}`;
        setTempObs(frequencias[key]?.observacoes || "");
        setJustifying({ alunoId, date, alunoNome });
        return;
      } else nextStatus = "";

      const key = `${alunoId}_${date}`;
      
      setFrequencias(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          aluno_id: alunoId,
          data: date,
          presenca: nextStatus,
        }
      }));
    };

    const confirmJustification = () => {
      if (!justifying) return;
      const key = `${justifying.alunoId}_${justifying.date}`;
      setFrequencias(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          aluno_id: justifying.alunoId,
          data: justifying.date,
          presenca: "justificada",
          observacoes: tempObs,
        }
      }));
      setJustifying(null);
      setTempObs("");
    };

    const removeJustification = () => {
      if (!justifying) return;
      const key = `${justifying.alunoId}_${justifying.date}`;
      setFrequencias(prev => {
        const newFreqs = { ...prev };
        delete newFreqs[key];
        return newFreqs;
      });
      setJustifying(null);
      setTempObs("");
    };


  const getCalendarIndicator = (dateStr: string) => {
    const event = calendarEvents.find(e => e.data === dateStr);
    if (!event) return null;

    if (event.tipo === 'reuniao') return { label: "RP", color: "bg-purple-600 text-white border-purple-400" };
    if (event.tipo === 'ponto_facultativo') return { label: "PF", color: "bg-yellow-600 text-white border-yellow-400" };
    if (event.tipo === 'feriado') return { label: "HD", color: "bg-red-600 text-white border-red-400" };
    return null;
  };

  const handleObsChange = (alunoId: string, date: string, obs: string) => {
    const key = `${alunoId}_${date}`;
    setFrequencias(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        aluno_id: alunoId,
        data: date,
        observacoes: obs,
      }
    }));
  };

  const handleSaveMonth = async () => {
    setSaving(true);
    try {
      const frequenciaEntries = Object.values(frequencias);
      
      // Separate records to upsert (with valid presenca) and to delete (empty presenca)
      const toUpsert: any[] = [];
      const toDelete: any[] = [];
      
      for (const f of frequenciaEntries) {
        const freq = f as any;
        if (freq.presenca && freq.presenca !== "") {
          toUpsert.push({
            aluno_id: freq.aluno_id,
            data: freq.data,
            presenca: freq.presenca,
            observacoes: freq.observacoes || "",
          });
        } else if (freq.id) {
          // Only delete if it has an id (exists in database)
          toDelete.push(freq.id);
        }
      }

      // Delete records that were cleared
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from("frequencias")
          .delete()
          .in("id", toDelete);
        
        if (delError) throw delError;
      }

        // Upsert records with valid presenca
        if (toUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from("frequencias")
            .upsert(toUpsert, { onConflict: "aluno_id,data" });
          
          if (upsertError) throw upsertError;

          // Add notifications for absences and justifications
          const notifications = toUpsert
            .filter(f => f.presenca === 'falta' || f.presenca === 'justificada')
            .map(f => ({
              aluno_id: f.aluno_id,
              tipo: f.presenca,
              data_referencia: f.data,
              descricao: f.presenca === 'falta' 
                ? `Falta registrada no dia ${format(parseISO(f.data), "dd/MM/yyyy")}`
                : `Falta justificada no dia ${format(parseISO(f.data), "dd/MM/yyyy")}: ${f.observacoes || 'Sem detalhes'}`,
            }));

          if (notifications.length > 0) {
            await supabase.from("eventos_notificacoes").upsert(notifications, { onConflict: "aluno_id,tipo,data_referencia" });
          }
        }
      
      toast.success("Frequências do mês salvas!");
      await fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar frequências:", error);
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const filteredAlunos = useMemo(() => {
    return [...alunos]
      .filter(a => {
        const matchesSearch = a.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTurma = selectedTurma === "all" || a.turma_id === selectedTurma;
        return matchesSearch && matchesTurma;
      });
  }, [alunos, searchTerm, selectedTurma]);

  const getHaircutRecords = (alunoId: string) => {
    return behaviorRecords
      .filter(r => 
        r.aluno_id === alunoId && 
        r.tipo === "demerito" && 
        r.descricao?.toUpperCase().includes("CABELO")
      );
  };

  const hasSuspension = (alunoId: string) => {
    return behaviorRecords.some(r => 
      r.aluno_id === alunoId && 
      r.descricao?.toUpperCase().includes("SUSPENSÃO")
    );
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - 2 + i));

  const [printLoading, setPrintLoading] = useState(false);
  const printRef = useMemo(() => ({ current: null }), []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            /* Force all containers to be visible and not scrollable */
            html, body, #root, #__next, main, div, section, article {
              height: auto !important;
              overflow: visible !important;
              position: static !important;
              display: block !important;
            }
            body {
              background: white !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible !important;
            }
            #printable-area {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            .print-break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              page-break-inside: auto !important;
              table-layout: fixed !important;
            }
            thead {
              display: table-header-group !important;
            }
            tbody {
              display: table-row-group !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            th, td {
              border: 1px solid #000 !important;
              color: black !important;
              padding: 4px 2px !important;
              font-size: 8px !important;
              text-align: center !important;
            }
          th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-zinc-950, .bg-zinc-900, .bg-zinc-800 {
            background-color: transparent !important;
          }
          .text-white, .text-zinc-300, .text-zinc-400, .text-zinc-500 {
            color: black !important;
          }
          .text-emerald-500, .text-emerald-400 {
            color: #059669 !important;
          }
          .bg-emerald-500 {
            background-color: #10b981 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-red-500 {
            background-color: #ef4444 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-amber-500 {
            background-color: #f59e0b !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 shadow-lg backdrop-blur-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CalendarCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tighter uppercase leading-none">Frequência</h1>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-9 px-4 rounded-xl transition-all font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Exportar PDF
              </Button>
              <Button 
                onClick={handleSaveMonth} 
                disabled={saving}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-9 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="w-32 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Turma</label>
                  <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="all">Todas as Turmas</SelectItem>
                      {turmas.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mês</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {MONTHS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Ano</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white h-9 rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-800/50 px-3 h-9 rounded-xl shrink-0 mt-5">
                <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">P</span>
                </div>
                <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">F</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">J</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Pesquisar por nome ou nome de guerra..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-950 border-zinc-800 text-white h-9 rounded-xl focus:ring-emerald-500/20 text-xs shadow-inner"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div id="printable-area" className="hidden print:block">
        <div className="text-center mb-4">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Fundação Populus Rationabilis</h2>
          <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tighter mb-2">Programa Força Mirim</h1>
          
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-800 border-t border-zinc-200 pt-2 inline-block px-8">Folha de Frequência Mensal</h3>
          <p className="text-xs uppercase font-bold text-zinc-600 mt-1">{MONTHS.find(m => m.value === selectedMonth)?.label} de {selectedYear}</p>
          <div className="flex justify-center gap-4 mt-1 text-[8px] text-zinc-400 font-bold uppercase tracking-widest">
            <span>Relatório: Presença Geral</span>
            <span>•</span>
            <span>Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-zinc-200 shadow-sm">
          <thead>
            <tr>
              <th className="p-2 border border-zinc-200 bg-zinc-50 uppercase text-[8px] font-black tracking-wider text-zinc-700 w-[10%]">Matrícula</th>
              <th className="p-2 border border-zinc-200 bg-zinc-50 uppercase text-[8px] font-black tracking-wider text-zinc-700 w-[14%] text-left pl-3">N. Guerra</th>
              <th className="p-2 border border-zinc-200 bg-zinc-50 uppercase text-[8px] font-black tracking-wider text-zinc-700 w-[30%] text-left pl-3">Nome Completo</th>
              {classDays.map(day => (
                <th key={day.toISOString()} className="p-1 border border-zinc-200 bg-zinc-50 text-[8px] font-black text-zinc-700 w-5">
                  {format(day, "dd")}
                </th>
              ))}
              <th className="p-2 border border-zinc-200 bg-zinc-50 uppercase text-[8px] font-black tracking-wider text-zinc-700 w-8">Tot</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.map(aluno => {
              let totalP = 0;
              return (
                <tr key={aluno.id} className="hover:bg-zinc-50">
                  <td className="p-1 border border-zinc-200 text-[8px] text-center font-bold text-zinc-600 font-mono tabular-nums">{aluno.matricula_pfm}</td>
                  <td className="p-1 border border-zinc-200 text-[9px] font-black uppercase text-zinc-900 pl-3 truncate max-w-0">{aluno.nome_guerra}</td>
                  <td className="p-1 border border-zinc-200 text-[8px] uppercase text-zinc-600 font-medium px-3 truncate max-w-0">{aluno.nome_completo}</td>
                  {classDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const freq = frequencias[`${aluno.id}_${dateStr}`] || {};
                    const status = freq.presenca || "";
                    if (status === "presente") totalP++;
                    
                    return (
                      <td key={dateStr} className={cn(
                        "p-1 border border-zinc-200 text-[9px] text-center font-black",
                        status === "presente" ? "text-emerald-600" : 
                        status === "falta" ? "text-red-600" : 
                        status === "justificada" ? "text-amber-600" : "text-zinc-300"
                      )}>
                        {status === "presente" ? "P" : status === "falta" ? "F" : status === "justificada" ? "J" : "•"}
                      </td>
                    );
                  })}
                  <td className="p-1 border border-zinc-200 text-[9px] text-center font-black text-zinc-900 bg-zinc-50">{totalP}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-lg font-bold uppercase mb-4 border-b pb-2">Observações e Justificativas</h2>
          <div className="grid grid-cols-1 gap-4">
            {filteredAlunos.map(aluno => {
              const justs = classDays.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const freq = frequencias[`${aluno.id}_${dateStr}`];
                if (freq?.presenca === "justificada" && freq.observacoes) {
                  return { date: format(day, "dd/MM"), obs: freq.observacoes };
                }
                return null;
              }).filter(Boolean);

              if (justs.length === 0) return null;

              return (
                <div key={aluno.id} className="border p-4 rounded-lg print-break-inside-avoid">
                  <p className="font-bold uppercase text-xs mb-2">
                    {aluno.nome_guerra} ({aluno.matricula_pfm})
                  </p>
                  <div className="space-y-2">
                    {justs.map((j: any, idx) => (
                      <div key={idx} className="flex gap-4 text-[10px]">
                        <span className="font-bold min-w-[40px]">{j.date}:</span>
                        <span className="italic">{j.obs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-20 px-12">
          <div className="text-center border-t border-black pt-2">
            <p className="text-xs uppercase font-bold">Assinatura do Instrutor Responsável</p>
          </div>
          <div className="text-center border-t border-black pt-2">
            <p className="text-xs uppercase font-bold">Assinatura da Coordenação</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-xl relative shadow-2xl overflow-hidden">
        <Table 
          className="table-fixed w-full border-separate border-spacing-0"
          containerClassName="max-h-[calc(100vh-220px)] overflow-auto no-scrollbar"
        >
          <TableHeader className="z-[100]">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="text-zinc-500 font-black py-5 text-[10px] uppercase tracking-wider sticky left-0 top-0 bg-zinc-950 z-[110] w-[110px] border-r border-b border-zinc-800 shadow-[4px_4px_15px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col gap-1">
                  <span className="text-emerald-500/50 text-[8px] tracking-[0.2em]">IDENTIFICAÇÃO</span>
                  <span>Aluno</span>
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-black py-5 text-[10px] uppercase tracking-wider w-[130px] sticky left-[110px] top-0 bg-zinc-950 z-[105] border-b border-r border-zinc-800 shadow-[4px_4px_15px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col gap-1">
                  <span className="text-emerald-500/50 text-[8px] tracking-[0.2em]">REGISTRO CIVIL</span>
                  <span>Nome Completo</span>
                </div>
              </TableHead>
              
              {classDays.map(day => (
                <TableHead key={day.toISOString()} className="text-center py-5 px-1 sticky top-0 bg-zinc-950 z-[90] border-b border-zinc-800 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest">{format(day, "eee", { locale: ptBR }).replace(".", "")}</span>
                    <span className="text-white font-black text-base leading-none mt-1">{format(day, "dd")}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={classDays.length + 2} className="text-center py-40 bg-zinc-950/20">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                    <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Carregando chamada...</p>
                  </TableCell>
                </TableRow>
              ) : filteredAlunos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={classDays.length + 2} className="text-center py-40 bg-zinc-950/20">
                    <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold">Nenhum aluno encontrado para os filtros selecionados</p>
                  </TableCell>
                </TableRow>
              ) : (
                  filteredAlunos.map((aluno) => {
                    const haircutRecords = getHaircutRecords(aluno.id);
                    const suspended = hasSuspension(aluno.id);
                  const age = calculateAge(aluno.data_nascimento);

                  return (
                      <TableRow key={aluno.id} className="border-zinc-800/50 hover:bg-white/5 transition-colors group">
                        <TableCell className="py-4 sticky left-0 bg-zinc-950 z-20 border-r border-zinc-800/50 shadow-[4px_0_15px_rgba(0,0,0,0.5)] w-[110px]">
                          <div className="flex flex-col max-w-[100px]">
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-70">
                              {aluno.turmas?.nome || "Sem Turma"}
                            </span>
                            <div className="flex flex-col">
                              <p className="text-white font-black uppercase text-[10px] tracking-tight leading-none group-hover:text-emerald-400 transition-colors mb-2 truncate">
                                {aluno.nome_guerra}
                              </p>
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1 py-0.5 flex items-center gap-1 w-fit mb-2">
                                <span className="text-[9px] font-black text-emerald-400">{aluno.matricula_pfm || "---"}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[8px] text-zinc-500 font-bold">{aluno.graduacao}</span>
                                <span className="text-[8px] text-zinc-600 font-black">{aluno.blood_type}</span>
                                <span className="text-[8px] text-zinc-600 font-bold">{age}a</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                          <TableCell className="py-4 sticky left-[110px] bg-zinc-950 z-20 border-r border-zinc-800/50 shadow-[4px_0_15px_rgba(0,0,0,0.5)] w-[130px]">
                            <p className="text-zinc-300 font-bold uppercase text-[9px] leading-tight whitespace-normal break-words max-w-[120px] opacity-90 group-hover:text-white transition-colors">
                              {aluno.nome_completo}
                            </p>

                            <div className="flex items-center gap-2 mt-2.5">
                              <Badge className={cn(
                                "font-black uppercase text-[7px] px-1 py-0 rounded-md border",
                                aluno.comportamento_atual === "Excepcional" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                aluno.comportamento_atual === "Ótimo" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                aluno.comportamento_atual === "Bom" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-red-500/10 text-red-400 border-red-500/20"
                              )}>
                                {aluno.comportamento_atual?.slice(0, 4) || "BOM"}
                              </Badge>
                                  {haircutRecords.length > 0 && (
                                    <button 
                                      onClick={() => setShowHaircutModal({ alunoNome: aluno.nome_guerra, records: haircutRecords })}
                                      className="flex items-center gap-0.5 bg-zinc-800/50 px-1 rounded border border-zinc-700/50 hover:bg-zinc-700 transition-colors"
                                    >
                                      <Scissors className="w-2.5 h-2.5 text-zinc-500" />
                                      <span className="text-[7px] font-black text-zinc-400">{haircutRecords.length}</span>
                                    </button>
                                  )}
                                {aluno.has_health_alert && (
                                  <div className="bg-rose-500/20 p-0.5 rounded-md border border-rose-500/30 group/health relative" title={aluno.health_alert_description}>
                                    <Heart className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                                      <p className="font-black text-rose-500 uppercase mb-1">ALERTA DE SAÚDE</p>
                                      {aluno.health_alert_description}
                                    </div>
                                  </div>
                                )}
                                {suspended && (
                                <div className="animate-pulse bg-red-500/20 p-0.5 rounded-full border border-red-500/30" title="ALUNO EM SUSPENSÃO">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          {classDays.map(day => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const key = `${aluno.id}_${dateStr}`;
                          const freq = frequencias[key] || {};
                          const status = freq.presenca || "";
                          const calendarInfo = getCalendarIndicator(dateStr);
                          
                          return (
                            <TableCell key={dateStr} className="text-center py-3 px-1">
                              {calendarInfo ? (
                                <div 
                                  className={cn(
                                    "w-7 h-7 rounded-lg font-black text-[9px] flex items-center justify-center border mx-auto",
                                    calendarInfo.color
                                  )}
                                  title={calendarEvents.find(e => e.data === dateStr)?.descricao}
                                >
                                  {calendarInfo.label}
                                </div>
                              ) : (
                                <div className="relative group/cell flex justify-center">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleFrequenciaToggle(aluno.id, dateStr, aluno.nome_guerra, status)}
                                    className={cn(
                                      "w-7 h-7 rounded-lg font-black text-[9px] transition-all border flex items-center justify-center relative mx-auto",
                                      status === "presente" ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20" :
                                      status === "falta" ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20" :
                                      status === "justificada" ? "bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20" :
                                      "bg-zinc-800/50 text-zinc-600 border-zinc-700 hover:border-zinc-500"
                                    )}
                                  >
                                    {status === "presente" ? "P" : 
                                     status === "falta" ? "F" : 
                                     status === "justificada" ? "J" : "?"}
                                  </motion.button>

                                    {status === "justificada" && freq.observacoes && (
                                      <div className="absolute -top-1 -right-1 z-10">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const key = `${aluno.id}_${dateStr}`;
                                            setTempObs(frequencias[key]?.observacoes || "");
                                            setJustifying({ alunoId: aluno.id, date: dateStr, alunoNome: aluno.nome_guerra });
                                          }}
                                          className="relative group/obs"
                                        >
                                          <div className="bg-zinc-900 border border-zinc-700 rounded-full p-0.5 shadow-xl hover:bg-zinc-800 transition-colors">
                                            <MessageSquare className="w-2 h-2 text-amber-400" />
                                          </div>
                                        </button>
                                      </div>
                                    )}

                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                  );
                })
              )}
            </TableBody>
            </Table>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-emerald-500/5 border-emerald-500/20 rounded-2xl p-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-tight leading-none mb-2">Ações Rápidas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  Alternar status clicando no botão de frequência.
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <MessageSquare className="w-3 h-3 text-amber-500" /> Editar justificativas.
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <Scissors className="w-3 h-3 text-emerald-500" /> Deméritos de cabelo no mês.
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <AlertTriangle className="w-3 h-3 text-red-500" /> Aluno em suspensão.
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alunos Ativos</span>
            <span className="text-sm font-black text-white">{filteredAlunos.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Turma</span>
            <span className="text-sm font-black text-emerald-500 uppercase tracking-tighter">
              {selectedTurma === "all" ? "Todas" : turmas.find(t => t.id === selectedTurma)?.nome}
            </span>
          </div>
        </Card>
      </div>

      <Dialog open={!!justifying} onOpenChange={() => setJustifying(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
              Justificativa de Falta
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Aluno</p>
              <p className="text-white font-bold">{justifying?.alunoNome}</p>
              <p className="text-[10px] text-zinc-600 mt-2 uppercase font-black">
                Data: {justifying && format(parseISO(justifying.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase font-black tracking-widest ml-1">Observações / Motivo</label>
              <Textarea 
                value={tempObs}
                onChange={(e) => setTempObs(e.target.value)}
                placeholder="Ex: Atestado médico, viagem justificada, etc..."
                className="bg-zinc-950 border-zinc-800 text-white min-h-[120px] rounded-2xl focus:ring-amber-500/20"
              />
            </div>
          </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-4">
              <Button 
                variant="ghost" 
                onClick={removeJustification}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl px-4 order-3 sm:order-1 h-10 text-xs font-bold"
              >
                Excluir Justificativa
              </Button>
              <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setJustifying(null)}
                  className="bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl px-6 flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmJustification}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-black px-8 rounded-xl flex-1 sm:flex-none"
                >
                  Confirmar
                </Button>
              </div>
            </DialogFooter>

        </DialogContent>
      </Dialog>
      <Dialog open={!!showHaircutModal} onOpenChange={() => setShowHaircutModal(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-zinc-900 p-6 flex items-center gap-4 border-b border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <Scissors className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Ocorrências de Corte</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs uppercase font-bold tracking-widest">{showHaircutModal?.alunoNome}</DialogDescription>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {showHaircutModal?.records.map((record, idx) => (
              <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Data do Registro</span>
                  <span className="text-[10px] font-black text-zinc-500 tabular-nums">
                    {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Narrativa</span>
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed">{record.descricao}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
            <Button 
              onClick={() => setShowHaircutModal(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-xl h-12 transition-all"
            >
              FECHAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
