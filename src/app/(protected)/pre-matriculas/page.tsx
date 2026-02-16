"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  MessageCircle,
  Search,
  UserCheck,
  Calendar,
  Trash2,
  MoreVertical,
  Loader2,
  FileText,
  Eye,
  Edit2,
  Printer,
  ChevronDown,
  XCircle,
  Sparkles,
  ArrowUpRight,
  ClipboardCheck,
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn, openExternalLink } from "@/lib/utils";
import { EnrollmentDetailsModal } from "@/components/enrollment-details-modal";
import { motion, AnimatePresence } from "framer-motion";

export default function PreEnrollmentsPage() {
  const { simulatedRole } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    efetivadas: 0,
    canceladas: 0
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    const { data: configData } = await supabase.from("configuracoes_sistema").select("*").single();
    if (configData) setConfig(configData);

    const showTestRecords = !!simulatedRole;
    let query = supabase.from("pre_matriculas").select("*");
    if (!showTestRecords) query = query.eq("is_test", false);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query.order("created_at", { ascending: true });

    if (data) {
      setEnrollments(data);
      const total = data.length;
      const pendentes = data.filter(e => e.status === "pendente").length;
      const efetivadas = data.filter(e => e.status === "efetivada").length;
      const canceladas = data.filter(e => e.status === "cancelada").length;
      setStats({ total, pendentes, efetivadas, canceladas });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmar cancelamento desta pré-matrícula?")) return;
    try {
      const { error } = await supabase
        .from("pre_matriculas")
        .update({ status: "cancelada", chave_acesso: null })
        .eq("id", id);
      if (error) throw error;
      toast.success("Cancelada com sucesso!");
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("AVISO: Exclusão Permanente. Deseja prosseguir?")) return;
    try {
      const { error } = await supabase.from("pre_matriculas").delete().eq("id", id);
      if (error) throw error;
      toast.success("Removida permanentemente!");
      fetchEnrollments();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const filteredEnrollments = enrollments.filter(e =>
    e.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.chave_acesso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.responsavel_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate: string) => {
    if (!birthDate || birthDate === "0000-00-00") return null;
    const today = new Date();
    const birth = new Date(birthDate + "T00:00:00");
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const sendWhatsAppMessage = (e: any) => {
    if (!config) return toast.error("Configurações pendentes.");
    const dateParts = e.data_agendamento.split("-");
    const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
    const dateStr = format(localDate, "dd/MM/yyyy");
    const dayConfig = config.datas_especificas?.find((d: any) => d.date === e.data_agendamento);
    const timeStr = dayConfig ? `${dayConfig.startTime} às ${dayConfig.endTime}` : "08:00 às 17:00";

    const message = `🚀 *Matrícula Agendada - PFM* 🚀\n\n👋 Olá *${e.responsavel_nome}*!\nSua data de entrega: *${dateStr}* às *${timeStr}*.\nLocal: Rua Arnaldo Lacerda, 1496.\n\nDocumentos: RG, CPF, Certidão e Comprovante.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = e.responsavel_whatsapp.replace(/\D/g, "").padStart(13, "55");
    openExternalLink(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`);
  };

  return (
    <div className="space-y-12 pb-10">
      <motion.div {...fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Operação de Matrículas</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
            PRÉ- <span className="text-amber-500">MATRÍCULAS</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl">
            Painel de controle para triagem, agendamento e efetivação de novos membros do programa.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Registrado", value: stats.total, icon: FileText, color: "text-zinc-400", bg: "bg-white/5" },
          { label: "Pendentes", value: stats.pendentes, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Efetivadas", value: stats.efetivadas, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Canceladas", value: stats.canceladas, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <TrendingUp className="w-4 h-4 text-zinc-800" />
            </div>
            <p className="text-4xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Filtrar por nome, ID ou responsável..."
            className="pl-14 bg-zinc-900/40 backdrop-blur-xl border-white/5 text-white h-16 rounded-[2rem] focus:ring-amber-500/20 text-lg font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[240px] bg-zinc-900/40 backdrop-blur-xl border-white/5 text-white h-16 rounded-[2rem] font-bold uppercase tracking-widest text-[10px] px-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
            <SelectItem value="all" className="rounded-xl focus:bg-amber-500">Todos</SelectItem>
            <SelectItem value="pendente" className="rounded-xl focus:bg-amber-500">Pendente</SelectItem>
            <SelectItem value="efetivada" className="rounded-xl focus:bg-emerald-600">Efetivada</SelectItem>
            <SelectItem value="cancelada" className="rounded-xl focus:bg-red-600">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl"
      >
        <div className="overflow-x-auto no-scrollbar">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8 px-10">MATRÍCULA / ID</TableHead>
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">CANDIDATO</TableHead>
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">RESPONSÁVEL</TableHead>
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">AGENDAMENTO</TableHead>
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8">STATUS</TableHead>
                <TableHead className="text-zinc-500 font-black text-[10px] uppercase tracking-widest py-8 text-right px-10">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32 text-zinc-500 font-black uppercase tracking-widest">
                    Vazio. Aguardando novos ingressos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map((e) => (
                  <TableRow key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group">
                    <TableCell className="py-8 px-10">
                      <span className={cn(
                        "font-mono text-sm tracking-widest",
                        e.matricula_pfm ? "text-emerald-500 font-black" : "text-zinc-500"
                      )}>
                        {e.matricula_pfm || e.chave_acesso || "---"}
                      </span>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="flex flex-col">
                        <span className="text-white font-black uppercase italic tracking-tighter text-lg">{e.nome_completo}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Guerra: {e.nome_guerra || "---"} • {calculateAge(e.data_nascimento)} anos</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      <span className="text-zinc-400 font-black uppercase text-xs tracking-tight">{e.responsavel_nome}</span>
                    </TableCell>
                    <TableCell className="py-8">
                      <div className="flex items-center gap-2 text-zinc-300 font-bold">
                        <Calendar className="w-4 h-4 text-amber-500 opacity-50" />
                        {e.data_agendamento ? format(new Date(e.data_agendamento + "T12:00:00"), "dd/MM/yy") : "---"}
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest",
                        e.status === "efetivada" && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                        e.status === "pendente" && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
                        e.status === "cancelada" && "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-8 px-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-12 w-12 p-0 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all">
                            <MoreVertical className="h-6 w-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-zinc-300 rounded-3xl p-3 w-56 shadow-2xl">
                          <DropdownMenuItem onClick={() => sendWhatsAppMessage(e)} className="rounded-2xl py-3 px-4 hover:bg-emerald-500/10 text-emerald-500 focus:text-emerald-400 cursor-pointer">
                            <MessageCircle className="w-5 h-5 mr-3" />
                            <span className="font-black uppercase tracking-widest text-[10px]">WhatsApp</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedEnrollment(e);
                            setIsDetailsOpen(true);
                          }} className="rounded-2xl py-3 px-4 hover:bg-white/5 cursor-pointer">
                            <Eye className="w-5 h-5 mr-3" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 hover:bg-white/5 cursor-pointer">
                            <Link href={`/pre-matriculas/efetivar/${e.id}`}>
                              <Edit2 className="w-5 h-5 mr-3" />
                              <span className="font-black uppercase tracking-widest text-[10px]">Efetivar</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 hover:bg-white/5 cursor-pointer">
                            <Link href={`/pre-matriculas/imprimir/${e.id}`}>
                              <Printer className="w-5 h-5 mr-3" />
                              <span className="font-black uppercase tracking-widest text-[10px]">Imprimir</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(e.id)} className="rounded-2xl py-3 px-4 hover:bg-red-500/10 text-red-500 focus:text-red-400 cursor-pointer">
                            <XCircle className="w-5 h-5 mr-3" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Cancelar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(e.id)} className="rounded-2xl py-3 px-4 hover:bg-red-500/10 text-red-500 focus:text-red-400 cursor-pointer">
                            <Trash2 className="w-5 h-5 mr-3" />
                            <span className="font-black uppercase tracking-widest text-[10px]">Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <EnrollmentDetailsModal
        enrollment={selectedEnrollment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
