"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Key,
  Search,
  Loader2,
  UserCog,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  Copy,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { motion, AnimatePresence } from "framer-motion";

const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  admin: { label: "Admin", color: "text-rose-400", bgColor: "bg-rose-500/10 border-rose-500/20", icon: ShieldCheck },
  instrutor: { label: "Instrutor", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20", icon: ShieldCheck },
  instructor: { label: "Instrutor", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20", icon: ShieldCheck },
  aluno: { label: "Aluno", color: "text-sky-400", bgColor: "bg-sky-500/10 border-sky-500/20", icon: GraduationCap },
  responsavel: { label: "Responsável", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20", icon: Users },
  user: { label: "Usuário", color: "text-zinc-400", bgColor: "bg-zinc-500/10 border-zinc-500/20", icon: Users },
};

const ITEMS_PER_PAGE = 15;

export default function GerenciarContasPage() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAccountData, setNewAccountData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "responsavel",
    cpf: "",
    studentId: ""
  });

  const [editAccountData, setEditAccountData] = useState({
    userId: "",
    fullName: "",
    role: "",
    cpf: "",
    studentId: ""
  });

  const [studentsList, setStudentsList] = useState<any[]>([]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const result = await res.json();
      if (result.success) {
        setStudentsList(result.students);
      }
    } catch (error) {
      console.error("Erro ao buscar estudantes", error);
    }
  };

  useEffect(() => {
    if (showCreateDialog || showEditDialog) {
      fetchStudents();
    }
  }, [showCreateDialog, showEditDialog]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const result = await res.json();
      if (result.success) {
        setAccounts(result.accounts);
      } else {
        toast.error("Erro ao carregar contas: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao carregar contas");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || "")) {
      fetchAccounts();
    }
  }, [profile]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch =
        acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.cpf?.includes(searchTerm);

      const matchesRole = filterRole === "all" ||
        acc.role === filterRole ||
        (filterRole === "instrutor" && acc.role === "instructor");

      return matchesSearch && matchesRole;
    });
  }, [accounts, searchTerm, filterRole]);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: accounts.length,
    alunos: accounts.filter(a => a.role === "aluno").length,
    responsaveis: accounts.filter(a => a.role === "responsavel").length,
    instrutores: accounts.filter(a => a.role === "instrutor" || a.role === "instructor").length,
    admins: accounts.filter(a => a.role === "admin").length,
  }), [accounts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const handleResetPassword = async () => {
    if (!selectedAccount || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", userId: selectedAccount.id, newPassword })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Senha redefinida com sucesso!");
        setShowResetDialog(false);
        setNewPassword("");
        setSelectedAccount(null);
      } else {
        toast.error("Erro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao redefinir senha");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAccount", userId: selectedAccount.id })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Conta excluída com sucesso!");
        setShowDeleteDialog(false);
        setSelectedAccount(null);
        fetchAccounts();
      } else {
        toast.error("Erro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao excluir conta");
    }
    setSaving(false);
  };

  const handleCreateAccount = async () => {
    if (!newAccountData.email || !newAccountData.password || !newAccountData.fullName) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createAccount", ...newAccountData })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Conta criada com sucesso!");
        setShowCreateDialog(false);
        setNewAccountData({ email: "", password: "", fullName: "", role: "responsavel", cpf: "", studentId: "" });
        fetchAccounts();
      } else {
        toast.error("Erro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao criar conta");
    }
    setSaving(false);
  };

  const handleUpdateAccount = async () => {
    if (!editAccountData.userId || !editAccountData.fullName) {
      toast.error("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateAccount", ...editAccountData })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Conta atualizada com sucesso!");
        setShowEditDialog(false);
        fetchAccounts();
      } else {
        toast.error("Erro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao atualizar conta");
    }
    setSaving(false);
  };

  const handleSyncAccounts = async () => {
    setLoading(true);
    toast.info("Iniciando sincronização de contas...");
    try {
      const res = await fetch("/api/accounts/sync", {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        const { created, already_exists, errors } = result.results;
        toast.success(`Sincronização concluída! Criados: ${created}, Existentes: ${already_exists}`);

        if (created > 0) {
          fetchAccounts();
        }

        if (errors.length > 0) {
          console.error("Erros na sincronização:", errors);
          toast.warning(`${errors.length} erros ocorreram. Verifique o console.`);
        }
      } else {
        toast.error("Erro na sincronização: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao conectar com servidor");
      console.error(error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  if (!["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || "")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
        <p className="text-zinc-500 text-sm max-w-md">
          Esta página é exclusiva para a administração do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Key className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gerenciar Contas</h1>
            <p className="text-zinc-500 text-sm">
              {stats.total} contas registradas no sistema
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncAccounts}
            disabled={loading}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold h-11 px-5 rounded-xl border border-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11 px-5 rounded-xl shadow-lg shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setFilterRole("all")}>
          <Card className={`bg-zinc-900/50 border-zinc-800 p-4 transition-all ${filterRole === "all" ? "ring-2 ring-emerald-500/50" : "hover:border-zinc-700"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-zinc-500 font-medium">Total</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setFilterRole("aluno")}>
          <Card className={`bg-zinc-900/50 border-zinc-800 p-4 transition-all ${filterRole === "aluno" ? "ring-2 ring-sky-500/50" : "hover:border-zinc-700"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.alunos}</p>
                <p className="text-xs text-zinc-500 font-medium">Alunos</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setFilterRole("responsavel")}>
          <Card className={`bg-zinc-900/50 border-zinc-800 p-4 transition-all ${filterRole === "responsavel" ? "ring-2 ring-emerald-500/50" : "hover:border-zinc-700"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.responsaveis}</p>
                <p className="text-xs text-zinc-500 font-medium">Responsáveis</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setFilterRole("instrutor")}>
          <Card className={`bg-zinc-900/50 border-zinc-800 p-4 transition-all ${filterRole === "instrutor" ? "ring-2 ring-amber-500/50" : "hover:border-zinc-700"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.instrutores}</p>
                <p className="text-xs text-zinc-500 font-medium">Instrutores</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="pl-11 bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl focus:ring-emerald-500/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full md:w-48 bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="aluno">Alunos</SelectItem>
            <SelectItem value="responsavel">Responsáveis</SelectItem>
            <SelectItem value="instrutor">Instrutores</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchAccounts}
          className="border-zinc-800 text-zinc-400 hover:text-white h-11 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="bg-zinc-900/30 border-zinc-800 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-zinc-500 text-sm">Carregando contas...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium mb-1">Nenhuma conta encontrada</p>
              <p className="text-zinc-600 text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500 font-semibold py-4 px-6">Usuário</TableHead>
                      <TableHead className="text-zinc-500 font-semibold py-4">E-mail</TableHead>
                      <TableHead className="text-zinc-500 font-semibold py-4">Tipo</TableHead>
                      <TableHead className="text-zinc-500 font-semibold py-4">Último Acesso</TableHead>
                      <TableHead className="text-zinc-500 font-semibold py-4 text-right px-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {paginatedAccounts.map((acc, index) => {
                        const roleInfo = ROLE_CONFIG[acc.role] || ROLE_CONFIG.user;
                        const RoleIcon = roleInfo.icon;
                        return (
                          <motion.tr
                            key={acc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-zinc-800/50 hover:bg-zinc-800/20 group"
                          >
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${roleInfo.bgColor} flex items-center justify-center border`}>
                                  <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-sm">{acc.full_name || "Sem nome"}</p>
                                  {acc.cpf && <p className="text-xs text-zinc-600 font-mono">CPF: {acc.cpf}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-300 text-sm font-mono">{acc.email}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white"
                                  onClick={() => copyToClipboard(acc.email)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge className={`${roleInfo.bgColor} ${roleInfo.color} border font-medium text-xs px-2`}>
                                {roleInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-zinc-400 text-sm">
                              {acc.last_sign_in
                                ? format(new Date(acc.last_sign_in), "dd/MM/yy HH:mm", { locale: ptBR })
                                : <span className="text-zinc-600">Nunca</span>}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => { setSelectedAccount(acc); setShowDetailsDialog(true); }}
                                  title="Ver detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 hover:text-sky-400 hover:bg-sky-500/10"
                                  onClick={() => {
                                    setSelectedAccount(acc);
                                    setEditAccountData({
                                      userId: acc.id,
                                      fullName: acc.full_name,
                                      role: acc.role,
                                      cpf: acc.cpf || "",
                                      studentId: acc.student_id || "none"
                                    });
                                    setShowEditDialog(true);
                                  }}
                                  title="Editar conta"
                                >
                                  <UserCog className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
                                  onClick={() => { setSelectedAccount(acc); setShowResetDialog(true); }}
                                  title="Redefinir senha"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                {acc.email !== "admin@admin.com" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                                    onClick={() => { setSelectedAccount(acc); setShowDeleteDialog(true); }}
                                    title="Excluir conta"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                  <p className="text-sm text-zinc-500">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)} de {filteredAccounts.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-zinc-400 px-3">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserCog className="w-5 h-5 text-emerald-500" />
              Detalhes da Conta
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                <div className={`w-14 h-14 rounded-xl ${ROLE_CONFIG[selectedAccount.role]?.bgColor || 'bg-zinc-700'} flex items-center justify-center border`}>
                  {(() => {
                    const Icon = ROLE_CONFIG[selectedAccount.role]?.icon || Users;
                    return <Icon className={`w-7 h-7 ${ROLE_CONFIG[selectedAccount.role]?.color || 'text-zinc-400'}`} />;
                  })()}
                </div>
                <div>
                  <p className="font-bold text-white">{selectedAccount.full_name || "Sem nome"}</p>
                  <Badge className={`${ROLE_CONFIG[selectedAccount.role]?.bgColor || 'bg-zinc-700'} ${ROLE_CONFIG[selectedAccount.role]?.color || 'text-zinc-400'} border mt-1`}>
                    {ROLE_CONFIG[selectedAccount.role]?.label || selectedAccount.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-500 text-sm">E-mail</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">{selectedAccount.email}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedAccount.email)}>
                      <Copy className="w-3 h-3 text-zinc-500" />
                    </Button>
                  </div>
                </div>
                {selectedAccount.cpf && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                    <span className="text-zinc-500 text-sm">CPF</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">{selectedAccount.cpf}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedAccount.cpf)}>
                        <Copy className="w-3 h-3 text-zinc-500" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-500 text-sm">Criado em</span>
                  <span className="text-white text-sm">
                    {selectedAccount.created_at
                      ? format(new Date(selectedAccount.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "---"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-500 text-sm">Último acesso</span>
                  <span className="text-white text-sm">
                    {selectedAccount.last_sign_in
                      ? format(new Date(selectedAccount.last_sign_in), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "Nunca"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Defina uma nova senha para: <span className="text-white font-medium">{selectedAccount?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="bg-zinc-800 border-zinc-700 text-white pr-10 rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-400 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={saving || !newPassword}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redefinir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Excluir Conta</DialogTitle>
                <DialogDescription className="text-zinc-500 text-sm">Esta ação não pode ser desfeita.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <p className="text-zinc-300 text-sm py-2">
            Tem certeza que deseja excluir a conta de <span className="text-white font-semibold">{selectedAccount?.email}</span>?
          </p>
          <DialogFooter className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 border-zinc-700 text-zinc-400 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={saving}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-500" />
              Nova Conta de Acesso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Tipo de Conta *</Label>
              <Select
                value={newAccountData.role}
                onValueChange={(val) => setNewAccountData({ ...newAccountData, role: val, fullName: "", cpf: "", studentId: "" })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="responsavel">Responsável</SelectItem>
                  <SelectItem value="instrutor">Instrutor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newAccountData.role === 'aluno' || newAccountData.role === 'responsavel') && (
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 space-y-3">
                <Label className="text-emerald-400 text-xs uppercase font-bold tracking-wider">Vincular a Cadastro Existente</Label>

                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Selecione o Aluno</Label>
                  <Select
                    value={newAccountData.studentId}
                    onValueChange={(val) => {
                      const selectedStudent = studentsList.find(s => s.id === val);
                      if (selectedStudent && newAccountData.role === 'aluno') {
                        setNewAccountData({
                          ...newAccountData,
                          studentId: val,
                          fullName: selectedStudent.nome_completo
                        });
                      } else {
                        setNewAccountData({ ...newAccountData, studentId: val });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm">
                      <SelectValue placeholder="Buscar aluno..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      {studentsList.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newAccountData.role === 'responsavel' && newAccountData.studentId && (
                  <div className="space-y-1">
                    <Label className="text-zinc-400 text-xs">Quem é este responsável?</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {(() => {
                        const st = studentsList.find(s => s.id === newAccountData.studentId);
                        if (!st) return null;
                        return (
                          <>
                            {st.guardian1_name && (
                              <Button
                                variant="outline"
                                className="justify-start text-left h-auto py-2 px-3 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700"
                                onClick={() => setNewAccountData({
                                  ...newAccountData,
                                  fullName: st.guardian1_name,
                                  cpf: st.guardian1_cpf || ""
                                })}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{st.guardian1_name}</span>
                                  <span className="text-xs text-zinc-500">Mãe / Resp. 1</span>
                                </div>
                              </Button>
                            )}
                            {st.guardian2_name && (
                              <Button
                                variant="outline"
                                className="justify-start text-left h-auto py-2 px-3 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700"
                                onClick={() => setNewAccountData({
                                  ...newAccountData,
                                  fullName: st.guardian2_name,
                                  cpf: st.guardian2_cpf || ""
                                })}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{st.guardian2_name}</span>
                                  <span className="text-xs text-zinc-500">Pai / Resp. 2</span>
                                </div>
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Nome Completo *</Label>
              <Input
                value={newAccountData.fullName}
                onChange={(e) => setNewAccountData({ ...newAccountData, fullName: e.target.value })}
                placeholder="Nome do usuário"
                className="bg-zinc-800 border-zinc-700 text-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">E-mail *</Label>
              <Input
                type="email"
                value={newAccountData.email}
                onChange={(e) => setNewAccountData({ ...newAccountData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-zinc-800 border-zinc-700 text-white rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Senha *</Label>
              <Input
                type="text"
                value={newAccountData.password}
                onChange={(e) => setNewAccountData({ ...newAccountData, password: e.target.value })}
                placeholder="Senha de acesso"
                className="bg-zinc-800 border-zinc-700 text-white rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">CPF (opcional)</Label>
              <Input
                value={newAccountData.cpf}
                onChange={(e) => setNewAccountData({ ...newAccountData, cpf: e.target.value.replace(/\D/g, "") })}
                placeholder="00000000000"
                maxLength={11}
                className="bg-zinc-800 border-zinc-700 text-white font-mono rounded-xl"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-400 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAccount}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-sky-500" />
              Editar Conta
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Atualizando dados de: <span className="text-white font-medium">{selectedAccount?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Nome Completo</Label>
              <Input
                value={editAccountData.fullName}
                onChange={(e) => setEditAccountData({ ...editAccountData, fullName: e.target.value })}
                placeholder="Nome do usuário"
                className="bg-zinc-800 border-zinc-700 text-white rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Tipo de Conta</Label>
              <Select
                value={editAccountData.role}
                onValueChange={(val) => setEditAccountData({ ...editAccountData, role: val })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="responsavel">Responsável</SelectItem>
                  <SelectItem value="instrutor">Instrutor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">Vincular a Aluno</Label>
              <Select
                value={editAccountData.studentId}
                onValueChange={(val) => setEditAccountData({ ...editAccountData, studentId: val })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-xl">
                  <SelectValue placeholder="Selecione um aluno..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                  <SelectItem value="none">Nenhum / Desvincular</SelectItem>
                  {studentsList.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400 text-sm">CPF</Label>
              <Input
                value={editAccountData.cpf}
                onChange={(e) => setEditAccountData({ ...editAccountData, cpf: e.target.value.replace(/\D/g, "") })}
                placeholder="00000000000"
                maxLength={11}
                className="bg-zinc-800 border-zinc-700 text-white font-mono rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1 border-zinc-700 text-zinc-400 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateAccount}
                disabled={saving}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
