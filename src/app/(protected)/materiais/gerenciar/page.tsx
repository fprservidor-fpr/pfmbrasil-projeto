"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import {
    FileText,
    Plus,
    Trash2,
    ChevronLeft,
    ArrowLeft,
    Loader2,
    Target,
    Book,
    ShieldCheck,
    Sparkles,
    Save,
    Tag,
    Upload,
    Paperclip,
    X,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function GerenciarMateriaisPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);
    const [missoes, setMissoes] = useState<any[]>([]);
    const [turmas, setTurmas] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [newMaterial, setNewMaterial] = useState({
        title: "",
        description: "",
        section: "Material PFM",
        file_url: ""
    });

    const [newMissao, setNewMissao] = useState({
        titulo: "",
        descricao: "",
        tipo: "missao",
        data_lancamento: new Date().toISOString().split('T')[0],
        data_entrega: "",
        turma_id: "all",
        material_ids: [] as string[]
    });

    const canManage = ["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor", "coordenador"].includes(profile?.role || "");

    useEffect(() => {
        if (profile && !canManage) {
            router.push("/materiais");
            return;
        }
        fetchData();
    }, [profile]);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho (ex: 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 10MB.");
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // Se o erro for que o bucket não existe, avisar de forma amigável
                if (uploadError.message.includes("bucket not found")) {
                    throw new Error("O bucket 'materials' não foi configurado no Supabase.");
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);

            setNewMaterial(prev => ({ ...prev, file_url: publicUrl }));
            toast.success("Arquivo carregado!");
        } catch (error: any) {
            console.error("Erro no upload:", error);
            toast.error("Erro no upload: " + error.message);
        } finally {
            setUploading(false);
        }
    }

    async function fetchData() {
        try {
            setLoading(true);
            const [mRes, missRes, tRes] = await Promise.all([
                supabase.from("study_materials").select("*").order("created_at", { ascending: false }),
                supabase.from("missoes_atividades").select("*").order("created_at", { ascending: false }),
                supabase.from("turmas").select("*").order("nome")
            ]);

            if (mRes.data) setMaterials(mRes.data);
            if (missRes.data) setMissoes(missRes.data);
            if (tRes.data) setTurmas(tRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddMaterial() {
        if (!newMaterial.title || !newMaterial.file_url) {
            toast.error("Preencha o título e a URL do arquivo.");
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from("study_materials").insert([{
                ...newMaterial,
                created_by: profile?.id
            }]);

            if (error) throw error;
            toast.success("Material adicionado com sucesso!");
            setNewMaterial({ title: "", description: "", section: "Material PFM", file_url: "" });
            fetchData();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleAddMissao() {
        if (!newMissao.titulo || !newMissao.data_entrega) {
            toast.error("Preencha o título e a data de entrega.");
            return;
        }

        setSaving(true);
        try {
            const { data: missaoData, error } = await supabase.from("missoes_atividades").insert([{
                titulo: newMissao.titulo,
                descricao: newMissao.descricao,
                tipo: newMissao.tipo,
                data_lancamento: newMissao.data_lancamento,
                data_entrega: newMissao.data_entrega,
                turma_id: newMissao.turma_id === "all" ? null : newMissao.turma_id
            }]).select().single();

            if (error) throw error;

            // Vincular materiais
            if (newMissao.material_ids.length > 0) {
                const links = newMissao.material_ids.map(mid => ({
                    missao_id: missaoData.id,
                    material_id: mid
                }));
                const { error: linkError } = await supabase.from("missoes_materiais").insert(links);
                if (linkError) throw linkError;
            }

            toast.success("Operação/Missão criada!");
            setNewMissao({
                titulo: "",
                descricao: "",
                tipo: "missao",
                data_lancamento: new Date().toISOString().split('T')[0],
                data_entrega: "",
                turma_id: "all",
                material_ids: []
            });
            fetchData();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteMaterial(id: string) {
        if (!confirm("Deseja realmente excluir este material?")) return;
        const { error } = await supabase.from("study_materials").delete().eq("id", id);
        if (error) toast.error("Erro ao excluir.");
        else {
            toast.success("Excluído!");
            fetchData();
        }
    }

    async function handleDeleteMissao(id: string) {
        if (!confirm("Deseja realmente excluir esta missão?")) return;
        const { error } = await supabase.from("missoes_atividades").delete().eq("id", id);
        if (error) toast.error("Erro ao excluir.");
        else {
            toast.success("Excluído!");
            fetchData();
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-zinc-500 hover:text-white p-0 h-auto flex items-center gap-2 group mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para Materiais
                    </Button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Painel de Controle Administrativo</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                        GESTAO DE <span className="text-yellow-400">CONTEUDO</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Adicionar Material Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center text-yellow-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-widest">Novo Material PDF</h2>
                    </div>

                    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                        <CardContent className="p-0 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Título do Material</label>
                                <Input
                                    value={newMaterial.title}
                                    onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                    className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6 focus:ring-yellow-500/20"
                                    placeholder="Ex: Manual de Ordem Unida v2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Descrição Curta</label>
                                <Textarea
                                    value={newMaterial.description}
                                    onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                    className="bg-zinc-950/50 border-white/5 rounded-2xl text-white px-6 py-4 focus:ring-yellow-500/20 min-h-[100px] resize-none"
                                    placeholder="Explicação breve sobre o conteúdo..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Seção do Portal</label>
                                <Select value={newMaterial.section} onValueChange={val => setNewMaterial({ ...newMaterial, section: val })}>
                                    <SelectTrigger className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                                        <SelectItem value="Material PFM">Manual PFM</SelectItem>
                                        <SelectItem value="Devocional | Biblia">Devocional</SelectItem>
                                        <SelectItem value="Atividades">Atividades</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 italic flex items-center gap-2">
                                        <Paperclip className="w-3 h-3" /> Origem do Conteúdo
                                    </label>

                                    <div className="grid grid-cols-1 gap-8">
                                        {/* Option 1: URL */}
                                        <div className="group/url space-y-3 p-6 rounded-[2rem] bg-zinc-950/20 border border-white/5 hover:border-yellow-500/20 transition-all">
                                            <div className="flex items-center gap-3 ml-2">
                                                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-black text-black">1</div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vincular Link Externo</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/url:text-yellow-500 transition-colors">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    value={newMaterial.file_url}
                                                    onChange={e => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                                                    className="bg-zinc-950/80 border-white/5 h-16 rounded-2xl text-white pl-14 pr-12 focus:ring-yellow-500/20 text-sm font-medium transition-all"
                                                    placeholder="Cole o link aqui (Google Drive, Dropbox, site...)"
                                                />
                                                {newMaterial.file_url && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Separator */}
                                        <div className="relative flex items-center justify-center">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/5"></div>
                                            </div>
                                            <div className="relative bg-zinc-900 px-6 text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] italic leading-none py-1 border border-white/5 rounded-full">
                                                OU
                                            </div>
                                        </div>

                                        {/* Option 2: Upload */}
                                        <div className="group/upload space-y-3 p-6 rounded-[2rem] bg-zinc-950/20 border border-white/5 hover:border-yellow-500/20 transition-all">
                                            <div className="flex items-center gap-3 ml-2">
                                                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-black text-black">2</div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Carregar Arquivo Local</p>
                                            </div>
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className={cn(
                                                    "flex flex-col items-center justify-center gap-4 p-8 rounded-[1.5rem] border-2 border-dashed transition-all cursor-pointer group/btn relative overflow-hidden",
                                                    uploading
                                                        ? "border-yellow-500/20 bg-yellow-500/5 opacity-50 pointer-events-none"
                                                        : "border-white/5 bg-zinc-950/40 hover:border-yellow-500/30 hover:bg-yellow-500/5 hover:shadow-2xl hover:shadow-yellow-500/5"
                                                )}
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover/btn:scale-110 group-hover/btn:bg-yellow-500 group-hover/btn:text-black transition-all">
                                                    {uploading ? (
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-6 h-6" />
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-xs font-black uppercase tracking-widest text-zinc-400 group-hover/btn:text-white transition-colors">
                                                        {uploading ? "Processando..." : "Subir Documento"}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter group-hover/btn:text-zinc-500 transition-colors mt-1 block">
                                                        PDF, IMG, DOC e MP4 (Max 10MB)
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleAddMaterial}
                                disabled={saving}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest h-16 rounded-[2rem] shadow-xl shadow-yellow-900/20"
                            >
                                {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5 mr-3" />}
                                Publicar Material
                            </Button>
                        </CardContent>
                    </Card>

                    {/* List Materials */}
                    <div className="space-y-4">
                        <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-widest ml-4">Últimos Publicados</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {materials.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            m.section === "Material PFM" ? "bg-yellow-400/10 text-yellow-500" :
                                                m.section === "Atividades" ? "bg-violet-400/10 text-violet-500" :
                                                    "bg-blue-400/10 text-blue-500"
                                        )}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm uppercase italic tracking-tight">{m.title}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase font-black">{m.section}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteMaterial(m.id)}
                                        className="text-zinc-700 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Adicionar Missão Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-violet-400/10 rounded-xl flex items-center justify-center text-violet-500">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-widest">Campanha / Missão</h2>
                    </div>

                    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                        <CardContent className="p-0 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Título da Operação</label>
                                <Input
                                    value={newMissao.titulo}
                                    onChange={e => setNewMissao({ ...newMissao, titulo: e.target.value })}
                                    className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6 focus:ring-violet-500/20"
                                    placeholder="Ex: Missão de Campo - Sobrevivência"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Objetivos / Descrição</label>
                                <Textarea
                                    value={newMissao.descricao}
                                    onChange={e => setNewMissao({ ...newMissao, descricao: e.target.value })}
                                    className="bg-zinc-950/50 border-white/5 rounded-2xl text-white px-6 py-4 focus:ring-violet-500/20 min-h-[100px] resize-none"
                                    placeholder="Detalhes táticos da missão..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tipo</label>
                                    <Select value={newMissao.tipo} onValueChange={val => setNewMissao({ ...newMissao, tipo: val as any })}>
                                        <SelectTrigger className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                                            <SelectItem value="missao">Missão</SelectItem>
                                            <SelectItem value="atividade">Atividade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Turma Alvo</label>
                                    <Select value={newMissao.turma_id} onValueChange={val => setNewMissao({ ...newMissao, turma_id: val })}>
                                        <SelectTrigger className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                                            <SelectItem value="all">Todas as Turmas</SelectItem>
                                            {turmas.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Data Início</label>
                                    <Input
                                        type="date"
                                        value={newMissao.data_lancamento}
                                        onChange={e => setNewMissao({ ...newMissao, data_lancamento: e.target.value })}
                                        className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-red-500/70 uppercase tracking-widest ml-4">Data Entrega (Prazo)</label>
                                    <Input
                                        type="date"
                                        value={newMissao.data_entrega}
                                        onChange={e => setNewMissao({ ...newMissao, data_entrega: e.target.value })}
                                        className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6 border-red-500/10 focus:ring-red-500/20"
                                    />
                                </div>
                            </div>

                            {/* Vincular Materiais */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                    <Paperclip className="w-3 h-3" /> Materiais de Apoio Vinculados
                                </label>

                                <div className="space-y-4">
                                    <Select
                                        onValueChange={val => {
                                            if (!newMissao.material_ids.includes(val)) {
                                                setNewMissao(prev => ({ ...prev, material_ids: [...prev.material_ids, val] }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-zinc-950/50 border-white/5 h-14 rounded-2xl text-white px-6">
                                            <SelectValue placeholder="Selecione materiais para apoiar esta missão..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl max-h-60 overflow-y-auto">
                                            {materials.filter(m => !newMissao.material_ids.includes(m.id)).map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{m.title}</span>
                                                        <span className="text-[10px] opacity-50 uppercase">{m.section}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {materials.filter(m => !newMissao.material_ids.includes(m.id)).length === 0 && (
                                                <p className="p-4 text-center text-xs text-zinc-500">Nenhum material disponível</p>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* Selected Materials Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <AnimatePresence>
                                            {newMissao.material_ids.map(mid => {
                                                const mat = materials.find(m => m.id === mid);
                                                if (!mat) return null;
                                                return (
                                                    <motion.div
                                                        key={mid}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-4 py-2 rounded-xl flex items-center gap-3"
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{mat.title}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewMissao(prev => ({
                                                                ...prev,
                                                                material_ids: prev.material_ids.filter(id => id !== mid)
                                                            }))}
                                                            className="hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleAddMissao}
                                disabled={saving}
                                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest h-16 rounded-[2rem] shadow-xl shadow-violet-900/20"
                            >
                                {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5 mr-3" />}
                                Lançar Operação
                            </Button>
                        </CardContent>
                    </Card>

                    {/* List Missoes */}
                    <div className="space-y-4">
                        <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-widest ml-4">Histórico de Missões</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {missoes.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.tipo === "missao" ? "bg-red-400/10 text-red-500" : "bg-blue-400/10 text-blue-500")}>
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-sm uppercase italic tracking-tight">{m.titulo}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase font-black">{m.tipo === 'missao' ? 'Missão' : 'Atividade'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteMissao(m.id)}
                                        className="text-zinc-700 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
