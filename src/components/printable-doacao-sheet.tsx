"use client";

import { forwardRef, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface StudentRow {
  matricula_pfm: string;
  nome_guerra: string;
  guardian1_name: string;
  guardian2_name?: string;
}

interface PrintableDoacaoSheetProps {
  groups: FamilyGroup[];
  selectedMonthLabel: string;
}

export const PrintableDoacaoSheet = forwardRef<HTMLDivElement, PrintableDoacaoSheetProps>(
  ({ groups, selectedMonthLabel }, ref) => {
    const allStudents: StudentRow[] = useMemo(() => {
      const students: StudentRow[] = [];
      groups.forEach(group => {
        group.students.forEach(student => {
          students.push({
            matricula_pfm: student.matricula_pfm,
            nome_guerra: student.nome_guerra,
            guardian1_name: group.guardian1.name,
            guardian2_name: group.guardian2?.name,
          });
        });
      });
      
      return students.sort((a, b) => {
        const [numA, yearA] = (a.matricula_pfm || "").split("/").map(Number);
        const [numB, yearB] = (b.matricula_pfm || "").split("/").map(Number);
        if ((yearA || 0) !== (yearB || 0)) return (yearA || 0) - (yearB || 0);
        return (numA || 0) - (numB || 0);
      });
    }, [groups]);

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-0 mx-auto text-[11px] printable-area" 
        style={{ 
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", 
          boxSizing: 'border-box',
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm 15mm',
          backgroundColor: 'white'
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
              min-height: 297mm !important;
              padding: 10mm 15mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
              background-color: white !important;
            }
            table {
              width: 100% !important;
              table-layout: fixed !important;
            }
            td, th {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
          }
          @media screen {
            .printable-area {
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
          .printable-area * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}</style>
        
          <div className="flex justify-between items-center border-b-2 border-amber-500 mb-4 pb-2">
            <div className="flex-1">
              <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">LISTA DE DOAÇÃO VOLUNTÁRIA</h1>
                <p className="text-xs font-bold text-black uppercase tracking-widest">FUNDAÇÃO POPULUS RATIONABILIS</p>
            </div>
            <div className="border-2 border-amber-500 rounded-xl p-2 text-right bg-amber-50 min-w-[140px]">
              <span className="text-[11px] text-black uppercase font-bold block mb-0.5">MÊS REFERÊNCIA</span>
              <span className="text-base font-black text-black leading-none">{selectedMonthLabel}</span>
            </div>
          </div>
  
          <table className="w-full border-collapse text-[11px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="bg-amber-500 text-white px-2 py-1.5 text-left text-[11px] font-black uppercase tracking-wider" style={{ width: '22%' }}>Aluno</th>
                <th className="bg-amber-500 text-white px-2 py-1.5 text-left text-[11px] font-black uppercase tracking-wider" style={{ width: '38%' }}>Responsáveis</th>
                <th className="bg-amber-500 text-white px-2 py-1.5 text-left text-[11px] font-black uppercase tracking-wider" style={{ width: '40%' }}>Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {allStudents.map((student, idx) => (
                  <tr key={idx} className="border-b border-zinc-300" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <td className="px-2 py-1.5 align-middle" style={{ wordBreak: 'break-word' }}>
                      <div className="font-bold uppercase text-black text-[12px]">
                        <span className="font-mono text-[11px] text-black">#{student.matricula_pfm}</span> {student.nome_guerra}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 align-middle" style={{ wordBreak: 'break-word' }}>
                      <div className="font-bold uppercase text-black text-[12px]">{student.guardian1_name}</div>
                      {student.guardian2_name && (
                        <div className="text-[11px] text-black">{student.guardian2_name}</div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                    <div className="h-[24px] border-b border-black"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        <div className="mt-8 pt-4 border-t-2 border-black">
          <div className="flex justify-between text-[9px]">
            <div>
              <div className="font-bold text-black">(86) 9 9994-5135</div>
              <div className="text-zinc-500 text-[8px]">WhatsApp</div>
            </div>
            <div>
              <div className="font-bold text-black">26.822.670/0001-87</div>
              <div className="text-zinc-500 text-[8px]">CNPJ</div>
            </div>
            <div>
              <div className="font-bold text-black">@fpr_brazil</div>
              <div className="text-zinc-500 text-[8px]">Redes Sociais</div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200 flex justify-between text-zinc-500 text-[8px] uppercase">
            <span>PFM SYSTEM - FUNDAÇÃO POPULUS RATIONABILIS</span>
            <span>GESTÃO {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    );
  }
);

PrintableDoacaoSheet.displayName = "PrintableDoacaoSheet";
