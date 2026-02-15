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
      <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0 print:bg-white">
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

        <div className="print:m-0 print:p-0 flex justify-center bg-transparent">
          <PrintableCover ref={componentRef} student={student} />
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
