"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { PrintableDoacaoSheet } from "@/components/printable-doacao-sheet";
import { useAuth } from "@/components/auth-provider";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
}

interface FamilyGroup {
  id: string;
  guardian1: { name: string; cpf: string; titulo: string };
  guardian2?: { name: string; cpf: string; titulo: string };
  students: Student[];
}

function PrintDoacaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { simulatedRole } = useAuth();
  const monthStr = searchParams.get("month") || format(new Date(), "yyyy-MM");
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Only show test records when admin is simulating another profile
        const showTestRecords = !!simulatedRole;
        
        let studentsQuery = supabase
          .from("students")
          .select("id, nome_completo, nome_guerra, matricula_pfm, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
          .eq("status", "ativo");
          
        if (!showTestRecords) {
          studentsQuery = studentsQuery.eq("is_test", false);
        }

        const { data: studentsData } = await studentsQuery;

        if (studentsData) {
          const familyGroupsMap = new Map<string, FamilyGroup>();

          studentsData.forEach((student: any) => {
            const cpfs = [student.guardian1_cpf, student.guardian2_cpf].filter(Boolean).sort();
            const familyKey = cpfs.join(":") || `sem-responsavel-${student.id}`;
            
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthStr]);

  const selectedMonthLabel = useMemo(() => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase();
  }, [monthStr]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Lista_Doacao_${monthStr}`,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          onClick={() => handlePrint()} 
          className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4" />
          Imprimir (Ctrl+P)
        </Button>
      </div>

      <div className="print:m-0 print:p-0 flex justify-center">
        <PrintableDoacaoSheet ref={componentRef} groups={groups} selectedMonthLabel={selectedMonthLabel} />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintDoacaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
      <PrintDoacaoContent />
    </Suspense>
  );
}
