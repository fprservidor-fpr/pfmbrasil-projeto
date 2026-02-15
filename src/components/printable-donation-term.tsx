"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DonationData {
  donor_name: string;
  donor_cpf: string;
  donation_date: string;
  items: Array<{
    name: string;
    unit: string;
    quantity: number;
  }>;
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const PrintableDonationTerm = forwardRef<HTMLDivElement, { data: DonationData }>(
  ({ data }, ref) => {
    const today = new Date();
    
    const midPoint = Math.ceil(data.items.length / 2);
    const leftItems = data.items.slice(0, midPoint);
    const rightItems = data.items.slice(midPoint);
    
    const itemsCount = data.items.length;
    let tableFontClass = "text-[11px]";
    let spacingClass = "mb-5";

    if (itemsCount > 12) {
      tableFontClass = "text-[8.5px]";
      spacingClass = "mb-2";
    } else if (itemsCount > 8) {
      tableFontClass = "text-[9.5px]";
      spacingClass = "mb-3";
    } else if (itemsCount > 5) {
      tableFontClass = "text-[10.5px]";
      spacingClass = "mb-4";
    }

    return (
      <div 
        ref={ref}
        className="bg-white text-black p-0 mx-auto printable-term-area"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          boxSizing: 'border-box',
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 20mm',
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
              background-color: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .printable-term-area {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 15mm 20mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
              background-color: white !important;
            }
            table {
              width: 100% !important;
            }
            td, th {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
          }
          @media screen {
            .printable-term-area {
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
          .printable-term-area * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}</style>
        
        <div className="text-center mb-5">
          <h1 className="text-[14pt] font-bold m-0 mb-2 uppercase">
            FUNDAÇÃO POPULUS RATIONABILIS
          </h1>
          <h2 className="text-[13pt] font-bold m-0 uppercase">
            TERMO DE DOAÇÃO DE MATERIAL {new Date().getFullYear()}
          </h2>
        </div>

        <p className="text-justify mb-2 text-[12pt] leading-relaxed">
          Pelo presente instrumento, as partes abaixo qualificadas:
        </p>

        <div className="mb-2">
          <p className="text-justify mb-1 text-[12pt] leading-relaxed">
            <strong className="uppercase">{data.donor_name}</strong>, inscrito(a) no CPF/CNPJ sob o número <strong>{formatCPF(data.donor_cpf)}</strong>, doravante denominado(a) <strong>DOADOR(A)</strong>.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-justify text-[12pt] leading-relaxed">
            <strong>Fundação Populus Rationabilis</strong>, inscrita no CNPJ sob o número <strong>26.822.670/0001-87</strong>, com endereço na Q.23A, Rua Arnaldo Lacerda, Nº 1496 Parque Piauí, Teresina PI, 64025-525, doravante denominada <strong>DONATÁRIA</strong>.
          </p>
        </div>

        <p className={`text-justify ${spacingClass} text-[12pt] leading-relaxed`}>
          As partes acima identificadas celebram o presente <strong>TERMO DE DOAÇÃO DE MATERIAL</strong>, mediante as seguintes cláusulas e condições:
        </p>

        <div className={spacingClass}>
          <h3 className="text-[12pt] font-bold uppercase mb-2">
            CLÁUSULA PRIMEIRA – DO OBJETO
          </h3>
          <p className="text-justify mb-2 text-[12pt] leading-relaxed">
            O presente termo tem por objeto a doação, pelo(a) <strong>DOADOR(A)</strong> à <strong>DONATÁRIA</strong>, do seguinte material:
          </p>
          
          <table className={`w-full border-collapse mb-2 ${tableFontClass}`}>
            <thead>
              <tr>
                <th className="border border-black p-1 px-2 text-left font-bold bg-gray-100 w-[35%]">MATERIAL</th>
                <th className="border border-black p-1 px-2 text-center font-bold bg-gray-100 w-[15%]">QUANTIDADE</th>
                <th className="border border-black p-1 px-2 text-left font-bold bg-gray-100 w-[35%]">MATERIAL</th>
                <th className="border border-black p-1 px-2 text-center font-bold bg-gray-100 w-[15%]">QUANTIDADE</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(leftItems.length, rightItems.length, 3) }).map((_, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1 px-2 uppercase">
                    {leftItems[idx]?.name || ""}
                  </td>
                  <td className="border border-black p-1 px-2 text-center font-bold">
                    {leftItems[idx]?.quantity || ""}
                  </td>
                  <td className="border border-black p-1 px-2 uppercase">
                    {rightItems[idx]?.name || ""}
                  </td>
                  <td className="border border-black p-1 px-2 text-center font-bold">
                    {rightItems[idx]?.quantity || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <h3 className="text-[12pt] font-bold uppercase mb-2">
            CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DAS PARTES
          </h3>
          <p className="text-justify mb-1 text-[12pt] leading-relaxed">
            <strong>1. O(A) DOADOR(A)</strong> declara que o material doado está em condições adequadas para uso e que detém plena propriedade e posse do mesmo, estando livre de quaisquer ônus ou impedimentos.
          </p>
          <p className="text-justify mb-1 text-[12pt] leading-relaxed">
            <strong>2. A DONATÁRIA</strong> compromete-se a utilizar o material doado exclusivamente para os fins a que se destina, não podendo revendê-lo, alugá-lo ou repassá-lo a terceiros.
          </p>
          <p className="text-justify text-[12pt] leading-relaxed">
            <strong>3. O(A) DOADOR(A)</strong> declara que, uma vez realizada a doação, não terá mais qualquer direito, controle ou ingerência sobre o material doado, ficando sua posse e administração exclusivamente a cargo da DONATÁRIA, que se compromete a utilizá-lo conforme suas necessidades institucionais.
          </p>
        </div>

        <div className="mb-3">
          <h3 className="text-[12pt] font-bold uppercase mb-2">
            CLÁUSULA TERCEIRA – DA ENTREGA DO MATERIAL
          </h3>
          <p className="text-justify text-[12pt] leading-relaxed">
            O material doado será entregue na sede da DONATÁRIA, na data da assinatura desta via, correndo as despesas de transporte e eventuais custos logísticos por conta do(a) DOADOR(A).
          </p>
        </div>

        <div className="mb-3">
          <h3 className="text-[12pt] font-bold uppercase mb-2">
            CLÁUSULA QUARTA – DA GRATUIDADE
          </h3>
          <p className="text-justify text-[12pt] leading-relaxed">
            A presente doação é realizada de forma gratuita, não gerando qualquer tipo de contrapartida ou ônus para nenhuma das partes, sendo um ato espontâneo de liberalidade do(a) DOADOR(A).
          </p>
        </div>

        <div className={spacingClass}>
          <h3 className="text-[12pt] font-bold uppercase mb-2">
            CLÁUSULA QUINTA – DA POSSE DA VIA
          </h3>
          <p className="text-justify text-[12pt] leading-relaxed">
            Por estarem justos e acordados, assinam o presente termo, ficando a DONATÁRIA com total posse da via.
          </p>
        </div>

        <p className={`text-right ${itemsCount > 6 ? "mb-5" : "mb-10"} text-[12pt]`}>
          Teresina-PI, {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>

        <div className="flex justify-between mt-auto pt-5 items-end w-full">
          <div className="w-[45%] text-center flex flex-col justify-end h-[120px]">
            <div className="border-b border-black mb-2 w-full"></div>
            <p className="m-0 font-bold uppercase text-[10pt]">
              {data.donor_name}
            </p>
            <p className="m-0 text-[9pt]">Doador(a)</p>
          </div>

          <div className="w-[45%] text-center flex flex-col justify-end items-center h-[120px]">
            <img 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/457299fe-3a14-44fe-b553-88091598e7a6/image-1768440183144.png?width=400&height=150&resize=contain" 
              alt="Assinatura Presidente" 
              className="w-full max-h-[100px] object-contain"
            />
          </div>
        </div>
      </div>
    );
  }
);

PrintableDonationTerm.displayName = "PrintableDonationTerm";
