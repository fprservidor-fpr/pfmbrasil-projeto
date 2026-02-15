"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintableSheetProps {
  data: any;
}

export const PrintableEnrollmentSheet = forwardRef<HTMLDivElement, PrintableSheetProps>(
  ({ data }, ref) => {
    const healthQuestions = [
      { key: "health_1_plano_saude", label: "1) Plano de Saúde?" },
      { key: "health_2_vacina_covid", label: "2) Tomou vacina COVID-19?" },
      { key: "health_3_assistencia_social", label: "3) Acompanhamento com Assistência Social?" },
      { key: "health_4_psicologo", label: "4) Acompanhamento com Psicólogo?" },
      { key: "health_5_transtorno_psiquico", label: "5) Possui Transtorno Psíquico?" },
      { key: "health_6_algum_problema", label: "6) Possui algum problema de saúde?" },
      { key: "health_7_epiletico", label: "7) É Epilético?" },
      { key: "health_8_diabetico", label: "8) É Diabético?" },
      { key: "health_9_atividade_fisica", label: "9) Realiza alguma atividade física?" },
      { key: "health_10_restricao_alimentar", label: "10) Possui alguma restrição alimentar?" },
      { key: "health_11_acompanhamento_nutricional", label: "11) Acompanhamento nutricional?" },
      { key: "health_12_alergia", label: "12) Possui alguma alergia?" },
      { key: "health_13_medicamento", label: "13) Faz uso de medicamento?" },
      { key: "health_14_cirurgia", label: "14) Já fez alguma cirurgia?" },
    ];

    const turmaName = data.turmas?.nome || data.turma_nome || data.turma || "A DEFINIR";
    const fullAddress = `${data.address_street || "---"}, ${data.address_number || "S/N"} - ${data.address_neighborhood || "---"} - ${data.address_city || "TERESINA"}/${data.address_state || "PI"} - CEP: ${data.address_cep || "---"}`;

      return (
        <div 
          ref={ref} 
          className="bg-white text-black p-[8mm] w-[794px] min-h-[1123px] mx-auto text-[11px] print:p-[8mm] printable-area flex flex-col shadow-none" 
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", 
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <style jsx global>{`
            @media print {
              @page { 
                size: A4 portrait; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .printable-area {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 8mm !important;
                box-shadow: none !important;
                border: none !important;
                font-size: 11px !important;
              }
            }
            .printable-area * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          `}</style>
          
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-emerald-600 mb-4 pb-2 shrink-0">
            <div className="flex-1">
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 leading-none mb-1">FICHA DE MATRÍCULA</h1>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">PROGRAMA FORÇA MIRIM - {new Date().getFullYear()}</p>
            </div>
            <div className="border border-emerald-600 rounded-xl p-2 text-right bg-white min-w-[120px]">
              <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-0.5">MATRÍCULA PFM</span>
              <span className="text-xl font-black text-emerald-600 leading-none">{data.matricula_pfm || "XX/25"}</span>
            </div>
          </div>

          {/* Layout Principal */}
          <div className="flex gap-6 shrink-0">
            {/* Coluna Esquerda */}
            <div className="w-[160px] shrink-0 space-y-3">
              {/* Foto */}
              <div className="border border-dashed border-zinc-300 rounded-[1.5rem] p-4 text-center bg-zinc-50 aspect-[3/4] flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl text-zinc-400">👤</span>
                </div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">FOTO 3X4</span>
              </div>
              
              <div className="space-y-2">
                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block mb-0.5">TURMA</span>
                  <span className="text-base font-black text-zinc-900 uppercase leading-tight">{turmaName}</span>
                </div>

                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block mb-0.5">RENDA FAMILIAR</span>
                  <span className="text-xs font-bold text-zinc-800 uppercase leading-tight">{data.family_income || "NÃO INFORMADO"}</span>
                </div>

                <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
                  <span className="text-[9px] text-zinc-500 uppercase font-black block mb-0.5">DATA INCLUSÃO</span>
                  <span className="text-xs font-bold text-zinc-800 leading-tight">
                    {data.efetivada_em ? format(new Date(data.efetivada_em), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="flex-1 space-y-3">
              {/* Seção 01 */}
              <div className="border border-emerald-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm">
                <div className="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider">01 - DADOS DO ALUNO</span>
                </div>
                <div className="p-4 grid grid-cols-6 gap-x-4 gap-y-2 text-[10px]">
                  <div className="col-span-6">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">NOME COMPLETO:</span>
                    <span className="font-black text-base uppercase text-zinc-900 leading-none">{data.nome_completo || "---"}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">NOME DE GUERRA:</span>
                    <span className="font-black text-base text-emerald-600 uppercase leading-none">{data.nome_guerra || "---"}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">WHATSAPP:</span>
                    <span className="font-bold text-zinc-800">{data.whatsapp || "---"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">DATA NASC:</span>
                    <span className="font-bold text-zinc-800">{data.data_nascimento ? format(new Date(data.data_nascimento + "T12:00:00"), "dd/MM/yyyy") : "---"}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">IDADE:</span>
                    <span className="font-bold text-zinc-800">{data.idade || "---"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">GÊNERO:</span>
                    <span className="font-bold uppercase text-zinc-800">{data.gender || "---"}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">SANGUE:</span>
                    <span className="font-bold text-zinc-800">{data.blood_type || "---"}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">NOME DA MÃE:</span>
                    <span className="font-bold uppercase text-zinc-800 truncate block text-[10px]">{data.mother_name || "---"}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">NOME DO PAI:</span>
                    <span className="font-bold uppercase text-zinc-800 truncate block text-[10px]">{data.father_name || "---"}</span>
                  </div>
                  <div className="col-span-6 border-t border-zinc-100 pt-2 mt-0.5">
                    <span className="text-zinc-500 text-[9px] font-black uppercase block mb-0.5">ENDEREÇO COMPLETO:</span>
                    <span className="font-bold uppercase text-zinc-800 leading-tight text-[10px]">{fullAddress}</span>
                  </div>
                </div>
              </div>

              {/* Seção 02 */}
              <div className="border border-amber-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm">
                <div className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider">02 - RESPONSÁVEIS</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-6 text-[10px]">
                  <div className="space-y-1.5">
                    <div className="text-amber-600 font-black text-[9px] uppercase border-b border-amber-100 pb-0.5 mb-1.5">RESPONSÁVEL 01 (TITULAR)</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="col-span-2">
                        <span className="text-zinc-500 text-[9px] font-black uppercase">NOME:</span>
                        <span className="font-bold uppercase block text-zinc-900 truncate">{data.guardian1_name || "---"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] font-black uppercase">CPF:</span>
                        <span className="font-bold block text-zinc-900">{data.guardian1_cpf || "---"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] font-black uppercase">WHATSAPP:</span>
                        <span className="font-bold block text-zinc-900">{data.guardian1_whatsapp || "---"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-amber-600 font-black text-[9px] uppercase border-b border-amber-100 pb-0.5 mb-1.5">RESPONSÁVEL 02</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="col-span-2">
                        <span className="text-zinc-500 text-[9px] font-black uppercase">NOME:</span>
                        <span className="font-bold uppercase block text-zinc-900 truncate">{data.guardian2_name || "---"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] font-black uppercase">CPF:</span>
                        <span className="font-bold block text-zinc-900">{data.guardian2_cpf || "---"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[9px] font-black uppercase">WHATSAPP:</span>
                        <span className="font-bold block text-zinc-900">{data.guardian2_whatsapp || "---"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 03 - Dados Médicos */}
          <div className="mt-3 border border-red-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm shrink-0">
            <div className="bg-red-500 text-white px-4 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider">03 - DADOS MÉDICOS & SAÚDE</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                {healthQuestions.map((q) => {
                  const isPositive = data[q.key] === true;
                  const description = data.health_descriptions?.[q.key] || (q.key === "health_1_plano_saude" ? data.health_plano_saude_descricao : "");
                  
                  return (
                    <div key={q.key} className="flex justify-between items-center border-b border-zinc-50 py-0.5">
                      <span className="text-zinc-600 font-bold">{q.label}</span>
                      <div className="text-right shrink-0 ml-4 flex items-center gap-2">
                        <span className={`font-black ${isPositive ? 'text-red-600' : 'text-zinc-300'}`}>
                          {isPositive ? "SIM" : "NÃO"}
                        </span>
                        {isPositive && description && (
                          <span className="text-[9px] text-zinc-500 italic max-w-[120px] truncate">
                            ({description})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Termo de Compromisso */}
          <div className="mt-3 border border-zinc-100 rounded-[1.5rem] p-4 bg-zinc-50/30 shrink-0">
            <h4 className="text-xs font-black uppercase text-center mb-2 text-zinc-900 tracking-wider border-b border-zinc-200 pb-1">
              TERMO DE AUTORIZAÇÃO DE IMAGEM E COMPROMISSO
            </h4>
            <p className="text-[10px] text-zinc-600 leading-tight text-justify">
              Eu, <strong className="uppercase text-zinc-900">{data.guardian1_name || "_______________"}</strong>, portador(a) da cédula CPF <strong className="text-zinc-900">{data.guardian1_cpf || "_______________"}</strong>, AUTORIZO o uso de imagem do(a) aluno(a) <strong className="uppercase text-zinc-900">{data.nome_completo || "_______________"}</strong> inscrito nesta ficha de inscrição, em todo e qualquer material entre fotos, documentos e outros meios de comunicação, para ser utilizada em campanhas promocionais e institucionais da FUNDAÇÃO POPULUS RATIONABILIS. A presente autorização é concedida a título gratuito, abrangendo o uso da imagem acima mencionada em todo o território nacional e no exterior. Além disso, declaro que as informações acima preenchidas neste formulário são verídicas e que estou ciente de TODAS AS CONDIÇÕES E REGRAS DO PROGRAMA FORÇA MIRIM exigidas para permanência da criança e/ou adolescente, bem como participação dos pais ou responsáveis nas reuniões e atividades do referido programa.
            </p>
            <div className="flex justify-end mt-2 italic text-zinc-500 font-bold text-[9px]">
              DATA: {data.efetivada_em ? format(new Date(data.efetivada_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Assinaturas */}
          <div className="mt-auto pt-4 grid grid-cols-2 gap-12 shrink-0">
            <div className="text-center flex flex-col items-center">
              <div className="w-full border-t border-zinc-900 pt-1.5">
                <p className="text-[10px] font-black text-zinc-900 uppercase">Assinatura do Responsável</p>
                <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{data.guardian1_name || "Responsável"}</p>
              </div>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="w-full border-t border-zinc-900 pt-1.5">
                <p className="text-[10px] font-black text-zinc-900 uppercase">Assinatura do Atendente</p>
                <p className="text-[9px] text-zinc-500 uppercase mt-0.5">{data.attendant_name || "PROGRAMA FORÇA MIRIM"}</p>
              </div>
            </div>
          </div>

          {/* Rodapé Institucional */}
          <div className="mt-4 pt-2 border-t border-zinc-100 text-center shrink-0">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              FUNDAÇÃO POPULUS RATIONABILIS - CNPJ: 26.822.670/0001-87
            </p>
          </div>
        </div>
      );
  }
);

PrintableEnrollmentSheet.displayName = "PrintableEnrollmentSheet";
