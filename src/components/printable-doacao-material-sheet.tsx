"use client";

import { forwardRef } from "react";
import { format } from "date-fns";

interface Responsible {
  name: string;
  cpf: string;
  guardian2?: { name: string; cpf: string };
  hasDonated?: boolean;
  students: Array<{ nome: string; nome_guerra?: string; matricula: string }>;
  donatedItems?: Array<{ name: string; quantity: number }>;
}

interface PrintableDoacaoMaterialSheetProps {
  responsibles: Responsible[];
}

export const PrintableDoacaoMaterialSheet = forwardRef<HTMLDivElement, PrintableDoacaoMaterialSheetProps>(
  ({ responsibles }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-0 mx-auto text-[11px] printable-area" 
        style={{ 
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", 
          boxSizing: 'border-box',
          width: '210mm',
          maxWidth: '210mm',
          padding: '10mm',
        }}
      >
        <style jsx global>{`
          @media print {
            @page { 
              size: A4 portrait; 
              margin: 10mm; 
            }
            html, body { 
              margin: 0 !important; 
              padding: 0 !important;
              width: 210mm !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .printable-area {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              font-size: 10px !important;
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
        
        <div className="flex justify-between items-center border-b-2 border-orange-500 mb-4 pb-2">
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">RELATÓRIO DE DOAÇÃO DE MATERIAL</h1>
            <p className="text-xs font-bold text-black uppercase tracking-widest">PROGRAMA FORÇA MIRIM - {new Date().getFullYear()}</p>
          </div>
          <div className="border-2 border-orange-500 rounded-xl p-2 text-right bg-orange-50 min-w-[120px]">
            <span className="text-[9px] text-black uppercase font-bold block mb-0.5">DATA</span>
            <span className="text-base font-black text-black leading-none">{format(new Date(), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        <table className="w-full border-collapse text-[9px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="bg-orange-500 text-white px-2 py-1.5 text-left text-[9px] font-black uppercase tracking-wider" style={{ width: '20%' }}>Alunos</th>
              <th className="bg-orange-500 text-white px-2 py-1.5 text-left text-[9px] font-black uppercase tracking-wider" style={{ width: '25%' }}>Responsáveis</th>
              <th className="bg-orange-500 text-white px-2 py-1.5 text-left text-[9px] font-black uppercase tracking-wider" style={{ width: '40%' }}>Itens Doados</th>
              <th className="bg-orange-500 text-white px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-wider" style={{ width: '15%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {responsibles.map((resp, idx) => (
              <tr key={idx} className="border-b border-zinc-300" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                <td className="px-2 py-1.5 align-top" style={{ wordBreak: 'break-word' }}>
                  {resp.students.map((s, si) => (
                    <div key={si} className="font-bold uppercase text-black text-[8px]">
                      <span className="font-mono text-[7px] text-black">#{s.matricula}</span> {s.nome_guerra}
                    </div>
                  ))}
                </td>
                <td className="px-2 py-1.5 align-top" style={{ wordBreak: 'break-word' }}>
                  <div className="font-bold uppercase text-black text-[8px]">{resp.name}</div>
                  {resp.guardian2 && (
                    <div className="text-[7px] text-black mt-0.5 pt-0.5 border-t border-zinc-200">{resp.guardian2.name}</div>
                  )}
                </td>
                <td className="px-2 py-1.5 align-top" style={{ wordBreak: 'break-word' }}>
                  {resp.hasDonated && resp.donatedItems ? (
                    <div className="flex flex-wrap gap-0.5">
                      {resp.donatedItems.map((it, i) => (
                        <span key={i} className="inline-block bg-zinc-200 px-1.5 py-0.5 rounded text-[7px] text-black">{it.quantity}x {it.name}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-zinc-400 text-[7px]">Aguardando entrega</span>
                  )}
                </td>
                <td className="px-2 py-1.5 align-top text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${resp.hasDonated ? 'bg-black text-white' : 'border border-zinc-300 text-zinc-400'}`}>
                    {resp.hasDonated ? 'ENTREGUE' : 'PENDENTE'}
                  </span>
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

PrintableDoacaoMaterialSheet.displayName = "PrintableDoacaoMaterialSheet";
