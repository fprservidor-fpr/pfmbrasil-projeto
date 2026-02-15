"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Printer, 
  User, 
  Home, 
  Heart, 
  Users, 
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { PrintableEnrollmentSheet } from "@/components/printable-enrollment-sheet";
import { useReactToPrint } from "react-to-print";
import { differenceInYears } from "date-fns";
import { createStudentAccount, createGuardianAccount } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Key, UserCheck } from "lucide-react";

export default function EfetivacaoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("pessoais");
  const [preMatricula, setPreMatricula] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [instrutores, setInstrutores] = useState<any[]>([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [createStudentAcc, setCreateStudentAcc] = useState(true);
  const [createGuardianAcc, setCreateGuardianAcc] = useState(true);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("pfmbrasil");
  const [guardianCpf, setGuardianCpf] = useState("");
  const [guardianPassword, setGuardianPassword] = useState("pfmbrasil");

    const form = useForm({
      defaultValues: {
        nome_guerra: "",
        nome_completo: "",
        data_nascimento: "",
        idade: 0,
        gender: "Masculino",
        blood_type: "A+",
        whatsapp: "",
        turma_id: "",
        
        mother_name: "",
        father_name: "",
        family_income: "",
        
        address_street: "",
        address_number: "",
        address_neighborhood: "",
        address_city: "Teresina",
        address_state: "PI",
        address_cep: "",
        
        guardian1_name: "",
        guardian1_cpf: "",
        guardian1_titulo: "",
        guardian1_whatsapp: "",
        guardian2_name: "",
        guardian2_cpf: "",
        guardian2_titulo: "",
        guardian2_whatsapp: "",
        
        health_1_plano_saude: false,
        health_plano_saude_descricao: "",
        health_2_vacina_covid: false,
        health_3_assistencia_social: false,
        health_4_psicologo: false,
        health_5_transtorno_psiquico: false,
        health_6_algum_problema: false,
        health_7_epiletico: false,
        health_8_diabetico: false,
        health_9_atividade_fisica: false,
        health_10_restricao_alimentar: false,
        health_11_acompanhamento_nutricional: false,
        health_12_alergia: false,
        health_13_medicamento: false,
        health_14_cirurgia: false,
        health_descriptions: {
          health_1_plano_saude: "",
          health_2_vacina_covid: "",
          health_3_assistencia_social: "",
          health_4_psicologo: "",
          health_5_transtorno_psiquico: "",
          health_6_algum_problema: "",
          health_7_epiletico: "",
          health_8_diabetico: "",
          health_9_atividade_fisica: "",
          health_10_restricao_alimentar: "",
          health_11_acompanhamento_nutricional: "",
          health_12_alergia: "",
          health_13_medicamento: "",
          health_14_cirurgia: "",
        } as Record<string, string>,
        
        attendant_name: profile?.full_name || profile?.war_name || "",
      }
    });

    useEffect(() => {
        async function fetchData() {
          const [{ data: matriculaData }, { data: turmasData }, { data: instrutoresData }] = await Promise.all([
            supabase.from("pre_matriculas").select("*, turmas(nome)").eq("id", id).single(),
            supabase.from("turmas").select("*").eq("ativa", true).order("nome"),
            supabase.from("instructors").select("id, full_name, war_name").order("war_name")
          ]);

        if (matriculaData) {
          setPreMatricula(matriculaData);
          form.reset({
            ...form.getValues(),
            nome_completo: matriculaData.nome_completo,
            data_nascimento: matriculaData.data_nascimento,
            idade: matriculaData.idade,
            nome_guerra: matriculaData.nome_guerra || "",
            gender: matriculaData.gender || "Masculino",
            blood_type: matriculaData.blood_type || "A+",
            whatsapp: matriculaData.whatsapp || "",
            turma_id: matriculaData.turma_id || "",
            mother_name: matriculaData.mother_name || "",
            father_name: matriculaData.father_name || "",
            family_income: matriculaData.family_income || "",
            address_street: matriculaData.address_street || "",
            address_number: matriculaData.address_number || "",
            address_neighborhood: matriculaData.address_neighborhood || "",
            address_city: matriculaData.address_city || "Teresina",
            address_state: matriculaData.address_state || "PI",
            address_cep: matriculaData.address_cep || "",
            guardian1_name: matriculaData.guardian1_name || matriculaData.responsavel_nome,
            guardian1_cpf: matriculaData.guardian1_cpf || matriculaData.responsavel_cpf,
            guardian1_titulo: matriculaData.guardian1_titulo || "",
            guardian1_whatsapp: matriculaData.guardian1_whatsapp || matriculaData.responsavel_whatsapp,
            guardian2_name: matriculaData.guardian2_name || "",
            guardian2_cpf: matriculaData.guardian2_cpf || "",
            guardian2_titulo: matriculaData.guardian2_titulo || "",
            guardian2_whatsapp: matriculaData.guardian2_whatsapp || "",
            health_1_plano_saude: matriculaData.health_1_plano_saude || false,
            health_plano_saude_descricao: matriculaData.health_plano_saude_descricao || "",
            health_2_vacina_covid: matriculaData.health_2_vacina_covid || false,
            health_3_assistencia_social: matriculaData.health_3_assistencia_social || false,
            health_4_psicologo: matriculaData.health_4_psicologo || false,
            health_5_transtorno_psiquico: matriculaData.health_5_transtorno_psiquico || false,
            health_6_algum_problema: matriculaData.health_6_algum_problema || false,
            health_7_epiletico: matriculaData.health_7_epiletico || false,
            health_8_diabetico: matriculaData.health_8_diabetico || false,
            health_9_atividade_fisica: matriculaData.health_9_atividade_fisica || false,
            health_10_restricao_alimentar: matriculaData.health_10_restricao_alimentar || false,
            health_11_acompanhamento_nutricional: matriculaData.health_11_acompanhamento_nutricional || false,
            health_12_alergia: matriculaData.health_12_alergia || false,
            health_13_medicamento: matriculaData.health_13_medicamento || false,
            health_14_cirurgia: matriculaData.health_14_cirurgia || false,
            health_descriptions: {
              health_1_plano_saude: matriculaData.health_descriptions?.health_1_plano_saude || matriculaData.health_plano_saude_descricao || "",
              health_2_vacina_covid: matriculaData.health_descriptions?.health_2_vacina_covid || "",
              health_3_assistencia_social: matriculaData.health_descriptions?.health_3_assistencia_social || "",
              health_4_psicologo: matriculaData.health_descriptions?.health_4_psicologo || "",
              health_5_transtorno_psiquico: matriculaData.health_descriptions?.health_5_transtorno_psiquico || "",
              health_6_algum_problema: matriculaData.health_descriptions?.health_6_algum_problema || "",
              health_7_epiletico: matriculaData.health_descriptions?.health_7_epiletico || "",
              health_8_diabetico: matriculaData.health_descriptions?.health_8_diabetico || "",
              health_9_atividade_fisica: matriculaData.health_descriptions?.health_9_atividade_fisica || "",
              health_10_restricao_alimentar: matriculaData.health_descriptions?.health_10_restricao_alimentar || "",
              health_11_acompanhamento_nutricional: matriculaData.health_descriptions?.health_11_acompanhamento_nutricional || "",
              health_12_alergia: matriculaData.health_descriptions?.health_12_alergia || "",
              health_13_medicamento: matriculaData.health_descriptions?.health_13_medicamento || "",
              health_14_cirurgia: matriculaData.health_descriptions?.health_14_cirurgia || "",
            },
            attendant_name: profile?.full_name || profile?.war_name || "",
          });
        }
        if (turmasData) setTurmas(turmasData);
        if (instrutoresData) setInstrutores(instrutoresData);
        setLoading(false);
      }
      if (id) fetchData();
    }, [id, profile, form]);
    
  useEffect(() => {
    const matriculaPfm = preMatricula?.matricula_pfm || form.watch("matricula_pfm");
    if (matriculaPfm) {
      const cleanMatricula = matriculaPfm.replace(/[^0-9]/g, "");
      setStudentEmail(`${cleanMatricula}@pfm.com`);
    }
    
    const cpf = form.watch("guardian1_cpf") || preMatricula?.guardian1_cpf;
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      setGuardianCpf(cleanCpf);
    }
  }, [preMatricula, form.watch("guardian1_cpf")]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ficha_Matricula_${preMatricula?.nome_completo || "aluno"}`,
  });

    const generateMatriculaPFM = async () => {
      const currentYear = new Date().getFullYear();
      const yearSuffix = String(currentYear).slice(-2);
      
      const { count } = await supabase
        .from("pre_matriculas")
        .select("*", { count: "exact", head: true })
        .not("numero_ordem", "is", null)
        .eq("ano_referencia", currentYear);

      const nextNumber = (count || 0) + 1;
      return {
        numero_ordem: nextNumber,
        ano_referencia: currentYear,
        display: `${String(nextNumber).padStart(2, "0")}/${yearSuffix}`
      };
    };

    const onSubmit = async (data: any) => {
      setSaving(true);
      try {
        const matriculaData = await generateMatriculaPFM();
        const selectedTurma = turmas.find(t => t.id === data.turma_id);
        
        // Retornar a chave de acesso temporária para o pool
        if (preMatricula?.chave_acesso) {
          await supabase
            .from("chaves_temporarias")
            .update({ ativa: true })
            .eq("chave", preMatricula.chave_acesso);
        }
        
          // 1. Atualizar Pré-Matrícula
          const { error: updateError } = await supabase
            .from("pre_matriculas")
            .update({
              ...data,
              health_plano_saude_descricao: data.health_descriptions?.health_1_plano_saude || data.health_plano_saude_descricao,
              numero_ordem: matriculaData.numero_ordem,
              ano_referencia: matriculaData.ano_referencia,
              matricula_pfm: matriculaData.display,
              status: "efetivada",
              efetivada_em: new Date().toISOString(),
              efetivada_por: profile?.id,
              chave_acesso: null,
            })
            .eq("id", id);

          if (updateError) throw updateError;

            // 2. Inserir na tabela de Alunos (students)
            const { data: student, error: studentError } = await supabase
              .from("students")
              .insert([{
                pre_matricula_id: id,
                nome_completo: data.nome_completo,
                nome_guerra: data.nome_guerra,
                data_nascimento: data.data_nascimento,
                  idade: data.idade,
                  data_matricula: new Date().toISOString().split('T')[0],
                  status: "ativo",
                ano_ingresso: matriculaData.ano_referencia,
                turma: selectedTurma?.nome || "A definir",
                turma_id: data.turma_id,
                graduacao: "APRENDIZ",
                comportamento_atual: "EXCEPCIONAL",
                numero_ordem: matriculaData.numero_ordem,
                matricula_pfm: matriculaData.display,
                
                // Novos campos sincronizados
                responsavel_nome: data.guardian1_name,
                responsavel_cpf: data.guardian1_cpf,
                responsavel_whatsapp: data.guardian1_whatsapp,
                gender: data.gender,
                blood_type: data.blood_type,
                whatsapp: data.whatsapp,
                mother_name: data.mother_name,
                father_name: data.father_name,
                family_income: data.family_income,
                address_street: data.address_street,
                address_number: data.address_number,
                address_neighborhood: data.address_neighborhood,
                address_city: data.address_city,
                address_state: data.address_state,
                address_cep: data.address_cep,
                guardian1_name: data.guardian1_name,
                guardian1_cpf: data.guardian1_cpf,
                guardian1_titulo: data.guardian1_titulo,
                guardian1_whatsapp: data.guardian1_whatsapp,
                guardian2_name: data.guardian2_name,
                guardian2_cpf: data.guardian2_cpf,
                guardian2_titulo: data.guardian2_titulo,
                guardian2_whatsapp: data.guardian2_whatsapp,
                health_1_plano_saude: data.health_1_plano_saude,
                health_2_vacina_covid: data.health_2_vacina_covid,
                health_3_assistencia_social: data.health_3_assistencia_social,
                health_4_psicologo: data.health_4_psicologo,
                health_5_transtorno_psiquico: data.health_5_transtorno_psiquico,
                health_6_algum_problema: data.health_6_algum_problema,
                health_7_epiletico: data.health_7_epiletico,
                health_8_diabetico: data.health_8_diabetico,
                health_9_atividade_fisica: data.health_9_atividade_fisica,
                health_10_restricao_alimentar: data.health_10_restricao_alimentar,
                health_11_acompanhamento_nutricional: data.health_11_acompanhamento_nutricional,
                health_12_alergia: data.health_12_alergia,
                health_13_medicamento: data.health_13_medicamento,
                health_14_cirurgia: data.health_14_cirurgia,
                health_plano_saude_descricao: data.health_descriptions?.health_1_plano_saude || data.health_plano_saude_descricao,
                health_descriptions: data.health_descriptions
              }])
              .select()
              .single();

          if (studentError) throw studentError;

          // 3. Criar contas de acesso
          if (createStudentAcc && studentEmail && studentPassword && student) {
            const studentAccResult = await createStudentAccount({
              email: studentEmail,
              password: studentPassword,
              fullName: data.nome_completo,
              studentId: student.id
            });
            if (!studentAccResult.success) {
              console.error("Erro ao criar conta do aluno:", studentAccResult.error);
              toast.warning("Matrícula efetivada, mas houve erro ao criar conta do aluno: " + studentAccResult.error);
            }
          }

          if (createGuardianAcc && guardianCpf && guardianPassword && student) {
            const guardianAccResult = await createGuardianAccount({
              cpf: guardianCpf,
              password: guardianPassword,
              fullName: data.guardian1_name,
              studentId: student.id
            });
            if (!guardianAccResult.success) {
              console.error("Erro ao criar conta do responsável:", guardianAccResult.error);
              toast.warning("Matrícula efetivada, mas houve erro ao criar conta do responsável: " + guardianAccResult.error);
            }
          }

          // 4. Inserir registro inicial de comportamento
          if (student) {
            await supabase
              .from("comportamentos")
              .insert([{
                aluno_id: student.id,
                tipo: "merito",
                descricao: "Ingresso no programa - Comportamento Inicial",
                pontos: 100,
                instrutor_id: profile?.id
              }]);
          }
          
          setPreMatricula({
            ...preMatricula,
            ...data,
            numero_ordem: matriculaData.numero_ordem,
            ano_referencia: matriculaData.ano_referencia,
            matricula_pfm: matriculaData.display,
            status: "efetivada",
            efetivada_em: new Date().toISOString()
          });
          
            toast.success(`Matrícula ${matriculaData.display} efetivada com sucesso! Aluno inserido no pelotão.`);
            
            // Redirecionar para a listagem após sucesso
            setTimeout(() => {
              router.push("/pre-matriculas");
            }, 2000);
          } catch (error: any) {
        toast.error(error.message || "Erro ao efetivar matrícula");
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const healthQuestions = [
    { name: "health_1_plano_saude", label: "Possui plano de saúde?" },
    { name: "health_2_vacina_covid", label: "Vacinado contra COVID-19?" },
    { name: "health_3_assistencia_social", label: "Recebe assistência social?" },
    { name: "health_4_psicologo", label: "Faz acompanhamento psicológico?" },
    { name: "health_5_transtorno_psiquico", label: "Possui transtorno psíquico?" },
    { name: "health_6_algum_problema", label: "Possui algum problema de saúde?" },
    { name: "health_7_epiletico", label: "É epilético?" },
    { name: "health_8_diabetico", label: "É diabético?" },
    { name: "health_9_atividade_fisica", label: "Pratica atividade física?" },
    { name: "health_10_restricao_alimentar", label: "Possui restrição alimentar?" },
    { name: "health_11_acompanhamento_nutricional", label: "Faz acompanhamento nutricional?" },
    { name: "health_12_alergia", label: "Possui alguma alergia?" },
    { name: "health_13_medicamento", label: "Usa algum medicamento?" },
    { name: "health_14_cirurgia", label: "Já fez alguma cirurgia?" },
  ];

  const formData = form.getValues();
  const printData = { ...preMatricula, ...formData };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate + "T00:00:00");
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const studentAge = calculateAge(form.watch("data_nascimento"));
  const isAgeValid = studentAge !== null && studentAge >= 6 && studentAge <= 17;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-zinc-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white">Efetivar Matrícula</h1>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          {preMatricula?.matricula_pfm || preMatricula?.chave_acesso}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="pessoais" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <User className="w-4 h-4" /> Pessoais
            </TabsTrigger>
            <TabsTrigger value="familiares" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <Users className="w-4 h-4" /> Familiares
            </TabsTrigger>
            <TabsTrigger value="endereco" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <Home className="w-4 h-4" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="responsaveis" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <ShieldCheck className="w-4 h-4" /> Responsáveis
            </TabsTrigger>
            <TabsTrigger value="saude" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <Heart className="w-4 h-4" /> Saúde
            </TabsTrigger>
            <TabsTrigger value="revisao" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex gap-2">
              <CheckCircle2 className="w-4 h-4" /> Revisão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pessoais">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Dados Pessoais</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome de Guerra *</Label>
                  <Input {...form.register("nome_guerra")} placeholder="Ex: MIRIM SILVA" className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome Completo</Label>
                  <Input {...form.register("nome_completo")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} readOnly />
                </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Data de Nascimento</Label>
                    <Input {...form.register("data_nascimento")} type="date" className="bg-zinc-800 border-zinc-700 text-white" />
                    {studentAge !== null && (
                    <div className={`flex items-center gap-2 mt-1 text-xs ${isAgeValid ? 'text-emerald-500' : 'text-red-500'}`}>
                      {!isAgeValid && <AlertTriangle className="w-3 h-3" />}
                      <span>Idade: {studentAge} anos {!isAgeValid && '(Fora da faixa permitida: 6-17 anos)'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Sexo *</Label>
                  <Select onValueChange={(val) => form.setValue("gender", val)} value={form.watch("gender")}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Tipo Sanguíneo</Label>
                    <Select onValueChange={(val) => form.setValue("blood_type", val)} value={form.watch("blood_type")}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não informado"].map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                    </Select>
                  </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">WhatsApp do Aluno</Label>
                  <Input {...form.register("whatsapp")} placeholder="(00) 00000-0000" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label className="text-zinc-400">Turma *</Label>
                  <Select onValueChange={(val) => form.setValue("turma_id", val)} value={form.watch("turma_id")}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {turmas.map(turma => (
                        <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="familiares">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Dados Familiares</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome da Mãe</Label>
                  <Input {...form.register("mother_name")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Nome do Pai</Label>
                  <Input {...form.register("father_name")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Renda Familiar</Label>
                    <Select onValueChange={(val) => form.setValue("family_income", val)} value={form.watch("family_income")}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione a renda" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Menor que 1 MIL">Menor que 1 MIL</SelectItem>
                        <SelectItem value="Entre 1 A 4 MIL">Entre 1 A 4 MIL</SelectItem>
                        <SelectItem value="Superior que 4 MIL">Superior que 4 MIL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Endereço</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-zinc-400">Rua</Label>
                  <Input {...form.register("address_street")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Número</Label>
                  <Input {...form.register("address_number")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Bairro</Label>
                  <Input {...form.register("address_neighborhood")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Cidade</Label>
                  <Input {...form.register("address_city")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">CEP</Label>
                  <Input {...form.register("address_cep")} className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responsaveis">
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Responsável 1 (Principal)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Nome *</Label>
                    <Input {...form.register("guardian1_name")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">CPF *</Label>
                    <Input {...form.register("guardian1_cpf")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Título de Eleitor</Label>
                    <Input {...form.register("guardian1_titulo")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">WhatsApp *</Label>
                    <Input {...form.register("guardian1_whatsapp")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Responsável 2 (Opcional)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Nome</Label>
                    <Input {...form.register("guardian2_name")} className="bg-zinc-800 border-zinc-700 text-white uppercase" style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">CPF</Label>
                    <Input {...form.register("guardian2_cpf")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Título de Eleitor</Label>
                    <Input {...form.register("guardian2_titulo")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400">WhatsApp</Label>
                    <Input {...form.register("guardian2_whatsapp")} className="bg-zinc-800 border-zinc-700 text-white" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="saude">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Informações de Saúde</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {healthQuestions.map((q) => (
                        <div key={q.name} className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                            <Checkbox 
                              id={q.name} 
                              checked={form.watch(q.name as any)}
                              onCheckedChange={(checked) => form.setValue(q.name as any, checked === true)}
                              className="border-zinc-700 data-[state=checked]:bg-emerald-600"
                            />
                            <Label htmlFor={q.name} className="text-zinc-300 cursor-pointer flex-1">{q.label}</Label>
                          </div>
                            {form.watch(q.name as any) && (
                              <div className="pl-10 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-xs text-emerald-500 mb-1 block">Descreva detalhes (Opcional)</Label>
                                <Input 
                                  {...form.register(`health_descriptions.${q.name}` as any)}
                                  placeholder="Descreva aqui..." 
                                  className="bg-zinc-800 border-emerald-500/30 text-white h-9 text-sm"
                                />
                              </div>
                            )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revisao">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Revisão e Finalização</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                    <h3 className="text-emerald-500 font-bold text-xl mb-2">Confirmação de Dados</h3>
                    <p className="text-zinc-400 text-sm">
                      Verifique se todas as informações estão corretas antes de efetivar. 
                      Após a efetivação, será gerada a Matrícula PFM (XX/AA) e o registro será movido para o módulo de Alunos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-zinc-800/50 border-zinc-700 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <UserCheck className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">Conta do Aluno</h4>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Acesso ao sistema</p>
                          </div>
                        </div>
                        <Switch 
                          checked={createStudentAcc}
                          onCheckedChange={setCreateStudentAcc}
                        />
                      </div>
                      {createStudentAcc && (
                        <div className="space-y-3 pt-3 border-t border-zinc-700">
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">E-mail de Acesso</Label>
                            <Input 
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              placeholder="matricula@pfm.com"
                              className="bg-zinc-900 border-zinc-700 text-white h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Senha</Label>
                            <Input 
                              value={studentPassword}
                              onChange={(e) => setStudentPassword(e.target.value)}
                              placeholder="pfmbrasil"
                              className="bg-zinc-900 border-zinc-700 text-white h-9"
                            />
                          </div>
                          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-[10px] text-blue-400">
                              <Key className="w-3 h-3 inline mr-1" />
                              Padrão: matricula@pfm.com / pfmbrasil
                            </p>
                          </div>
                        </div>
                      )}
                    </Card>

                    <Card className="bg-zinc-800/50 border-zinc-700 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                            <Users className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">Conta do Responsável</h4>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Acesso ao sistema</p>
                          </div>
                        </div>
                        <Switch 
                          checked={createGuardianAcc}
                          onCheckedChange={setCreateGuardianAcc}
                        />
                      </div>
                      {createGuardianAcc && (
                        <div className="space-y-3 pt-3 border-t border-zinc-700">
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">CPF (Login)</Label>
                            <Input 
                              value={guardianCpf}
                              onChange={(e) => setGuardianCpf(e.target.value.replace(/\D/g, ""))}
                              placeholder="00000000000"
                              maxLength={11}
                              className="bg-zinc-900 border-zinc-700 text-white h-9 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-zinc-400 text-xs">Senha</Label>
                            <Input 
                              value={guardianPassword}
                              onChange={(e) => setGuardianPassword(e.target.value)}
                              placeholder="pfmbrasil"
                              className="bg-zinc-900 border-zinc-700 text-white h-9"
                            />
                          </div>
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                              <p className="text-[10px] text-amber-400">
                                <Key className="w-3 h-3 inline mr-1" />
                                Padrão: CPF@pfm.com / pfmbrasil
                              </p>
                            </div>
                        </div>
                      )}
                    </Card>
                  </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-zinc-400">Nome do Atendente</Label>
                      <Select onValueChange={(val) => form.setValue("attendant_name", val)} value={form.watch("attendant_name")}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecione o atendente" />
                        </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            {instrutores.map(inst => (
                              <SelectItem key={inst.id} value={inst.full_name || inst.war_name}>
                                {inst.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-400">Turma Selecionada</Label>
                        <Input 
                          value={turmas.find(t => t.id === form.watch("turma_id"))?.nome || "Nenhuma turma selecionada"} 
                          className="bg-zinc-800 border-zinc-700 text-white" 
                          readOnly 
                        />
                      </div>
                    </div>
  
                  <div className="pt-6 flex gap-4">
                    {!isAgeValid && (
                      <div className="w-full mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-bold">Idade fora da faixa permitida (6-17 anos). Não é possível efetivar.</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit" disabled={saving || !isAgeValid} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? "Salvando..." : "Efetivar"}
                    </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-zinc-700 text-zinc-400 h-12"
                    onClick={() => setShowPrintDialog(true)}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Pré-visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Pré-visualização da Ficha
              <Button onClick={() => handlePrint()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </DialogTitle>
          </DialogHeader>
          <PrintableEnrollmentSheet ref={printRef} data={printData} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
