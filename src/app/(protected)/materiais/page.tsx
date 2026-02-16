"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Download,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  ChevronRight,
  ShieldCheck,
  Book,
  Printer,
  Target,
  Calendar,
  Clock,
  Heart,
  Pencil,
  Sparkles,
  Info
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [missoes, setMissoes] = useState<MissaoAtividade[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pfm");

  // Cover states
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [mounted, setMounted] = useState(false);

  const canManage = ["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor"].includes(profile?.role || "");

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

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
      }
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    }
  }

  if (!mounted) return null;

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
    <div className="space-y-12">
      {/* Premium Header */}
      <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Recursos de Aprendizado</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            CENTRAL DE <span className="text-yellow-400">MATERIAIS</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl">
            Acesse conteúdos pedagógicos, orientações estratégicas e missões operacionais do programa.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => router.push('/materiais/gerenciar')}
              className="bg-zinc-900 border border-white/10 hover:border-yellow-400/50 text-white font-black px-8 h-14 rounded-2xl shadow-xl uppercase tracking-widest text-xs group"
            >
              <Pencil className="w-5 h-5 mr-3 group-hover:text-yellow-400 transition-colors" />
              Painel de Gestão
            </Button>
          </div>
        )}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-2 rounded-3xl h-16 flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-2">
          {[
            { id: "pfm", label: "Manual PFM", icon: ShieldCheck, color: "text-yellow-400" },
            { id: "biblia", label: "Devocional", icon: Book, color: "text-blue-400" },
            { id: "missoes", label: "Atividades", icon: Target, color: "text-violet-400" },
            { id: "capa", label: "Identidade", icon: FileText, color: "text-amber-500" }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-2xl data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-widest h-full px-6 transition-all"
            >
              <tab.icon className={cn("w-4 h-4 mr-2", tab.color)} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="relative z-10">
          <TabsContent value="pfm" className="space-y-8 outline-none">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input
                placeholder="Filtrar manuais e materiais..."
                className="pl-14 bg-zinc-900/40 backdrop-blur-xl border-white/5 text-zinc-100 h-16 rounded-[2rem] focus:ring-yellow-500/20 text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-zinc-900/50 animate-pulse rounded-[2.5rem] border border-white/5" />
                ))}
              </div>
            ) : filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMaterials.map((material, idx) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 hover:border-yellow-400/30 transition-all duration-500 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <ShieldCheck className="w-40 h-40 text-white" />
                    </div>

                    <div className="flex flex-col h-full relative z-10">
                      <div className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-yellow-400/20 group-hover:scale-110 transition-transform">
                        <FileText className="text-black w-8 h-8" />
                      </div>

                      <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter leading-tight group-hover:text-yellow-400 transition-colors">
                        {material.title}
                      </h3>

                      <p className="text-zinc-500 text-sm font-medium line-clamp-3 mb-10 flex-1 leading-relaxed">
                        {material.description || "Material estratégico para suporte e desenvolvimento das atividades do Força Mirim."}
                      </p>

                      <div className="flex gap-4 mt-auto">
                        <Link href={material.file_url} target="_blank" className="flex-1">
                          <Button size="lg" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl border-b-2 border-zinc-950 active:border-b-0 transition-all">
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </Link>
                        <Link href={material.file_url} target="_blank">
                          <Button size="lg" variant="outline" className="bg-transparent border-white/10 hover:border-yellow-400/50 hover:text-yellow-400 font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-zinc-900/20 rounded-[4rem] border border-white/5">
                <ShieldCheck className="w-24 h-24 text-zinc-800 mx-auto mb-8 opacity-50" />
                <h3 className="text-3xl font-black text-zinc-500 uppercase tracking-tighter italic">Nenhum Material Publicado</h3>
                <p className="text-zinc-600 mt-4 font-black uppercase text-xs tracking-widest">Aguarde novas orientações estratégicas</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="biblia" className="space-y-8 outline-none">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input
                placeholder="Filtrar devocionais..."
                className="pl-14 bg-zinc-900/40 backdrop-blur-xl border-white/5 text-zinc-100 h-16 rounded-[2rem] focus:ring-blue-500/20 text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMaterials.map((material, idx) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 hover:border-blue-400/30 transition-all duration-500 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <Book className="w-40 h-40 text-white" />
                    </div>

                    <div className="flex flex-col h-full relative z-10">
                      <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <Heart className="text-white w-8 h-8" />
                      </div>

                      <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">
                        {material.title}
                      </h3>

                      <p className="text-zinc-500 text-sm font-medium line-clamp-3 mb-10 flex-1 leading-relaxed">
                        {material.description || "Conteúdo espiritual e valores éticos para formação do caráter."}
                      </p>

                      <div className="flex gap-4 mt-auto">
                        <Link href={material.file_url} target="_blank" className="flex-1">
                          <Button size="lg" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-2xl border-b-2 border-zinc-950 transition-all">
                            <Download className="w-4 h-4 mr-2" />
                            Acessar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-zinc-900/20 rounded-[4rem] border border-white/5">
                <Book className="w-24 h-24 text-zinc-800 mx-auto mb-8 opacity-50" />
                <h3 className="text-3xl font-black text-zinc-500 uppercase tracking-tighter italic">Conteúdo em Breve</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="missoes" className="space-y-8 outline-none">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <Input
                placeholder="Filtrar atividades e missões..."
                className="pl-14 bg-zinc-900/40 backdrop-blur-xl border-white/5 text-zinc-100 h-16 rounded-[2rem] focus:ring-violet-500/20 text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredMissoes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredMissoes.map((missao, idx) => (
                  <motion.div
                    key={missao.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 hover:border-violet-500/30 transition-all shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <Target className="w-48 h-48 text-white" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl",
                          missao.tipo === 'missao' ? "bg-red-500 shadow-red-500/20" : "bg-blue-500 shadow-blue-500/20"
                        )}>
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <Badge className={cn(
                          "px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em]",
                          missao.tipo === 'missao' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {missao.tipo === 'missao' ? 'Missão Tática' : 'Atividade Extra'}
                        </Badge>
                      </div>

                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none group-hover:text-violet-400 transition-colors">
                        {missao.titulo}
                      </h3>

                      <p className="text-zinc-500 text-sm font-medium mb-12 line-clamp-2 leading-relaxed">
                        {missao.descricao}
                      </p>

                      <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-zinc-950/50 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                          <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Calendar className="w-3 h-3" />
                            Início
                          </div>
                          <p className="text-white font-black text-lg">{format(parseISO(missao.data_lancamento), "dd/MM")}</p>
                        </div>
                        <div className="bg-zinc-950/50 p-6 rounded-3xl border border-red-500/10 backdrop-blur-md">
                          <div className="flex items-center gap-2 text-red-400/70 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Clock className="w-3 h-3" />
                            Prazo
                          </div>
                          <p className="text-red-400 font-black text-lg">{format(parseISO(missao.data_entrega), "dd/MM")}</p>
                        </div>
                      </div>

                      {missao.missoes_materiais && missao.missoes_materiais.length > 0 && (
                        <div className="space-y-4 mb-10">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Materiais de Apoio
                          </p>
                          {missao.missoes_materiais.map(({ study_materials: m }) => (
                            <Link key={m.id} href={m.file_url} target="_blank" className="block">
                              <div className="p-5 bg-zinc-800/30 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group/file">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center text-violet-400 group-hover/file:bg-violet-400 group-hover/file:text-black transition-all">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs text-white font-black uppercase tracking-tight truncate max-w-[150px]">{m.title}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover/file:text-white transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">
                          Operação Ativa
                        </div>
                        <Button variant="ghost" className="text-white font-black uppercase text-[10px] tracking-widest hover:text-violet-400 p-0 h-auto group">
                          Detalhes da Missão <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-zinc-900/20 rounded-[4rem] border border-white/5">
                <Target className="w-24 h-24 text-zinc-800 mx-auto mb-8 opacity-50" />
                <h3 className="text-3xl font-black text-zinc-500 uppercase tracking-tighter italic">Nenhuma Missão Designada</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="capa" className="outline-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              <div className="space-y-10">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-12 rounded-[3rem] shadow-2xl space-y-10">
                  <div>
                    <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-amber-500/20">
                      <FileText className="text-black w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">IDENTIDADE DO <span className="text-amber-500">CADERNO</span></h2>
                    <p className="text-zinc-500 font-medium">Gere uma capa personalizada oficial para identificação tática do seu material didático.</p>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Membro Vinculado</label>
                    <Select value={selectedStudent?.id} onValueChange={(val) => setSelectedStudent(students.find(s => s.id === val) || null)}>
                      <SelectTrigger className="bg-zinc-950/80 border-white/5 h-20 rounded-[2rem] text-white font-black uppercase tracking-tight text-lg shadow-inner">
                        <SelectValue placeholder="Selecione o Aluno" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-zinc-200 rounded-[2rem] p-2">
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id} className="rounded-2xl focus:bg-amber-500 focus:text-black py-4">
                            <div className="flex items-center gap-3 uppercase font-black text-sm">
                              <span className="text-zinc-500 opacity-50">#{s.matricula_pfm}</span> {s.nome_guerra}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-6">
                    <Button
                      disabled={!selectedStudent}
                      onClick={() => router.push(`/materiais/imprimir-capa?student_id=${selectedStudent?.id}`)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black h-20 rounded-[2rem] shadow-xl shadow-amber-900/20 uppercase tracking-[0.2em] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border-b-4 border-amber-700 active:border-b-0"
                    >
                      <Printer className="w-6 h-6 mr-4" />
                      Imprimir Versão Oficial
                    </Button>
                    <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                      <Info className="w-3.5 h-3.5" /> Papel A4 • Alta Definição
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-10 rounded-[2.5rem] flex items-start gap-6 backdrop-blur-sm">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white font-black text-sm uppercase tracking-widest italic">Padrão Força Mirim</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed font-medium">A capa oficial é obrigatória em todos os cadernos de uso acadêmico. Recomendamos a impressão em gramatura 90g para maior durabilidade e rigidez.</p>
                  </div>
                </div>
              </div>

              <div className="relative group hidden lg:block perspective-1000">
                <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/10 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden aspect-[1/1.414] scale-90 rotate-2 group-hover:rotate-0 transition-transform duration-700 border-[12px] border-zinc-900/10">
                  {selectedStudent ? (
                    <PrintableCover student={selectedStudent} />
                  ) : (
                    <div className="w-full h-full bg-zinc-50 flex flex-col items-center justify-center p-20 text-center border-4 border-dashed border-zinc-200 m-6 rounded-3xl">
                      <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-8">
                        <Printer className="w-10 h-10 text-zinc-300" />
                      </div>
                      <h3 className="text-zinc-400 font-black uppercase tracking-[0.2em] text-sm italic">Prévia Indisponível</h3>
                      <p className="text-zinc-400 text-[10px] mt-4 font-bold uppercase tracking-widest leading-relaxed">Selecione um membro para carregar os dados de identificação na capa oficial.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
