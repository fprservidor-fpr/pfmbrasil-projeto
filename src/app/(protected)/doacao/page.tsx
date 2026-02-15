"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Loader2,
  Filter,
  Printer,
  ShieldCheck,
  Star,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  comportamento_atual: string;
  guardian1_name: string;
  guardian1_cpf: string;
  guardian1_titulo: string;
  guardian2_name: string;
  guardian2_cpf: string;
  guardian2_titulo: string;
}

interface FamilyGroup {
  id: string;
  guardian1: { name: string; cpf: string; titulo: string };
  guardian2?: { name: string; cpf: string; titulo: string };
  students: Student[];
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export default function DoacaoPage() {
  const { simulatedRole } = useAuth();
  const [loading, setLoading] = useState(true);
    const [availableMonths, setAvailableMonths] = useState<Date[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
    const [groups, setGroups] = useState<FamilyGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
      const init = async () => {
        try {
          await checkUserRole();
          await fetchConfigAndMonths();
        } catch (error) {
          console.error("Error in init:", error);
          setLoading(false);
        }
      };
      init();
    }, []);

    useEffect(() => {
      if (selectedMonth) {
        fetchStudentsAndPresence();
      }
    }, [selectedMonth]);

    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setIsAdmin(["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || ""));
      }
    };

    const fetchConfigAndMonths = async () => {
      try {
        const { data: config, error } = await supabase
          .from("configuracoes_sistema")
          .select("*")
          .single();

        if (error) {
          console.error("Error fetching config:", error);
          setLoading(false);
          return;
        }

        if (config?.data_inicio_letivo && config?.data_fim_letivo) {
          const start = new Date(config.data_inicio_letivo + "T00:00:00");
          const end = new Date(config.data_fim_letivo + "T00:00:00");
          
          const months = eachMonthOfInterval({ start, end });
          setAvailableMonths(months);

          const now = new Date();
          let initialMonth = format(start, "yyyy-MM");
          
          if (now >= start && now <= end) {
            initialMonth = format(now, "yyyy-MM");
          }
          
          setSelectedMonth(initialMonth);
          // If selectedMonth is already initialMonth, useEffect won't trigger
          // so we call it manually here to be safe
          if (selectedMonth === initialMonth) {
            fetchStudentsAndPresence();
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
        setLoading(false);
      }
    };


  const fetchStudentsAndPresence = async () => {
    setLoading(true);
    try {
      // Only show test records when admin is simulating another profile
      const showTestRecords = !!simulatedRole;
      
      let studentsQuery = supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, matricula_pfm, data_matricula, comportamento_atual, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
        .eq("status", "ativo");
        
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }

      const { data: studentsData } = await studentsQuery;

      if (studentsData) {
        const familyGroupsMap = new Map<string, FamilyGroup>();

        studentsData.forEach((student: any) => {
          const cpfs = [student.guardian1_cpf, student.guardian2_cpf].filter(Boolean).sort();
          const familyKey = cpfs.join(":") || `sem-responsavel-${student.matricula_pfm}`;
          
          if (!familyGroupsMap.has(familyKey)) {
            familyGroupsMap.set(familyKey, {
              id: familyKey,
              guardian1: { 
                name: student.guardian1_name || "NÃO INFORMADO", 
                cpf: student.guardian1_cpf || "", 
                titulo: student.guardian1_titulo || "Responsável" 
              },
              guardian2: student.guardian2_cpf ? { 
                name: student.guardian2_name, 
                cpf: student.guardian2_cpf, 
                titulo: student.guardian2_titulo || "Responsável" 
              } : undefined,
              students: []
            });
          }
          familyGroupsMap.get(familyKey)!.students.push(student);
        });

        const sortMatricula = (a: string, b: string) => {
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          const [numA, yearA] = a.split("/").map(Number);
          const [numB, yearB] = b.split("/").map(Number);
          if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
          return (numA || 0) - (numB || 0);
        };

        const getMinMatricula = (group: FamilyGroup) => {
          return group.students.reduce((min, student) => {
            const current = student.matricula_pfm || "";
            if (!min) return current;
            return sortMatricula(current, min) < 0 ? current : min;
          }, "");
        };

        setGroups(Array.from(familyGroupsMap.values()).sort((a, b) => {
          const matA = getMinMatricula(a);
          const matB = getMinMatricula(b);
          return sortMatricula(matA, matB);
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(g => 
      g.guardian1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.guardian1.cpf.includes(searchTerm) ||
      g.guardian2?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.guardian2?.cpf.includes(searchTerm) ||
      g.students.some(s => 
        s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.matricula_pfm.includes(searchTerm)
      )
    );
  }, [groups, searchTerm]);



  return (
    <div className="space-y-6 min-h-full relative pb-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
      
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-area {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            background: white !important;
          }
            .print-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: 15mm;
              border-top: 0.5pt solid #000;
              font-size: 8pt;
              display: flex;
              justify-content: center;
              align-items: center;
              background: white;
              text-align: center;
            }
            .page-number::after {
              content: "Página " counter(page);
            }
            .break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}</style>

      {/* Interface do Usuário */}
      <div className="no-print space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center border border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
              <ShieldCheck className="text-yellow-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Doação Voluntária</h1>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                PFM SYSTEM • GESTÃO 2026
              </div>
            </div>
          </div>
            <div className="flex gap-4">
              <Link href={`/doacao/imprimir?month=${selectedMonth}`}>
                <Button 
                  className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-3 text-yellow-500" />
                  Imprimir Lista
                </Button>
              </Link>
            </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-yellow-400/10 transition-colors duration-500" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-4 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Mês de Referência</label>
              <div className="relative group/select">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/select:text-yellow-400 transition-colors" />
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-12 pr-8 h-14 text-sm font-bold focus:ring-2 focus:ring-yellow-400/20 outline-none appearance-none cursor-pointer hover:border-zinc-700 transition-all"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {availableMonths.map(month => (
                    <option key={format(month, "yyyy-MM")} value={format(month, "yyyy-MM")}>
                      {format(month, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-8 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Pesquisar Registros</label>
              <div className="relative group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within/search:text-yellow-400 transition-colors" />
                <Input 
                  placeholder="Responsável, CPF ou Matrícula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-zinc-950 border-zinc-800 text-white h-14 rounded-2xl focus:ring-yellow-400/20 text-sm font-medium shadow-inner transition-all hover:border-zinc-700 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] shadow-2xl overflow-hidden no-print">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/50">
                          <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500">Alunos</th>
                          <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500">Responsáveis</th>
                        </tr>
                      </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="py-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
                            <div className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Sincronizando registros...</div>
                          </td>
                        </tr>
                      ) : filteredGroups.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-20 text-center">
                            <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-50" />
                            <div className="text-zinc-500 font-black uppercase tracking-widest text-sm">Nenhum registro encontrado</div>
                          </td>
                        </tr>
                      ) : (
                        filteredGroups.map((group, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/20 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="space-y-1.5">
                                {group.students.map((student, sidx) => (
                                  <div key={sidx} className="flex items-center gap-2">
                                    <span className="text-[11px] font-black font-mono text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">#{student.matricula_pfm}</span>
                                    <span className="text-sm font-black text-white uppercase truncate max-w-[150px]">{student.nome_guerra}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-white uppercase leading-none">{group.guardian1.name}</span>
                                </div>
                                {group.guardian2 && (
                                  <div className="flex flex-col pt-2 border-t border-zinc-800/50">
                                    <span className="text-[13px] font-bold text-zinc-400 uppercase leading-none">{group.guardian2.name}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
              </div>
            </div>

      </div>

    </div>
  );
}
