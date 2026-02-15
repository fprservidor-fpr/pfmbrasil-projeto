"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintableEnrollmentSheet } from "@/components/printable-enrollment-sheet";
import { useReactToPrint } from "react-to-print";
import { generatePDF } from "@/lib/pdf-utils";
import { toast } from "sonner";

export default function PrintEnrollmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEnrollment = async () => {
      const { data, error } = await supabase
        .from("pre_matriculas")
        .select("*, turmas(nome)")
        .eq("id", id)
        .single();

      if (data) setEnrollment(data);
      setLoading(false);
    };

    fetchEnrollment();
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: enrollment ? `Ficha_Matricula_${enrollment.nome_completo.replace(/\s+/g, '_')}` : 'Ficha_Matricula',
  });

    const handleDownloadPDF = async () => {
      if (!componentRef.current) return;
      setIsExporting(true);
      const toastId = toast.loading("Gerando PDF...");
      
      try {
        await generatePDF(componentRef.current, `Ficha_Matricula_${enrollment.nome_completo.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF gerado com sucesso!", { id: toastId });
      } catch (error) {
        console.error(error);
        toast.error("Erro ao gerar PDF", { id: toastId });
      } finally {
        setIsExporting(false);
      }
    };

    if (loading) {

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Inscrição não encontrada.</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0">
      {/* Controls - Hidden on print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePrint()} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                Imprimir Ficha
              </Button>
            </div>

      </div>

      {/* Printable Area */}
      <div className="print:m-0 print:p-0 flex justify-center">
        <PrintableEnrollmentSheet ref={componentRef} data={enrollment} />
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
