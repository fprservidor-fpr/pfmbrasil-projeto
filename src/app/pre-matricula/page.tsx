"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { openExternalLink } from "@/lib/utils";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Loader2 as Spinner, 
  CheckCircle2, 
  Copy, 
  Camera, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  MessageSquare 
} from "lucide-react";

const WEEKDAY_MAP: Record<string, number> = {
  "Domingo": 0,
  "Segunda": 1,
  "Terça": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
  "Sábado": 6,
};

const formSchema = z.object({
  nome_completo: z.string().min(3, "Nome muito curto"),
  data_nascimento: z.string().refine((val) => {
    const today = new Date();
    const birth = new Date(val + "T00:00:00");
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 6 && age <= 17;
  }, "A idade deve ser entre 6 e 17 anos"),
  responsavel_nome: z.string().min(3, "Nome do responsável obrigatório"),
  responsavel_cpf: z.string().min(11, "CPF inválido"),
  responsavel_whatsapp: z.string().min(10, "WhatsApp inválido"),
  blood_type: z.string().min(1, "Selecione o tipo sanguíneo"),
  data_agendamento: z.string().min(1, "Selecione uma data para o agendamento"),
  horario_agendamento: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PreEnrollmentPage() {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [checkingConfig, setCheckingConfig] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from("configuracoes_sistema").select("*").single();
      setConfig(data);
      setCheckingConfig(false);
    }
    fetchConfig();
  }, []);

  const availableDates = useMemo(() => {
    if (!config) return [];
    
    if (config.modo_agendamento === "especifico") {
      return config.datas_especificas || [];
    }
    
    if (config.modo_agendamento === "fixo" && config.dias_semana_fixos?.length > 0) {
      const dates: any[] = [];
      const selectedDayNums = config.dias_semana_fixos.map((day: string) => WEEKDAY_MAP[day]);
      
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1); // Começar de amanhã

      // Tentar gerar até 2 datas nos próximos 45 dias
      for (let i = 0; i < 45; i++) {
        if (selectedDayNums.includes(currentDate.getDay())) {
          dates.push({
            date: format(currentDate, "yyyy-MM-dd"),
            startTime: config.horario_inicio_fixo || "08:00",
            endTime: config.horario_fim_fixo || "17:00"
          });
        }
        if (dates.length >= 2) break;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    }
    
    return [];
  }, [config]);

  const onSubmit = async (data: FormData) => {
    if (!config?.matriculas_abertas) {
      toast.error("As matrículas estão encerradas no momento.");
      return;
    }
    setLoading(true);
    try {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedKey = `PFM-${randomStr}`;

      const selectedDateConfig = availableDates.find((d: any) => d.date === data.data_agendamento);
      const horarioAgendamento = selectedDateConfig ? `${selectedDateConfig.startTime} às ${selectedDateConfig.endTime}` : "08:00 às 17:00";

        const birthDate = new Date(data.data_nascimento + "T00:00:00");
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }

        const { data: insertedData, error } = await supabase
          .from("pre_matriculas")
          .insert([{
            nome_completo: data.nome_completo,
            data_nascimento: data.data_nascimento,
            idade: calculatedAge,
          responsavel_nome: data.responsavel_nome,
          responsavel_cpf: data.responsavel_cpf,
          responsavel_whatsapp: data.responsavel_whatsapp,
          blood_type: data.blood_type,
          tipo_sanguineo: data.blood_type,
          chave_acesso: generatedKey,
          data_agendamento: data.data_agendamento,
          horario_agendamento: horarioAgendamento,
          status: "pendente"
        }])
        .select()
        .single();

      if (error) throw error;

      setSuccessData(insertedData);
      toast.success("Pré-matrícula realizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar pré-matrícula");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  if (checkingConfig) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (config && !config.matriculas_abertas) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="text-red-500 w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Matrículas Encerradas</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          O período de pré-matrículas para o Programa Forças Mirins está temporariamente encerrado. 
          Fique atento às nossas redes sociais para novas aberturas.
        </p>
        <Button asChild variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white">
          <Link href="/">Voltar ao Início</Link>
        </Button>
      </div>
    );
  }

  if (successData) {
    const whatsappNumber = "86999945135";
    const formattedDate = format(new Date(successData.data_agendamento + "T12:00:00"), "PPPP", { locale: ptBR });
    const scheduleTime = successData.horario_agendamento || "08:00 às 17:00";
    const whatsappMessage = encodeURIComponent(`*Matrícula Agendada* 👮‍♂️ 🇧🇷\n\nOlá *${successData.responsavel_nome}* do aluno(a) *${successData.nome_completo}*! 🚩\n\nSua matrícula para o *Programa Força Mirim ${new Date().getFullYear()}* está quase completa! Por favor, atente-se às informações abaixo para a entrega da documentação e doação:\n\n📅 *Data de entrega*: ${formattedDate}\n🕒 *Horário*: ${scheduleTime}\n📍 *Local*: Q.23A, Rua Arnaldo Lacerda, Nº1496 - Teresina-PI\n🗺️ *Link do Local*: https://bit.ly/localizacaofpr\n\n📄 *Documentos exigidos*:\n👦 *Aluno(a)*:\n- Certidão de Nascimento (cópia)\n- 2 fotos 3x4\n👨‍👩‍👧 *Responsável*:\n- RG e CPF (cópias)\n- Título de Eleitor (cópia)\n- Comprovante de Residência (cópia)\n\n🤝 *Doação*: *R$40,00* (em espécie), a ser entregue no ato da matrícula.`);

    const openWhatsApp = () => {
      const url = `https://wa.me/55${whatsappNumber}?text=${whatsappMessage}`;
      openExternalLink(url);
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-zinc-900 border-emerald-500/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white">Inscrição Realizada!</CardTitle>
            <CardDescription className="text-zinc-400">
              Guarde sua chave de acesso para consultar o status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />
              <p className="text-zinc-400 text-sm mb-1 uppercase tracking-wider">Chave de Acesso</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold text-emerald-500">{successData.chave_acesso}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => copyToClipboard(successData.chave_acesso)}
                  className="text-zinc-400 hover:text-white"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">
                <Camera className="w-3 h-3" />
                Tire um print desta tela
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                <Calendar className="text-emerald-500 w-6 h-6 mt-1" />
                <div>
                  <p className="text-white font-medium">Data e Horário Agendado</p>
                  <p className="text-zinc-400 text-sm">
                    {formattedDate}
                  </p>
                  <p className="text-emerald-500 text-xs font-bold mt-1">
                    Atendimento: {scheduleTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
                <MapPin className="text-emerald-500 w-6 h-6 mt-1" />
                <div className="flex-1">
                  <p className="text-white font-medium">Local de Entrega</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Q.23A, Rua Arnaldo Lacerda, Nº 1496 - Parque Piauí, Teresina - PI
                  </p>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      openExternalLink("https://bit.ly/localizacaofpr");
                    }}
                    className="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold mt-2 hover:underline"
                  >
                    Ver no Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20">
              <h4 className="text-emerald-500 font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                O que trazer:
              </h4>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-zinc-300 font-bold mb-1 text-xs uppercase tracking-wider">Documentos do Aluno(a):</p>
                  <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                    <li>Certidão de Nascimento (cópia)</li>
                    <li>2 fotos 3x4</li>
                  </ul>
                </div>

                <div>
                  <p className="text-zinc-300 font-bold mb-1 text-xs uppercase tracking-wider">Documentos do Responsável:</p>
                  <ul className="text-zinc-400 space-y-1 list-disc list-inside">
                    <li>RG e CPF (cópias)</li>
                    <li>Título de Eleitor (cópia)</li>
                    <li>Comprovante de Residência (cópia)</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-emerald-500/10">
                  <p className="text-zinc-400 italic text-xs leading-relaxed">
                    <span className="text-emerald-500 font-bold not-italic">Doação:</span> Em relação ao valor, esclarecemos que <span className="text-white font-bold">*NÃO*</span> se trata de um pagamento, mas sim de uma <span className="text-white font-bold">*doação mensal*</span> no valor de <span className="text-white font-bold">*R$40,00 (somente em espécie)*</span>, a ser <span className="text-white font-bold">*iniciada*</span> no momento da entrega da documentação de matrícula.
                  </p>
                  <p className="text-zinc-500 text-[10px] mt-2">
                    Para mais informações no ato da matrícula, a coordenação estará presente para esclarecer todas as dúvidas. Estamos à disposição para ajudar! 🌟
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex flex-col gap-3">
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-bold text-lg">
              <Link href={`/consultar?chave=${successData.chave_acesso}`}>
                Ver Informações Completas
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-12"
              onClick={openWhatsApp}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Falar com a Instituição
            </Button>

            <Button asChild variant="ghost" className="w-full text-zinc-500 hover:text-white">
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-500 w-8 h-8" />
                <CardTitle className="text-2xl text-white">Formulário de Pré-Matrícula</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hidden md:flex"
                onClick={() => openExternalLink("https://wa.me/5586999945135")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Dúvidas?
              </Button>
            </div>
            <CardDescription className="text-zinc-400">
              Preencha os dados básicos para iniciar o processo de inscrição.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome Completo do Aluno</Label>
                  <Input 
                    {...register("nome_completo")}
                    placeholder="Ex: JOÃO SILVA SANTOS"
                    className="bg-zinc-800 border-zinc-700 text-white uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.nome_completo && <p className="text-red-500 text-xs">{errors.nome_completo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Data de Nascimento</Label>
                  <Input 
                    {...register("data_nascimento")}
                    type="date"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.data_nascimento && <p className="text-red-500 text-xs">{errors.data_nascimento.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <h3 className="text-lg font-medium text-white">Dados do Responsável</h3>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome do Responsável</Label>
                  <Input 
                    {...register("responsavel_nome")}
                    placeholder="Ex: MARIA SILVA SANTOS"
                    className="bg-zinc-800 border-zinc-700 text-white uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.responsavel_nome && <p className="text-red-500 text-xs">{errors.responsavel_nome.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">CPF</Label>
                    <Input 
                      {...register("responsavel_cpf")}
                      placeholder="000.000.000-00"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {errors.responsavel_cpf && <p className="text-red-500 text-xs">{errors.responsavel_cpf.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Tipo Sanguíneo do Aluno</Label>
                    <Select onValueChange={(val) => setValue("blood_type", val)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não informado"].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.blood_type && <p className="text-red-500 text-xs">{errors.blood_type.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">WhatsApp</Label>
                  <Input 
                    {...register("responsavel_whatsapp")}
                    placeholder="(86) 99999-9999"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  {errors.responsavel_whatsapp && <p className="text-red-500 text-xs">{errors.responsavel_whatsapp.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-emerald-500 w-5 h-5" />
                  <h3 className="text-lg font-medium text-white">Agendamento Presencial</h3>
                </div>
                <p className="text-zinc-400 text-sm">
                  Escolha uma das datas disponíveis para comparecer à instituição e finalizar a matrícula.
                </p>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Data Disponível</Label>
                  <Select onValueChange={(val) => setValue("data_agendamento", val)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-12">
                      <SelectValue placeholder="Selecione uma data" />
                    </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {availableDates.map((d: any) => (
                          <SelectItem key={d.date} value={d.date}>
                            {format(new Date(d.date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: ptBR })} - {d.startTime} às {d.endTime}
                          </SelectItem>
                        ))}
                      </SelectContent>

                  </Select>
                  {errors.data_agendamento && <p className="text-red-500 text-xs">{errors.data_agendamento.message}</p>}
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12">
                {loading ? "Processando..." : "Realizar Pré-Matrícula"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
