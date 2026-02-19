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
                className="bg-white text-black p-0 mx-auto text-[10px] printable-area"
                style={{
                    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
              border-collapse: collapse !important;
              width: 100% !important;
            }
            th, td {
              border: 1px solid black !important;
              padding: 4px 6px !important;
            }
          }
          @media screen {
            .printable-area {
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid black;
            padding: 4px 6px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
          }
          .checkbox-box {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1.5px solid black;
            margin-right: 4px;
            vertical-align: middle;
          }
          .patrol-option {
            display: inline-flex;
            align-items: center;
            margin-right: 12px;
            white-space: nowrap;
          }
        `}</style>

                <div className="mb-6 text-center">
                    <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">RELAÇÃO DE ALUNOS - CEPFM 2026</h1>
                    <p className="text-xs font-bold text-black uppercase tracking-widest">PARA DISTRIBUIÇÃO DE PATRULHAS</p>
                </div>

                <table className="w-full">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>Turma</th>
                            <th style={{ width: '20%' }}>Aluno</th>
                            <th style={{ width: '30%' }}>Nome do Aluno</th>
                            <th style={{ width: '35%' }}>Patrulha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, idx) => (
                            <tr key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <td className="font-bold uppercase">{student.turma || "---"}</td>
                                <td className="uppercase">
                                    <span className="font-mono text-[9px] mr-1">{student.matricula_pfm || "---"}</span>
                                    <span className="font-bold">{student.nome_guerra}</span>
                                </td>
                                <td className="uppercase">{student.nome_completo}</td>
                                <td>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
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
