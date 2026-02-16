"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { PrintableCover } from "@/components/printable-cover";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  blood_type: string;
  turma: string;
}

function PrintCoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get("student_id");
  const componentRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, nome_completo, nome_guerra, matricula_pfm, blood_type, turma")
          .eq("id", studentId)
          .single();

        if (error) throw error;
        setStudent(data);
      } catch (error) {
        console.error("Erro ao carregar dados do aluno:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Capa_Caderno_${student?.nome_guerra || "PFM"}`,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-zinc-800">Aluno não encontrado</h2>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0 print:bg-white overflow-x-hidden">
      {/* Header - Sticky on mobile */}
      <div className="sticky top-0 z-50 bg-zinc-100/90 backdrop-blur-md border-b border-zinc-200 md:border-none md:bg-transparent md:static md:max-w-[210mm] mx-auto mb-4 md:mb-6 flex justify-between items-center p-4 md:p-0 print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-2 hidden lg:inline">
            Visualização de Impressão (A4)
          </span>
          <Button
            onClick={() => handlePrint()}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-lg h-10 px-4 md:px-6"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
            <span className="hidden md:inline">(Ctrl+P)</span>
          </Button>
        </div>
      </div>

      {/* Mobile orientation hint */}
      <div className="md:hidden flex justify-center mb-4 px-4 print:hidden">
        <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-[11px] text-amber-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
          Para melhor visualização, você pode deslizar para os lados ou usar modo paisagem.
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="print:m-0 print:p-0 flex justify-start md:justify-center bg-transparent overflow-x-auto overflow-y-hidden pb-8 scrollbar-hide touch-pan-x">
        <div className="inline-block min-w-max md:min-w-0 p-4 md:p-0">
          <PrintableCover ref={componentRef} student={student} />
        </div>
      </div>

      <style jsx global>{`
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print\:hidden {
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

export default function PrintCoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
      <PrintCoverContent />
    </Suspense>
  );
}
