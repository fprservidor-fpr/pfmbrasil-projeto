"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserPlus,
  Loader2,
  Search,
  Edit2,
  Trash2,
  User,
  AlertTriangle,
  Sparkles,
  Shield,
  Clock,
  ExternalLink,
  Users,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createInstructorWithAccount, updateInstructor, deleteInstructor } from "./actions";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CARGOS = [
  "Coordenador Geral",
  "Coordenador de Núcleo",
  "Instrutor",
  "Monitor",
  "Voluntário",
];

export default function InstructorsPage() {
  const { profile, loading: authLoading, simulatedRole } = useAuth();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createAccount, setCreateAccount] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    war_name: "",
    email: "",
    cpf: "",
    birth_date: "",
    academic_formation: "",
    voter_id: "",
    rank: "",
    specialty: "",
    status: "Ativo",
    roles: [] as string[],
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const showTestRecords = !!simulatedRole;
      let query = supabase
        .from("instructors")
        .select(`
          *,
          profile:profiles!instructors_profile_id_fkey(id, full_name, role)
        `);

      if (!showTestRecords) {
        query = query.eq("is_test", false);
      }

      const { data, error } = await query.order("full_name", { ascending: true });
      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar instrutores");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor"].includes(profile?.role || "")) {
      fetchInstructors();
    }
  }, [profile]);

  const resetForm = () => {
    setFormData({
      full_name: "",
      war_name: "",
      email: "",
      cpf: "",
      birth_date: "",
      academic_formation: "",
      voter_id: "",
      rank: "",
      specialty: "",
      status: "Ativo",
      roles: [],
    });
    setEditingId(null);
    setCreateAccount(false);
  };

  const handleOpenModal = (instructor?: any) => {
    if (instructor) {
      setEditingId(instructor.id);
      setFormData({
        full_name: instructor.full_name || "",
        war_name: instructor.war_name || "",
        email: instructor.email || "",
        cpf: instructor.cpf || "",
        birth_date: instructor.birth_date || "",
        academic_formation: instructor.academic_formation || "",
        voter_id: instructor.voter_id || "",
        rank: instructor.rank || "",
        specialty: instructor.specialty || "",
        status: instructor.status || "Ativo",
        roles: instructor.roles || [],
      });
      setCreateAccount(false);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) return toast.error("Nome é obrigatório");
    if (!formData.war_name.trim()) return toast.error("Nome de Guerra é obrigatório");
    if (!formData.cpf.trim()) return toast.error("CPF é obrigatório");
    if (createAccount && !formData.email.trim()) return toast.error("E-mail é obrigatório para criar conta de acesso");

    setSaving(true);
    try {
      let result;
      if (editingId) result = await updateInstructor(editingId, formData);
      else result = await createInstructorWithAccount(formData, createAccount);

      if (result.success) {
        toast.success(editingId ? "Dados atualizados!" : "Cadastrado com sucesso!");
        setShowModal(false);
        fetchInstructors();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, email: string) => {
    if (email === "admin@admin.com") {
      toast.error("Acesso administrativo exclusivo não pode ser removido.");
      return;
    }
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const result = await deleteInstructor(deletingId);
      if (result.success) {
        toast.success("Registro removido!");
        fetchInstructors();
      } else throw new Error(result.error);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "---";
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return cpf;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    setFormData({ ...formData, cpf: value });
  };

  const filteredInstructors = instructors.filter(i =>
    i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cpf?.includes(searchTerm) ||
    i.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.war_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (authLoading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
    </div>
  );

  if (!["admin", "instructor", "instrutor", "coord_geral", "coord_nucleo"].includes(profile?.role || "")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-red-500 opacity-50" />
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h1>
        <p className="text-zinc-500 font-medium">Você não possui as credenciais necessárias para este setor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-10">
      {/* Premium Header */}
      <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Gestão Administrativa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            QUADRO DE <span className="text-emerald-500">INSTRUTORES</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl">
            Controle operacional da equipe de instrutores, coordenadores e auxiliares do programa.
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 px-10 rounded-[2rem] shadow-xl shadow-emerald-900/20 uppercase tracking-widest text-xs border-b-4 border-emerald-800 active:border-b-0 transition-all"
        >
          <UserPlus className="w-5 h-5 mr-3" />
          Novo Registro
        </Button>
      </motion.div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Efetivo", value: instructors.length, icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Instrutores Ativos", value: instructors.filter(i => i.status === "Ativo").length, icon: Shield, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Contas Vinculadas", value: instructors.filter(i => i.profile_id).length, icon: UserCheck, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Média de Idade", value: Math.round(instructors.reduce((acc, i) => acc + (calculateAge(i.birth_date) || 0), 0) / (instructors.length || 1)), icon: Clock, color: "text-violet-400", bg: "bg-violet-400/10" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
            className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Pesquisar por nome, CPF ou cargo..."
            className="pl-14 bg-zinc-900/40 backdrop-blur-xl border-white/5 text-white h-16 rounded-[2rem] focus:ring-emerald-500/20 text-lg font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto overflow-y-hidden">
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/5">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8 px-10">IDENTIFICAÇÃO / NOME</TableHead>
                  <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">DOCUMENTAÇÃO</TableHead>
                  <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">POSTO / CARGOS</TableHead>
                  <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">STATUS</TableHead>
                  <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8 text-right px-10">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32">
                      <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredInstructors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32 text-zinc-500 font-black uppercase tracking-widest text-sm">
                      Nenhum registro localizado no sistema.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstructors.map((inst, idx) => (
                    <TableRow key={inst.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group">
                      <TableCell className="py-8 px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                            <User className="w-8 h-8" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-black uppercase italic tracking-tighter text-lg">{inst.full_name}</span>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-emerald-500 uppercase font-black px-2 py-1 bg-emerald-500/10 rounded-lg">{inst.war_name || "N/A"}</span>
                              {inst.profile_id && (
                                <Badge className="h-5 px-2 text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black tracking-widest">Acesso Ativo</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex flex-col">
                          <span className="text-zinc-300 font-mono text-sm tracking-widest">{formatCPF(inst.cpf)}</span>
                          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Nasc: {inst.birth_date ? new Date(inst.birth_date).toLocaleDateString('pt-BR') : "---"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex flex-col gap-2">
                          <span className="text-zinc-400 text-xs font-black uppercase tracking-tight">{inst.rank || "Monitor"}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {inst.roles?.map((role: string, i: number) => (
                              <span key={i} className="text-[9px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded-md uppercase font-bold">{role}</span>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-8">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", inst.status === "Ativo" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
                          <span className={cn("font-black text-[10px] uppercase tracking-widest", inst.status === "Ativo" ? "text-emerald-500" : "text-red-500")}>
                            {inst.status || "Ativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-8 px-10">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(inst)} className="w-12 h-12 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-2xl transition-all">
                            <Edit2 className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id, inst.email)} className="w-12 h-12 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-white/5 text-white max-w-xl p-0 overflow-hidden rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
          <div className="bg-gradient-to-br from-emerald-600/20 to-transparent p-12 border-b border-white/5 relative overflow-hidden">
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2">{editingId ? "Atualizar Perfil" : "Novo Cadastro"}</DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium tracking-tight">Insira os dados operacionais do membro do quadro efetivo.</DialogDescription>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <UserPlus className="w-24 h-24 text-emerald-500" />
            </div>
          </div>

          <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nome de Guerra</Label>
                <Input
                  value={formData.war_name}
                  onChange={(e) => setFormData({ ...formData, war_name: e.target.value })}
                  className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">E-mail Operacional</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@fundaçãopedromorais.com"
                className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-bold"
              />
            </div>

            {!editingId && (
              <div className="flex items-center justify-between p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/20 shadow-inner">
                <div className="space-y-1">
                  <Label className="text-emerald-500 font-black uppercase text-xs tracking-widest">Habilitar Acesso</Label>
                  <p className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest">Login: CPF | Senha: 5 Últimos Dígitos</p>
                </div>
                <Switch
                  checked={createAccount}
                  onCheckedChange={setCreateAccount}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                  className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-mono"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nascimento</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Posto / Rank</Label>
                <Input
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Status Operativo</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="bg-zinc-900/50 border-white/5 h-14 rounded-2xl text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                    <SelectItem value="Ativo" className="rounded-xl focus:bg-emerald-600">Ativo</SelectItem>
                    <SelectItem value="Inativo" className="rounded-xl focus:bg-red-600">Inativo</SelectItem>
                    <SelectItem value="Afastado" className="rounded-xl focus:bg-amber-600">Afastado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Cargos Designados</Label>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {CARGOS.map((cargo) => (
                  <div key={cargo} className="flex items-center space-x-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                    <Checkbox
                      id={cargo}
                      checked={formData.roles.includes(cargo)}
                      onCheckedChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          roles: prev.roles.includes(cargo) ? prev.roles.filter(r => r !== cargo) : [...prev.roles, cargo]
                        }));
                      }}
                      className="border-white/10 data-[state=checked]:bg-emerald-500 rounded-md"
                    />
                    <Label htmlFor={cargo} className="text-zinc-400 font-bold text-xs uppercase cursor-pointer group-hover:text-white transition-colors">{cargo}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-12 bg-white/5 border-t border-white/5 flex gap-6">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs h-16 rounded-[2rem]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 rounded-[2rem] shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] text-xs">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-950 border-white/5 text-white max-w-sm rounded-[3rem] p-12 text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic mb-3">Remover Acesso?</DialogTitle>
          <DialogDescription className="text-zinc-500 mb-10 font-medium">Esta ação é irreversível e removerá todos os privilégios operacionais deste membro.</DialogDescription>
          <div className="flex flex-col gap-4">
            <Button onClick={confirmDelete} disabled={deleting} className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-16 rounded-[2rem] shadow-xl shadow-red-900/20 uppercase tracking-widest text-xs border-b-4 border-red-800 active:border-b-0">
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Exclusão"}
            </Button>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="w-full text-zinc-500 hover:text-white font-black h-16 uppercase tracking-widest text-[10px]">
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
