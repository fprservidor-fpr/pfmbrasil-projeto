"use client";

import { forwardRef } from "react";
import { format } from "date-fns";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  guardian1_name: string;
  guardian1_cpf: string;
}

interface FamilyGroup {
  id: string;
  guardian1: { name: string; cpf: string; titulo: string };
  guardian2?: { name: string; cpf: string; titulo: string };
  students: Student[];
  signed: boolean;
  signatureUrl?: string;
  signedByCpf?: string;
  signedByName?: string;
}

interface PrintableReuniaoSheetProps {
  groups: FamilyGroup[];
  event: { descricao: string; data: string } | null;
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const PrintableReuniaoSheet = forwardRef<HTMLDivElement, PrintableReuniaoSheetProps>(
  ({ groups, event }, ref) => {
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
        
        <div className="flex justify-between items-center border-b-2 border-blue-600 mb-4 pb-2">
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">ATA DE REUNIÃO DE PAIS</h1>
            <p className="text-xs font-bold text-black uppercase tracking-widest">PROGRAMA FORÇA MIRIM - {new Date().getFullYear()}</p>
          </div>
          <div className="border-2 border-blue-600 rounded-xl p-2 text-right bg-blue-50 min-w-[140px]">
            <span className="text-[9px] text-black uppercase font-bold block mb-0.5">EVENTO</span>
            <span className="text-sm font-black text-black leading-none">{event?.descricao || "---"}</span>
            <span className="text-[10px] text-black block mt-1">{event && format(new Date(event.data + "T00:00:00"), "dd/MM/yyyy")}</span>
          </div>
        </div>

        <table className="w-full border-collapse text-[9px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="bg-blue-600 text-white px-2 py-1.5 text-left text-[9px] font-black uppercase tracking-wider" style={{ width: '18%' }}>Alunos</th>
                <th className="bg-blue-600 text-white px-2 py-1.5 text-left text-[9px] font-black uppercase tracking-wider" style={{ width: '27%' }}>Responsáveis</th>
                <th className="bg-blue-600 text-white px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-wider" style={{ width: '55%' }}>Confirmação de Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, idx) => (
                <tr key={idx} className="border-b border-zinc-300" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <td className="px-2 py-1.5 align-top" style={{ wordBreak: 'break-word' }}>
                    {group.students.map((s, si) => (
                      <div key={si} className="font-bold uppercase text-black text-[8px]">
                        <span className="font-mono text-[7px] text-black">#{s.matricula_pfm}</span> {s.nome_guerra}
                      </div>
                    ))}
                  </td>
                  <td className="px-2 py-1.5 align-top" style={{ wordBreak: 'break-word' }}>
                    <div className="font-bold uppercase text-black text-[8px]">{group.guardian1.name}</div>
                    <div className="font-mono text-[7px] text-black">{formatCPF(group.guardian1.cpf)}</div>
                    {group.guardian2 && (
                      <div className="text-[7px] text-black mt-0.5 pt-0.5 border-t border-zinc-200">
                        <div>{group.guardian2.name}</div>
                        <div className="font-mono text-[6px]">{formatCPF(group.guardian2.cpf)}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5 align-middle text-center">
                    {group.signed ? (
                      <div className="flex flex-col items-center justify-center min-h-[40px]">
                        {group.signatureUrl === "FISICO" || !group.signatureUrl ? (
                          <div className="text-[9px] text-black font-black uppercase italic leading-tight px-4">
                            Assinado Eletronicamente por {group.signedByName || "Responsável"} - CPF Nº {formatCPF(group.signedByCpf || "")}
                          </div>
                        ) : (
                          <>
                            <img 
                              src={group.signatureUrl} 
                              alt="Assinatura" 
                              className="max-h-[45px] max-w-[180px]" 
                              style={{ filter: 'brightness(0) saturate(100%)' }}
                            />
                            {group.signedByName && (
                              <div className="text-[8px] text-black font-bold mt-0.5 uppercase">{group.signedByName}</div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="h-[40px] border-b border-black flex items-end justify-center">
                        <span className="text-[7px] text-zinc-400 mb-0.5 font-bold uppercase tracking-widest">
                          {group.guardian1.name === "RESPONSÁVEL AUSENTE" ? "FALTA REGISTRADA" : "Aguardando"}
                        </span>
                      </div>
                    )}
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

PrintableReuniaoSheet.displayName = "PrintableReuniaoSheet";
