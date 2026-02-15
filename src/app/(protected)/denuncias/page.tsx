"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
  Filter,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DenunciasPage() {
  const { profile } = useAuth();
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    pendentes: 0,
    lidas: 0,
    analise: 0,
    resolvidas: 0,
  });

  const fetchData = async () => {
    setLoading(true);
        let query = supabase
          .from("denuncias")
          .select("*, profiles(full_name, role, student_id)")
          .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;

    if (data) {
      setDenuncias(data);
      
      const { data: allData } = await supabase.from("denuncias").select("status");
      if (allData) {
        setStats({
          pendentes: allData.filter(d => d.status === "pendente").length,
          lidas: allData.filter(d => d.status === "lido").length,
          analise: allData.filter(d => d.status === "analise").length,
          resolvidas: allData.filter(d => d.status === "resolvido").length,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "lido" && !denuncias.find(d => d.id === id)?.lido_em) {
        updateData.lido_em = new Date().toISOString();
        updateData.lido_por = profile?.id;
      }
      
    const { error } = await supabase.from("denuncias").update(updateData).eq("id", id);
    if (error) throw error;
    toast.success("Status atualizado!");
    fetchData();
  } catch (error: any) {
    toast.error(error.message || "Erro ao atualizar status");
  }
};

const handleDelete = async (id: string) => {
  try {
    const { error } = await supabase.from("denuncias").delete().eq("id", id);
    if (error) throw error;
    toast.success("Denúncia excluída com sucesso!");
    fetchData();
  } catch (error: any) {
    toast.error(error.message || "Erro ao excluir denúncia");
  }
};


  const filteredDenuncias = denuncias.filter(d => {
    const reporterName = d.profiles?.full_name || "";
    const title = d.title || "";
    const content = d.content || "";
    return reporterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           content.toLowerCase().includes(searchTerm.toLowerCase());
  });

    const getStatusBadge = (status: string) => {
      const styles: Record<string, string> = {
        pendente: "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse",
        lido: "bg-blue-500/10 text-blue-500",
        analise: "bg-purple-500/10 text-purple-500",
        resolvido: "bg-emerald-500/10 text-emerald-500",
      };
      return styles[status] || "bg-zinc-700 text-zinc-400";
    };

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 relative">
            <Shield className="w-8 h-8 text-red-500" />
            {stats.pendentes > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Denúncias</h1>
              {stats.pendentes > 0 && (
                <Badge className="bg-red-500 text-white border-none animate-pulse text-[10px] font-black uppercase">
                  {stats.pendentes} Pendente(s)
                </Badge>
              )}
            </div>
            <p className="text-zinc-500">Canal de Relatos Confidenciais</p>
          </div>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-red-500/20 shadow-lg shadow-red-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <p className="text-3xl font-bold text-white">{stats.pendentes}</p>
              <p className="text-red-500 text-sm font-bold uppercase tracking-tight">Pendente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <Eye className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-3xl font-bold text-white">{stats.lidas}</p>
              <p className="text-zinc-500 text-sm">Lido</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-3xl font-bold text-white">{stats.analise}</p>
              <p className="text-zinc-500 text-sm">Em Análise</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-3xl font-bold text-white">{stats.resolvidas}</p>
              <p className="text-zinc-500 text-sm">Resolvido</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar por aluno ou descrição..." 
            className="pl-12 bg-zinc-900/50 border-zinc-800 text-white h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-zinc-900/50 border-zinc-800 text-white h-12">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="lido">Lido</SelectItem>
            <SelectItem value="analise">Em Análise</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredDenuncias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-500">Nenhuma denúncia encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredDenuncias.map((d) => (
              <div key={d.id} className="p-6 hover:bg-zinc-800/20 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("font-semibold uppercase text-xs", getStatusBadge(d.status))}>
                          {d.status === "analise" ? "Em Análise" : d.status}
                        </Badge>
                        <span className="text-zinc-500 text-sm">
                          {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <h3 className="text-white font-bold text-lg">{d.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm">Relatado por:</span>
                          <span className="text-white font-bold uppercase">
                            {d.profiles?.full_name || "Não identificado"}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            {d.profiles?.role || "Usuário"}
                          </Badge>
                        </div>
                      </div>
  
                      <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                        <p className="text-zinc-300 text-sm whitespace-pre-wrap">{d.content}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm pt-2">
                        {d.lido_em && (
                          <span className="text-zinc-500 italic">
                            Lido em: <span className="text-zinc-400">
                              {format(new Date(d.lido_em), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </span>
                        )}
                      </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <Select 
                      value={d.status} 
                      onValueChange={(val) => handleUpdateStatus(d.id, val)}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="lido">Marcar como Lido</SelectItem>
                        <SelectItem value="analise">Em Análise</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10 gap-2 h-9">
                          <Trash2 className="w-4 h-4" />
                          Excluir Registro
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Denúncia</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Tem certeza que deseja excluir esta denúncia? Esta ação não pode ser desfeita e o registro será removido permanentemente do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(d.id)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Confirmar Exclusão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
