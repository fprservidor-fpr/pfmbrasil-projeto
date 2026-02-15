"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, 
  Plus, 
  Loader2,
  Edit2,
  Trash2,
  Users
} from "lucide-react";

export default function TurmasPage() {
  const { profile, simulatedRole } = useAuth();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [instrutores, setInstrutores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [newTurma, setNewTurma] = useState({
    nome: "",
    descricao: "",
    ano_referencia: new Date().getFullYear(),
    idade_minima: 6,
    idade_maxima: 17,
    ativa: true,
  });
  const [editingTurma, setEditingTurma] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

      const fetchData = async () => {
      setLoading(true);
      const showTestRecords = !!simulatedRole;

      const [{ data: turmasData }, { data: instrutoresData }] = await Promise.all([
        supabase.from("turmas").select("*, turma_instrutores(profile_id, profiles(full_name, war_name))").order("nome"),
        supabase.from("profiles").select("*").in("role", ["instructor", "instrutor", "admin", "coord_geral", "coord_nucleo"]).order("war_name, full_name")
      ]);

        if (turmasData) {
          const turmasWithCounts = await Promise.all(turmasData.map(async (turma) => {
            let studentsQuery = supabase
              .from("students")
              .select("*", { count: "exact", head: true })
              .eq("turma_id", turma.id);
            
            if (!showTestRecords) {
              studentsQuery = studentsQuery.eq("is_test", false);
            }

            const { count } = await studentsQuery;
            return { ...turma, alunos_count: count || 0 };
          }));
          setTurmas(turmasWithCounts);
        }
    if (instrutoresData) setInstrutores(instrutoresData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTurma = async () => {
    if (!newTurma.nome.trim()) {
      toast.error("O nome da turma é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("turmas").insert([newTurma]);
      if (error) throw error;
      toast.success("Turma criada com sucesso!");
      setShowNewModal(false);
      setNewTurma({
        nome: "",
        descricao: "",
        ano_referencia: new Date().getFullYear(),
        idade_minima: 6,
        idade_maxima: 17,
        ativa: true,
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar turma");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTurma = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta turma?")) return;
    try {
      const { error } = await supabase.from("turmas").delete().eq("id", id);
      if (error) throw error;
      toast.success("Turma excluída com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir turma");
    }
  };

  const openEditModal = (turma: any) => {
    setEditingTurma({ ...turma });
    setShowEditModal(true);
  };

  const handleUpdateTurma = async () => {
    if (!editingTurma?.nome.trim()) {
      toast.error("O nome da turma é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("turmas").update({
        nome: editingTurma.nome,
        descricao: editingTurma.descricao,
        ano_referencia: editingTurma.ano_referencia,
        idade_minima: editingTurma.idade_minima,
        idade_maxima: editingTurma.idade_maxima,
        ativa: editingTurma.ativa
      }).eq("id", editingTurma.id);
      if (error) throw error;
      toast.success("Turma atualizada com sucesso!");
      setShowEditModal(false);
      setEditingTurma(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar turma");
    } finally {
      setSaving(false);
    }
  };

  const openInstructorsModal = async (turma: any) => {
    setSelectedTurma(turma);
    const { data } = await supabase
      .from("turma_instrutores")
      .select("profile_id")
      .eq("turma_id", turma.id);
    setSelectedInstructors(data?.map(d => d.profile_id) || []);
    setShowInstructorsModal(true);
  };

  const handleSaveInstructors = async () => {
    setSaving(true);
    try {
      await supabase.from("turma_instrutores").delete().eq("turma_id", selectedTurma.id);
      
      if (selectedInstructors.length > 0) {
        const inserts = selectedInstructors.map(profile_id => ({
          turma_id: selectedTurma.id,
          profile_id,
        }));
        const { error } = await supabase.from("turma_instrutores").insert(inserts);
        if (error) throw error;
      }
      
      toast.success("Instrutores vinculados com sucesso!");
      setShowInstructorsModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular instrutores");
    } finally {
      setSaving(false);
    }
  };

  if (profile?.role !== "admin" && profile?.role !== "instructor" && profile?.role !== "instrutor") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Negado</h1>
        <p className="text-zinc-400 text-sm">Apenas administradores e instrutores podem gerenciar turmas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Turmas</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie as turmas do programa</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Nova Turma
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-zinc-500">Nenhuma turma cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map((turma) => (
            <Card key={turma.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white uppercase">{turma.nome}</h3>
                    <Badge className={turma.ativa ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-700 text-zinc-400"}>
                      {turma.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => openEditModal(turma)} className="text-zinc-500 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTurma(turma.id)} className="text-red-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </div>

                <p className="text-zinc-500 text-sm uppercase tracking-wide">
                  Idades de {turma.idade_minima?.toString().padStart(2, '0')} a {turma.idade_maxima} anos
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Alunos:</span>
                    <span className="text-white font-bold">{turma.alunos_count}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Instrutores:</span>
                    <span className="text-white font-bold">{turma.turma_instrutores?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Ano:</span>
                    <span className="text-white font-bold">{turma.ano_referencia}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => openInstructorsModal(turma)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Instrutores
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="bg-[#1a1f2e] border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nova Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Nome da Turma *</Label>
              <Input 
                value={newTurma.nome}
                onChange={(e) => setNewTurma({ ...newTurma, nome: e.target.value })}
                placeholder="Ex: 1º Pelotão Alfa"
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Descrição</Label>
              <Textarea 
                value={newTurma.descricao}
                onChange={(e) => setNewTurma({ ...newTurma, descricao: e.target.value })}
                placeholder="Descrição opcional"
                className="bg-zinc-900 border-zinc-700 text-white resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Ano de Referência *</Label>
              <Input 
                type="number"
                value={newTurma.ano_referencia}
                onChange={(e) => setNewTurma({ ...newTurma, ano_referencia: parseInt(e.target.value) })}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="turma_ativa"
                checked={newTurma.ativa}
                onCheckedChange={(val) => setNewTurma({ ...newTurma, ativa: !!val })}
                className="border-zinc-700 data-[state=checked]:bg-emerald-500"
              />
              <Label htmlFor="turma_ativa" className="text-zinc-300 cursor-pointer">Turma Ativa</Label>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setShowNewModal(false)} className="flex-1 border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button onClick={handleCreateTurma} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        <Dialog open={showInstructorsModal} onOpenChange={setShowInstructorsModal}>
          <DialogContent className="bg-[#1a1f2e] border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Vincular Instrutores</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedInstructors(instrutores.map(i => i.id))}
                  className="bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"
                >
                  Selecionar Todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedInstructors([])}
                  className="border-zinc-700 text-zinc-400"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {instrutores.map((inst) => (
                  <div key={inst.id} className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                    <Checkbox 
                      id={`inst-${inst.id}`}
                      checked={selectedInstructors.includes(inst.id)}
                      onCheckedChange={(val) => {
                        if (val) {
                          setSelectedInstructors([...selectedInstructors, inst.id]);
                        } else {
                          setSelectedInstructors(selectedInstructors.filter(id => id !== inst.id));
                        }
                      }}
                      className="border-zinc-700 data-[state=checked]:bg-emerald-500"
                    />
                      <Label htmlFor={`inst-${inst.id}`} className="text-white cursor-pointer uppercase font-medium">
                        {inst.war_name || inst.full_name}
                      </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setShowInstructorsModal(false)} className="flex-1 border-zinc-700 text-zinc-400">
                  Cancelar
                </Button>
                <Button onClick={handleSaveInstructors} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-[#1a1f2e] border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Editar Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Nome da Turma *</Label>
                <Input 
                  value={editingTurma?.nome || ""}
                  onChange={(e) => setEditingTurma({ ...editingTurma, nome: e.target.value })}
                  placeholder="Ex: 1º Pelotão Alfa"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Descrição</Label>
                <Textarea 
                  value={editingTurma?.descricao || ""}
                  onChange={(e) => setEditingTurma({ ...editingTurma, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  className="bg-zinc-900 border-zinc-700 text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Ano</Label>
                  <Input 
                    type="number"
                    value={editingTurma?.ano_referencia || new Date().getFullYear()}
                    onChange={(e) => setEditingTurma({ ...editingTurma, ano_referencia: parseInt(e.target.value) })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Idade Mín.</Label>
                  <Input 
                    type="number"
                    value={editingTurma?.idade_minima || 6}
                    onChange={(e) => setEditingTurma({ ...editingTurma, idade_minima: parseInt(e.target.value) })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Idade Máx.</Label>
                  <Input 
                    type="number"
                    value={editingTurma?.idade_maxima || 17}
                    onChange={(e) => setEditingTurma({ ...editingTurma, idade_maxima: parseInt(e.target.value) })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit_turma_ativa"
                  checked={editingTurma?.ativa}
                  onCheckedChange={(val) => setEditingTurma({ ...editingTurma, ativa: !!val })}
                  className="border-zinc-700 data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="edit_turma_ativa" className="text-zinc-300 cursor-pointer">Turma Ativa</Label>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 border-zinc-700 text-zinc-400">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateTurma} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {saving ? "Salvando..." : "Atualizar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
}
