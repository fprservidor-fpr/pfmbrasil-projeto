"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { 
  Megaphone, 
  Plus, 
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Denuncia = {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
};

export default function MinhasDenunciasPage() {
  const { profile } = useAuth();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.role === "aluno") {
      router.push("/aluno/denuncias");
      return;
    }
    if (profile?.role === "responsavel") {
      router.push("/responsavel/denuncias");
      return;
    }

    if (profile?.id) {
      fetchDenuncias();
    }
  }, [profile?.id, profile?.role]);

  async function fetchDenuncias() {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("denuncias")
        .select("*")
        .eq("reported_by", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDenuncias(data || []);
    } catch (error) {
      console.error("Erro ao buscar denúncias:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return toast.error("Preencha todos os campos.");

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("denuncias").insert({
        title,
        content,
        reported_by: profile?.id,
        status: "pendente"
      });

      if (error) throw error;

      toast.success("Denúncia registrada com sucesso! Nossa equipe irá analisar.");
      setTitle("");
      setContent("");
      setShowForm(false);
      fetchDenuncias();
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      toast.error("Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolvido": return <CheckCircle2 className="text-emerald-500 w-5 h-5" />;
      case "em_analise": return <Clock className="text-amber-500 w-5 h-5" />;
      default: return <AlertCircle className="text-zinc-500 w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolvido": return "Resolvido";
      case "em_analise": return "Em Análise";
      default: return "Pendente";
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Megaphone className="text-emerald-500 w-8 h-8" />
            Minhas Denúncias
          </h1>
          <p className="text-zinc-500 mt-1">
            Espaço seguro para relatos, sugestões ou denúncias anônimas.
          </p>
        </div>

        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-emerald-900/20"
        >
          {showForm ? "Ver Minhas Denúncias" : "Nova Denúncia"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-2xl"
          >
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Plus className="text-emerald-500 w-5 h-5" />
              Registrar Novo Relato
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Assunto</label>
                <Input 
                  placeholder="Ex: Problema em sala, Sugestão de melhoria..."
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-12 rounded-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Descrição Detalhada</label>
                <Textarea 
                  placeholder="Conte-nos o que aconteceu. Suas informações são tratadas com total sigilo."
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 min-h-[200px] rounded-2xl resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-12 h-12 rounded-xl"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Denúncia"}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-zinc-900/50 animate-pulse rounded-2xl border border-zinc-800" />
                ))}
              </div>
            ) : denuncias.length > 0 ? (
              denuncias.map((denuncia) => (
                <div 
                  key={denuncia.id}
                  className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded">
                          ID: {denuncia.id.split("-")[0]}
                        </span>
                        <span className="text-zinc-600 text-[10px]">•</span>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                          {new Date(denuncia.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100">{denuncia.title}</h3>
                      <p className="text-zinc-500 text-sm">{denuncia.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800 shadow-inner">
                        {getStatusIcon(denuncia.status)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                          {getStatusLabel(denuncia.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
                <MessageSquare className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-zinc-300">Nenhuma denúncia registrada</h3>
                <p className="text-zinc-500">Suas denúncias e relatos aparecerão aqui.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
