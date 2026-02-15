"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Download, 
  Loader2,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function ExportContactsPage() {
  const { profile } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExportGoogleContacts = async () => {
    setExporting(true);
    try {
      // Busca todos os alunos e pré-matrículas para garantir que ninguém fique de fora (incluindo 2026)
      const [studentsRes, preMatriculasRes] = await Promise.all([
        supabase
          .from("students")
          .select("nome_completo, nome_guerra, matricula_pfm, whatsapp, guardian1_whatsapp, guardian2_whatsapp, responsavel_whatsapp"),
        supabase
          .from("pre_matriculas")
          .select("nome_completo, nome_guerra, matricula_pfm, whatsapp, guardian1_whatsapp, guardian2_whatsapp, responsavel_whatsapp")
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (preMatriculasRes.error) throw preMatriculasRes.error;

      // Combina as duas listas e remove duplicatas baseadas na matrícula ou nome+whatsapp
      const allContactsRaw = [...(studentsRes.data || []), ...(preMatriculasRes.data || [])];
      const uniqueContactsMap = new Map();

      allContactsRaw.forEach(c => {
        // Usa matrícula como chave primária, se não houver, usa nome + whatsapp
        const key = c.matricula_pfm || `${c.nome_completo}-${c.whatsapp}`;
        if (!uniqueContactsMap.has(key)) {
          uniqueContactsMap.set(key, c);
        }
      });

      const students = Array.from(uniqueContactsMap.values());

      if (students.length === 0) {
        toast.error("Nenhum contato encontrado para exportar.");
        return;
      }

      // Ordenação por Matrícula (ex: 26/18 antes de 10/26)
      // Lógica: Extrai o ano (parte após a barra) e depois o número sequencial
      students.sort((a, b) => {
        const matA = (a.matricula_pfm || "").trim();
        const matB = (b.matricula_pfm || "").trim();
        
        if (!matA && !matB) return 0;
        if (!matA) return 1;
        if (!matB) return -1;

        const [numAStr, yearAStr] = matA.split("/");
        const [numBStr, yearBStr] = matB.split("/");
        
        const numA = parseInt(numAStr) || 0;
        const numB = parseInt(numBStr) || 0;
        let yearA = parseInt(yearAStr) || 0;
        let yearB = parseInt(yearBStr) || 0;

        // Normaliza anos (ex: 26 -> 2026, 2018 -> 2018)
        if (yearA > 0 && yearA < 100) yearA += 2000;
        if (yearB > 0 && yearB < 100) yearB += 2000;

        // Primeiro ordena pelo ano
        if (yearA !== yearB) return yearA - yearB;
        // Depois pelo número da matrícula
        return numA - numB;
      });

      const alunosMap = new Map<string, string>();
      const responsaveisMap = new Map<string, { tipo: string, alunos: string[] }>();

      students.forEach((s) => {
        // Formata o nome do aluno como "MATRÍCULA NOME_GUERRA"
        const matricula = s.matricula_pfm ? s.matricula_pfm.trim() : "S/M";
        const nomeGuerra = s.nome_guerra?.trim() || s.nome_completo?.split(" ")[0] || "";
        const nomeFormatado = `${matricula} ${nomeGuerra}`.trim().toUpperCase();
        
        // Aluno
        if (s.whatsapp) {
          const tel = s.whatsapp.replace(/\D/g, "");
          if (tel && tel.length >= 8) {
            if (!alunosMap.has(tel)) {
              alunosMap.set(tel, nomeFormatado);
            }
          }
        }

        // Função auxiliar para processar responsáveis de forma unificada
        const processarResp = (telRaw: string, tipoDefault: string) => {
          const tel = telRaw?.replace(/\D/g, "");
          if (!tel || tel.length < 8) return;
          
          if (!responsaveisMap.has(tel)) {
            responsaveisMap.set(tel, { tipo: tipoDefault, alunos: [] });
          }
          if (!responsaveisMap.get(tel)?.alunos.includes(nomeFormatado)) {
            responsaveisMap.get(tel)?.alunos.push(nomeFormatado);
          }
        };

        processarResp(s.guardian1_whatsapp, "RESP 01");
        processarResp(s.guardian2_whatsapp, "RESP 02");
        
        if (s.responsavel_whatsapp && 
            s.responsavel_whatsapp !== s.guardian1_whatsapp && 
            s.responsavel_whatsapp !== s.guardian2_whatsapp) {
          processarResp(s.responsavel_whatsapp, "RESP");
        }
      });

        const headers = [
          "Name Prefix", "First Name", "Middle Name", "Last Name", "Name Suffix", 
          "Phonetic First Name", "Phonetic Middle Name", "Phonetic Last Name", 
          "Nickname", "File As", "E-mail 1 - Label", "E-mail 1 - Value", 
          "Phone 1 - Label", "Phone 1 - Value", "Address 1 - Label", "Address 1 - Country", 
          "Address 1 - Street", "Address 1 - Extended Address", "Address 1 - City", 
          "Address 1 - Region", "Address 1 - Postal Code", "Address 1 - PO Box", 
          "Organization Name", "Organization Title", "Organization Department", 
          "Birthday", "Event 1 - Label", "Event 1 - Value", "Relation 1 - Label", 
          "Relation 1 - Value", "Website 1 - Label", "Website 1 - Value", 
          "Custom Field 1 - Label", "Custom Field 1 - Value", "Notes", "Labels"
        ];

        const csvRows = [headers];

        // Adiciona Alunos
        alunosMap.forEach((nome, telefone) => {
          const row = new Array(headers.length).fill("");
          row[0] = nome; // Name Prefix
          row[13] = telefone; // Phone 1 - Value
          csvRows.push(row);
        });

        // Adiciona Responsáveis com o formato: "RESP 01 - 26/18 RAMOS E 32/19 ANA"
        responsaveisMap.forEach((info, telefone) => {
          const nomeCompleto = `${info.tipo} - ${info.alunos.join(" E ")}`;
          const row = new Array(headers.length).fill("");
          row[0] = nomeCompleto; // Name Prefix
          row[13] = telefone; // Phone 1 - Value
          csvRows.push(row);
        });

      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const str = String(cell || "").replace(/"/g, '""');
          return str.includes(",") || str.includes("\n") || str.includes("\"") ? `"${str}"` : str;
        }).join(",")
      ).join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `contatos_google_pfm_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exportação de ${csvRows.length - 1} contatos concluída!`);
    } catch (error: any) {
      toast.error("Erro na exportação de contatos: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-zinc-400 text-sm">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/configuracoes">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Exportar Contatos</h1>
          <p className="text-zinc-400 text-sm">Gerar arquivo CSV otimizado para importação no Google Contatos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
              <Users className="text-blue-400 w-6 h-6" />
            </div>
            <CardTitle className="text-white">Contatos Unificados</CardTitle>
            <CardDescription className="text-zinc-400">
              Exporta todos os alunos e responsáveis (incluindo 2026) ordenados por matrícula.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    <span className="text-white font-bold block mb-1">Alunos</span>
                    Matrícula + Nome de Guerra (ex: 26/18 RAMOS).
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    <span className="text-white font-bold block mb-1">Responsáveis</span>
                    Formatado como: <code className="text-emerald-400">RESP 01 - 26/18 RAMOS</code> (Agrupados por telefone).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <div className="text-xs text-amber-200/70 leading-relaxed">
                    <span className="text-amber-400 font-bold block mb-1">Ordenação</span>
                    A lista é organizada por ordem de matrícula (Ano/Número).
                  </div>
                </div>
            </div>

            <Button 
              onClick={handleExportGoogleContacts} 
              disabled={exporting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Baixar CSV para Google Contatos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col justify-center items-center p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
            <ShieldCheck className="text-zinc-500 w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Todos os Anos Incluídos</h3>
            <p className="text-xs text-zinc-500 max-w-[200px]">
              O sistema agora inclui alunos efetivados e pré-matrículas (incluindo o ano de 2026).
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-2 w-full">
             <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-800/30 py-2 px-3 rounded-lg border border-zinc-800 justify-center uppercase tracking-widest font-bold">
               <FileSpreadsheet className="w-3 h-3" />
               Formato CSV (UTF-8)
             </div>
          </div>
        </Card>
      </div>

      <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
        <h4 className="text-amber-400 font-bold text-sm mb-2">Instruções de Importação:</h4>
        <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside">
          <li>Baixe o arquivo clicando no botão acima.</li>
          <li>Acesse <a href="https://contacts.google.com" target="_blank" className="text-blue-400 hover:underline">contacts.google.com</a>.</li>
          <li>No menu lateral, clique em <span className="text-zinc-200">"Importar"</span>.</li>
          <li>Selecione o arquivo que você acabou de baixar.</li>
          <li>O Google organizará automaticamente seus contatos.</li>
        </ol>
      </div>
    </div>
  );
}
