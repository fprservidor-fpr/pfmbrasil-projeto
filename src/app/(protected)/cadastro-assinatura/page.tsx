"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Check,
  Loader2,
  X,
  AlertCircle,
  Users,
  Search,
  ShieldCheck,
  Printer,
  Fingerprint,
  FileCheck,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StarField } from "@/components/StarField";

interface AssinaturaCadastrada {
  id: string;
  cpf: string;
  nome_completo: string;
  assinatura_url: string;
  created_at: string;
  updated_at: string;
}

interface Responsavel {
  cpf: string;
  nome: string;
  titulo: string;
  alunos: string[];
  ordem: number;
}

export default function CadastroAssinaturaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCpf, setUserCpf] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [assinatura, setAssinatura] = useState<AssinaturaCadastrada | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [allAssinaturas, setAllAssinaturas] = useState<AssinaturaCadastrada[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResponsavel, setSelectedResponsavel] = useState<Responsavel | null>(null);
  const [editingAssinatura, setEditingAssinatura] = useState<AssinaturaCadastrada | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchUserAndSignature();
  }, []);

  useEffect(() => {
    if (isAdminMode) {
      fetchAllResponsaveis();
      fetchAllAssinaturas();
    }
  }, [isAdminMode]);

  const fetchUserAndSignature = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, cpf, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserCpf(profile.cpf || "");
        setUserName(profile.full_name || "");
        setUserRole(profile.role || "");
        
        if (["admin", "coord_geral", "instrutor"].includes(profile.role)) {
          setIsAdminMode(true);
        }
      }

      if (profile?.cpf && !["admin", "coord_geral", "instrutor"].includes(profile.role)) {
        const res = await fetch(`/api/assinatura?cpf=${profile.cpf}`);
        const { data } = await res.json();
        if (data && data.length > 0) {
          setAssinatura(data[0]);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResponsaveis = async () => {
    try {
      const { data: students } = await supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo, data_matricula")
        .eq("status", "ativo")
        .order("data_matricula", { ascending: true });

      if (!students) return;

      const responsaveisMap = new Map<string, Responsavel>();

      students.forEach((student, index) => {
        if (student.guardian1_cpf) {
          const cpf = student.guardian1_cpf.replace(/\D/g, "");
          if (cpf && !responsaveisMap.has(cpf)) {
            responsaveisMap.set(cpf, {
              cpf,
              nome: student.guardian1_name || "Não informado",
              titulo: student.guardian1_titulo || "Responsável 1",
              alunos: [],
              ordem: index
            });
          }
          if (cpf) {
            responsaveisMap.get(cpf)!.alunos.push(student.nome_guerra || student.nome_completo);
          }
        }

        if (student.guardian2_cpf) {
          const cpf = student.guardian2_cpf.replace(/\D/g, "");
          if (cpf && !responsaveisMap.has(cpf)) {
            responsaveisMap.set(cpf, {
              cpf,
              nome: student.guardian2_name || "Não informado",
              titulo: student.guardian2_titulo || "Responsável 2",
              alunos: [],
              ordem: index
            });
          }
          if (cpf) {
            responsaveisMap.get(cpf)!.alunos.push(student.nome_guerra || student.nome_completo);
          }
        }
      });

      setResponsaveis(Array.from(responsaveisMap.values()).sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllAssinaturas = async () => {
    try {
      const res = await fetch("/api/assinatura");
      const { data } = await res.json();
      if (data) {
        setAllAssinaturas(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmPhysicalSignature = async (resp: Responsavel) => {
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cpf: resp.cpf,
          nomeCompleto: resp.nome,
          isPhysical: true,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao salvar");
      }

      toast.success("Termo de assinatura física confirmado!");
      fetchAllAssinaturas();
      setShowConfirmModal(false);
      setSelectedResponsavel(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao confirmar assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignature = async () => {
    const targetAssinatura = editingAssinatura || assinatura;
    if (!targetAssinatura) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/assinatura?id=${targetAssinatura.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir");
      }

      toast.success("Assinatura removida.");
      
      if (isAdminMode) {
        fetchAllAssinaturas();
        setEditingAssinatura(null);
      } else {
        setAssinatura(null);
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir assinatura.");
    } finally {
      setSaving(false);
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "-";
    const digits = cpf.replace(/\D/g, "");
    const padded = digits.padStart(11, "0");
    return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const getAssinaturaByCpf = (cpf: string) => {
    return allAssinaturas.find(a => a.cpf === cpf);
  };

  const handlePrintTermo = (resp: Responsavel) => {
    const printContent = `
      <html>
        <head>
          <title>Termo de Autorização para Assinatura Eletrônica - ${resp.nome}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; font-weight: bold; }
            .header h2 { font-size: 16px; color: #444; margin-top: 8px; font-weight: normal; }
            .title { text-align: center; margin: 30px 0; }
            .title h3 { border: 2px solid #000; display: inline-block; padding: 10px 30px; font-size: 18px; text-transform: uppercase; font-weight: bold; }
            .content { margin: 30px 0; line-height: 1.8; text-align: justify; font-size: 16px; }
            .signature-area { margin-top: 80px; }
            .signature-line { width: 400px; border-top: 1px solid #000; margin: 0 auto; padding-top: 10px; text-align: center; }
            .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fundação Populus Rationabilis</h1>
            <h2>Programa Força Mirim - PFM</h2>
          </div>
          <div class="title">
            <h3>Termo de Autorização para Assinatura Eletrônica</h3>
          </div>
          <div class="content">
            <p>Eu, <strong>${resp.nome.toUpperCase()}</strong>, portador(a) do CPF nº <strong>${formatCPF(resp.cpf)}</strong>, na qualidade de responsável legal pelo(s) aluno(s) <strong>${resp.alunos.join(", ")}</strong>, AUTORIZO para os devidos fins de direito, que o Programa Força Mirim (PFM) utilize a metodologia de <strong>Assinatura Eletrônica</strong> em meu nome para documentos oficiais do programa.</p>
            <p>Declaro estar ciente de que, após a assinatura física deste termo, os documentos gerados pelo sistema PFM (atas de reunião, termos de participação, etc.) constarão com a observação: <strong>"Assinado Eletronicamente por ${resp.nome.toUpperCase()} - CPF Nº ${formatCPF(resp.cpf)}"</strong>, possuindo plena validade jurídica e administrativa perante a coordenação do programa, nos termos da Lei nº 14.063/2020.</p>
            <p>Esta autorização é concedida de livre e espontânea vontade e permanecerá válida enquanto o aluno estiver devidamente matriculado e ativo no programa, ou até que seja formalmente revogada por escrito.</p>
            <p style="margin-top: 40px; text-align: right;">Cuiabá - MT, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.</p>
          </div>
          <div class="signature-area">
            <div class="signature-line">
              <strong>${resp.nome.toUpperCase()}</strong><br/>
              <span>Assinatura do Responsável</span><br/>
              <span style="font-size: 12px;">CPF: ${formatCPF(resp.cpf)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Documento gerado pelo PFM Digital System em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.</p>
            <p>Referência: Lei nº 14.063/2020 (Assinatura Eletrônica e Digital).</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handlePrintAtaColetiva = () => {
    // Apenas responsáveis que ainda não assinaram o termo aparecem na ata coletiva
    const responsaveisParaAta = responsaveis.filter(resp => !getAssinaturaByCpf(resp.cpf));

    if (responsaveisParaAta.length === 0) {
      toast.error("Todos os responsáveis já possuem assinatura confirmada.");
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Ata Coletiva de Autorização para Assinatura Eletrônica</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Inter', sans-serif; color: #000; padding: 0; margin: 0; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin: 0; text-transform: uppercase; font-weight: 900; }
            .header p { font-size: 10px; color: #666; margin: 5px 0 0; font-weight: bold; letter-spacing: 1px; }
            .title { text-align: center; margin-bottom: 20px; }
            .title h2 { font-size: 14px; text-transform: uppercase; font-weight: 800; border: 1px solid #000; display: inline-block; padding: 5px 20px; }
            .legal-text { font-size: 9px; text-align: justify; line-height: 1.4; margin-bottom: 20px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; }
            th { background: #3b82f6; color: #fff; padding: 8px; text-align: left; text-transform: uppercase; font-weight: 900; }
            td { border: 1px solid #e2e8f0; padding: 8px; vertical-align: middle; }
            .sig-line { border-bottom: 1px solid #000; width: 100%; height: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
              tr { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Programa Força Mirim - PFM</h1>
            <p>FUNDAÇÃO POPULUS RATIONABILIS • GESTÃO 2026</p>
          </div>
          <div class="title">
            <h2>Ata Coletiva: Autorização para Assinatura Eletrônica</h2>
          </div>
          <div class="legal-text">
            Os abaixo assinados, na qualidade de responsáveis legais pelos alunos do Programa Força Mirim (PFM), AUTORIZAM o uso da <strong>Metodologia de Assinatura Eletrônica</strong> em seus nomes para documentos oficiais do programa (Atas de Reunião, Termos de Participação, etc.), nos termos da Lei nº 14.063/2020. Declaram estar cientes de que a assinatura física nesta ata confere plena validade jurídica às menções eletrônicas de seus nomes e CPFs nos sistemas digitais do PFM.
          </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 5%">#</th>
                  <th style="width: 35%">Responsável / CPF</th>
                  <th style="width: 60%">Assinatura de Concordância</th>
                </tr>
              </thead>
              <tbody>
                ${responsaveisParaAta.map((resp, i) => `
                  <tr>
                    <td style="text-align: center">${i + 1}</td>
                    <td>
                      <strong>${resp.nome.toUpperCase()}</strong><br/>
                      <span style="color: #64748b; font-family: monospace">${formatCPF(resp.cpf)}</span>
                    </td>
                    <td><div class="sig-line"></div></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          <div class="footer">
            Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • PFM Digital Security System
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const filteredResponsaveis = responsaveis.filter(r =>
    r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cpf.includes(searchTerm) ||
    r.alunos.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  const PageHeader = ({ title, subtitle, icon: Icon, badge }: { title: string, subtitle: string, icon: any, badge?: string }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-yellow-400/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.15)] group-hover:scale-110 transition-transform duration-500">
          <Icon className="text-yellow-400 w-9 h-9" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">{title}</h1>
          <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-yellow-500" />
            {subtitle}
          </div>
        </div>
      </div>
      {badge && (
        <div className="px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
          {badge}
        </div>
      )}
    </div>
  );

  if (isAdminMode) {
    return (
      <div className="relative min-h-screen pb-20 overflow-x-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <StarField />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/5 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-400/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.15)] group-hover:scale-110 transition-transform duration-500">
                <Fingerprint className="text-yellow-400 w-9 h-9" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">Gestão de Assinaturas</h1>
                <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" />
                  Administração • Base Digital PFM
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePrintAtaColetiva}
                className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <ClipboardList className="w-5 h-5 mr-3 text-yellow-500" />
                Imprimir Ata Coletiva
              </Button>
              <div className="px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
                Módulo de Segurança
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl mb-10 group transition-all hover:border-yellow-400/20">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" />
              <Input
                placeholder="Pesquisar por Nome, CPF ou Aluno vinculado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 bg-zinc-950/50 border-zinc-800 text-white h-16 rounded-2xl focus:ring-yellow-400/20 text-base font-medium placeholder:text-zinc-600 transition-all border-2 focus:border-yellow-400/40"
              />
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">
                  {filteredResponsaveis.length} Responsáveis Cadastrados
                </span>
              </div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-widest">
                Nova Metodologia: Assinatura Eletrônica via Termo Físico
              </div>
            </div>
            
            <div className="divide-y divide-zinc-800/30">
              {filteredResponsaveis.map((resp, index) => {
                const assinaturaExistente = getAssinaturaByCpf(resp.cpf);
                return (
                  <motion.div
                    key={resp.cpf}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "p-6 flex items-center gap-6 transition-all duration-300 group hover:bg-zinc-800/20",
                      assinaturaExistente && "bg-emerald-500/5"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-[50px]">
                      <span className="text-zinc-700 font-mono text-sm w-8">#{index + 1}</span>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        assinaturaExistente ? "bg-emerald-500/20" : "bg-zinc-800 group-hover:bg-yellow-400/10"
                      )}>
                        {assinaturaExistente ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-zinc-600 group-hover:text-yellow-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-black uppercase tracking-tight truncate">{resp.nome}</span>
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-zinc-800 rounded">{resp.titulo}</span>
                        {assinaturaExistente ? (
                          <span className="text-[9px] text-emerald-500 font-black uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Assinado
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500 font-black uppercase bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50">
                            Não Assinado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500 font-mono">{formatCPF(resp.cpf)}</span>
                        <div className="flex items-center gap-1.5">
                          {resp.alunos.map((aluno, idx) => (
                            <span key={idx} className="text-[10px] bg-zinc-900 text-yellow-400/70 border border-yellow-400/10 px-2 py-0.5 rounded font-medium">
                              {aluno}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintTermo(resp)}
                        className="h-10 px-4 rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest"
                      >
                        <Printer className="w-3.5 h-3.5 mr-2 text-yellow-500/70" />
                        Imprimir Termo
                      </Button>

                      {!assinaturaExistente ? (
                        <Button
                          onClick={() => {
                            setSelectedResponsavel(resp);
                            setShowConfirmModal(true);
                          }}
                          size="sm"
                          className="h-10 bg-yellow-500 hover:bg-yellow-400 text-black px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-2" />
                          Confirmar Assinatura
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAssinatura(assinaturaExistente);
                            setShowDeleteConfirm(true);
                          }}
                          className="h-10 w-10 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 p-0"
                          title="Revogar Assinatura"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {filteredResponsaveis.length === 0 && (
            <div className="bg-zinc-900/40 backdrop-blur-2xl border-2 border-dashed border-zinc-800/50 rounded-[3rem] p-24 text-center">
              <Users className="w-24 h-24 text-zinc-800 mx-auto mb-6 opacity-20" />
              <div className="text-zinc-600 font-black uppercase tracking-[0.3em] text-sm">Registro não localizado</div>
              <p className="text-zinc-700 text-xs mt-2">Verifique os termos da busca ou filtros aplicados.</p>
            </div>
          )}
        </div>

        {/* Modal de Confirmação Recebimento Termo */}
        <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <AlertDialogContent className="bg-zinc-900 border-yellow-400/20 rounded-[3rem] p-10">
            <AlertDialogHeader>
              <div className="w-20 h-20 bg-yellow-400/10 rounded-3xl flex items-center justify-center border border-yellow-400/20 mb-6 mx-auto">
                <ClipboardList className="w-10 h-10 text-yellow-400" />
              </div>
              <AlertDialogTitle className="text-2xl font-black text-white uppercase tracking-tighter text-center">Confirmar Assinatura?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed text-center mt-4">
                Você confirma que o responsável <strong className="text-white">{selectedResponsavel?.nome}</strong> entregou o termo de autorização assinado fisicamente? 
                <br /><br />
                A partir de agora, os documentos do sistema serão assinados eletronicamente em seu nome.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-4 mt-10">
              <AlertDialogCancel className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedResponsavel && handleConfirmPhysicalSignature(selectedResponsavel)} 
                disabled={saving}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-500/20"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Recebimento"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-zinc-900 border-red-500/20 rounded-[3rem] p-10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Revogar Assinatura?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
                A autorização de assinatura eletrônica de <strong className="text-white">{editingAssinatura?.nome_completo}</strong> será revogada. O sistema deixará de assinar documentos em seu nome.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-4 mt-10">
              <AlertDialogCancel className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest transition-all">
                Voltar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteSignature} 
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest"
              >
                {saving ? "Processando..." : "Confirmar Revogação"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Layout para Responsável (User)
  return (
    <div className="relative min-h-screen pb-20">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <StarField />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-400/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <PageHeader 
          title="Minha Assinatura" 
          subtitle="Identidade Digital • PFM System" 
          icon={ShieldCheck}
          badge="Acesso Seguro"
        />

        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/50 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all hover:border-yellow-400/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 block">Titular da Conta</label>
                <div className="text-white font-black text-xl uppercase tracking-tighter truncate">{userName || "Usuário não identificado"}</div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 block">Registro CPF</label>
                <div className="text-yellow-400/70 font-mono text-xl">{formatCPF(userCpf)}</div>
              </div>
            </div>

            {assinatura ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] shadow-[0_0_40px_rgba(16,185,129,0.05)] relative overflow-hidden text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-emerald-500 uppercase tracking-tighter mb-4">Assinatura Habilitada</h3>
                <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed mb-8">
                  Sua autorização de assinatura eletrônica está ativa. O sistema assinará documentos oficiais em seu nome utilizando a metodologia eletrônica certificada.
                </p>
                <div className="inline-block px-6 py-3 bg-zinc-950/50 rounded-2xl border border-zinc-800 font-mono text-zinc-500 text-xs">
                  Validado em {format(new Date(assinatura.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </motion.div>
            ) : (
              <div className="p-12 bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800">
                  <AlertCircle className="w-12 h-12 text-zinc-700" />
                </div>
                <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest mb-4">Aguardando Autorização</h3>
                <p className="text-zinc-600 text-sm max-w-md leading-relaxed mb-10">
                  Para habilitar sua assinatura eletrônica, você precisa imprimir o termo de autorização, assiná-lo fisicamente e entregá-lo à coordenação do PFM.
                </p>
                <Button
                  onClick={() => handlePrintTermo({ cpf: userCpf, nome: userName, alunos: [], ordem: 0, titulo: "Responsável" })}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-500/10"
                >
                  <Printer className="w-5 h-5 mr-3" />
                  Imprimir Termo de Autorização
                </Button>
              </div>
            )}

            <div className="p-8 bg-zinc-950/30 rounded-2xl border border-zinc-800/50">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">Informação Legal</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed italic">
                "A Assinatura Eletrônica PFM baseia-se na Lei nº 14.063/2020. Ao assinar o termo físico de autorização, você concorda que o sistema registre sua presença e autorizações através da menção eletrônica do seu nome e CPF nos documentos digitais do programa, possuindo plena eficácia jurídica."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
