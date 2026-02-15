"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn, openExternalLink } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BookOpen, 
  FileText, 
  Download, 
  ExternalLink,
  Search, 
  ShieldCheck, 
  Book, 
  Printer, 
    User,
    Heart,
    Target
  } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PrintableCover } from "@/components/printable-cover";

type Material = {
  id: string;
  title: string;
  description: string;
  file_url: string;
  section: string;
  created_at: string;
};

  interface Student {
    id: string;
    nome_completo: string;
    nome_guerra: string;
    matricula_pfm: string;
    blood_type: string;
    turma: string;
    turma_id: string;
  }

export default function ResponsavelMateriaisPage() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [missoes, setMissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pfm");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        fetchMaterials(),
        profile?.cpf ? fetchStudents(profile.cpf) : Promise.resolve()
      ]);
      setLoading(false);
    }
    init();
  }, [profile]);

  useEffect(() => {
    if (selectedStudent) {
      fetchMissoes(selectedStudent.turma_id);
    }
  }, [selectedStudent]);

  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  }

  async function fetchMissoes(turmaId: string) {
    try {
      const { data, error } = await supabase
        .from("missoes_atividades")
        .select(`
          *,
          missoes_materiais(
            material:study_materials(*)
          )
        `)
        .or(`turma_id.eq.${turmaId},turma_id.is.null`)
        .order("data_entrega", { ascending: true });

      if (error) throw error;
      setMissoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar missões:", error);
    }
  }

  async function fetchStudents(cpf: string) {
    const cleanCpf = cpf.replace(/\D/g, "").padStart(11, '0');
    const { data } = await supabase
      .from("students")
      .select("*, turma_id")
      .or(`guardian1_cpf.eq.${cleanCpf},guardian2_cpf.eq.${cleanCpf},responsavel_cpf.eq.${cleanCpf}`)
      .eq("status", "ativo");
    
    if (data) {
      setStudents(data);
      const savedId = sessionStorage.getItem("selectedStudentId");
      const current = data.find(s => s.id === savedId) || data[0];
      if (current) setSelectedStudent(current);
    }
  }

  const handlePrintCover = () => {
    if (selectedStudent?.id) {
      openExternalLink(`/materiais/imprimir-capa?student_id=${selectedStudent.id}`);
    }
  };

  const filteredMaterials = materials.filter(m =>
    (m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())) &&
    (activeTab === "pfm" ? m.section === "Material PFM" : m.section === "Devocional | Biblia")
  );

  const openExternal = (url: string) => {
    openExternalLink(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-slate-900/50 border border-white/10 p-1 rounded-2xl h-14">
            <TabsTrigger value="pfm" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Material PFM
            </TabsTrigger>
            <TabsTrigger value="biblia" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
              <Book className="w-4 h-4 mr-2" />
              Devocional | Bíblia
            </TabsTrigger>
            <TabsTrigger value="missoes" className="rounded-xl data-[state=active]:bg-rose-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
              <Target className="w-4 h-4 mr-2" />
              Atividades & Missões
            </TabsTrigger>
            <TabsTrigger value="capa" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest h-full px-8">
              <FileText className="w-4 h-4 mr-2" />
              Capa do Caderno
            </TabsTrigger>
          </TabsList>

        <TabsContent value="capa" className="mt-0 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <div className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl space-y-6 backdrop-blur-xl">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Capa Personalizada</h2>
                  <p className="text-slate-400 text-sm mt-1">Gere a capa para identificar o material do seu dependente.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Selecione o Aluno</label>
                  <Select value={selectedStudent?.id} onValueChange={(val) => setSelectedStudent(students.find(s => s.id === val) || null)}>
                    <SelectTrigger className="bg-slate-950 border-white/10 h-14 rounded-2xl text-white font-bold">
                      <SelectValue placeholder="Escolha um aluno vinculado" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl focus:bg-blue-600">
                          <div className="flex items-center gap-2 uppercase font-black text-[11px]">
                            <span className="text-slate-500">#{s.matricula_pfm}</span> {s.nome_guerra}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-6 bg-slate-950/50 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <User className="text-blue-500 w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase text-xs">{selectedStudent?.nome_guerra || selectedStudent?.nome_completo || "Selecione um aluno"}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedStudent?.matricula_pfm || "Matrícula"}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handlePrintCover()}
                    disabled={!selectedStudent}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg shadow-amber-900/20 gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Gerar e Imprimir Capa
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden aspect-[1/1.414] scale-90 origin-top border-4 border-zinc-900/10">
                {selectedStudent ? (
                  <PrintableCover student={selectedStudent} />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-slate-200 m-4 rounded-xl">
                    <User className="w-20 h-20 text-slate-300 mb-6" />
                    <h3 className="text-slate-400 font-black uppercase tracking-widest">Prévia da Capa</h3>
                    <p className="text-slate-400 text-xs mt-2">Selecione um dependente para visualizar a capa.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          </TabsContent>

          <TabsContent value="missoes" className="space-y-6 mt-0 outline-none">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Pesquisar atividades e missões..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-14 bg-slate-900/50 border-white/10 rounded-2xl text-white focus:ring-rose-500/20"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedStudent?.id} onValueChange={(val) => setSelectedStudent(students.find(s => s.id === val) || null)}>
                  <SelectTrigger className="bg-slate-900/50 border-white/10 h-14 rounded-2xl text-white font-bold">
                    <SelectValue placeholder="Selecione o Aluno" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id} className="rounded-xl">
                        {s.nome_guerra}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {missoes
                .filter(m => m.titulo.toLowerCase().includes(search.toLowerCase()) || m.descricao?.toLowerCase().includes(search.toLowerCase()))
                .map((missao, i) => (
                <motion.div
                  key={missao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 hover:border-rose-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-16 h-16 text-rose-500" />
                  </div>
                  <div className="flex flex-col gap-5 relative z-10">
                    <div className="flex items-start gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                        missao.tipo === "missao" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        <Target className="w-7 h-7" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            missao.tipo === "missao" ? "bg-rose-500 text-white" : "bg-blue-500 text-white"
                          )}>
                            {missao.tipo === "missao" ? "Missão" : "Atividade"}
                          </span>
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            Prazo: {format(parseISO(missao.data_entrega), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 truncate group-hover:text-rose-500 transition-colors">{missao.titulo}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 font-medium">
                          {missao.descricao}
                        </p>
                      </div>
                    </div>

                    {missao.missoes_materiais && missao.missoes_materiais.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <BookOpen className="w-3 h-3" />
                          Materiais Vinculados
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {missao.missoes_materiais.map((mm: any) => (
                            <div key={mm.material.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5 group/item hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-slate-500 group-hover/item:text-blue-500 transition-colors" />
                                <span className="text-xs font-bold text-slate-400 truncate uppercase tracking-tight">{mm.material.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button 
                                  onClick={() => openExternal(mm.material.file_url)}
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 font-black uppercase text-[9px] tracking-widest px-2"
                                >
                                  Abrir
                                </Button>
                                <Button 
                                  onClick={() => openExternal(mm.material.file_url)}
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 text-slate-500 hover:text-white hover:bg-slate-800 font-black uppercase text-[9px] tracking-widest px-2"
                                >
                                  Baixar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {missoes.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500 font-medium bg-slate-900/20 rounded-[2rem] border border-dashed border-white/5">
                  Nenhuma atividade ou missão lançada para este aluno.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pfm" className="space-y-6 mt-0 outline-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Pesquisar material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-slate-900/50 border-white/10 rounded-2xl text-white focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMaterials.map((material, i) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="w-16 h-16 text-blue-500" />
                </div>
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20">
                    <FileText className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 truncate group-hover:text-blue-500 transition-colors">{material.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 font-medium">
                      {material.description || "Material pedagógico oficial PFM."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {format(parseISO(material.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      <Button 
                        onClick={() => openExternal(material.file_url)}
                        variant="ghost" 
                        size="sm"
                        className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 font-black uppercase text-[10px] tracking-widest"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="biblia" className="space-y-6 mt-0 outline-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Pesquisar conteúdo bíblico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-slate-900/50 border-white/10 rounded-2xl text-white focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMaterials.map((material, i) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Book className="w-16 h-16 text-indigo-500" />
                </div>
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-500/20">
                    <Heart className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 truncate group-hover:text-indigo-500 transition-colors">{material.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 font-medium">
                      {material.description || "Conteúdo devocional e valores fundamentais."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {format(parseISO(material.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                        <Button 
                          onClick={() => openExternal(material.file_url)}
                          variant="ghost" 
                          size="sm"
                          className="text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 font-black uppercase text-[10px] tracking-widest"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
