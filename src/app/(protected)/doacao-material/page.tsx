"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Package, 
  Users, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Circle,
  FileText,
  History,
  LayoutDashboard,
  Box,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  Edit2,
  XCircle,
  ShieldCheck,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { generatePDF } from "@/lib/pdf-utils";
import { useAuth } from "@/components/auth-provider";

interface InventoryItem {

  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface Responsible {
  name: string;
  cpf: string;
  titulo: string;
  guardian2?: { name: string; cpf: string; titulo: string };
  hasDonated?: boolean;
  students: Array<{ nome: string; nome_guerra?: string; matricula: string }>;
}

  interface DonationRecord {
    id: string;
    donor_name: string;
    donor_cpf: string;
    student_matricula?: string;
    donation_date: string;
    status: string;
    items: Array<{
      inventory_item_id: string;
      name: string;
      unit: string;
      quantity: number;
    }>;
  }

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export default function DoacaoMaterialPage() {
  const router = useRouter();
  const { simulatedRole } = useAuth();
  const [activeTab, setActiveTab] = useState("gerenciamento");
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Unidade");
  const [newItemQuantity, setNewItemQuantity] = useState("0");
  
  const [isRegisterDonationOpen, setIsRegisterDonationOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Responsible | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; quantity: number }>>([]);
  
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [donationToCancel, setDonationToCancel] = useState<DonationRecord | null>(null);

  const [isEditDonationOpen, setIsEditDonationOpen] = useState(false);
  const [donationToEdit, setDonationToEdit] = useState<DonationRecord | null>(null);

  const listPrintRef = useRef<HTMLDivElement>(null);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [familyToReceive, setFamilyToReceive] = useState<Responsible | null>(null);
  const [selectedGuardianCpf, setSelectedGuardianCpf] = useState<string>("");
  const [receiveLoading, setReceiveLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await checkUserRole();
        await fetchData();
      } catch (error) {
        console.error("Error in init:", error);
        setLoading(false);
      }
    };
    init();
  }, []);

    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setIsAdmin(["admin", "coord_geral", "coord_nucleo", "instrutor"].includes(profile?.role || ""));
      }
    };

  const [isAdmin, setIsAdmin] = useState(false);

  const handleEditDonation = async () => {
    if (!donationToEdit || selectedItems.length === 0) return;

    try {
      await supabase.from("donation_items").delete().eq("donation_id", donationToEdit.id);
      const itemsToInsert = selectedItems.map(item => ({
        donation_id: donationToEdit.id,
        inventory_item_id: item.id,
        quantity: item.quantity
      }));
      const { error } = await supabase.from("donation_items").insert(itemsToInsert);
      if (error) throw error;
      toast.success("Doação atualizada com sucesso!");
      setIsEditDonationOpen(false);
      setDonationToEdit(null);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      toast.error("Erro ao atualizar doação");
    }
    };

    const handlePrintList = useReactToPrint({
      contentRef: listPrintRef,
      documentTitle: `Relatorio_Doadores_Material_${format(new Date(), 'dd_MM_yyyy')}`,
    });

    const fetchData = async () => {

    setLoading(true);
    try {
      // Only show test records when admin is simulating another profile
      const showTestRecords = !!simulatedRole;
      
      let studentsQuery = supabase.from("students")
        .select("nome_completo, nome_guerra, matricula_pfm, data_matricula, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
        .eq("status", "ativo")
        .order("data_matricula", { ascending: true });
        
      if (!showTestRecords) {
        studentsQuery = studentsQuery.eq("is_test", false);
      }
      
      const [invRes, stuRes, donRes, donItemsRes] = await Promise.all([
        supabase.from("donation_inventory").select("*").order("name"),
        studentsQuery,
        supabase.from("donations").select("*").order("created_at", { ascending: false }),
        supabase.from("donation_items").select("*, donation_inventory(name, unit)")
      ]);

      if (invRes.data) setInventory(invRes.data);

      const processedDonations: DonationRecord[] = (donRes.data || []).map(d => ({
        ...d,
        donation_date: d.created_at,
        items: (donItemsRes.data || [])
          .filter(di => di.donation_id === d.id)
          .map(di => ({
            inventory_item_id: di.inventory_item_id,
            name: di.donation_inventory?.name || "Item Removido",
            unit: di.donation_inventory?.unit || "Un",
            quantity: di.quantity
          }))
      }));

      setDonations(processedDonations);

      const finalResponsibles: Responsible[] = (stuRes.data || []).map(student => ({
        name: student.guardian1_name || "NÃO INFORMADO",
        cpf: student.guardian1_cpf || "",
        titulo: student.guardian1_titulo || "Responsável",
        guardian2: student.guardian2_cpf ? {
          name: student.guardian2_name,
          cpf: student.guardian2_cpf,
          titulo: student.guardian2_titulo || "Responsável"
        } : undefined,
        students: [{
          nome: student.nome_completo,
          nome_guerra: student.nome_guerra || student.nome_completo,
          matricula: student.matricula_pfm
        }],
        hasDonated: processedDonations.some(d => 
          (d.student_matricula === student.matricula_pfm || (!d.student_matricula && d.donor_cpf === student.guardian1_cpf)) && 
          d.status !== 'cancelled'
        )
      }));

      setResponsibles(finalResponsibles);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemUnit) return;
    try {
      const { error } = await supabase
        .from("donation_inventory")
        .insert({ 
          name: newItemName.toUpperCase(), 
          unit: newItemUnit,
          quantity: parseInt(newItemQuantity) || 1
        });
      
      if (error) throw error;
      toast.success("Item adicionado ao inventário");
      setNewItemName("");
      setNewItemQuantity("1");
      setIsAddItemOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao adicionar item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("donation_inventory").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item removido");
      fetchData();
    } catch (error) {
      toast.error("Erro ao remover item");
    }
  };

  const handleRegisterDonation = async () => {
    if (!selectedDonor || selectedItems.length === 0) {
      toast.error("Selecione o doador e ao menos um item");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: donation, error: donError } = await supabase
        .from("donations")
        .insert({
          donor_name: selectedDonor.name,
          donor_cpf: selectedDonor.cpf,
          created_by: user?.id,
          status: 'completed'
        })
        .select()
        .single();

      if (donError) throw donError;

      const itemsToInsert = selectedItems.map(item => ({
        donation_id: donation.id,
        inventory_item_id: item.id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("donation_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Doação registrada com sucesso!");
      setIsRegisterDonationOpen(false);
      setSelectedDonor(null);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar doação");
    }
  };

  const handleCancelDonation = async () => {
    if (!donationToCancel) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: cancelError } = await supabase
        .from("donations")
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id
        })
        .eq("id", donationToCancel.id);
      if (cancelError) throw cancelError;
      toast.success("Doação cancelada!");
      setIsCancelDialogOpen(false);
      setDonationToCancel(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cancelar doação");
    }
  };

  const handleReceiveDonation = async () => {
    if (!familyToReceive || !selectedGuardianCpf) {
      toast.error("Selecione o responsável presente");
      return;
    }

    setReceiveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const selectedGuardian = selectedGuardianCpf === familyToReceive.cpf 
        ? { name: familyToReceive.name, cpf: familyToReceive.cpf }
        : familyToReceive.guardian2 
          ? { name: familyToReceive.guardian2.name, cpf: familyToReceive.guardian2.cpf }
          : { name: familyToReceive.name, cpf: familyToReceive.cpf };

        const { data: donation, error: donError } = await supabase
          .from("donations")
          .insert({
            donor_name: selectedGuardian.name,
            donor_cpf: selectedGuardian.cpf,
            student_matricula: familyToReceive.students[0].matricula,
            created_by: user?.id,
            status: 'completed'
          })
          .select()
          .single();

      if (donError) throw donError;

      const itemsToInsert = inventory.map(item => ({
        donation_id: donation.id,
        inventory_item_id: item.id,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from("donation_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Doação registrada com sucesso!");
        
        setIsReceiveModalOpen(false);
        setFamilyToReceive(null);
        setSelectedGuardianCpf("");
        
        router.push(`/doacao-material/imprimir?donationId=${donation.id}`);
        
        fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar doação");
    } finally {
      setReceiveLoading(false);
    }
  };

  const filteredResponsibles = useMemo(() => {
    const sortMatricula = (a: string, b: string) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      const [numA, yearA] = a.split("/").map(Number);
      const [numB, yearB] = b.split("/").map(Number);
      if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
      return (numA || 0) - (numB || 0);
    };

    const getMinMatricula = (resp: Responsible) => {
      return resp.students.reduce((min, s) => {
        if (!min) return s.matricula;
        return sortMatricula(s.matricula, min) < 0 ? s.matricula : min;
      }, "");
    };

    return responsibles.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cpf.includes(searchTerm) ||
      r.guardian2?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guardian2?.cpf.includes(searchTerm) ||
      r.students.some(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()) || s.matricula.includes(searchTerm))
    ).sort((a, b) => {
      const matA = getMinMatricula(a);
      const matB = getMinMatricula(b);
      return sortMatricula(matA, matB);
    });
  }, [responsibles, searchTerm]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      i.name.toLowerCase().includes(inventorySearch.toLowerCase())
    );
  }, [inventory, inventorySearch]);

  return (
    <div className="space-y-6 min-h-full relative pb-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background: white !important;
            color: black !important;
            font-family: 'Inter', system-ui, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
            #printable-area {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              background: white !important;
              position: relative !important;
              left: 0 !important;
            }
            .break-inside-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}</style>

      {/* Interface Principal */}
      <div className="no-print space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
              <Package className="text-amber-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Doação de Material</h1>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                PFM SYSTEM • LOGÍSTICA 2026
              </div>
            </div>
          </div>
          
            <div className="flex gap-4">
              <Link href="/doacao-material/imprimir">
                <Button 
                  className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <Printer className="w-4 h-4 mr-3 text-amber-500" />
                  Imprimir Relatório
                </Button>
              </Link>
              <Button 
                onClick={() => setIsRegisterDonationOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black h-12 px-8 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest"
              >
                <Plus className="w-4 h-4 mr-3" />
                Nova Doação
              </Button>
            </div>
        </div>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-1.5 rounded-[2rem] w-fit">
            <TabsTrigger value="gerenciamento" className="rounded-[1.5rem] data-[state=active]:bg-amber-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 transition-all">
              <Users className="w-4 h-4 mr-2" />
              Doadores
            </TabsTrigger>
            <TabsTrigger value="inventario" className="rounded-[1.5rem] data-[state=active]:bg-amber-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 transition-all">
              <Box className="w-4 h-4 mr-2" />
              Inventário
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-[1.5rem] data-[state=active]:bg-amber-500 data-[state=active]:text-black font-black text-[10px] uppercase tracking-widest px-8 h-12 transition-all">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

              <TabsContent value="gerenciamento" className="space-y-6">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-amber-400/10 transition-colors duration-700" />
                  <div className="flex flex-col md:flex-row gap-10 items-center justify-between relative z-10">
                    <div className="relative flex-1 group/search w-full">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500 group-focus-within/search:text-amber-400 transition-colors" />
                      <Input 
                        placeholder="Pesquisar por responsável, CPF ou aluno..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-16 bg-zinc-950/80 border-zinc-800 text-white h-16 rounded-[1.5rem] focus:ring-amber-400/20 text-base font-medium transition-all shadow-inner placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[2rem] shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/50">
                            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500">Alunos</th>
                            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500">Responsáveis</th>
                            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500 text-center">Status</th>
                            <th className="px-6 py-4 text-[12px] font-black uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {loading ? (
                            <tr>
                              <td colSpan={4} className="py-20 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
                                <div className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Sincronizando registros...</div>
                              </td>
                            </tr>
                          ) : filteredResponsibles.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-20 text-center">
                                <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-50" />
                                <div className="text-zinc-500 font-black uppercase tracking-widest text-sm">Nenhum registro encontrado</div>
                              </td>
                            </tr>
                          ) : (
                            filteredResponsibles.map((resp, idx) => (
                              <tr key={idx} className={cn("hover:bg-zinc-800/20 transition-colors group", resp.hasDonated && "bg-emerald-500/[0.02]")}>
                                <td className="px-6 py-4">
                                  <div className="space-y-1.5">
                                    {resp.students.map((s, si) => (
                                      <div key={si} className="flex items-center gap-2">
                                        <span className="text-[11px] font-black font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">#{s.matricula}</span>
                                        <span className="text-sm font-black text-white uppercase truncate max-w-[150px]">{s.nome_guerra}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                  <td className="px-6 py-4">
                                    <div className="space-y-3">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-black text-white uppercase leading-none">{resp.name}</span>
                                      </div>
                                      {resp.guardian2 && (
                                        <div className="flex flex-col pt-2 border-t border-zinc-800/50">
                                          <span className="text-[13px] font-bold text-zinc-400 uppercase leading-none">{resp.guardian2.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                <td className="px-6 py-4 text-center">
                                  <Badge className={cn(
                                    "font-black text-[11px] uppercase px-3 py-1 rounded-full border shadow-lg",
                                    resp.hasDonated 
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                      : "bg-zinc-950 text-zinc-600 border-zinc-800"
                                  )}>
                                    {resp.hasDonated ? "ENTREGUE" : "PENDENTE"}
                                  </Badge>
                                </td>
                              <td className="px-6 py-4 text-right">
                                  {!resp.hasDonated ? (
                                    <Button 
                                      onClick={() => {
                                        setFamilyToReceive(resp);
                                        setSelectedGuardianCpf("");
                                        setIsReceiveModalOpen(true);
                                      }}
                                      className="h-9 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                                    >
                                      Receber <ChevronRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                    ) : (
                                      <div className="flex gap-2 justify-end">
                                          <Button 
                                              onClick={() => {
                                              const don = donations.find(d => d.donor_cpf === resp.cpf && d.status !== 'cancelled');
                                              if (don) {
                                                  router.push(`/doacao-material/imprimir?donationId=${don.id}`);
                                              }
                                              }}
                                              size="icon"
                                              className="h-9 w-9 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all group/print"
                                          >
                                              <Printer className="w-4 h-4 text-amber-500 group-hover/print:scale-110" />
                                          </Button>
                                      </div>
                                    )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>


          <TabsContent value="inventario" className="space-y-6">
            <Card className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Materiais Disponíveis</h2>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gerenciamento de estoque padrão para doações</div>
                </div>
                <Button 
                  onClick={() => setIsAddItemOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl h-12 px-8 uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Cadastrar Item
                </Button>
              </div>

              <div className="relative mb-8 group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within/search:text-amber-400 transition-colors" />
                <Input 
                  placeholder="Pesquisar material..." 
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="pl-12 bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredInventory.map(item => (
                  <div key={item.id} className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-[2rem] group relative hover:border-amber-400/20 transition-all duration-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black uppercase text-white truncate pr-6 group-hover:text-amber-400 transition-colors">{item.name}</div>
                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-2 bg-zinc-900 w-fit px-2 py-0.5 rounded-lg border border-zinc-800">{item.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-amber-500 tracking-tighter">
                          {item.quantity}
                        </div>
                        <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Padrão</div>
                      </div>
                    </div>
                  
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        onClick={() => {
                          setNewItemName(item.name);
                          setNewItemUnit(item.unit);
                          setNewItemQuantity(item.quantity.toString());
                          handleDeleteItem(item.id);
                          setIsAddItemOpen(true);
                        }}
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl border border-transparent hover:border-amber-500/20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteItem(item.id)}
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

            <TabsContent value="historico" className="space-y-6">
              <Card className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="mb-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Últimas Doações</h2>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Registro cronológico detalhado</div>
                </div>

                <div className="space-y-4">
                  {donations.map(don => (
                    <motion.div 
                      key={don.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-6 border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-500",
                        don.status === 'cancelled' ? "bg-red-500/[0.02] border-red-500/20 opacity-60" : "bg-zinc-950/50 border-zinc-800/50 hover:bg-zinc-800/20 hover:border-amber-400/20"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
                          don.status === 'cancelled' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        )}>
                          {don.status === 'cancelled' ? <XCircle className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="text-base font-black text-white uppercase tracking-tight">{don.donor_name}</div>
                            {don.status === 'cancelled' && (
                              <Badge variant="outline" className="text-[9px] border-red-500/50 text-red-500 uppercase font-black px-2 py-0.5 rounded-full">Cancelada</Badge>
                            )}
                          </div>
                          <div className="space-y-2 mt-2">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{format(new Date(don.donation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                            <div className="flex flex-wrap gap-2">
                              {responsibles.find(r => r.cpf === don.donor_cpf)?.students.map((s, i) => (
                                <span key={i} className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg uppercase">
                                  #{s.matricula} {s.nome_guerra}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                          {don.status !== 'cancelled' && (
                            <>
                                <Button 
                                  onClick={() => {
                                    router.push(`/doacao-material/imprimir?donationId=${don.id}`);
                                  }}
                                  variant="outline" 
                                  className="border-zinc-800 bg-zinc-950/50 text-amber-500 hover:text-amber-400 hover:bg-zinc-900 rounded-xl font-black text-[10px] uppercase h-10 px-6 transition-all"
                                >
                                  <Printer className="w-4 h-4 mr-2" />
                                  Imprimir
                                </Button>
                              <Button 
                                onClick={() => {
                                  setDonationToCancel(don);
                                  setIsCancelDialogOpen(true);
                                }}
                                variant="outline" 
                                className="border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase h-10 px-6 transition-all"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

        {/* ÁREA DE IMPRESSÃO - RELATÓRIO GERAL */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div 
            ref={listPrintRef} 
            id="printable-area" 
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              padding: '10mm',
              backgroundColor: 'white',
              color: 'black',
              fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
              fontSize: '10px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ borderBottom: '2px solid #f59e0b', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px', color: '#18181b' }}>RELATÓRIO DE DOAÇÃO DE MATERIAL</h1>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '2px', margin: '4px 0 0 0' }}>PROGRAMA FORÇA MIRIM - {new Date().getFullYear()}</p>
              </div>
              <div style={{ border: '1px solid #f59e0b', borderRadius: '12px', padding: '8px 16px', textAlign: 'right', backgroundColor: 'white', minWidth: '140px' }}>
                <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>DATA</span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b' }}>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '20%' }}>Alunos</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '25%' }}>Responsáveis</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '40%' }}>Itens Doados</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', width: '15%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponsibles.map((resp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e4e4e7', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      {resp.students.map((s, si) => (
                        <div key={si} style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.4 }}>
                          <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontSize: '10px' }}>#{s.matricula}</span> {s.nome_guerra}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', borderLeft: '1px solid #e4e4e7' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{resp.name}</div>
                      {resp.guardian2 && (
                        <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #f4f4f5' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b' }}>{resp.guardian2.name}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', borderLeft: '1px solid #e4e4e7' }}>
                      {resp.hasDonated ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {donations
                            .find(d => 
                              (d.student_matricula === resp.students[0].matricula || (!d.student_matricula && d.donor_cpf === resp.cpf)) && 
                              d.status !== 'cancelled'
                            )
                            ?.items.map((it, i) => (
                              <span key={i} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b', backgroundColor: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>
                                {it.quantity}x {it.name}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#d4d4d8', textTransform: 'uppercase', fontStyle: 'italic' }}>Aguardando entrega</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderLeft: '1px solid #e4e4e7' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 900, 
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: resp.hasDonated ? '#18181b' : 'transparent',
                        color: resp.hasDonated ? 'white' : '#d4d4d8',
                        border: resp.hasDonated ? 'none' : '1px solid #e4e4e7'
                      }}>
                        {resp.hasDonated ? 'ENTREGUE' : 'PENDENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '2px solid #18181b' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', color: '#52525b' }}>
                <div>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>(86) 9 9994-5135</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>WhatsApp</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>26.822.670/0001-87</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>CNPJ</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#18181b', fontWeight: 900, display: 'block' }}>@fpr_brazil</span>
                  <span style={{ fontSize: '7px', color: '#a1a1aa' }}>Redes Sociais</span>
                </div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#a1a1aa', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                <span>PFM SYSTEM • FUNDAÇÃO POPULUS RATIONABILIS</span>
                <span>GESTÃO {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
          </div>

        {/* Modais de Cadastro/Edição */}
      <Dialog open={isRegisterDonationOpen} onOpenChange={setIsRegisterDonationOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl rounded-[2.5rem] p-10 backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Registrar Doação</DialogTitle>
            <CardDescription className="text-zinc-500 uppercase font-bold text-[10px] tracking-widest">Selecione o doador e os itens recebidos</CardDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Selecionar Responsável</label>
              <Select onValueChange={(val) => setSelectedDonor(responsibles.find(r => r.cpf === val) || null)}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold text-sm transition-all focus:ring-amber-400/20 shadow-inner">
                  <SelectValue placeholder="Busque pelo nome ou CPF..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                  {responsibles.sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                    <SelectItem key={r.cpf} value={r.cpf} className="rounded-xl hover:bg-amber-500/10 focus:bg-amber-500/10 transition-colors uppercase font-bold text-[11px]">
                      {r.name} ({formatCPF(r.cpf)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Itens da Doação</label>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase border border-amber-500/20 tracking-widest">
                  {selectedItems.length} Itens Selecionados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 pr-4">
                {inventory.map(item => {
                  const selected = selectedItems.find(si => si.id === item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group/item",
                        selected ? "bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5" : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={!!selected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems(prev => [...prev, { id: item.id, quantity: item.quantity || 1 }]);
                            } else {
                              setSelectedItems(prev => prev.filter(p => p.id !== item.id));
                            }
                          }}
                          className="border-zinc-700 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black rounded-lg w-5 h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-black uppercase text-white truncate block tracking-tight group-hover/item:text-amber-400 transition-colors">{item.name}</span>
                          <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{item.unit} • Padrão: {item.quantity}</span>
                        </div>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-3 pl-8 animate-in fade-in slide-in-from-left-2 duration-300">
                          <Label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Qtd:</Label>
                          <Input 
                            type="number" 
                            min="1"
                            className="bg-zinc-900 border-zinc-800 h-8 text-[10px] font-black w-24 rounded-lg focus:ring-amber-500/20"
                            value={selected.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value);
                              if (!isNaN(qty) && qty > 0) {
                                setSelectedItems(prev => prev.map(p => p.id === item.id ? { ...p, quantity: qty } : p));
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsRegisterDonationOpen(false)} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest h-12 rounded-2xl">Cancelar</Button>
            <Button 
              onClick={handleRegisterDonation}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest px-10 h-12 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Registrar Doação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white rounded-[2.5rem] p-10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Novo Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Identificação do Item</label>
              <Input 
                placeholder="Ex: PACOTE DE COPOS 200ML" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white uppercase font-bold text-sm focus:ring-amber-400/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Unidade</label>
                <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-2xl">
                    <SelectItem value="Unidade" className="uppercase font-bold text-[10px]">Unidade</SelectItem>
                    <SelectItem value="Pacote" className="uppercase font-bold text-[10px]">Pacote</SelectItem>
                    <SelectItem value="Litro" className="uppercase font-bold text-[10px]">Litro</SelectItem>
                    <SelectItem value="Kit" className="uppercase font-bold text-[10px]">Kit</SelectItem>
                    <SelectItem value="Par" className="uppercase font-bold text-[10px]">Par</SelectItem>
                    <SelectItem value="Caixa" className="uppercase font-bold text-[10px]">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Qtd Sugerida</label>
                <Input 
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-14 rounded-2xl text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddItemOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Abortar</Button>
            <Button onClick={handleAddItem} className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl shadow-lg">Salvar Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDonationOpen} onOpenChange={setIsEditDonationOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl rounded-[2.5rem] p-10 backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-blue-400">Ajustar Doação</DialogTitle>
            <CardDescription className="text-zinc-500 uppercase font-bold text-[10px] tracking-widest">Alterando registro de: {donationToEdit?.donor_name}</CardDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map(item => {
                const selected = selectedItems.find(si => si.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 relative group/item",
                      selected ? "bg-blue-500/5 border-blue-500/40 shadow-lg shadow-blue-500/5" : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={!!selected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(prev => [...prev, { id: item.id, quantity: item.quantity || 1 }]);
                          } else {
                            setSelectedItems(prev => prev.filter(p => p.id !== item.id));
                          }
                        }}
                        className="border-zinc-700 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white rounded-lg w-5 h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-black uppercase text-white truncate block tracking-tight group-hover/item:text-blue-400 transition-colors">{item.name}</span>
                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{item.unit}</span>
                      </div>
                    </div>
                    {selected && (
                      <div className="flex items-center gap-3 pl-8">
                        <Label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Qtd:</Label>
                        <Input 
                          type="number" 
                          min="1"
                          className="bg-zinc-900 border-zinc-800 h-8 text-[10px] font-black w-24 rounded-lg focus:ring-blue-500/20"
                          value={selected.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value);
                            if (!isNaN(qty) && qty > 0) {
                              setSelectedItems(prev => prev.map(p => p.id === item.id ? { ...p, quantity: qty } : p));
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDonationOpen(false)} className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest h-12 rounded-2xl">Voltar</Button>
            <Button 
              onClick={handleEditDonation}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-10 h-12 rounded-2xl shadow-xl shadow-blue-600/20 transition-all"
            >
              Salvar Ajustes
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Receber Doação - Selecionar Responsável */}
        <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md rounded-[2.5rem] p-10 backdrop-blur-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Receber Doação</DialogTitle>
              <CardDescription className="text-zinc-500 uppercase font-bold text-[10px] tracking-widest">Selecione o responsável presente para entregar o material</CardDescription>
            </DialogHeader>
            
            {familyToReceive && (
              <div className="space-y-6 py-6">
                {/* Alunos vinculados */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Alunos Vinculados</label>
                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 space-y-2">
                    {familyToReceive.students.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] font-black font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">#{s.matricula}</span>
                        <span className="text-xs font-black text-white uppercase">{s.nome_guerra || s.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seleção de responsável */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Responsável Presente</label>
                  <div className="space-y-3">
                    {/* Guardian 1 */}
                    <div 
                      onClick={() => setSelectedGuardianCpf(familyToReceive.cpf)}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                        selectedGuardianCpf === familyToReceive.cpf 
                          ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10" 
                          : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedGuardianCpf === familyToReceive.cpf 
                            ? "border-amber-500 bg-amber-500" 
                            : "border-zinc-600"
                        )}>
                          {selectedGuardianCpf === familyToReceive.cpf && (
                            <CheckCircle2 className="w-3 h-3 text-black" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-black uppercase text-white">{familyToReceive.name}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{formatCPF(familyToReceive.cpf)}</div>
                          <div className="text-[9px] text-amber-500 uppercase font-bold mt-1">{familyToReceive.titulo || "Responsável"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian 2 */}
                    {familyToReceive.guardian2 && (
                      <div 
                        onClick={() => setSelectedGuardianCpf(familyToReceive.guardian2!.cpf)}
                        className={cn(
                          "p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                          selectedGuardianCpf === familyToReceive.guardian2.cpf 
                            ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10" 
                            : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedGuardianCpf === familyToReceive.guardian2.cpf 
                              ? "border-amber-500 bg-amber-500" 
                              : "border-zinc-600"
                          )}>
                            {selectedGuardianCpf === familyToReceive.guardian2.cpf && (
                              <CheckCircle2 className="w-3 h-3 text-black" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-black uppercase text-white">{familyToReceive.guardian2.name}</div>
                            <div className="text-[10px] font-mono text-zinc-500">{formatCPF(familyToReceive.guardian2.cpf)}</div>
                            <div className="text-[9px] text-amber-500 uppercase font-bold mt-1">{familyToReceive.guardian2.titulo || "Responsável"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsReceiveModalOpen(false);
                  setFamilyToReceive(null);
                  setSelectedGuardianCpf("");
                }} 
                className="text-zinc-500 hover:text-white uppercase font-black text-[10px] tracking-widest h-12 rounded-2xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReceiveDonation}
                disabled={!selectedGuardianCpf || receiveLoading}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest px-10 h-12 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {receiveLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  <>Confirmar Recebimento</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-500 font-black uppercase tracking-tighter text-xl">
              <AlertTriangle className="w-6 h-6" />
              Excluir Registro
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="text-xs text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
              Tem certeza que deseja cancelar esta doação? Esta ação é irreversível e removerá o registro do histórico oficial.
            </div>
            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
              <div className="text-[11px] font-black uppercase text-white">{donationToCancel?.donor_name}</div>
              <div className="text-[9px] text-zinc-500 font-mono mt-1 uppercase">Protocolo: {donationToCancel?.id.slice(0,12)}</div>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)} className="uppercase font-black text-[10px] tracking-widest h-12 rounded-2xl">Abortar</Button>
            <Button onClick={handleCancelDonation} className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-xl shadow-red-600/20">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
