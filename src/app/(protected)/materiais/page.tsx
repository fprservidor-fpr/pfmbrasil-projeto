"use client";

import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Download,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  X,
  Loader2,
  UploadCloud,
  Link as LinkIcon,
  ShieldCheck,
  Book,
  Printer,
  ChevronRight,
  User,
  Heart,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PrintableCover } from "@/components/printable-cover";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Material = {
  id: string;
  title: string;
  description: string;
  file_url: string;
  section: string;
  created_at: string;
  created_by: string;
};

interface MissaoAtividade {
  id: string;
  titulo: string;
  descricao: string;
  data_lancamento: string;
  data_entrega: string;
  tipo: 'missao' | 'atividade';
  turma_id?: string;
  created_at: string;
  missoes_materiais?: {
    study_materials: Material;
  }[];
}

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  blood_type: string;
  turma: string;
}

interface Turma {
  id: string;
  nome: string;
}

export default function MateriaisPage() {
  const router = useRouter();
  const { profile, user, simulatedRole } = useAuth();
  const coverRef = useRef<HTMLDivElement>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [missoes, setMissoes] = useState<MissaoAtividade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMissaoModal, setShowMissaoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pfm");

  // Modal states for Material
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("Material PFM");
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal states for Missao
  const [editingMissao, setEditingMissao] = useState<MissaoAtividade | null>(null);
  const [missaoTitulo, setMissaoTitulo] = useState("");
  const [missaoDescricao, setMissaoDescricao] = useState("");
  const [missaoDataEntrega, setMissaoDataEntrega] = useState("");
  const [missaoTipo, setMissaoTipo] = useState<'missao' | 'atividade'>('missao');
  const [missaoTurmaId, setMissaoTurmaId] = useState("");
  const [missaoMateriaisIds, setMissaoMateriaisIds] = useState<string[]>([]);

  // Cover states
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [mounted, setMounted] = useState(false);

  const canManage = ["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor"].includes(profile?.role || "");

  useEffect(() => {
    setMounted(true);
    fetchMaterials();
    fetchMissoes();
    if (profile) fetchStudents();
    if (canManage) fetchTurmas();
  }, [profile]);

  async function fetchMaterials() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
      toast.error("Não foi possível carregar os materiais.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMissoes() {
    try {
      let query = supabase
        .from("missoes_atividades")
        .select("*, missoes_materiais(study_materials(*))")
        .order("data_entrega", { ascending: true });

      if ((profile?.role === "aluno" || profile?.role === "responsavel") && (profile?.student_id || sessionStorage.getItem("selectedStudentId"))) {
        const id = profile?.student_id || sessionStorage.getItem("selectedStudentId");
        const { data: student } = await supabase.from("students").select("turma, turma_id").eq("id", id).single();
        if (student) {
          query = query.or(`turma_id.is.null,turma_id.eq."${student.turma}",turma_id.eq."${student.turma_id}"`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setMissoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar missões:", error);
    }
  }

  async function fetchTurmas() {
    const { data } = await supabase.from("turmas").select("*").order("nome");
    setTurmas(data || []);
  }

  async function fetchStudents() {
    try {
      const showTestRecords = !!simulatedRole;
      let query = supabase.from("students").select("*").eq("status", "ativo");

      if (!showTestRecords) {
        query = query.eq("is_test", false);
      }

      if (profile?.role === "responsavel" && profile?.cpf) {
        const cleanCpf = profile.cpf.replace(/\D/g, "").padStart(11, '0');
        query = query.or(`guardian1_cpf.eq.${cleanCpf},guardian2_cpf.eq.${cleanCpf},responsavel_cpf.eq.${cleanCpf}`);
      } else if (profile?.role === "aluno" && profile?.student_id) {
        query = query.eq("id", profile.student_id);
      }

      const { data, error } = await query.order("data_matricula", { ascending: true });
      if (error) throw error;
      setStudents(data || []);

      if (data && data.length === 1) {
        setSelectedStudent(data[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    }
  }

  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return toast.error("Título é obrigatório");

    try {
      setSubmitting(true);
      let fileUrl = "";

      if (uploadType === "link") {
        if (!linkUrl) throw new Error("Link é obrigatório");
        fileUrl = linkUrl;
      } else {
        if (!selectedFile) throw new Error("Arquivo é obrigatório");

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("study-materials")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("study-materials")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from("study_materials")
        .insert({
          title,
          description,
          section,
          file_url: fileUrl,
          created_by: user?.id
        });

      if (insertError) throw insertError;

      toast.success("Material adicionado com sucesso!");
      setShowAddModal(false);
      resetForm();
      fetchMaterials();
    } catch (error: any) {
      console.error("Erro ao salvar material:", error);
      toast.error(error.message || "Erro ao salvar material");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMissaoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!missaoTitulo || !missaoDataEntrega) return toast.error("Preencha os campos obrigatórios");

    try {
      setSubmitting(true);

      const payload = {
        titulo: missaoTitulo,
        descricao: missaoDescricao,
        data_entrega: missaoDataEntrega,
        tipo: missaoTipo,
        turma_id: missaoTurmaId === "null" || !missaoTurmaId ? null : missaoTurmaId,
        criado_por: user?.id
      };

      let missaoId = editingMissao?.id;

      if (editingMissao) {
        const { error } = await supabase
          .from("missoes_atividades")
          .update(payload)
          .eq("id", editingMissao.id);
        if (error) throw error;
      } else {
        const { data: missao, error } = await supabase
          .from("missoes_atividades")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        missaoId = missao.id;
      }

      // Handle materials links
      if (missaoId) {
        // First delete existing links if editing
        if (editingMissao) {
          await supabase.from("missoes_materiais").delete().eq("missao_id", missaoId);
        }

        if (missaoMateriaisIds.length > 0) {
          const materialInserts = missaoMateriaisIds.map(materialId => ({
            missao_id: missaoId,
            material_id: materialId
          }));

          const { error: materialError } = await supabase
            .from("missoes_materiais")
            .insert(materialInserts);

          if (materialError) throw materialError;
        }
      }

      toast.success(`${missaoTipo === 'missao' ? 'Missão' : 'Atividade'} ${editingMissao ? 'atualizada' : 'lançada'} com sucesso!`);
      setShowMissaoModal(false);
      resetMissaoForm();
      fetchMissoes();
    } catch (error: any) {
      console.error("Erro ao lançar missão:", error);
      toast.error("Erro ao processar solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditMissao(missao: MissaoAtividade) {
    setEditingMissao(missao);
    setMissaoTitulo(missao.titulo);
    setMissaoDescricao(missao.descricao);
    setMissaoDataEntrega(missao.data_entrega);
    setMissaoTipo(missao.tipo);
    setMissaoTurmaId(missao.turma_id || "");
    setMissaoMateriaisIds(missao.missoes_materiais?.map(mm => mm.study_materials.id) || []);
    setShowMissaoModal(true);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setSection("Material PFM");
    setLinkUrl("");
    setSelectedFile(null);
    setUploadType("file");
  }

  function resetMissaoForm() {
    setEditingMissao(null);
    setMissaoTitulo("");
    setMissaoDescricao("");
    setMissaoDataEntrega("");
    setMissaoTipo("missao");
    setMissaoTurmaId("");
    setMissaoMateriaisIds([]);
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "pfm") return matchesSearch && m.section === "Material PFM";
    if (activeTab === "biblia") return matchesSearch && m.section === "Devocional | Biblia";
    return false;
  });

  const filteredMissoes = missoes.filter(m =>
    m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
            <BookOpen className="text-emerald-500 w-8 h-8" />
            Central de Materiais
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            Conteúdo pedagógico, documentos oficiais e missões táticas.
          </p>
        </div>

        <div className="flex gap-4">
          {canManage && (
            <>
              <Button
                onClick={() => {
                  resetMissaoForm();
                  setShowMissaoModal(true);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white font-black px-8 h-12 rounded-2xl shadow-xl shadow-violet-900/20 uppercase text-xs tracking-widest"
              >
                <Target className="w-5 h-5 mr-2" />
                Lançar Atividade
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-2xl shadow-xl shadow-emerald-900/20 uppercase text-xs tracking-widest"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Material
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-2xl h-14 overflow-x-auto justify-start md:justify-center">
          <TabsTrigger value="pfm" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Material PFM
          </TabsTrigger>
          <TabsTrigger value="biblia" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
            <Book className="w-4 h-4 mr-2" />
            Devocional | Bíblia
          </TabsTrigger>
          <TabsTrigger value="missoes" className="rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
            <Target className="w-4 h-4 mr-2" />
            Atividades & Missões
          </TabsTrigger>
          <TabsTrigger value="capa" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
            <FileText className="w-4 h-4 mr-2" />
            Capa do Aluno
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missoes" className="space-y-8 mt-0 outline-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              placeholder="Buscar missões ou atividades..."
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-violet-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-zinc-900/50 animate-pulse rounded-[2rem] border border-zinc-800" />
              ))}
            </div>
          ) : filteredMissoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMissoes.map((missao) => (
                <motion.div
                  key={missao.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 hover:border-violet-500/50 transition-all shadow-xl hover:shadow-violet-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-24 h-24 text-violet-500" />
                  </div>

                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-4 rounded-2xl border flex items-center justify-center",
                        missao.tipo === 'missao' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                      )}>
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <Badge variant="outline" className={cn(
                          "uppercase text-[10px] font-black tracking-[0.2em] mb-1 px-3 py-1",
                          missao.tipo === 'missao' ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-blue-500/20 text-blue-500 bg-blue-500/5"
                        )}>
                          {missao.tipo === 'missao' ? 'Missões' : 'Atividades'}
                        </Badge>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                          {missao.titulo}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl"
                            onClick={() => handleEditMissao(missao)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                            onClick={async () => {
                              if (!confirm("Excluir esta missão?")) return;
                              await supabase.from("missoes_atividades").delete().eq("id", missao.id);
                              fetchMissoes();
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-500 text-sm mb-8 font-medium line-clamp-2">
                    {missao.descricao}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                        <Calendar className="w-3 h-3" />
                        Lançamento
                      </div>
                      <p className="text-white font-bold">{format(parseISO(missao.data_lancamento), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-red-500/10">
                      <div className="flex items-center gap-2 text-red-400/70 text-[10px] font-black uppercase tracking-widest mb-1">
                        <Clock className="w-3 h-3" />
                        Prazo Final
                      </div>
                      <p className="text-red-400 font-black">{format(parseISO(missao.data_entrega), "dd/MM/yyyy")}</p>
                    </div>
                  </div>

                  {missao.missoes_materiais && missao.missoes_materiais.length > 0 && (
                    <div className="space-y-3 mb-8">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Materiais Vinculados</p>
                      {missao.missoes_materiais.map(({ study_materials: m }) => (
                        <div key={m.id} className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/50 flex items-center justify-between group/file hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white font-bold truncate max-w-[200px]">{m.title}</p>
                            </div>
                          </div>
                          <Button asChild size="sm" variant="ghost" className="rounded-xl hover:bg-violet-500/10 text-violet-400">
                            <a href={m.file_url} target="_blank">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      <ShieldCheck className="w-4 h-4" />
                      Status: Em Aberto
                    </div>
                    <Button variant="ghost" className="text-violet-400 font-black uppercase text-[10px] tracking-widest hover:bg-violet-500/10">
                      Acessar Missão <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800">
              <Target className="w-20 h-20 text-zinc-800 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-tighter">Nenhuma missão no radar</h3>
              <p className="text-zinc-600 mt-2 font-bold uppercase text-[10px] tracking-widest">Aguarde instruções do seu instrutor</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="capa" className="mt-0 outline-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6 backdrop-blur-xl">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Capa do Caderno</h2>
                  <p className="text-zinc-500 text-sm mt-1">Gere uma capa personalizada e moderna para identificar seu material.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Selecione o Aluno</label>
                  <Select value={selectedStudent?.id} onValueChange={(val) => setSelectedStudent(students.find(s => s.id === val) || null)}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                      <SelectValue placeholder="Escolha um aluno vinculado" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl focus:bg-emerald-600">
                          <div className="flex items-center gap-2 uppercase font-black text-[11px]">
                            <span className="text-zinc-500">#{s.matricula_pfm}</span> {s.nome_guerra}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    disabled={!selectedStudent}
                    onClick={() => router.push(`/materiais/imprimir-capa?student_id=${selectedStudent?.id}`)}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black h-14 rounded-2xl shadow-xl shadow-amber-900/20 uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Printer className="w-5 h-5 mr-3" />
                    Gerar Capa para Impressão
                  </Button>
                  <p className="text-center text-[10px] text-zinc-600 uppercase font-bold mt-4 tracking-widest">Formato A4 Retrato • Alta Definição</p>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-tight">Instruções de Identificação</h4>
                  <p className="text-zinc-500 text-xs mt-1 leading-relaxed">A capa deve ser impressa em papel branco, preferencialmente com gramatura superior a 90g, e inserida na parte frontal do caderno ou pasta do aluno.</p>
                </div>
              </div>
            </div>

            <div className="relative group hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden aspect-[1/1.414] scale-90 origin-top border-8 border-zinc-900/10">
                {selectedStudent ? (
                  <PrintableCover student={selectedStudent} />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-zinc-200 m-4 rounded-xl">
                    <User className="w-20 h-20 text-zinc-300 mb-6" />
                    <h3 className="text-zinc-400 font-black uppercase tracking-widest">Prévia da Capa</h3>
                    <p className="text-zinc-400 text-xs mt-2">Selecione um aluno para visualizar como ficará sua capa personalizada.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="hidden">
            {selectedStudent && <PrintableCover ref={coverRef} student={selectedStudent} />}
          </div>
        </TabsContent>

        <TabsContent value="pfm" className="space-y-8 mt-0 outline-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              placeholder="Buscar material..."
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900/50 animate-pulse rounded-3xl border border-zinc-800" />
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
                >


                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-20 h-20 text-emerald-500" />
                  </div>

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <FileText className="text-emerald-500 w-7 h-7" />
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        onClick={async () => {
                          if (!confirm("Tem certeza que deseja excluir este material?")) return;
                          const { error } = await supabase.from("study_materials").delete().eq("id", material.id);
                          if (error) toast.error("Erro ao excluir.");
                          else {
                            toast.success("Excluído com sucesso!");
                            fetchMaterials();
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-zinc-100 mb-3 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">
                    {material.title}
                  </h3>
                  <p className="text-zinc-500 text-sm line-clamp-3 mb-8 font-medium">
                    {material.description || "Nenhuma descrição fornecida para este material operacional."}
                  </p>

                  <div className="flex gap-3 relative z-10">
                    <Button
                      asChild
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-none rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
                    >
                      <a href={material.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
                    >
                      <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (


            <div className="text-center py-32 bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800">
              <ShieldCheck className="w-20 h-20 text-zinc-800 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-tighter">Nenhum material estratégico</h3>
              <p className="text-zinc-600 mt-2 font-bold uppercase text-[10px] tracking-widest">Aguarde novas publicações da coordenação</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="biblia" className="space-y-8 mt-0 outline-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              placeholder="Buscar conteúdo bíblico..."
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900/50 animate-pulse rounded-3xl border border-zinc-800" />
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 hover:border-blue-500/50 transition-all shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
                >



                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Book className="w-20 h-20 text-blue-500" />
                  </div>

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <Heart className="text-blue-500 w-7 h-7" />
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        onClick={async () => {
                          if (!confirm("Tem certeza que deseja excluir este material?")) return;
                          const { error } = await supabase.from("study_materials").delete().eq("id", material.id);
                          if (error) toast.error("Erro ao excluir.");
                          else {
                            toast.success("Excluído com sucesso!");
                            fetchMaterials();
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-zinc-100 mb-3 group-hover:text-blue-500 transition-colors uppercase tracking-tight">
                    {material.title}
                  </h3>
                  <p className="text-zinc-500 text-sm line-clamp-3 mb-8 font-medium">
                    {material.description || "Conteúdo espiritual e valores fundamentais para a formação da criança."}
                  </p>

                  <div className="flex gap-3 relative z-10">
                    <Button
                      asChild
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-none rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
                    >
                      <a href={material.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
                    >
                      <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (


            <div className="text-center py-32 bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800">
              <Book className="w-20 h-20 text-zinc-800 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-tighter">Nenhum material devocional</h3>
              <p className="text-zinc-600 mt-2 font-bold uppercase text-[10px] tracking-widest">Novos estudos bíblicos em breve</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Material Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Publicar Material</h2>
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mt-1">Disponibilize novo conteúdo na plataforma</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-full"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Seção do Material</label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                        <SelectItem value="Material PFM" className="rounded-xl focus:bg-emerald-600 uppercase font-black text-[10px] tracking-widest">Material PFM</SelectItem>
                        <SelectItem value="Devocional | Biblia" className="rounded-xl focus:bg-blue-600 uppercase font-black text-[10px] tracking-widest">Devocional | Bíblia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Título do Conteúdo</label>
                    <Input
                      required
                      placeholder="Ex: Apostila de Português - Módulo 1"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-emerald-500/20 font-bold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Descrição Informativa</label>
                  <textarea
                    rows={3}
                    placeholder="Breve descrição do conteúdo..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none font-medium text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUploadType("file")}
                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${uploadType === "file"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-lg shadow-emerald-500/5"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                      }`}
                  >
                    <UploadCloud className="w-5 h-5" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Arquivo Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType("link")}
                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${uploadType === "link"
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-lg shadow-emerald-500/5"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                      }`}
                  >
                    <LinkIcon className="w-5 h-5" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Link Externo</span>
                  </button>
                </div>

                {uploadType === "file" ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Carregar Documento</label>
                    <div className="relative group">
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group-hover:shadow-2xl shadow-emerald-500/5"
                      >
                        {selectedFile ? (
                          <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                              <FileText className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-white font-black uppercase text-[10px] tracking-tight truncate max-w-[250px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-zinc-600 text-[9px] font-bold mt-1 uppercase">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} Megabytes
                            </p>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-12 h-12 text-zinc-700 mb-4 group-hover:text-emerald-500 transition-colors duration-500" />
                            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Clique ou arraste o arquivo</p>
                            <p className="text-zinc-700 text-[9px] font-bold mt-2 uppercase tracking-tighter">PDF, DOC, JPG • Limite 10MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">URL de Destino</label>
                    <Input
                      placeholder="https://exemplo.com/material.pdf"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-emerald-500/20 font-medium"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    className="flex-1 text-zinc-600 hover:text-white uppercase font-black text-[10px] tracking-widest h-14 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Abortar Missão
                  </button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-900/20 uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Publicar Conteúdo"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Launch Mission Modal */}
      <AnimatePresence>
        {showMissaoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowMissaoModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                    {editingMissao ? 'Editar' : 'Lançar'} Atividades e Missões
                  </h2>
                  <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mt-1">
                    {editingMissao ? 'Atualize os' : 'Defina'} objetivos e prazos para os alunos
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-full"
                  onClick={() => {
                    setShowMissaoModal(false);
                    resetMissaoForm();
                  }}
                  disabled={submitting}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <form onSubmit={handleMissaoSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMissaoTipo("missao")}
                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${missaoTipo === "missao"
                        ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/5"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                      }`}
                  >
                    <Target className="w-5 h-5" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Missões</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissaoTipo("atividade")}
                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${missaoTipo === "atividade"
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-lg shadow-blue-500/5"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                      }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Atividades</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Título da Missão</label>
                  <Input
                    required
                    placeholder="Ex: Treinamento de Primeiros Socorros"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-14 rounded-2xl font-bold"
                    value={missaoTitulo}
                    onChange={(e) => setMissaoTitulo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Objetivos e Instruções</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva detalhadamente o que deve ser feito..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none font-medium text-sm"
                    value={missaoDescricao}
                    onChange={(e) => setMissaoDescricao(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Prazo de Entrega</label>
                    <Input
                      type="date"
                      required
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 h-14 rounded-2xl font-bold"
                      value={missaoDataEntrega}
                      onChange={(e) => setMissaoDataEntrega(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Turma Destino (Opcional)</label>
                    <Select value={missaoTurmaId} onValueChange={setMissaoTurmaId}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                        <SelectValue placeholder="Todas as turmas" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                        <SelectItem value="null" className="rounded-xl focus:bg-zinc-800 uppercase font-black text-[10px] tracking-widest">Global</SelectItem>
                        {turmas.map(t => (
                          <SelectItem key={t.id} value={t.id} className="rounded-xl focus:bg-violet-600 uppercase font-black text-[10px] tracking-widest">{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Vincular Materiais PFM (Opcional)</label>
                  <Select onValueChange={(val) => {
                    if (val === "null") return;
                    if (!missaoMateriaisIds.includes(val)) {
                      setMissaoMateriaisIds([...missaoMateriaisIds, val]);
                    }
                  }}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                      <SelectValue placeholder="Adicionar material..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                      <SelectItem value="null" className="rounded-xl focus:bg-zinc-800 uppercase font-black text-[10px] tracking-widest">Selecione...</SelectItem>
                      {materials
                        .filter(m => m.section === "Material PFM" && !missaoMateriaisIds.includes(m.id))
                        .map(m => (
                          <SelectItem key={m.id} value={m.id} className="rounded-xl focus:bg-violet-600 uppercase font-black text-[10px] tracking-widest">
                            {m.title}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>

                  {missaoMateriaisIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                      {missaoMateriaisIds.map(id => {
                        const material = materials.find(m => m.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2"
                          >
                            <span className="uppercase text-[9px] font-black">{material?.title}</span>
                            <button
                              type="button"
                              onClick={() => setMissaoMateriaisIds(missaoMateriaisIds.filter(mid => mid !== id))}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>


                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    className="flex-1 text-zinc-600 hover:text-white uppercase font-black text-[10px] tracking-widest h-14 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all"
                    onClick={() => setShowMissaoModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-violet-900/20 uppercase text-xs tracking-[0.2em]"
                  >
                    {submitting ? "Processando..." : (editingMissao ? "Salvar Alterações" : "Lançar Missão")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
