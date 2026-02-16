"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Save,
  Loader2,
  Trash2,
  Plus,
  Settings,
  Eye,
  Tag,
  FileSpreadsheet,
  Database,
  Download,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const PERFIS_DISPONIVEIS = [
  { id: "admin", label: "Administrador" },
  { id: "coordenador_geral", label: "Coordenador Geral" },
  { id: "coordenador_nucleo", label: "Coordenador de Núcleo" },
  { id: "instrutor", label: "Instrutor" },
  { id: "monitor", label: "Monitor" },
  { id: "voluntario", label: "Voluntário" },
];

const CORES_DISPONIVEIS = [
  { id: "red", label: "Vermelho", class: "bg-red-500" },
  { id: "amber", label: "Âmbar", class: "bg-amber-500" },
  { id: "emerald", label: "Verde", class: "bg-emerald-500" },
  { id: "blue", label: "Azul", class: "bg-blue-500" },
  { id: "purple", label: "Roxo", class: "bg-purple-500" },
  { id: "cyan", label: "Ciano", class: "bg-cyan-500" },
  { id: "pink", label: "Rosa", class: "bg-pink-500" },
  { id: "orange", label: "Laranja", class: "bg-orange-500" },
];

export default function GestaoSistemaPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("avisos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avisos, setAvisos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [tiposEventos, setTiposEventos] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    ano_letivo: 2026,
    data_inicio_letivo: "",
    data_fim_letivo: "",
    recesso_inicio: "",
    recesso_fim: "",
    ano_letivo_ativo: true
  });

  const [newAviso, setNewAviso] = useState({
    tipo: "geral",
    titulo: "",
    mensagem: "",
    data_inicio: format(new Date(), "yyyy-MM-dd"),
    data_fim: "",
  });

  const [newEvento, setNewEvento] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    tipo_evento_id: "",
    descricao: "",
  });

  const [newTipoEvento, setNewTipoEvento] = useState({
    nome: "",
    cor: "blue",
    bloqueia_aula: false,
    visibilidade_perfis: ["admin", "coordenador_geral", "coordenador_nucleo", "instrutor", "monitor", "voluntario"],
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: avisosData }, { data: eventosData }, { data: configData }, { data: tiposData }] = await Promise.all([
      supabase.from("avisos").select("*").order("created_at", { ascending: false }),
      supabase.from("calendario_letivo").select("*, tipos_eventos(*)").order("data", { ascending: true }),
      supabase.from("configuracoes_sistema").select("*").single(),
      supabase.from("tipos_eventos").select("*").order("nome")
    ]);
    if (avisosData) setAvisos(avisosData);
    if (eventosData) setEventos(eventosData);
    if (configData) setConfig(configData);
    if (tiposData) setTiposEventos(tiposData);
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("configuracoes_sistema")
        .update({
          ano_letivo: config.ano_letivo,
          data_inicio_letivo: config.data_inicio_letivo || null,
          data_fim_letivo: config.data_fim_letivo || null,
          recesso_inicio: config.recesso_inicio || null,
          recesso_fim: config.recesso_fim || null,
          ano_letivo_ativo: config.ano_letivo_ativo
        })
        .eq("id", config.id);

      if (error) throw error;
      toast.success("Configurações do ano letivo salvas!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveAviso = async () => {
    if (!newAviso.titulo.trim() || !newAviso.mensagem.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("avisos").insert([{
        ...newAviso,
        data_fim: newAviso.data_fim || null,
        created_by: profile?.id,
      }]);
      if (error) throw error;
      toast.success("Aviso salvo com sucesso!");
      setNewAviso({
        tipo: "geral",
        titulo: "",
        mensagem: "",
        data_inicio: format(new Date(), "yyyy-MM-dd"),
        data_fim: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar aviso");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAviso = async (id: string) => {
    try {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aviso removido!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover aviso");
    }
  };

  const handleSaveEvento = async () => {
    if (!newEvento.descricao.trim() || !newEvento.tipo_evento_id) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      const tipoSelecionado = tiposEventos.find(t => t.id === newEvento.tipo_evento_id);
      const { error } = await supabase.from("calendario_letivo").insert([{
        data: newEvento.data,
        tipo: tipoSelecionado?.nome?.toLowerCase() || "evento",
        tipo_evento_id: newEvento.tipo_evento_id,
        descricao: newEvento.descricao,
      }]);
      if (error) throw error;
      toast.success("Evento adicionado ao calendário!");
      setNewEvento({
        data: format(new Date(), "yyyy-MM-dd"),
        tipo_evento_id: "",
        descricao: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvento = async (id: string) => {
    try {
      const { error } = await supabase.from("calendario_letivo").delete().eq("id", id);
      if (error) throw error;
      toast.success("Evento removido!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover evento");
    }
  };

  const handleSaveTipoEvento = async () => {
    if (!newTipoEvento.nome.trim()) {
      toast.error("Informe o nome do tipo de evento");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("tipos_eventos").insert([newTipoEvento]);
      if (error) throw error;
      toast.success("Tipo de evento criado!");
      setNewTipoEvento({
        nome: "",
        cor: "blue",
        bloqueia_aula: false,
        visibilidade_perfis: ["admin", "coordenador_geral", "coordenador_nucleo", "instrutor", "monitor", "voluntario"],
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar tipo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTipoEvento = async (id: string) => {
    try {
      const { error } = await supabase.from("tipos_eventos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Tipo removido!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover tipo");
    }
  };

  const togglePerfilVisibilidade = (perfilId: string) => {
    const current = newTipoEvento.visibilidade_perfis;
    if (current.includes(perfilId)) {
      setNewTipoEvento({ ...newTipoEvento, visibilidade_perfis: current.filter(p => p !== perfilId) });
    } else {
      setNewTipoEvento({ ...newTipoEvento, visibilidade_perfis: [...current, perfilId] });
    }
  };

  const handleExportGoogleContacts = async () => {
    setSaving(true);
    try {
      const { data: students, error } = await supabase
        .from("students")
        .select("nome_completo, whatsapp, guardian1_whatsapp, guardian2_whatsapp, responsavel_whatsapp")
        .eq("status", "ativo")
        .eq("is_test", false);

      if (error) throw error;
      if (!students || students.length === 0) {
        toast.error("Nenhum aluno ativo encontrado para exportar.");
        return;
      }

      const alunosMap = new Map<string, string>();
      const responsaveisMap = new Map<string, { tipo: string, alunos: string[] }>();

      students.forEach((s) => {
        const nome = s.nome_completo;

        if (s.whatsapp) {
          if (!alunosMap.has(s.whatsapp)) {
            alunosMap.set(s.whatsapp, nome);
          }
        }

        if (s.guardian1_whatsapp) {
          const tel = s.guardian1_whatsapp;
          if (!responsaveisMap.has(tel)) {
            responsaveisMap.set(tel, { tipo: "RESP 01", alunos: [] });
          }
          responsaveisMap.get(tel)?.alunos.push(nome);
        }

        if (s.guardian2_whatsapp) {
          const tel = s.guardian2_whatsapp;
          if (!responsaveisMap.has(tel)) {
            responsaveisMap.set(tel, { tipo: "RESP 02", alunos: [] });
          }
          responsaveisMap.get(tel)?.alunos.push(nome);
        }

        // Caso exista um terceiro responsável genérico
        if (s.responsavel_whatsapp && s.responsavel_whatsapp !== s.guardian1_whatsapp && s.responsavel_whatsapp !== s.guardian2_whatsapp) {
          const tel = s.responsavel_whatsapp;
          if (!responsaveisMap.has(tel)) {
            responsaveisMap.set(tel, { tipo: "RESP", alunos: [] });
          }
          responsaveisMap.get(tel)?.alunos.push(nome);
        }
      });

      const csvRows = [["Name", "Phone 1 - Value", "Phone 1 - Type"]];

      alunosMap.forEach((nome, telefone) => {
        csvRows.push([nome, telefone, "Mobile"]);
      });

      responsaveisMap.forEach((info, telefone) => {
        const nomeCompleto = `${info.tipo} - ${info.alunos.join(" E ")}`;
        csvRows.push([nomeCompleto, telefone, "Mobile"]);
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
      setSaving(false);
    }
  };

  const handleExport = async (table: string) => {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(";"),
        ...data.map((row: any) =>
          headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(";") || str.includes("\n") || str.includes("\"") ? `"${str}"` : str;
          }).join(";")
        )
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${table}_backup_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exportação de ${table} concluída!`);
    } catch (error: any) {
      toast.error("Erro na exportação: " + error.message);
    }
  };

  const handleExportAll = async () => {
    setSaving(true);
    try {
      const tables = ["students", "pre_matriculas", "turmas", "instructors", "tipos_eventos", "configuracoes_sistema", "avisos"];
      const allData: any[] = [];
      const allKeys = new Set<string>(["_tabela"]);

      for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            const enrichedRow = { _tabela: table, ...row };
            allData.push(enrichedRow);
            Object.keys(enrichedRow).forEach(key => allKeys.add(key));
          });
        }
      }

      if (allData.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }

      const headers = Array.from(allKeys);
      const csvContent = [
        headers.join(";"),
        ...allData.map((row: any) =>
          headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(";") || str.includes("\n") || str.includes("\"") ? `"${str}"` : str;
          }).join(";")
        )
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `master_backup_pfm_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Master Backup exportado com sucesso!");
    } catch (error: any) {
      toast.error("Erro na exportação master: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (file?: File) => {
    const fileInput = document.getElementById("csv-file-input") as HTMLInputElement;
    const targetFile = file || fileInput?.files?.[0];

    if (!targetFile) {
      toast.error("Selecione um arquivo CSV.");
      return;
    }

    setSaving(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) throw new Error("Arquivo CSV vazio ou inválido.");

        // Detect delimiter
        const firstLine = lines[0];
        const delimiter = firstLine.includes(";") ? ";" : ",";

        const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^\ufeff/, ""));

        const rows = lines.slice(1).map(line => {
          const values: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delimiter && !inQuotes) {
              values.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current);

          const obj: any = {};
          headers.forEach((header, index) => {
            let val: any = values[index]?.trim();
            if (val === "true") val = true;
            if (val === "false") val = false;
            if (val === "" || val === "null") val = null;
            obj[header] = val;
          });
          return obj;
        });

        // Check if it's a Master Backup or specific table
        const isMaster = headers.includes("_tabela");

        if (isMaster) {
          const groups = rows.reduce((acc: any, row: any) => {
            const table = row._tabela;
            if (!table) return acc;
            if (!acc[table]) acc[table] = [];
            const { _tabela, ...cleanRow } = row;

            // Filter out null IDs if they are empty strings or invalid
            if (cleanRow.id === null || cleanRow.id === "") delete cleanRow.id;

            // Remove keys that don't belong to this table if possible, 
            // but Supabase upsert usually ignores extra columns or errors.
            // To be safe, we should ideally know the columns of each table.
            // For now, we'll try to push and let Supabase handle it or filter nulls.
            const finalRow: any = {};
            Object.keys(cleanRow).forEach(k => {
              if (cleanRow[k] !== undefined && cleanRow[k] !== null) {
                finalRow[k] = cleanRow[k];
              }
            });

            acc[table].push(finalRow);
            return acc;
          }, {});

          let totalCount = 0;
          for (const table of Object.keys(groups)) {
            const { error } = await supabase.from(table).upsert(groups[table]);
            if (error) {
              console.error(`Erro ao importar tabela ${table}:`, error);
              toast.error(`Erro em ${table}: ${error.message}`);
            } else {
              totalCount += groups[table].length;
            }
          }
          toast.success(`${totalCount} registros restaurados de várias tabelas!`);
        } else {
          const tableSpan = (document.querySelector('[id^="import-table"] button span') as HTMLElement)?.innerText?.toLowerCase();
          const table = tableSpan?.includes("alunos") ? "students" :
            tableSpan?.includes("pré") ? "pre_matriculas" :
              tableSpan?.includes("turmas") ? "turmas" :
                tableSpan?.includes("instrutores") ? "instructors" : "";

          if (!table) throw new Error("Selecione a tabela de destino para importação individual.");

          const { error } = await supabase.from(table).upsert(rows);
          if (error) throw error;
          toast.success(`${rows.length} registros importados em ${table}!`);
        }

        fetchData();
      } catch (error: any) {
        toast.error("Erro na importação: " + error.message);
      } finally {
        setSaving(false);
        if (fileInput) fileInput.value = "";
      }
    };

    reader.readAsText(targetFile);
  };

  if (profile?.role !== "admin" && profile?.role !== "instructor" && profile?.role !== "instrutor") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-zinc-400 text-sm">Apenas administradores e instrutores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Painel de Controle Principal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            GESTÃO DO <span className="text-cyan-500">SISTEMA</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl">
            Configurações globais, calendário letivo, avisos e ferramentas de manutenção da plataforma.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold px-6 py-3 rounded-2xl flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Root Access
          </Badge>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="avisos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2">
            <AlertTriangle className="w-4 h-4" /> Avisos
          </TabsTrigger>
          <TabsTrigger value="calendario" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2">
            <Calendar className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="tipos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2">
            <Tag className="w-4 h-4" /> Tipos Evento
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2">
            <Settings className="w-4 h-4" /> Ano Letivo
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
            <Database className="w-4 h-4" /> Backup (CSV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-500" /> Exportar Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  Baixe os dados atuais do sistema. Os arquivos usam <span className="text-white font-bold">ponto-e-vírgula (;)</span> como separador para melhor compatibilidade com Excel.
                </p>

                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mb-4">
                  <h4 className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Recomendado: Master Backup
                  </h4>
                  <p className="text-xs text-zinc-400 mb-4">
                    Exporta todas as tabelas (Alunos, Turmas, Instrutores, etc.) em um único arquivo CSV. Ideal para backups completos.
                  </p>
                  <Button
                    onClick={handleExportAll}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                    Exportar Tudo (Backup Completo)
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-500 text-xs uppercase font-bold">Exportações Individuais</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleExport("students")} variant="outline" className="justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs">
                      Alunos
                    </Button>
                    <Button onClick={() => handleExport("pre_matriculas")} variant="outline" className="justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs">
                      Pré-Matrículas
                    </Button>
                    <Button onClick={() => handleExport("turmas")} variant="outline" className="justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs">
                      Turmas
                    </Button>
                    <Button onClick={() => handleExport("instructors")} variant="outline" className="justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs">
                      Instrutores
                    </Button>
                    <Link href="/configuracoes/contatos">
                      <Button variant="outline" className="justify-start border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-xs gap-2">
                        <Download className="w-3 h-3" /> Contatos Google
                      </Button>
                    </Link>

                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" /> Importar / Restaurar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-zinc-400">
                    O sistema detecta automaticamente se o arquivo é um <span className="text-white font-bold">Master Backup</span> ou uma tabela individual.
                    <br /><br />
                    Se for um Master Backup, <span className="text-blue-400">todas as tabelas serão atualizadas simultaneamente</span> ignorando a seleção abaixo.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2" id="import-table">
                    <Label className="text-zinc-400">Tabela de Destino (apenas para arquivos individuais)</Label>
                    <Select>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione a tabela" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="students">Alunos (students)</SelectItem>
                        <SelectItem value="pre_matriculas">Pré-Matrículas</SelectItem>
                        <SelectItem value="turmas">Turmas</SelectItem>
                        <SelectItem value="instructors">Instrutores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400">Arquivo CSV</Label>
                    <div className="relative group">
                      <Input
                        type="file"
                        accept=".csv"
                        id="csv-file-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImport(file);
                        }}
                        className="bg-zinc-900 border-zinc-700 text-white file:bg-zinc-800 file:text-zinc-300 file:border-0 cursor-pointer h-12"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    Atenção: Registros existentes serão atualizados (Upsert)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="avisos" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Criar Novo Aviso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Tipo de Aviso</Label>
                  <Select value={newAviso.tipo} onValueChange={(val) => setNewAviso({ ...newAviso, tipo: val })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="geral">Aviso Geral</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="informativo">Informativo</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Título</Label>
                  <Input
                    value={newAviso.titulo}
                    onChange={(e) => setNewAviso({ ...newAviso, titulo: e.target.value })}
                    placeholder="Ex: Atenção - Corte de Cabelo"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Mensagem</Label>
                <Textarea
                  value={newAviso.mensagem}
                  onChange={(e) => setNewAviso({ ...newAviso, mensagem: e.target.value })}
                  placeholder="Digite a mensagem do aviso..."
                  className="bg-zinc-900 border-zinc-700 text-white resize-none min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Data Início</Label>
                  <Input
                    type="date"
                    value={newAviso.data_inicio}
                    onChange={(e) => setNewAviso({ ...newAviso, data_inicio: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Data Fim (Opcional)</Label>
                  <Input
                    type="date"
                    value={newAviso.data_fim}
                    onChange={(e) => setNewAviso({ ...newAviso, data_fim: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <Button onClick={handleSaveAviso} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Aviso"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Avisos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : avisos.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum aviso cadastrado</p>
              ) : (
                <div className="space-y-4">
                  {avisos.map((aviso) => (
                    <div key={aviso.id} className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${aviso.tipo === "urgente" ? "bg-red-500/20 text-red-500" :
                            aviso.tipo === "informativo" ? "bg-blue-500/20 text-blue-500" :
                              "bg-amber-500/20 text-amber-500"
                            }`}>
                            {aviso.tipo}
                          </span>
                          <h4 className="text-white font-bold">{aviso.titulo}</h4>
                        </div>
                        <p className="text-zinc-400 text-sm">{aviso.mensagem}</p>
                        <p className="text-zinc-500 text-xs">
                          {format(new Date(aviso.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                          {aviso.data_fim && ` até ${format(new Date(aviso.data_fim), "dd/MM/yyyy", { locale: ptBR })}`}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAviso(aviso.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendario" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Adicionar Evento ao Calendário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Data</Label>
                  <Input
                    type="date"
                    value={newEvento.data}
                    onChange={(e) => setNewEvento({ ...newEvento, data: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Tipo de Evento</Label>
                  <Select value={newEvento.tipo_evento_id} onValueChange={(val) => setNewEvento({ ...newEvento, tipo_evento_id: val })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {tiposEventos.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${tipo.cor}-500`} />
                            {tipo.nome}
                            {tipo.bloqueia_aula && <span className="text-[10px] text-red-400">(Sem Aula)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Descrição</Label>
                <Input
                  value={newEvento.descricao}
                  onChange={(e) => setNewEvento({ ...newEvento, descricao: e.target.value })}
                  placeholder="Ex: Dia da Independência"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <Button onClick={handleSaveEvento} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12">
                <Plus className="w-4 h-4 mr-2" />
                {saving ? "Adicionando..." : "Adicionar ao Calendário"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Eventos do Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : eventos.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum evento cadastrado</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {eventos.map((evento) => (
                    <div key={evento.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-${evento.tipos_eventos?.cor || 'blue'}-500/10`}>
                          <Calendar className={`w-5 h-5 text-${evento.tipos_eventos?.cor || 'blue'}-500`} />
                        </div>
                        <div>
                          <p className="text-white font-bold">{evento.descricao}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-400">
                              {format(new Date(evento.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className={`text-${evento.tipos_eventos?.cor || 'blue'}-500 border-${evento.tipos_eventos?.cor || 'blue'}-500/30`}>
                              {evento.tipos_eventos?.nome || evento.tipo}
                            </Badge>
                            {evento.tipos_eventos?.bloqueia_aula && (
                              <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">
                                Sem Aula
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteEvento(evento.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Criar Tipo de Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome do Tipo</Label>
                  <Input
                    value={newTipoEvento.nome}
                    onChange={(e) => setNewTipoEvento({ ...newTipoEvento, nome: e.target.value })}
                    placeholder="Ex: Feriado Nacional"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Cor</Label>
                  <Select value={newTipoEvento.cor} onValueChange={(val) => setNewTipoEvento({ ...newTipoEvento, cor: val })}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {CORES_DISPONIVEIS.map(cor => (
                        <SelectItem key={cor.id} value={cor.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${cor.class}`} />
                            {cor.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Checkbox
                  id="bloqueia_aula"
                  checked={newTipoEvento.bloqueia_aula}
                  onCheckedChange={(checked) => setNewTipoEvento({ ...newTipoEvento, bloqueia_aula: !!checked })}
                />
                <label htmlFor="bloqueia_aula" className="text-sm font-medium text-amber-200 cursor-pointer">
                  Este tipo de evento BLOQUEIA aulas (Não aparece na frequência)
                </label>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Visibilidade por Perfil
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PERFIS_DISPONIVEIS.map(perfil => (
                    <div key={perfil.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perfil.id}
                        checked={newTipoEvento.visibilidade_perfis.includes(perfil.id)}
                        onCheckedChange={() => togglePerfilVisibilidade(perfil.id)}
                      />
                      <label htmlFor={perfil.id} className="text-sm text-zinc-300 cursor-pointer">
                        {perfil.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveTipoEvento} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12">
                <Plus className="w-4 h-4 mr-2" />
                {saving ? "Criando..." : "Criar Tipo de Evento"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Tipos de Eventos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : tiposEventos.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum tipo cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {tiposEventos.map((tipo) => (
                    <div key={tipo.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full bg-${tipo.cor}-500`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{tipo.nome}</p>
                            {tipo.bloqueia_aula && (
                              <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">
                                Sem Aula
                              </Badge>
                            )}
                          </div>
                          <p className="text-zinc-500 text-xs">
                            Visível para: {tipo.visibilidade_perfis?.map((p: string) => PERFIS_DISPONIVEIS.find(pf => pf.id === p)?.label || p).join(", ")}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTipoEvento(tipo.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Configurações do Ano Letivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Ano de Referência</Label>
                  <Input
                    type="number"
                    value={config.ano_letivo}
                    onChange={(e) => setConfig({ ...config, ano_letivo: parseInt(e.target.value) })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Data de Início das Aulas</Label>
                  <Input
                    type="date"
                    value={config.data_inicio_letivo || ""}
                    onChange={(e) => setConfig({ ...config, data_inicio_letivo: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Data de Término das Aulas</Label>
                  <Input
                    type="date"
                    value={config.data_fim_letivo || ""}
                    onChange={(e) => setConfig({ ...config, data_fim_letivo: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                <div className="space-y-2">
                  <Label className="text-amber-500">Início do Recesso</Label>
                  <Input
                    type="date"
                    value={config.recesso_inicio || ""}
                    onChange={(e) => setConfig({ ...config, recesso_inicio: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-500">Término do Recesso</Label>
                  <Input
                    type="date"
                    value={config.recesso_fim || ""}
                    onChange={(e) => setConfig({ ...config, recesso_fim: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Estas datas influenciam automaticamente o cálculo de frequências e o processamento dos ciclos de comportamento dos alunos. Eventos marcados como "Sem Aula" no calendário também são considerados.
                </p>
              </div>

              <Button onClick={handleSaveConfig} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando Configurações..." : "Salvar Configurações do Ano Letivo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
