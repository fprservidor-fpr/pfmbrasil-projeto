"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft, Award, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MeritosDemeritosPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState({
    label: "",
    points: 5,
    type: "merito"
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("occurrence_types")
      .select("*")
      .order("label");
    
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async () => {
    if (!newItem.label.trim()) return toast.error("Informe a descrição");
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("occurrence_types")
          .update(newItem)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Item atualizado!");
        setEditingId(null);
      } else {
        const { error } = await supabase.from("occurrence_types").insert([newItem]);
        if (error) throw error;
        toast.success("Item cadastrado!");
      }
      setNewItem({ label: "", points: 5, type: "merito" });
      fetchItems();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setNewItem({
      label: item.label,
      points: item.points,
      type: item.type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItem({ label: "", points: 5, type: "merito" });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("occurrence_types").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item removido");
      fetchItems();
    } catch (error: any) {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/comportamento">
            <Button variant="ghost" size="icon" className="rounded-xl border border-zinc-800">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Regulamento Disciplinar</h1>
            <p className="text-zinc-500 font-medium text-sm italic">Configuração de Méritos e Deméritos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4">
          <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl rounded-3xl overflow-hidden sticky top-8">
            <CardHeader className={cn(
              "border-b border-zinc-800 transition-colors",
              editingId ? "bg-amber-600/20" : "bg-gradient-to-br from-emerald-600/20 to-transparent"
            )}>
              <CardTitle className={cn(
                "text-sm font-black uppercase flex items-center gap-2",
                editingId ? "text-amber-400" : "text-emerald-400"
              )}>
                {editingId ? <AlertTriangle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Editar Registro" : "Novo Registro"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-500">Descrição</Label>
                <Input 
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="Ex: Auxílio em evento"
                  className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-emerald-500/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Tipo</Label>
                  <Select 
                    value={newItem.type} 
                    onValueChange={(v) => setNewItem({ ...newItem, type: v as any })}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="merito">MÉRITO (+)</SelectItem>
                      <SelectItem value="demerito">DEMÉRITO (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-500">Pontos</Label>
                  <Input 
                    type="number"
                    value={newItem.points}
                    onChange={(e) => setNewItem({ ...newItem, points: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-950 border-zinc-800 h-12 rounded-xl text-center font-black"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleCreate} 
                  disabled={saving}
                  className={cn(
                    "w-full text-white font-black h-12 rounded-xl shadow-lg transition-all",
                    editingId 
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20" 
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                  )}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "ATUALIZAR ITEM" : "CADASTRAR ITEM"}
                </Button>
                
                {editingId && (
                  <Button 
                    variant="ghost" 
                    onClick={cancelEdit}
                    className="text-zinc-500 hover:text-white"
                  >
                    CANCELAR EDIÇÃO
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total de Méritos</p>
                <p className="text-2xl font-black text-white">{items.filter(i => i.type === 'merito').length}</p>
              </div>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total de Deméritos</p>
                <p className="text-2xl font-black text-white">{items.filter(i => i.type === 'demerito').length}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-600 font-medium">Nenhum item cadastrado no regulamento.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      item.type === 'merito' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {item.type === 'merito' ? <Award className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm uppercase">{item.label}</h3>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.type}</p>
                    </div>
                  </div>
                  
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-600 uppercase mb-0.5">Pontuação</p>
                        <p className={cn(
                          "text-lg font-black",
                          item.type === 'merito' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {item.type === 'merito' ? "+" : "-"}{item.points}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(item)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-amber-500 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
