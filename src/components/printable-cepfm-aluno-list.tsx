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
                    width: '794px', // Exatamente A4 em pixels @ 96dpi
                    minHeight: '1123px', // Exatamente A4 em pixels @ 96dpi
                    padding: '40px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column'
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
            }
          }
          /* Force styles during PDF generation */
          .printable-area {
             width: 794px !important;
             min-height: 1123px !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            word-break: break-all;
            vertical-align: middle;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
          }
          td {
            font-size: 10px;
          }
          .patrol-option {
            font-size: 9px;
            display: inline-flex;
            align-items: center;
            margin-right: 10px;
            white-space: nowrap;
          }
        `}</style>

                <div className="mb-6 flex justify-between items-end border-b-2 border-black pb-4">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-black leading-none mb-1">RELAÇÃO DE ALUNOS</h1>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">CEPFM 2026 - CONTROLE DE EFETIVO</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-black uppercase">DATA: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                <div className="flex-1">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th style={{ width: '12%' }}>Turma</th>
                                <th style={{ width: '23%' }}>Matrícula / Guerra</th>
                                <th style={{ width: '30%' }}>Nome Completo</th>
                                <th style={{ width: '35%' }}>Patrulha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => (
                                <tr key={idx} style={{ breakInside: 'avoid' }}>
                                    <td className="font-bold uppercase text-[9px] text-center">{student.turma || "-"}</td>
                                    <td className="uppercase">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-[8px] text-zinc-500 leading-none mb-0.5">#{student.matricula_pfm || "---"}</span>
                                            <span className="font-black text-[10px] leading-tight">{student.nome_guerra}</span>
                                        </div>
                                    </td>
                                    <td className="uppercase text-[9px] font-medium leading-tight">{student.nome_completo}</td>
                                    <td className="py-1.5">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="patrol-option">
                                                <span className="w-3 h-3 border border-black inline-block mr-1 rounded-sm"></span> Águia
                                            </span>
                                            <span className="patrol-option">
                                                <span className="w-3 h-3 border border-black inline-block mr-1 rounded-sm"></span> Tubarão
                                            </span>
                                            <span className="patrol-option">
                                                <span className="w-3 h-3 border border-black inline-block mr-1 rounded-sm"></span> Leão
                                            </span>
                                            <span className="patrol-option">
                                                <span className="w-3 h-3 border border-black inline-block mr-1 rounded-sm"></span> Tigre
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 pt-4 border-t border-black/20 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Fundação Populus Rationabilis - Sistema de Gestão Integrada
                    </p>
                </div>
            </div>
        );
    }
);

PrintableCEPFMAlunoList.displayName = "PrintableCEPFMAlunoList";
