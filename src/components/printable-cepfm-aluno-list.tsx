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
                className="bg-white text-black p-0 mx-auto printable-area"
                style={{
                    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                    boxSizing: 'border-box',
                    width: '794px', // A4 em pixels (96dpi)
                    minHeight: '1123px',
                    padding: '40px',
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
            }
            .printable-area {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 10mm 15mm !important;
              margin: 0 !important;
              background-color: white !important;
            }
          }
          .printable-area {
            font-size: 10px;
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

                <div className="mb-8 border-b-2 border-black pb-4 text-center">
                    <h1 className="text-lg font-black uppercase tracking-tight text-black leading-none mb-2">RELAÇÃO DE ALUNOS - CEPFM 2026</h1>
                    <p className="text-[10px] font-bold text-black uppercase tracking-[0.3em]">CONTROLE DE DISTRIBUIÇÃO E PATRULHAS</p>
                </div>

                <table className="w-full">
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
                            <tr key={idx} style={{ breakInside: 'avoid' }}>
                                <td className="font-bold uppercase text-[9px]">{student.turma || "---"}</td>
                                <td className="uppercase text-[9px]">
                                    <span className="font-mono text-[8px] block opacity-70">#{student.matricula_pfm || "---"}</span>
                                    <span className="font-black">{student.nome_guerra}</span>
                                </td>
                                <td className="uppercase text-[8px] font-medium">{student.nome_completo}</td>
                                <td className="py-2">
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
