"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Search,
  Loader2,
  Star,
  FileSignature,
  CheckCircle2,
  Users,
  Printer
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

interface AssinaturaCadastrada {
  id: string;
  cpf: string;
  nome_completo: string;
  assinatura_url: string;
  created_at: string;
  updated_at: string;
  alunos?: string[];
}

export default function AssinaturasPage() {
  const { simulatedRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assinaturas, setAssinaturas] = useState<AssinaturaCadastrada[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingSignature, setViewingSignature] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [simulatedRole]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("cpf, role")
        .eq("id", user.id)
        .single();

      const res = await fetch("/api/assinatura");
      const { data: assinaturasData } = await res.json();

      // Only show test records when admin is simulating another profile
      const showTestRecords = !!simulatedRole;
      
      let studentsQuery = supabase
        .from("students")
        .select("nome_guerra, guardian1_cpf, guardian2_cpf")
        .eq("status", "ativo");
        
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }

      const { data: students } = await studentsQuery;

      if (assinaturasData) {
          const enriched = assinaturasData.map((a: AssinaturaCadastrada) => {
            const cleanAssinaturaCpf = a.cpf.replace(/\D/g, "");
            const alunosVinculados = students?.filter(
              s => {
                const g1Cpf = (s.guardian1_cpf || "").replace(/\D/g, "");
                const g2Cpf = (s.guardian2_cpf || "").replace(/\D/g, "");
                return g1Cpf === cleanAssinaturaCpf || g2Cpf === cleanAssinaturaCpf;
              }
            ).map(s => s.nome_guerra) || [];
            return { ...a, alunos: alunosVinculados };
          });

        if (profile?.role === "admin" || profile?.role === "coord_geral" || profile?.role === "coord_nucleo" || profile?.role === "instrutor") {
          setAssinaturas(enriched);
        } else if (profile?.cpf) {
          const cleanCpf = profile.cpf.replace(/\D/g, "");
          const filtered = enriched.filter((a: AssinaturaCadastrada) => a.cpf === cleanCpf);
          setAssinaturas(filtered);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "-";
    const digits = cpf.replace(/\D/g, "");
    const padded = digits.padStart(11, "0");
    return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const filteredAssinaturas = assinaturas.filter(a =>
    a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cpf.includes(searchTerm.replace(/\D/g, "")) ||
    a.alunos?.some(al => al.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrint = (assinatura: AssinaturaCadastrada) => {
    const printContent = `
      <html>
        <head>
          <title>Termo de Assinatura Digital - ${assinatura.nome_completo}</title>
          <style>
            body { font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; }
            .header h2 { font-size: 16px; color: #666; margin-top: 8px; }
            .title { text-align: center; margin: 30px 0; }
            .title h3 { border: 2px solid #000; display: inline-block; padding: 10px 30px; font-size: 18px; text-transform: uppercase; }
            .content { margin: 30px 0; line-height: 1.8; text-align: justify; }
            .signature-box { text-align: center; margin-top: 50px; }
            .signature-box img { max-height: 80px; border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
            .signature-line { width: 300px; border-top: 2px solid #000; margin: 20px auto 0; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fundação Populus Rationabilis</h1>
            <h2>Programa Força Mirim - PFM</h2>
          </div>
          <div class="title">
            <h3>Termo de Cadastro de Assinatura Digital</h3>
          </div>
          <div class="content">
            <p>Eu, <strong>${assinatura.nome_completo.toUpperCase()}</strong>, portador(a) do CPF nº <strong>${formatCPF(assinatura.cpf)}</strong>, declaro para os devidos fins que cadastrei minha assinatura digital no sistema do Programa Força Mirim (PFM) para utilização em documentos oficiais.</p>
            <p>Declaro ainda que estou ciente de que esta assinatura eletrônica tem validade legal conforme a Lei nº 14.063/2020 e será utilizada para confirmar minha presença em reuniões, autorizar participações em eventos e assinar demais documentos oficiais do programa.</p>
            ${assinatura.alunos && assinatura.alunos.length > 0 ? `<p><strong>Alunos vinculados:</strong> ${assinatura.alunos.join(", ")}</p>` : ""}
            <p>Por ser expressão da verdade, confirmo o cadastro desta assinatura de livre e espontânea vontade.</p>
          </div>
          <div class="signature-box">
            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">${format(new Date(assinatura.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
            <img src="${assinatura.assinatura_url}" alt="Assinatura Digital" />
            <div class="signature-line">
              <strong>${assinatura.nome_completo.toUpperCase()}</strong><br/>
              <span style="font-size: 12px;">CPF: ${formatCPF(assinatura.cpf)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Documento gerado eletronicamente pelo PFM Digital System em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.</p>
            <p>Este documento possui validade legal conforme Lei nº 14.063/2020 (Assinatura Eletrônica).</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-400/10 rounded-2xl flex items-center justify-center border border-emerald-400/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
            <FileText className="text-emerald-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Assinaturas Cadastradas</h1>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              PFM SYSTEM • GESTÃO DE ASSINATURAS DIGITAIS
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Link href="/assinaturas/imprimir-ata">
            <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-400/10 font-bold rounded-2xl h-12 px-6">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Ata Coletiva
            </Button>
          </Link>

          <Link href="/cadastro-assinatura">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl h-12 px-6 w-full md:w-auto">
              <FileSignature className="w-4 h-4 mr-2" />
              Gerenciar Assinaturas
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-[2rem] shadow-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, CPF ou aluno vinculado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-zinc-950 border-zinc-800 text-white h-14 rounded-2xl focus:ring-emerald-400/20 text-sm font-medium"
          />
        </div>
      </div>

      {filteredAssinaturas.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] p-12 text-center">
          <Users className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <div className="text-zinc-500 font-black uppercase tracking-widest text-sm">Nenhuma assinatura cadastrada encontrada</div>
          <p className="text-zinc-600 text-sm mt-2">As assinaturas cadastradas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssinaturas.map((assinatura, idx) => (
            <motion.div
              key={assinatura.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] p-6 hover:border-emerald-500/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Atualizado em</div>
                  <div className="text-sm text-white font-bold">
                    {format(new Date(assinatura.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Responsável</div>
                <div className="text-white font-bold text-sm uppercase">{assinatura.nome_completo}</div>
                <div className="text-[10px] text-zinc-600 font-mono">{formatCPF(assinatura.cpf)}</div>
              </div>

              {assinatura.alunos && assinatura.alunos.length > 0 && (
                <div className="mb-4">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Alunos Vinculados</div>
                  <div className="flex flex-wrap gap-1">
                    {assinatura.alunos.slice(0, 3).map((aluno, aidx) => (
                      <span key={aidx} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {aluno}
                      </span>
                    ))}
                    {assinatura.alunos.length > 3 && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                        +{assinatura.alunos.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div 
                onClick={() => setViewingSignature(assinatura.assinatura_url)}
                className="bg-white rounded-xl p-3 flex items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors mb-4"
              >
                <img 
                  src={assinatura.assinatura_url} 
                  alt="Assinatura" 
                  className="max-h-16 object-contain invert opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => handlePrint(assinatura)}
                className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 rounded-xl text-xs font-bold"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Termo
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {viewingSignature && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-zinc-950/95 backdrop-blur-3xl"
          onClick={() => setViewingSignature(null)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={viewingSignature}
            className="max-w-full max-h-[70vh] object-contain invert grayscale brightness-50 p-12 bg-white rounded-[3rem] shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
