"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2, Download } from "lucide-react";
import { PrintableCover } from "@/components/printable-cover";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

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
  const [downloading, setDownloading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Pré-carrega o brasão em base64 para evitar erros de CORS no Canvas Mobile
    const preloadLogo = async () => {
      try {
        const logoUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/457299fe-3a14-44fe-b553-88091598e7a6/BRASAO-BFM-1769571151682.png?width=800&height=800&resize=contain";
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Falha ao pré-carregar logo:", e);
      }
    };
    preloadLogo();

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleDownloadPDF = async () => {
    if (!componentRef.current) {
      toast.error("Erro interno: Área de impressão não encontrada.");
      return;
    }

    try {
      setDownloading(true);
      const loadingToast = toast.loading("Preparando exportação estável...");

      // Forçar scroll para o topo para evitar capturas parciais
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(componentRef.current, {
        scale: 1, // Escala 1 para garantir sucesso em qualquer celular (memória limitada)
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        width: componentRef.current.offsetWidth,
        height: componentRef.current.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // A4 em escala 1 (approx 794x1123px)
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`Capa_${student?.nome_guerra || "PFM"}.pdf`);

      toast.dismiss(loadingToast);
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro PDF:", error);
      toast.error("Erro ao gerar PDF no celular. Tente novamente ou use computador.");
    } finally {
      setDownloading(false);
    }
  };

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
            onClick={() => isMobile ? handleDownloadPDF() : handlePrint()}
            disabled={downloading}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-lg h-10 px-4 md:px-6"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMobile ? (
              <Download className="w-4 h-4" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{isMobile ? "Baixar PDF" : "Imprimir"}</span>
            {!isMobile && <span className="hidden md:inline">(Ctrl+P)</span>}
          </Button>
        </div>
      </div>

      {/* Mobile orientation hint */}
      <div className="md:hidden flex justify-center mb-4 px-4 print:hidden">
        <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-[11px] text-amber-700 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <Download className="w-3 h-3" />
            <span className="font-bold">Versão Mobile: Download Direto</span>
          </div>
          <p>O arquivo será baixado como PDF para garantir que a capa não fique cortada ou desorganizada.</p>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="print:m-0 print:p-0 flex justify-start md:justify-center bg-transparent overflow-x-auto overflow-y-hidden pb-8 scrollbar-hide touch-pan-x">
        <div className="inline-block min-w-max md:min-w-0 p-4 md:p-0">
          <PrintableCover ref={componentRef} student={student} logoUrl={logoBase64} />
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
