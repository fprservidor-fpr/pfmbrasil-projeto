"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

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

interface Responsible {
  name: string;
  cpf: string;
  titulo: string;
  guardian2?: { name: string; cpf: string; titulo: string };
  hasDonated?: boolean;
  students: Array<{ nome: string; nome_guerra?: string; matricula: string }>;
}

interface MaterialReportData {
  responsibles: Responsible[];
  donations: any[];
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

function PrintDonationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { simulatedRole } = useAuth();
  const donationId = searchParams.get("donationId");
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [donationData, setDonationData] = useState<DonationData | null>(null);
  const [reportData, setReportData] = useState<MaterialReportData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (donationId) {
          const { data: donation } = await supabase
            .from("donations")
            .select("*")
            .eq("id", donationId)
            .single();

          if (donation) {
            const { data: items } = await supabase
              .from("donation_items")
              .select(`
                quantity,
                inventory_item:inventory_item_id (
                  name,
                  unit
                )
              `)
              .eq("donation_id", donationId);

            setDonationData({
              donor_name: donation.donor_name,
              donor_cpf: donation.donor_cpf,
              donation_date: donation.created_at,
              items: items?.map((item: any) => ({
                name: item.inventory_item?.name || "Item Removido",
                unit: item.inventory_item?.unit || "Un",
                quantity: item.quantity
              })) || []
            });
          }
        } else {
            // Only show test records when admin is simulating another profile
            const showTestRecords = !!simulatedRole;
            
            let studentsQuery = supabase.from("students")
              .select("nome_completo, nome_guerra, matricula_pfm, data_matricula, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
              .eq("status", "ativo")
              .order("data_matricula", { ascending: true });
              
            if (!showTestRecords) {
              studentsQuery = studentsQuery.eq("is_test", false);
            }
            
            const [stuRes, donRes, donItemsRes] = await Promise.all([
              studentsQuery,
              supabase.from("donations").select("*").order("created_at", { ascending: false }),
            supabase.from("donation_items").select("*, inventory_item:inventory_item_id(name, unit)")
          ]);

          const processedDonations = (donRes.data || []).map(d => ({
            ...d,
            items: (donItemsRes.data || [])
              .filter(di => di.donation_id === d.id)
              .map(di => ({
                name: di.inventory_item?.name || "Item Removido",
                quantity: di.quantity
              }))
          }));

            const finalResponsibles: Responsible[] = (stuRes.data || []).map(student => ({
              name: student.guardian1_name || "NÃO INFORMADO",
              cpf: student.guardian1_cpf || "",
              titulo: student.guardian1_titulo || "Responsável",
              guardian2: student.guardian2_cpf ? {
                name: student.guardian2_name,
                cpf: student.guardian2_cpf,
                titulo: student.guardian2_titulo || "Responsável"
              } : undefined,
              students: [{
                nome: student.nome_completo,
                nome_guerra: student.nome_guerra || student.nome_completo,
                matricula: student.matricula_pfm
              }],
              hasDonated: processedDonations.some(d => 
                (d.student_matricula === student.matricula_pfm || (!d.student_matricula && d.donor_cpf === student.guardian1_cpf)) && 
                d.status !== 'cancelled'
              )
            })).sort((a, b) => {
              const matA = a.students[0].matricula;
              const matB = b.students[0].matricula;
              if (!matA && !matB) return 0;
              if (!matA) return 1;
              if (!matB) return -1;
              const [numA, yearA] = matA.split("/").map(Number);
              const [numB, yearB] = matB.split("/").map(Number);
              if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
              return (numA || 0) - (numB || 0);
            });

          setReportData({
            responsibles: finalResponsibles,
            donations: processedDonations
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [donationId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: donationId 
      ? (donationData ? `Termo_Doacao_${donationData.donor_name.replace(/\s+/g, '_')}` : 'Termo_Doacao')
      : `Relatorio_Entrega_Materiais_${format(new Date(), 'dd_MM_yyyy')}`,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

    const today = new Date();
    const itemCount = donationData?.items.length || 0;
    const midPoint = donationData ? Math.ceil(itemCount / 2) : 0;
    const leftItems = donationData?.items.slice(0, midPoint) || [];
    const rightItems = donationData?.items.slice(midPoint) || [];
    
    // Ajusta tamanho da fonte baseado na quantidade de itens para caber em 1 página
    const getScaleFactor = () => {
      if (itemCount <= 6) return 1;
      if (itemCount <= 10) return 0.92;
      if (itemCount <= 14) return 0.85;
      if (itemCount <= 18) return 0.78;
      if (itemCount <= 24) return 0.72;
      return 0.65;
    };
    const scale = getScaleFactor();

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          onClick={() => handlePrint()} 
          disabled={donationId ? !donationData : !reportData}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-lg disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          Imprimir (Ctrl+P)
        </Button>
      </div>

      <div className="print:m-0 print:p-0 flex justify-center">
        {donationId ? (
          donationData ? (
            <div 
              ref={componentRef}
              className="bg-white text-black mx-auto printable-area"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                boxSizing: 'border-box',
                width: '210mm',
                height: '297mm',
                maxHeight: '297mm',
                padding: `${12 * scale}mm ${18 * scale}mm`,
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: `${16 * scale}px` }}>
                <h1 style={{ fontSize: `${14 * scale}pt`, fontWeight: 'bold', margin: `0 0 ${6 * scale}px 0`, textTransform: 'uppercase' }}>
                  FUNDAÇÃO POPULUS RATIONABILIS
                </h1>
                <h2 style={{ fontSize: `${13 * scale}pt`, fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
                  TERMO DE DOAÇÃO DE MATERIAL {new Date().getFullYear()}
                </h2>
              </div>

              <p style={{ textAlign: 'justify', marginBottom: `${6 * scale}px`, fontSize: `${11 * scale}pt`, lineHeight: 1.5 }}>
                Pelo presente instrumento, as partes abaixo qualificadas:
              </p>

              <div style={{ marginBottom: `${6 * scale}px` }}>
                <p style={{ textAlign: 'justify', marginBottom: `${3 * scale}px`, fontSize: `${11 * scale}pt`, lineHeight: 1.5 }}>
                  <strong style={{ textTransform: 'uppercase' }}>{donationData.donor_name}</strong>, inscrito(a) no CPF/CNPJ sob o número <strong>{formatCPF(donationData.donor_cpf)}</strong>, doravante denominado(a) <strong>DOADOR(A)</strong>.
                </p>
              </div>

              <div style={{ marginBottom: `${10 * scale}px` }}>
                <p style={{ textAlign: 'justify', fontSize: `${11 * scale}pt`, lineHeight: 1.5 }}>
                  <strong>Fundação Populus Rationabilis</strong>, inscrita no CNPJ sob o número <strong>26.822.670/0001-87</strong>, com endereço na Q.23A, Rua Arnaldo Lacerda, Nº 1496 Parque Piauí, Teresina PI, 64025-525, doravante denominada <strong>DONATÁRIA</strong>.
                </p>
              </div>

              <p style={{ textAlign: 'justify', marginBottom: `${10 * scale}px`, fontSize: `${11 * scale}pt`, lineHeight: 1.5 }}>
                As partes acima identificadas celebram o presente <strong>TERMO DE DOAÇÃO DE MATERIAL</strong>, mediante as seguintes cláusulas e condições:
              </p>

              <div style={{ marginBottom: `${10 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}pt`, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: `${6 * scale}px` }}>
                  CLÁUSULA PRIMEIRA – DO OBJETO
                </h3>
                <p style={{ textAlign: 'justify', marginBottom: `${6 * scale}px`, fontSize: `${11 * scale}pt`, lineHeight: 1.5 }}>
                  O presente termo tem por objeto a doação, pelo(a) <strong>DOADOR(A)</strong> à <strong>DONATÁRIA</strong>, do seguinte material:
                </p>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: `${6 * scale}px`, fontSize: `${10 * scale}px` }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid black', padding: `${3 * scale}px ${6 * scale}px`, textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f3f3f3', width: '35%' }}>MATERIAL</th>
                      <th style={{ border: '1px solid black', padding: `${3 * scale}px ${6 * scale}px`, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f3f3f3', width: '15%' }}>QTD</th>
                      <th style={{ border: '1px solid black', padding: `${3 * scale}px ${6 * scale}px`, textAlign: 'left', fontWeight: 'bold', backgroundColor: '#f3f3f3', width: '35%' }}>MATERIAL</th>
                      <th style={{ border: '1px solid black', padding: `${3 * scale}px ${6 * scale}px`, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f3f3f3', width: '15%' }}>QTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(leftItems.length, rightItems.length, 1) }).map((_, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid black', padding: `${2 * scale}px ${6 * scale}px`, textTransform: 'uppercase', fontSize: `${9 * scale}px` }}>
                          {leftItems[idx]?.name || ""}
                        </td>
                        <td style={{ border: '1px solid black', padding: `${2 * scale}px ${6 * scale}px`, textAlign: 'center', fontWeight: 'bold' }}>
                          {leftItems[idx]?.quantity || ""}
                        </td>
                        <td style={{ border: '1px solid black', padding: `${2 * scale}px ${6 * scale}px`, textTransform: 'uppercase', fontSize: `${9 * scale}px` }}>
                          {rightItems[idx]?.name || ""}
                        </td>
                        <td style={{ border: '1px solid black', padding: `${2 * scale}px ${6 * scale}px`, textAlign: 'center', fontWeight: 'bold' }}>
                          {rightItems[idx]?.quantity || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: `${8 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}pt`, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: `${5 * scale}px` }}>
                  CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DAS PARTES
                </h3>
                <p style={{ textAlign: 'justify', marginBottom: `${3 * scale}px`, fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  <strong>1. O(A) DOADOR(A)</strong> declara que o material doado está em condições adequadas para uso e que detém plena propriedade e posse do mesmo, estando livre de quaisquer ônus ou impedimentos.
                </p>
                <p style={{ textAlign: 'justify', marginBottom: `${3 * scale}px`, fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  <strong>2. A DONATÁRIA</strong> compromete-se a utilizar o material doado exclusivamente para os fins a que se destina, não podendo revendê-lo, alugá-lo ou repassá-lo a terceiros.
                </p>
                <p style={{ textAlign: 'justify', fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  <strong>3. O(A) DOADOR(A)</strong> declara que, uma vez realizada a doação, não terá mais qualquer direito, controle ou ingerência sobre o material doado, ficando sua posse e administração exclusivamente a cargo da DONATÁRIA, que se compromete a utilizá-lo conforme suas necessidades institucionais.
                </p>
              </div>

              <div style={{ marginBottom: `${8 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}pt`, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: `${5 * scale}px` }}>
                  CLÁUSULA TERCEIRA – DA ENTREGA DO MATERIAL
                </h3>
                <p style={{ textAlign: 'justify', fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  O material doado será entregue na sede da DONATÁRIA, na data da assinatura desta via, correndo as despesas de transporte e eventuais custos logísticos por conta do(a) DOADOR(A).
                </p>
              </div>

              <div style={{ marginBottom: `${8 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}pt`, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: `${5 * scale}px` }}>
                  CLÁUSULA QUARTA – DA GRATUIDADE
                </h3>
                <p style={{ textAlign: 'justify', fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  A presente doação é realizada de forma gratuita, não gerando qualquer tipo de contrapartida ou ônus para nenhuma das partes, sendo um ato espontâneo de liberalidade do(a) DOADOR(A).
                </p>
              </div>

              <div style={{ marginBottom: `${10 * scale}px` }}>
                <h3 style={{ fontSize: `${11 * scale}pt`, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: `${5 * scale}px` }}>
                  CLÁUSULA QUINTA – DA POSSE DA VIA
                </h3>
                <p style={{ textAlign: 'justify', fontSize: `${10 * scale}pt`, lineHeight: 1.4 }}>
                  Por estarem justos e acordados, assinam o presente termo, ficando a DONATÁRIA com total posse da via.
                </p>
              </div>

              <p style={{ textAlign: 'right', marginBottom: `${20 * scale}px`, fontSize: `${11 * scale}pt` }}>
                Teresina-PI, {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: `${10 * scale}px`, alignItems: 'flex-end', width: '100%' }}>
                <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: `${80 * scale}px` }}>
                  <div style={{ borderBottom: '1px solid black', marginBottom: `${6 * scale}px`, width: '100%' }}></div>
                  <p style={{ margin: 0, fontWeight: 'bold', textTransform: 'uppercase', fontSize: `${9 * scale}pt` }}>
                    {donationData.donor_name}
                  </p>
                  <p style={{ margin: 0, fontSize: `${8 * scale}pt` }}>Doador(a)</p>
                </div>

                <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: `${80 * scale}px` }}>
                  <img 
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/457299fe-3a14-44fe-b553-88091598e7a6/image-1768440183144.png?width=400&height=150&resize=contain" 
                    alt="Assinatura Presidente" 
                    style={{ width: '100%', maxHeight: `${70 * scale}px`, objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          ) : <p>Não encontrado</p>
        ) : (
          <div 
            ref={componentRef} 
            className="bg-white text-black p-0 mx-auto printable-area"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              padding: '10mm 15mm',
              backgroundColor: 'white',
              color: 'black',
              fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
              fontSize: '10px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ borderBottom: '2px solid #f59e0b', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px', color: '#18181b' }}>RELATÓRIO DE ENTREGA DE MATERIAL</h1>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '2px', margin: '4px 0 0 0' }}>FUNDAÇÃO POPULUS RATIONABILIS</p>
              </div>
              <div style={{ border: '2px solid #f59e0b', borderRadius: '12px', padding: '8px 16px', textAlign: 'right', backgroundColor: 'white', minWidth: '140px' }}>
                <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>DATA EMISSÃO</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '20%' }}>Alunos</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '25%' }}>Responsáveis</th>
                    <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '40%' }}>Itens Recebidos</th>
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '15%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.responsibles.map((resp, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e4e4e7', pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        {resp.students.map((s, si) => (
                          <div key={si} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.4 }}>
                            <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '10px' }}>#{s.matricula}</span> {s.nome_guerra}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '6px 8px', verticalAlign: 'top', borderLeft: '1px solid #e4e4e7' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{resp.name}</div>
                        {resp.guardian2 && (
                          <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f4f4f5' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b' }}>{resp.guardian2.name}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', verticalAlign: 'top', borderLeft: '1px solid #e4e4e7' }}>
                        {resp.hasDonated ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {reportData.donations
                              .find(d => 
                                (d.student_matricula === resp.students[0].matricula || (!d.student_matricula && d.donor_cpf === resp.cpf)) && 
                                d.status !== 'cancelled'
                              )
                              ?.items.map((it: any, i: number) => (
                                <span key={i} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b', backgroundColor: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>
                                  {it.quantity}x {it.name}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#d4d4d8', textTransform: 'uppercase', fontStyle: 'italic' }}>PENDENTE</span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', borderLeft: '1px solid #e4e4e7' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          textTransform: 'uppercase',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: resp.hasDonated ? '#18181b' : 'transparent',
                          color: resp.hasDonated ? 'white' : '#d4d4d8',
                          border: resp.hasDonated ? 'none' : '1px solid #e4e4e7'
                        }}>
                          {resp.hasDonated ? 'ENTREGUE' : 'PENDENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '2px solid #18181b' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b' }}>
                <div>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>(86) 9 9994-5135</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>WhatsApp</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>26.822.670/0001-87</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>CNPJ</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>@fpr_brazil</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>Redes Sociais</span>
                </div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#a1a1aa', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <span>PFM SYSTEM • FUNDAÇÃO POPULUS RATIONABILIS</span>
                <span>GESTÃO {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .printable-area {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintDonationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>}>
      <PrintDonationContent />
    </Suspense>
  );
}
