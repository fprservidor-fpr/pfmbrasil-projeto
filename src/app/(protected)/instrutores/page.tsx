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
  AlertTriangle
} from "lucide-react";

import { createInstructorWithAccount, updateInstructor, deleteInstructor } from "./actions";
import { Switch } from "@/components/ui/switch";

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

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      // Only show test records when admin is in simulation mode
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
    if (!formData.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.war_name.trim()) {
      toast.error("Nome de Guerra é obrigatório");
      return;
    }
    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório");
      return;
    }
    if (createAccount && !formData.email.trim()) {
      toast.error("E-mail é obrigatório para criar conta de acesso");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (editingId) {
        result = await updateInstructor(editingId, formData);
      } else {
        result = await createInstructorWithAccount(formData, createAccount);
      }
      
      if (result.success) {
        toast.success(editingId ? "Dados do instrutor atualizados!" : "Novo instrutor cadastrado!");
        setShowModal(false);
        fetchInstructors();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, email: string) => {
    if (email === "admin@admin.com") {
      toast.error("Não é permitido excluir o acesso exclusivo do criador do sistema.");
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
        toast.success("Registro excluído!");
        fetchInstructors();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
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
    
    // Apply mask
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    
    setFormData({ ...formData, cpf: value });
  };

  const filteredInstructors = instructors.filter(i => 
    i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.cpf?.includes(searchTerm) ||
    i.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.war_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: instructors.length,
    active: instructors.filter(i => i.status === "Ativo").length,
    inactive: instructors.filter(i => i.status !== "Ativo").length,
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 p-2 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-zinc-900" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Instrutores</h1>
            <p className="text-zinc-500 text-sm">Gerencie a equipe de instrutores do programa</p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-6">
          <UserPlus className="w-5 h-5 mr-2" />
          Novo Instrutor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input 
          placeholder="Buscar por nome, CPF ou cargo..." 
          className="pl-12 bg-zinc-900/50 border-zinc-800 text-white h-12 rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
        <Table>
            <TableHeader className="bg-zinc-800/20 border-b border-zinc-800/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-zinc-400 font-bold py-4 px-6 text-[11px] uppercase tracking-wider">INSTRUTOR / NOME</TableHead>
                <TableHead className="text-zinc-400 font-bold py-4 text-[11px] uppercase tracking-wider">CPF</TableHead>
                <TableHead className="text-zinc-400 font-bold py-4 text-[11px] uppercase tracking-wider">IDADE / NASC.</TableHead>
                <TableHead className="text-zinc-400 font-bold py-4 text-[11px] uppercase tracking-wider">CARGOS NA FUNDAÇÃO</TableHead>
                <TableHead className="text-zinc-400 font-bold py-4 text-[11px] uppercase tracking-wider">STATUS</TableHead>
                <TableHead className="text-zinc-400 font-bold py-4 text-right px-6 text-[11px] uppercase tracking-wider">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredInstructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-zinc-500">
                  Nenhum instrutor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredInstructors.map((inst) => (
                  <TableRow key={inst.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-all duration-200 group">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                          <User className="w-6 h-6 text-emerald-500" />
                        </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold uppercase tracking-tight text-sm">{inst.full_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-emerald-500 uppercase font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">{inst.war_name || "---"}</span>
                              <span className="text-[10px] text-zinc-500 uppercase font-medium">| {inst.rank || "Instrutor"}</span>
                              {inst.profile_id && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-emerald-500/30 text-emerald-500 uppercase font-bold bg-emerald-500/5">Conta Ativa</Badge>
                              )}
                            </div>
                          </div>

                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300 font-mono text-sm">{formatCPF(inst.cpf)}</TableCell>
                    <TableCell className="text-zinc-300 font-medium">
                      {inst.birth_date ? (
                        <div className="flex flex-col">
                          <span>{calculateAge(inst.birth_date)} anos</span>
                          <span className="text-[10px] text-zinc-500 font-normal">
                            {new Date(inst.birth_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">Não informado</span>
                      )}
                    </TableCell>

                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {inst.roles && inst.roles.length > 0 ? (
                        inst.roles.map((role: string, idx: number) => (
                          <Badge key={idx} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none font-medium text-[10px]">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-500 border-none font-medium text-[10px]">
                          Sem cargo definido
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`font-bold text-xs uppercase tracking-wider ${inst.status === "Ativo" ? "text-emerald-500" : "text-red-500"}`}>
                      {inst.status || "Ativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-4">
                      <button onClick={() => handleOpenModal(inst)} className="text-zinc-500 hover:text-white transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                        <button onClick={() => handleDelete(inst.id, inst.email)} className="text-red-500 hover:text-red-400 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>

                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a1f2e] border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingId ? "Editar Instrutor" : "Novo Instrutor"}</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome Completo *</Label>
                  <Input 
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome de Guerra *</Label>
                  <Input 
                    value={formData.war_name}
                    onChange={(e) => setFormData({ ...formData, war_name: e.target.value })}
                    placeholder="Ex: Sgt Silva"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">E-mail (para acesso)</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="instrutor@exemplo.com"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              {!editingId && (
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="space-y-0.5">
                    <Label className="text-emerald-500 font-bold">Criar Conta de Acesso</Label>
                    <p className="text-[10px] text-emerald-500/70">Login: CPF ou E-mail | Senha: 5 últimos dígitos do CPF</p>
                  </div>
                  <Switch 
                    checked={createAccount}
                    onCheckedChange={setCreateAccount}
                  />
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">CPF *</Label>
                  <Input 
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-zinc-900 border-zinc-700 text-white font-mono"
                  />
                </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Data de Nascimento *</Label>
                <Input 
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-white [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Formação Acadêmica</Label>
                <Input 
                  value={formData.academic_formation}
                  onChange={(e) => setFormData({ ...formData, academic_formation: e.target.value })}
                  placeholder="Ex: Licenciatura em Educação Física"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Nº Título de Eleitor</Label>
                <Input 
                  value={formData.voter_id}
                  onChange={(e) => setFormData({ ...formData, voter_id: e.target.value })}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Posto/Graduação</Label>
                <Input 
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  placeholder="Ex: Sargento"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Especialidade</Label>
                <Input 
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Educação Física"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Status *</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Cargos na Fundação *</Label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {CARGOS.map((cargo) => (
                  <div key={cargo} className="flex items-center space-x-2">
                    <Checkbox 
                      id={cargo}
                      checked={formData.roles.includes(cargo)}
                      onCheckedChange={() => toggleRole(cargo)}
                      className="border-zinc-700 data-[state=checked]:bg-emerald-500"
                    />
                    <Label htmlFor={cargo} className="text-zinc-300 cursor-pointer text-sm">{cargo}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 border-zinc-700 text-zinc-400">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Confirmar Exclusão</DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">Esta ação não pode ser desfeita.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 border-zinc-700 text-zinc-400">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
