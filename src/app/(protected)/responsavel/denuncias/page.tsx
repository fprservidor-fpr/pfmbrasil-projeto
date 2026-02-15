"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Megaphone, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Denuncia = {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  reported_by: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "amber", icon: Clock },
  em_analise: { label: "Em Análise", color: "blue", icon: AlertCircle },
  resolvido: { label: "Resolvido", color: "emerald", icon: CheckCircle2 },
  arquivada: { label: "Arquivada", color: "slate", icon: XCircle },
};

export default function AlunoDenunciasPage() {
  const { profile } = useAuth();
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (profile?.id) {
      fetchDenuncias();
    }
  }, [profile?.id]);

  async function fetchDenuncias() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("denuncias")
        .select("*")
        .eq("reported_by", profile?.id)
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
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("denuncias").insert({
        title: form.title,
        content: form.content,
        reported_by: profile?.id,
        status: "pendente",
      });

      if (error) throw error;
      
      toast.success("Denúncia enviada com sucesso!");
      setForm({ title: "", content: "" });
      setIsDialogOpen(false);
      fetchDenuncias();
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      toast.error("Erro ao enviar denúncia");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-slate-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Nova Denúncia
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Registrar Denúncia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Título</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Resumo da ocorrência"
                    className="bg-slate-950 border-white/10 text-white placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1.5 block">Descrição</label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Descreva detalhadamente a ocorrência..."
                    rows={4}
                    className="bg-slate-950 border-white/10 text-white placeholder:text-slate-600 resize-none"
                  />
                </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 text-xs">
                  <strong>Importante:</strong> Denúncias falsas podem resultar em medidas disciplinares. 
                  Seja honesto e preciso em sua descrição.
                </p>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2"
              >
                {submitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Denúncia
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {denuncias.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-slate-900/30 rounded-2xl border border-white/5"
        >
          <Megaphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Nenhuma denúncia registrada</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Caso presencie alguma situação que precise ser reportada, 
            clique no botão acima para registrar uma nova denúncia.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {denuncias.map((denuncia, i) => {
            const config = statusConfig[denuncia.status] || statusConfig.pendente;
            const Icon = config.icon;
            
            return (
              <motion.div
                key={denuncia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    config.color === "amber" && "bg-amber-500/20",
                    config.color === "blue" && "bg-blue-500/20",
                    config.color === "emerald" && "bg-emerald-500/20",
                    config.color === "slate" && "bg-slate-500/20"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      config.color === "amber" && "text-amber-400",
                      config.color === "blue" && "text-blue-400",
                      config.color === "emerald" && "text-emerald-400",
                      config.color === "slate" && "text-slate-400"
                    )} />
                  </div>
                  
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-bold truncate">{denuncia.title}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0",
                          config.color === "amber" && "bg-amber-500/10 text-amber-400",
                          config.color === "blue" && "bg-blue-500/10 text-blue-400",
                          config.color === "emerald" && "bg-emerald-500/10 text-emerald-400",
                          config.color === "slate" && "bg-slate-500/10 text-slate-400"
                        )}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {denuncia.content}
                      </p>

                    <p className="text-slate-600 text-xs">
                      Registrada em {format(parseISO(denuncia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-slate-500/10 to-zinc-500/10 border border-slate-500/20 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-1">Canal de Denúncias</h3>
            <p className="text-slate-400 text-sm">
              Este canal é destinado a reportar situações de bullying, assédio, 
              comportamento inadequado ou qualquer ocorrência que necessite atenção da coordenação. 
              Todas as denúncias são tratadas com sigilo.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
