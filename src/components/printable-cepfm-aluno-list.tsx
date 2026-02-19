"use client";

import { forwardRef } from "react";

interface Student {
    id: string;
    nome_completo: string;
    nome_guerra: string;
    matricula_pfm: string;
    turma: string;
}

interface PrintableCEPFMAlunoListProps {
    students: Student[];
}

export const PrintableCEPFMAlunoList = forwardRef<HTMLDivElement, PrintableCEPFMAlunoListProps>(
    ({ students }, ref) => {
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
                    backgroundColor: 'white'
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
              background-color: white !important;
            }
            .printable-area {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              font-size: 10px !important;
              background-color: white !important;
              display: block !important;
            }
            table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            td, th {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              border: 1px solid black !important;
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
          table {
            border-collapse: collapse;
            width: 100%;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
            word-break: break-all;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
          }
          .patrol-option {
            font-size: 8px;
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
          }
        `}</style>

                <div className="flex justify-between items-center border-b-2 border-black mb-4 pb-2">
                    <div className="flex-1">
                        <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">RELAÇÃO DE ALUNOS - CEPFM 2026</h1>
                        <p className="text-xs font-bold text-black uppercase tracking-widest">CONTROLE DE DISTRIBUIÇÃO E PATRULHAS</p>
                    </div>
                </div>

                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Turma</th>
                            <th style={{ width: '25%' }}>Matrícula / Guerra</th>
                            <th style={{ width: '30%' }}>Nome Completo</th>
                            <th style={{ width: '30%' }}>Patrulha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <tr key={idx} className="border-b border-black" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <td className="px-2 py-1.5 align-top font-bold uppercase text-[9px]">{student.turma || "---"}</td>
                                <td className="px-2 py-1.5 align-top uppercase text-[9px]">
                                    <span className="font-mono text-[8px] block opacity-70">#{student.matricula_pfm || "---"}</span>
                                    <span className="font-black">{student.nome_guerra}</span>
                                </td>
                                <td className="px-2 py-1.5 align-top uppercase text-[8px] font-medium">{student.nome_completo}</td>
                                <td className="px-2 py-1.5 align-top">
                                    <div className="grid grid-cols-2 gap-y-1">
                                        <span className="patrol-option">
                                            <span className="mr-1">( )</span> Águia
                                        </span>
                                        <span className="patrol-option">
                                            <span className="mr-1">( )</span> Tubarão
                                        </span>
                                        <span className="patrol-option">
                                            <span className="mr-1">( )</span> Leão
                                        </span>
                                        <span className="patrol-option">
                                            <span className="mr-1">( )</span> Tigre
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-auto pt-4 text-right text-[8px] text-zinc-500 uppercase italic">
                    Gerado em {new Date().toLocaleString('pt-BR')} - PFM SYSTEM
                </div>
            </div>
        );
    }
);

PrintableCEPFMAlunoList.displayName = "PrintableCEPFMAlunoList";
