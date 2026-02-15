"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
  Loader2,
  FileText,
  Eye,
  Edit2,
    Printer,
    ChevronDown,
    XCircle
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

    const fetchEnrollments = async () => {
      setLoading(true);
      
      const { data: configData } = await supabase.from("configuracoes_sistema").select("*").single();
      if (configData) setConfig(configData);

      const showTestRecords = !!simulatedRole;
      let query = supabase.from("pre_matriculas").select("*");
      
      if (!showTestRecords) {
        query = query.eq("is_test", false);
      }
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (data) {
      setEnrollments(data);
      
      // Calculate stats based on all data (if possible) or just the current fetch
      // For real apps, we'd do a separate count query or fetch all statuses
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
      if (!confirm("Tem certeza que deseja marcar esta pré-matrícula como cancelada?")) return;

      try {
        const { error } = await supabase
          .from("pre_matriculas")
          .update({ status: "cancelada", chave_acesso: null })
          .eq("id", id);

        if (error) throw error;
        toast.success("Pré-matrícula marcada como cancelada!");
        fetchEnrollments();
      } catch (error: any) {
        toast.error(error.message || "Erro ao cancelar");
      }
    };

    const handleDelete = async (id: string) => {
      if (!confirm("AVISO: Esta ação é PERMANENTE e excluirá todos os dados desta pré-matrícula do banco de dados. Deseja continuar?")) return;

      try {
        const { error } = await supabase
          .from("pre_matriculas")
          .delete()
          .eq("id", id);

        if (error) throw error;
        toast.success("Pré-matrícula excluída permanentemente!");
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
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const sendWhatsAppMessage = (e: any) => {
      if (!config) {
        toast.error("Configurações do sistema não carregadas.");
        return;
      }

      // Corrigir parsing da data para evitar fuso horário
      const dateParts = e.data_agendamento.split("-");
      const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0);
      const dateStr = format(localDate, "dd/MM/yyyy");
      
      const dayConfig = config.datas_especificas?.find((d: any) => d.date === e.data_agendamento);
      const timeStr = dayConfig ? `${dayConfig.startTime} às ${dayConfig.endTime}` : "08:00 às 17:00";
      
      const sortedDates = config.datas_especificas
        ?.map((d: any) => d.date)
        .filter((d: string) => d > e.data_agendamento)
        .sort();
      
      const nextDateStr = sortedDates && sortedDates.length > 0 
        ? format(new Date(sortedDates[0] + "T12:00:00"), "dd/MM/yyyy")
        : "data a confirmar";

      const message = `🚀 *Matrícula Agendada* 🚀

👋 Olá *${e.responsavel_nome}* do aluno(a) *${e.nome_completo}*! 👦👧

Sua matrícula para o *Programa Força Mirim ${config.ano_letivo || new Date().getFullYear()}* está quase completa! Por favor, atente-se às informações abaixo:

📅 *Data de entrega*: ${dateStr}
⏰ *Horário*: *${timeStr}*
📍 *Local*: Q.23A, Rua Arnaldo Lacerda, Nº 1496 - Parque Piauí, Teresina-PI
🔗 *Localização*: https://bit.ly/localizacaofpr

📝 *Documentos Aluno(a)*:
- Certidão de Nascimento (cópia)
- 2 fotos 3x4

👤 *Documentos Responsável*:
- RG e CPF (cópias)
- Título de Eleitor (cópia)
- Comprovante de Residência (cópia)

💰 *Doação*: *R$40,00* (em espécie) no ato da matrícula.

Caso não possa comparecer, sua próxima data disponível é ${nextDateStr}.`;

      const encodedMessage = encodeURIComponent(message);
      let whatsappNumber = e.responsavel_whatsapp.replace(/\D/g, "");
      
      // Garantir código do país
      if (whatsappNumber.length === 11) {
        whatsappNumber = "55" + whatsappNumber;
      }
      
      const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      openExternalLink(url);
    };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-amber-400 p-2 rounded-lg">
          <FileText className="w-6 h-6 text-zinc-900" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pré-Matrículas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="pt-6">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-yellow-500/20">
          <CardContent className="pt-6">
            <p className="text-yellow-500 text-xs font-medium uppercase tracking-wider mb-2">Pendentes</p>
            <p className="text-3xl font-bold text-white">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-emerald-500/20">
          <CardContent className="pt-6">
            <p className="text-emerald-500 text-xs font-medium uppercase tracking-wider mb-2">Efetivadas</p>
            <p className="text-3xl font-bold text-white">{stats.efetivadas}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500 text-xs font-medium uppercase tracking-wider mb-2">Canceladas</p>
            <p className="text-3xl font-bold text-white">{stats.canceladas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar por nome, número ou responsável..." 
            className="pl-12 bg-zinc-900/50 border-zinc-800 text-white h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-zinc-900/50 border-zinc-800 text-white h-12">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="efetivada">Efetivada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent border-b border-zinc-800/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-zinc-500 font-medium py-4">Matrícula / ID</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4">Nome</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4 hidden md:table-cell">Idade</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4 hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4 hidden sm:table-cell">Agendamento</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4">Status</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4 hidden xl:table-cell">Nome Guerra</TableHead>
                <TableHead className="text-zinc-500 font-medium py-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20 text-zinc-500">
                    Nenhuma pré-matrícula encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                  filteredEnrollments.map((e) => (
                    <TableRow key={e.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <TableCell className="font-medium text-zinc-300 py-4 whitespace-nowrap">
                        {e.matricula_pfm ? (
                          <span className="text-emerald-500 font-bold">{e.matricula_pfm}</span>
                        ) : (
                          e.chave_acesso || "---"
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-white py-4 uppercase min-w-[200px]">{e.nome_completo}</TableCell>

                      <TableCell className="text-zinc-400 py-4 hidden md:table-cell whitespace-nowrap">{calculateAge(e.data_nascimento)} anos</TableCell>
                    <TableCell className="text-zinc-400 py-4 uppercase hidden lg:table-cell max-w-[200px] truncate">{e.responsavel_nome}</TableCell>
                      <TableCell className="text-zinc-400 py-4 hidden sm:table-cell whitespace-nowrap">
                        {e.data_agendamento ? format(new Date(e.data_agendamento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "---"}
                      </TableCell>
                    <TableCell className="py-4 whitespace-nowrap">
                      <Badge className={cn(
                        "font-semibold px-3 py-1 rounded-md text-[10px] uppercase",
                        e.status === "efetivada" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                        e.status === "pendente" && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
                        e.status === "cancelada" && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-white py-4 uppercase hidden xl:table-cell whitespace-nowrap">{e.nome_guerra || "---"}</TableCell>
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800 text-zinc-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                          <DropdownMenuItem onClick={() => sendWhatsAppMessage(e)} className="hover:bg-zinc-800 cursor-pointer text-emerald-500 focus:text-emerald-400 focus:bg-emerald-500/10">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedEnrollment(e);
                            setIsDetailsOpen(true);
                          }} className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white">
                            <Link href={`/pre-matriculas/efetivar/${e.id}`}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar / Efetivar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white">
                            <Link href={`/pre-matriculas/imprimir/${e.id}`}>
                              <Printer className="w-4 h-4 mr-2" />
                              Imprimir Ficha
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancel(e.id)} className="hover:bg-zinc-800 cursor-pointer text-orange-500 focus:text-orange-400 focus:bg-orange-500/10">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(e.id)} className="hover:bg-zinc-800 cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-500/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
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
      </div>

      <EnrollmentDetailsModal 
        enrollment={selectedEnrollment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
