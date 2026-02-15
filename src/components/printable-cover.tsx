import React from "react";
import { format } from "date-fns";

interface Student {
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  blood_type: string;
  turma: string;
}

interface PrintableCoverProps {
  student: Student;
}

export const PrintableCover = React.forwardRef<HTMLDivElement, PrintableCoverProps>(
  ({ student }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-0 mx-auto printable-area flex flex-col items-center justify-between !w-[210mm] !h-[297mm]"
        style={{
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
          boxSizing: 'border-box',
          width: '210mm',
          height: '297mm',
          padding: '15mm',
          backgroundColor: 'white',
          position: 'relative'
        }}
      >
        <style jsx global>{`
          @media print {
            @page { 
              size: A4 portrait; 
              margin: 0; 
            }
            body { 
              margin: 0 !important; 
              padding: 0 !important;
              background-color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .printable-area {
              width: 210mm !important;
              height: 297mm !important;
              padding: 15mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
              background-color: white !important;
            }
          }
          @media screen {
            .printable-area {
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
          }
          .printable-area * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}</style>

        {/* Bordas Finas conforme o design */}
        <div className="absolute inset-[10mm] border-[0.5px] border-zinc-300 pointer-events-none" />
        <div className="absolute inset-[11mm] border-[0.5px] border-zinc-200 pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center mt-[15mm] w-full">
          <div className="mb-20 text-center">
            <h2 className="text-[22px] font-black tracking-[0.4em] uppercase text-zinc-800">
              IDENTIFICAÇÃO DO(A) ALUNO(A)
            </h2>
          </div>
          
          <div className="mb-10 w-[280px]">
            <img
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/457299fe-3a14-44fe-b553-88091598e7a6/BRASAO-BFM-1769571151682.png?width=8000&height=8000&resize=contain"
              alt="Brasão Força Mirim"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="z-10 flex flex-col items-center w-full px-[15mm]">
          <div className="w-full border-t border-zinc-100 mb-12" />
          
          <div className="text-center mb-10">
            <div className="text-[48px] font-black uppercase tracking-tight text-black flex items-center justify-center gap-6">
              <span>{student.matricula_pfm}</span>
              <span className="text-zinc-200 text-[40px]">•</span>
              <span>{student.nome_guerra}</span>
              <span className="text-zinc-200 text-[40px]">•</span>
              <span>{student.blood_type || "A+"}</span>
            </div>
          </div>
          
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 block mb-4">
              UNIDADE / PELOTÃO
            </span>
            <div className="text-[34px] font-black uppercase tracking-tight text-zinc-800">
              TURMA: {student.turma || "---"}
            </div>
          </div>

          <div className="w-full border-t border-zinc-100 mt-2 mb-12" />

          <div className="px-10 max-w-[550px]">
            <p className="text-[18px] font-medium italic text-zinc-500 leading-relaxed text-center">
              "Treinar a criança no caminho em que deve andar, e até quando envelhecer não se desviará dele."
            </p>
          </div>
        </div>

        <div className="z-10 flex flex-col items-center gap-6 mb-[15mm]">
          <div className="text-center">
            <span className="text-[14px] font-black uppercase tracking-[0.8em] text-zinc-600 block mb-3">
              G E S T Ã O &nbsp; {format(new Date(), "yyyy")}
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                PFM SYSTEM • DOCUMENTO DE IDENTIFICAÇÃO
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400/60">
                DESENVOLVIDO POR AVERO AGENCY
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintableCover.displayName = "PrintableCover";
