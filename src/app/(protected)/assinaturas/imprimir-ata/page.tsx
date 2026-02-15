"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

interface Guardian {
  nome: string;
  cpf: string;
}

export default function ImprimirAtaPage() {
  const { simulatedRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [guardiansToSign, setGuardiansToSign] = useState<Guardian[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [simulatedRole]);

  const fetchData = async () => {
    try {
      // Only show test records when admin is simulating another profile
      const showTestRecords = !!simulatedRole;
      
      let studentsQuery = supabase
        .from("students")
        .select("guardian1_name, guardian1_cpf, guardian2_name, guardian2_cpf")
        .eq("status", "ativo");
        
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }
      
      const { data: students } = await studentsQuery;

      if (!students) return;

      const guardianMap = new Map<string, string>();
      students.forEach(s => {
        if (s.guardian1_name && s.guardian1_cpf) {
          const cleanCpf = s.guardian1_cpf.replace(/\D/g, "");
          if (cleanCpf.length === 11) {
            guardianMap.set(cleanCpf, s.guardian1_name.toUpperCase());
          }
        }
        if (s.guardian2_name && s.guardian2_cpf) {
          const cleanCpf = s.guardian2_cpf.replace(/\D/g, "");
          if (cleanCpf.length === 11) {
            guardianMap.set(cleanCpf, s.guardian2_name.toUpperCase());
          }
        }
      });

      const { data: assinaturas } = await supabase
        .from("assinaturas_cadastradas")
        .select("cpf")
        .eq("ativo", true);

      const registeredCpfs = new Set(assinaturas?.map(a => a.cpf.replace(/\D/g, "")) || []);

      const pending: Guardian[] = [];
      guardianMap.forEach((nome, cpf) => {
        if (!registeredCpfs.has(cpf)) {
          pending.push({ nome, cpf });
        }
      });

      pending.sort((a, b) => a.nome.localeCompare(b.nome));
      setGuardiansToSign(pending);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ata_Coletiva_Assinaturas_${format(new Date(), "dd_MM_yyyy")}`,
  });

  const formatCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    const padded = digits.padStart(11, "0");
    return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-zinc-600">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h1 className="font-bold text-zinc-900">Ata Coletiva</h1>
            <p className="text-xs text-zinc-500">{guardiansToSign.length} pendentes</p>
          </div>
          <Button 
            onClick={() => handlePrint()} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ata
          </Button>
        </div>
      </div>

      <div className="print:m-0 print:p-0 flex justify-center">
        <div 
          ref={componentRef}
          className="bg-white text-black mx-auto printable-area"
          style={{
            fontFamily: "'Times New Roman', serif",
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          {/* PAGE 1: ATA LIST */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>FUNDAÇÃO POPULUS RATIONABILIS</h1>
            <h2 style={{ fontSize: '14pt', margin: 0 }}>PROGRAMA FORÇA MIRIM - PFM</h2>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14pt' }}>
            ATA COLETIVA DE TERMO DE ASSINATURAS - {new Date().getFullYear()}
          </div>

          <p style={{ textAlign: 'justify', fontSize: '11pt', marginBottom: '20px', lineHeight: 1.5 }}>
            Pela presente Ata Coletiva, os responsáveis abaixo relacionados declaram estar cientes e de acordo com o <strong>Termo de Autorização para Assinatura Eletrônica</strong> (conforme detalhado na página seguinte), autorizando que os documentos oficiais do Programa Força Mirim sejam firmados eletronicamente em seu nome.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontSize: '10pt', width: '30px' }}>Nº</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontSize: '10pt', width: '200px' }}>NOME DO RESPONSÁVEL</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontSize: '10pt', width: '100px' }}>CPF</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', fontSize: '10pt' }}>ASSINATURA</th>
              </tr>
            </thead>
            <tbody>
              {guardiansToSign.map((g, idx) => (
                <tr key={g.cpf} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontSize: '9pt' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid black', padding: '8px', fontSize: '9pt', textTransform: 'uppercase' }}>{g.nome}</td>
                  <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontSize: '9pt' }}>{formatCPF(g.cpf)}</td>
                  <td style={{ border: '1px solid black', padding: '8px', height: '60px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '9pt', color: '#666', paddingTop: '20px' }}>
            Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>

          {/* PAGE 2: TERMO DE ADESÃO */}
          <div style={{ pageBreakBefore: 'always', paddingTop: '10mm' }} />
          
          <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>FUNDAÇÃO POPULUS RATIONABILIS</h1>
            <h2 style={{ fontSize: '14pt', margin: 0 }}>PROGRAMA FORÇA MIRIM - PFM</h2>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '14pt' }}>
            TERMO DE AUTORIZAÇÃO PARA ASSINATURA ELETRÔNICA
          </div>

          <div style={{ fontSize: '11pt', lineHeight: 1.6, textAlign: 'justify' }} className="space-y-6">
            <p>
              O presente termo tem por objetivo regulamentar a utilização de <strong>Assinaturas Eletrônicas</strong> pelos responsáveis legais dos alunos matriculados no <strong>PROGRAMA FORÇA MIRIM (PFM)</strong>, mantido pela <strong>FUNDAÇÃO POPULUS RATIONABILIS</strong>.
            </p>

            <p>
              <strong>1. DA VALIDADE LEGAL:</strong> A assinatura eletrônica utilizada no sistema PFM possui validade legal plena, fundamentada na Lei nº 14.063/2020, que dispõe sobre o uso de assinaturas eletrônicas em interações com entes públicos e em questões de saúde.
            </p>

            <div>
              <strong>2. DA FINALIDADE:</strong> A autorização permite que o sistema registre a presença e concordância do responsável através da menção: <strong>"Assinado Eletronicamente por [NOME] - CPF Nº [CPF]"</strong> nos seguintes documentos:
              <ul style={{ listStyleType: 'disc', marginLeft: '30px', marginTop: '10px' }} className="space-y-1">
                <li>Atas de presença em reuniões de pais e mestres;</li>
                <li>Autorizações para participação em eventos e atividades externas;</li>
                <li>Termos de responsabilidade e autorizações de uso de imagem;</li>
                <li>Dossiês comportamentais e registros de frequência;</li>
                <li>Demais documentos oficiais emitidos pela coordenação do programa.</li>
              </ul>
            </div>

            <p>
              <strong>3. DA METODOLOGIA:</strong> Após a assinatura física desta ata coletiva (ou do termo individual), o responsável autoriza a coordenação do PFM a processar eletronicamente sua confirmação nos documentos digitais, possuindo a mesma eficácia de uma assinatura manuscrita.
            </p>

            <p>
              <strong>4. DO CONSENTIMENTO:</strong> Ao assinar a Ata Coletiva vinculada a este termo, o responsável manifesta sua livre e expressa vontade em aderir a esta metodologia, permanecendo válida enquanto o vínculo do aluno com o programa existir.
            </p>

            <p style={{ marginTop: '40px', textAlign: 'center' }}>
              Teresina/PI, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
            </p>

            <div style={{ marginTop: '60px', borderTop: '1px solid black', width: '250px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', paddingTop: '10px' }}>
              <p style={{ fontWeight: 'bold', margin: 0 }}>COORDENAÇÃO GERAL</p>
              <p style={{ fontSize: '9pt', margin: 0 }}>Programa Força Mirim</p>
            </div>
          </div>
        </div>
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
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
