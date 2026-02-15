"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Shirt, 
  Search, 
  UserPlus, 
  Trash2, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
    Plus,
    ArrowRight,
    Package,
    History,
    X,
    Pencil
  } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  blood_type: string;
  turma: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não informado"];

interface FardamentoItem {
  id: string;
  student: Student;
  items: {
    name: string;
    size: string;
    quantity: number;
  }[];
  observacoes: string;
}

export default function PedidoFardamentoPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [pedidoItems, setPedidoItems] = useState<FardamentoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [newItem, setNewItem] = useState({ name: "Camisa", size: "P", quantity: 1 });
  const [currentStudentItems, setCurrentStudentItems] = useState<{ name: string; size: string; quantity: number }[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBloodType, setSelectedBloodType] = useState<string>("");

  const itemTotals = useMemo(() => {
    const totals: Record<string, Record<string, number>> = {};
    pedidoItems.forEach(entry => {
      entry.items.forEach(item => {
        if (!totals[item.name]) totals[item.name] = {};
        if (!totals[item.name][item.size]) totals[item.name][item.size] = 0;
        totals[item.name][item.size] += Number(item.quantity) || 1;
      });
    });
    return totals;
  }, [pedidoItems]);

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStudents(),
      fetchPedidoItems()
    ]);
    setLoading(false);
  };

    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setIsAdmin(["admin", "coord_geral", "coord_nucleo"].includes(profile?.role || ""));
      }
    };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, matricula_pfm, blood_type, turma")
        .eq("status", "ativo");

      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => {
        const parseMatricula = (m: string) => {
          const match = m?.match(/(\d+)\/(\d+)/);
          if (!match) return { num: 999, year: 99 };
          return { num: parseInt(match[1]), year: parseInt(match[2]) };
        };
        const matA = parseMatricula(a.matricula_pfm);
        const matB = parseMatricula(b.matricula_pfm);
        if (matA.year !== matB.year) return matA.year - matB.year;
        return matA.num - matB.num;
      });
      
      setStudents(sortedData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar alunos.");
    }
  };

  const fetchPedidoItems = async () => {
    try {
      const { data, error } = await supabase
        .from("fardamento_pedidos")
        .select(`
          id,
          items,
          observacoes,
          student:students (
            id,
            nome_completo,
            nome_guerra,
            matricula_pfm,
            blood_type,
            turma
          )
        `);

      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        items: item.items,
        observacoes: item.observacoes,
        student: item.student
      }));

      setPedidoItems(formattedData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pedidos.");
    }
  };

  // All students - no longer filtering by blood type
  const allStudents = useMemo(() => {
    return students;
  }, [students]);

  // Count students with blood type
  const studentsWithBloodType = useMemo(() => {
    return students.filter(s => s.blood_type && s.blood_type !== "").length;
  }, [students]);

  const handleAddStudentToPedido = async () => {
    const student = allStudents.find(s => s.id === selectedStudentId);
    if (!student) {
      toast.error("Selecione um aluno.");
      return;
    }

    // Determine the blood type to use
    const finalBloodType = student.blood_type || selectedBloodType;
    if (!finalBloodType) {
      toast.error("Selecione o Tipo Sanguíneo (TS) do aluno.");
      return;
    }

    if (currentStudentItems.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }

    try {
      // If student doesn't have blood type, update it first
      if (!student.blood_type && selectedBloodType) {
        const { error: updateError } = await supabase
          .from("students")
          .update({ blood_type: selectedBloodType })
          .eq("id", student.id);

        if (updateError) throw updateError;
        
        // Update local state
        setStudents(students.map(s => 
          s.id === student.id ? { ...s, blood_type: selectedBloodType } : s
        ));
        student.blood_type = selectedBloodType;
        toast.success(`TS "${selectedBloodType}" salvo no dossiê do aluno.`);
      }

      if (editingId) {
        const { error } = await supabase
          .from("fardamento_pedidos")
          .update({
            items: currentStudentItems,
            observacoes,
            student_id: selectedStudentId
          })
          .eq("id", editingId);

        if (error) throw error;
        
        setPedidoItems(pedidoItems.map(item => 
          item.id === editingId 
            ? { ...item, items: [...currentStudentItems], observacoes, student: { ...student, blood_type: finalBloodType } }
            : item
        ));
        toast.success("Pedido atualizado.");
      } else {
        const { data, error } = await supabase
          .from("fardamento_pedidos")
          .insert({
            student_id: selectedStudentId,
            items: currentStudentItems,
            observacoes
          })
          .select()
          .single();

        if (error) throw error;

        const newItemEntry: FardamentoItem = {
          id: data.id,
          student: { ...student, blood_type: finalBloodType },
          items: [...currentStudentItems],
          observacoes
        };
        setPedidoItems([...pedidoItems, newItemEntry]);
        toast.success("Aluno adicionado ao pedido.");
      }
      
      // Reset form
      setSelectedStudentId("");
      setCurrentStudentItems([]);
      setObservacoes("");
      setEditingId(null);
      setSelectedBloodType("");
      setIsAddingStudent(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar pedido.");
    }
  };

  const handleEdit = (item: FardamentoItem) => {
    setEditingId(item.id);
    setSelectedStudentId(item.student.id);
    setCurrentStudentItems([...item.items]);
    setObservacoes(item.observacoes);
    setSelectedBloodType("");
    setIsAddingStudent(true);
  };

  const addItemToCurrentStudent = () => {
    setCurrentStudentItems([...currentStudentItems, { ...newItem }]);
    toast.success("Item adicionado.");
  };

  const removeItemFromCurrentStudent = (index: number) => {
    setCurrentStudentItems(currentStudentItems.filter((_, i) => i !== index));
  };

  const removeEntryFromPedido = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fardamento_pedidos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPedidoItems(pedidoItems.filter(item => item.id !== id));
      toast.success("Registro removido.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover registro.");
    }
  };

  const handleClearList = async () => {
    if (pedidoItems.length === 0) return;
    
    if (!confirm("Tem certeza que deseja excluir TODOS os registros deste pedido? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("fardamento_pedidos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;

      setPedidoItems([]);
      toast.success("Lista de pedidos limpa com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao limpar lista.");
    }
  };

  const handlePrint = () => {
    if (pedidoItems.length === 0) {
      toast.error("Adicione itens ao pedido antes de exportar.");
      return;
    }
    window.print();
  };

  if (!isAdmin && !loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h1>
        <p className="text-zinc-500 text-sm">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 40px;
          }
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #000 !important;
            color: black !important;
            padding: 10px !important;
            font-size: 11px !important;
            text-align: left;
          }
          th {
            background-color: #f0f0f0 !important;
            font-weight: bold;
            text-transform: uppercase;
          }
        }
      `}</style>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/20">
            <Shirt className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Pedido de Fardamento</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Gestão de Equipamentos Institucionais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <Dialog open={isAddingStudent} onOpenChange={(open) => {
              setIsAddingStudent(open);
              if (!open) {
                setEditingId(null);
                setSelectedStudentId("");
                setCurrentStudentItems([]);
                setObservacoes("");
                setSelectedBloodType("");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none bg-violet-600 hover:bg-violet-500 text-white font-black h-12 rounded-xl px-6 shadow-lg shadow-violet-600/20 transition-all active:scale-95 uppercase text-xs tracking-widest">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-violet-500" />
                    {editingId ? "Editar Registro no Pedido" : "Adicionar Aluno ao Pedido"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Selecionar Aluno</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Select value={selectedStudentId} onValueChange={(v) => {
                          setSelectedStudentId(v);
                          setSelectedBloodType("");
                        }}>
                          <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl">
                            <SelectValue placeholder="Busque por nome de guerra..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                            {allStudents.length === 0 ? (
                              <div className="p-4 text-center text-zinc-500 text-xs uppercase font-bold">Nenhum aluno encontrado</div>
                            ) : (
                              allStudents.map(s => (
                                <SelectItem key={s.id} value={s.id} className="focus:bg-violet-600">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      s.blood_type ? "bg-emerald-500" : "bg-amber-500"
                                    )} />
                                    <span className="font-black uppercase">{s.nome_guerra}</span>
                                    <span className="text-[10px] text-zinc-500">#{s.matricula_pfm}</span>
                                    {s.blood_type && (
                                      <Badge className="bg-red-500/10 border-red-500/20 text-red-400 font-black px-1.5 py-0 text-[9px] ml-1">
                                        {s.blood_type}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        {(() => {
                          const selectedStudent = allStudents.find(s => s.id === selectedStudentId);
                          if (!selectedStudentId) {
                            return (
                              <div className="h-12 flex items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <span className="text-[10px] text-zinc-600 uppercase font-bold">TS</span>
                              </div>
                            );
                          }
                          if (selectedStudent?.blood_type) {
                            return (
                              <div className="h-12 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                <Badge className="bg-red-500/20 border-red-500/30 text-red-400 font-black px-3 py-1 text-sm">
                                  {selectedStudent.blood_type}
                                </Badge>
                              </div>
                            );
                          }
                          return (
                            <Select value={selectedBloodType} onValueChange={setSelectedBloodType}>
                              <SelectTrigger className="bg-amber-500/10 border-amber-500/30 h-12 rounded-xl text-amber-400">
                                <SelectValue placeholder="Definir TS" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                {BLOOD_TYPES.map(bt => (
                                  <SelectItem key={bt} value={bt} className="focus:bg-violet-600">
                                    <span className="font-black">{bt}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 italic mt-1 ml-1">
                      {allStudents.find(s => s.id === selectedStudentId)?.blood_type 
                        ? "✓ Aluno com TS cadastrado" 
                        : selectedStudentId 
                          ? "⚠ Selecione o TS - será salvo automaticamente no dossiê do aluno"
                          : "Lista ordenada por matrícula (mais antigo primeiro)"
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-500 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Adicionar Itens
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Select value={newItem.name} onValueChange={(v) => setNewItem({...newItem, name: v})}>
                          <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="Camisa">Camisa</SelectItem>
                            <SelectItem value="Short">Short</SelectItem>
                            <SelectItem value="Calça">Calça</SelectItem>
                            <SelectItem value="Meia">Meia</SelectItem>
                            <SelectItem value="Tênis">Tênis</SelectItem>
                            <SelectItem value="Boné">Boné</SelectItem>
                            <SelectItem value="Cinto">Cinto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input 
                          placeholder="Tam." 
                          value={newItem.size} 
                          onChange={(e) => setNewItem({...newItem, size: e.target.value.toUpperCase()})}
                          className="bg-zinc-950 border-zinc-800 h-10 rounded-lg uppercase"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={addItemToCurrentStudent}
                        variant="outline"
                        className="border-zinc-800 hover:bg-zinc-800 h-10 rounded-lg font-black uppercase text-[10px]"
                    >
                      Incluir
                    </Button>
                  </div>

                  {currentStudentItems.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {currentStudentItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white uppercase">{item.name}</span>
                            <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-400 font-bold">{item.size}</Badge>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => removeItemFromCurrentStudent(idx)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Observações Especiais</label>
                  <Input 
                    placeholder="Ex: Aluno alérgico a poliéster, urgência para formatura..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 h-12 rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  onClick={handleAddStudentToPedido}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black h-12 rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-violet-600/20"
                >
                  Confirmar e Listar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handlePrint}
            variant="outline" 
            className="flex-1 md:flex-none border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12 rounded-xl px-6 transition-all font-black uppercase text-xs tracking-widest"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </motion.div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Statistics & Filters Column */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" /> Pesquisa Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  placeholder="Nome, Matrícula..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-950 border-zinc-800 text-white h-11 rounded-xl focus:ring-violet-500/20"
                />
              </div>
              
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Total de Alunos:</span>
                  <span className="text-white">{students.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Com TS:</span>
                  <span className="text-emerald-500">{studentsWithBloodType}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">Sem TS:</span>
                  <span className="text-amber-500">{students.length - studentsWithBloodType}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-500">No Pedido:</span>
                  <span className="text-violet-500">{pedidoItems.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Legenda de Cores</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Com TS cadastrado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Sem TS (preencher na seleção)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request List Column */}
        <div className="xl:col-span-3">
          <Card className="bg-zinc-900/50 border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl min-h-[500px]">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Lista do Pedido Corrente</h2>
              </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearList}
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg px-3 flex items-center gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Limpar Lista de Pedidos
                  </Button>
                  <Badge className="bg-violet-500/10 border-violet-500/20 text-violet-400 font-black px-3 py-1 uppercase text-[10px]">
                    {pedidoItems.length} Alunos Listados
                  </Badge>
                </div>

            </div>

            <CardContent className="p-0">
              {pedidoItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 opacity-20 rotate-12">
                    <Shirt className="w-10 h-10 text-zinc-500" />
                  </div>
                  <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">Nenhum registro no pedido</p>
                  <p className="text-zinc-700 text-[10px] font-bold uppercase mt-2">Adicione alunos clicando em "Novo Registro"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/30">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Aluno / Matrícula</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">TS</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Itens / Tamanhos</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Observações</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <AnimatePresence>
                        {pedidoItems
                          .filter(item => 
                            item.student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.student.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.student.matricula_pfm.includes(searchTerm)
                          )
                          .map((entry, idx) => (
                            <motion.tr 
                              key={entry.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="group hover:bg-zinc-800/20 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-white uppercase tracking-tight">{entry.student.nome_guerra}</span>
                                  <span className="text-[10px] font-mono text-emerald-500 font-bold">#{entry.student.matricula_pfm}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className="bg-red-500/10 border-red-500/20 text-red-400 font-black px-2 py-0.5 text-[10px]">
                                  {entry.student.blood_type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {entry.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.name}:</span>
                                      <span className="text-[10px] font-black text-violet-400 uppercase">{item.size}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[10px] text-zinc-500 italic max-w-xs truncate" title={entry.observacoes}>
                                  {entry.observacoes || "-"}
                                </p>
                              </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 text-zinc-500 hover:text-violet-500 hover:bg-violet-500/10 rounded-xl"
                                      onClick={() => handleEdit(entry)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-9 w-9 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                      onClick={() => removeEntryFromPedido(entry.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                            </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Printable Area - Formatted as per User Requirement */}
        <div id="printable-area" className="hidden print:block">
          {/* 1. Header Section */}
          <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #000", paddingBottom: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px", margin: "0" }}>Fundação Populus Rationabilis</h2>
            <h1 style={{ fontSize: "28px", fontWeight: "900", textTransform: "uppercase", margin: "10px 0" }}>Programa Força Mirim</h1>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "3px", borderTop: "1px solid #ddd", paddingTop: "10px", marginTop: "10px" }}>Pedido de Fardamento Operacional</h3>
            <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold" }}>
              <span>DATA DO PEDIDO: {format(new Date(), "dd/MM/yyyy")}</span>
              <span>SETOR: LOGÍSTICA / EQUIPAMENTOS</span>
            </div>
          </div>

          {/* 2. Summary Section (Image 2 - Now First) */}
          <div style={{ marginBottom: "30px" }}>
            <h4 style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "15px" }}>Resumo da Contabilidade:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
              {Object.entries(itemTotals).map(([itemName, sizes]) => (
                <div key={itemName} style={{ fontSize: "11px", backgroundColor: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #eee" }}>
                  <strong style={{ textTransform: "uppercase", display: "block", marginBottom: "8px", borderBottom: "1px solid #eee", pb: "5px" }}>{itemName}:</strong>
                  <div style={{ marginTop: "5px" }}>
                    {Object.entries(sizes).map(([size, qty]) => (
                      <div key={size} style={{ marginBottom: "4px" }}>
                        Tamanho {size}: <strong>{qty} unidades</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Links and Exemplar Section (Image 2) */}
          <div style={{ marginBottom: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>Exemplar do Fardamento:</p>
              <div style={{ padding: "10px", border: "1px solid #eee", borderRadius: "12px", display: "inline-block" }}>
                <img 
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/project-uploads/50ab8052-0bc7-4468-9be8-a9c50b738fcf/image-1768108895293.png?width=800&height=800&resize=contain" 
                  alt="Exemplar Fardamento"
                  style={{ maxWidth: "280px", maxHeight: "280px", objectFit: "contain" }}
                />
              </div>
            </div>
            
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "20px", borderRadius: "15px" }}>
              <p style={{ fontSize: "11px", fontWeight: "black", textTransform: "uppercase", color: "#166534", marginBottom: "12px" }}>Arquivos para Confecção:</p>
              <p style={{ fontSize: "10px", color: "#166534", marginBottom: "15px", lineHeight: "1.4" }}>Acesse o link abaixo para baixar logotipos, brasões e artes em alta resolução:</p>
              <a 
                href="https://drive.google.com/drive/folders/1g5KBIV4ThPv6yg3ZAhw5mvZkVLcEoSTh?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: "inline-block",
                  fontSize: "11px", 
                  fontWeight: "bold", 
                  color: "#059669", 
                  textDecoration: "underline", 
                  wordBreak: "break-all",
                  padding: "10px 15px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0"
                }}
              >
                LINK PARA BAIXAR LOGOS E IMAGENS
              </a>
            </div>
          </div>

          {/* 4. Table Section (Image 3 - Now Below Summary) */}
          <div style={{ marginBottom: "30px" }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>MATRÍCULA</th>
                  <th style={{ width: "25%" }}>NOME DE GUERRA</th>
                  <th style={{ width: "10%" }}>TS</th>
                  <th style={{ width: "30%" }}>ITENS / TAMANHOS</th>
                  <th style={{ width: "20%" }}>OBSERVAÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {pedidoItems.map((entry, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "bold", fontFamily: "monospace" }}>#{entry.student.matricula_pfm}</td>
                    <td style={{ fontWeight: "bold", textTransform: "uppercase" }}>{entry.student.nome_guerra}</td>
                    <td style={{ fontWeight: "900", color: "#cc0000" }}>{entry.student.blood_type}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {entry.items.map((item, i) => (
                          <span key={i} style={{ fontSize: "10px" }}>
                            <strong>{item.name.toUpperCase()}:</strong> {item.size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: "9px", fontStyle: "italic" }}>{entry.observacoes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Terms Section */}
          <div style={{ marginTop: "30px", fontSize: "10px", textAlign: "justify", lineHeight: "1.6", backgroundColor: "#f9f9f9", padding: "20px", border: "1px solid #eee", borderRadius: "10px" }}>
            <strong>TERMO DE RESPONSABILIDADE:</strong> Os tamanhos informados neste documento foram baseados nas medidas coletadas dos alunos ativos do Programa Força Mirim. A inclusão do Tipo Sanguíneo (TS) é obrigatória para a confecção da identificação operacional, visando a segurança do aluno em atividades externas. Este pedido deve ser processado pela empresa fornecedora seguindo os padrões técnicos de cor e tecido estabelecidos no regulamento de uniformes da instituição.
          </div>

            {/* 6. Signatures */}
            <div style={{ marginTop: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", padding: "0 40px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #000", height: "40px", marginBottom: "5px" }}></div>
                <p style={{ fontSize: "10px", fontWeight: "black", textTransform: "uppercase", margin: "0" }}>Responsável pelo Pedido</p>
                <p style={{ fontSize: "8px", color: "#666", margin: "5px 0" }}>Seção de Logística - PFM</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #000", height: "40px", marginBottom: "5px" }}></div>
                <p style={{ fontSize: "10px", fontWeight: "black", textTransform: "uppercase", margin: "0" }}>Autorização Direção</p>
                <p style={{ fontSize: "8px", color: "#666", margin: "5px 0" }}>Fundação Populus Rationabilis</p>
              </div>
            </div>
          </div>

    </div>
  );
}

