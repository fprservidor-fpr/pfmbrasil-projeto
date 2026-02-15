"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { openExternalLink } from "@/lib/utils";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  MessageSquare, 
  Loader2, 
  BadgeCheck, 
  User, 
  Calendar, 
  Fingerprint, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  ExternalLink, 
  GraduationCap, 
  Camera 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ConsultationContent() {
  const searchParams = useSearchParams();
  const [chave, setChave] = useState(searchParams.get("chave") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const chaveFromUrl = searchParams.get("chave");
    if (chaveFromUrl) {
      setChave(chaveFromUrl);
      performSearch(chaveFromUrl);
    }
  }, [searchParams]);

  const performSearch = async (chaveToSearch: string) => {
    if (!chaveToSearch) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("pre_matriculas")
        .select("*")
        .eq("chave_acesso", chaveToSearch.toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast.error("Chave não encontrada ou já efetivada.");
        } else {
          throw error;
        }
      } else {
        setResult(data);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar chave");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(chave);
  };

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col p-4 md:p-8">
        <div className="max-w-4xl mx-auto w-full">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

            <Card className="bg-zinc-900 border-zinc-800 mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Search className="text-emerald-500 w-8 h-8" />
                    <CardTitle className="text-2xl text-white">Consultar Inscrição</CardTitle>
                  </div>
                  <CardDescription className="text-zinc-400">
                    Digite sua chave PFM-XXXX para verificar o status e a data do agendamento.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => openExternalLink("https://wa.me/5586999945135")}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  placeholder="Ex: PFM-0001"
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-lg uppercase"
                  maxLength={8}
                />
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
              <Card className="bg-zinc-900 border-emerald-500/30 overflow-hidden shadow-2xl">
                <div className="bg-emerald-500/10 p-6 border-b border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                      <BadgeCheck className="text-emerald-500 w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-white font-black text-xl tracking-tight uppercase">Inscrição Localizada</h2>
                      <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest">Código: {result.chave_acesso}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500 text-white text-sm font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {result.status}
                  </div>
                </div>

                <CardContent className="p-8 space-y-10">
                  {/* Seção Principal: Aluno e Responsável */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-zinc-800/30 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="text-emerald-500 w-5 h-5" />
                        <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">Dados do Aluno</h3>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white text-xl font-bold uppercase">{result.nome_completo}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(result.data_nascimento + "T12:00:00"), "dd/MM/yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Fingerprint className="w-4 h-4" />
                            {result.idade} anos
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-zinc-800/30 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-emerald-500 w-5 h-5" />
                        <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest">Dados do Responsável</h3>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white text-xl font-bold uppercase">{result.responsavel_nome}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Phone className="w-4 h-4" />
                            {result.responsavel_whatsapp}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Fingerprint className="w-4 h-4" />
                            CPF: {result.responsavel_cpf}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agendamento e Localização */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Comparecimento Agendado</h4>
                      <div className="bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-700 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <Calendar className="text-emerald-500 w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white text-2xl font-black uppercase tracking-tighter">
                            {format(new Date(result.data_agendamento + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-emerald-500 font-bold text-sm">Atendimento: {result.horario_agendamento || "08:00 às 17:00"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Local de Entrega</h4>
                      <div className="bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-700 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          <MapPin className="text-emerald-500 w-8 h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold leading-tight">Q.23A, Rua Arnaldo Lacerda, 1496</p>
                          <p className="text-zinc-500 text-xs">Parque Piauí, Teresina - PI</p>
                          <a 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                            openExternalLink("https://bit.ly/localizacaofpr");

                            }}
                            className="text-emerald-500 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2 mt-2"
                          >
                            Abrir no GPS <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documentação e Informações de Valor */}
                  <div className="bg-zinc-800/20 rounded-[2.5rem] border border-zinc-800 p-8 space-y-8">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="text-emerald-500 w-6 h-6" />
                      <h3 className="text-white font-black uppercase tracking-widest text-lg">O que trazer para finalizar:</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h4 className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          Documentos do Aluno(a)
                        </h4>
                        <ul className="space-y-3">
                          {['Certidão de Nascimento (cópia)', '2 fotos 3x4'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                              <BadgeCheck className="w-4 h-4 text-emerald-500/50" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          Documentos do Responsável
                        </h4>
                        <ul className="space-y-3">
                          {['RG e CPF (cópias)', 'Título de Eleitor (cópia)', 'Comprovante de Residência (cópia)'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                              <BadgeCheck className="w-4 h-4 text-emerald-500/50" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-800">
                      <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10">
                        <p className="text-zinc-400 italic text-sm leading-relaxed">
                          <span className="text-emerald-500 font-black not-italic uppercase tracking-widest mr-2">Informação sobre Doação:</span> 
                          Em relação ao valor, esclarecemos que <span className="text-white font-black uppercase">*NÃO*</span> se trata de um pagamento, mas sim de uma <span className="text-white font-black uppercase">*doação mensal*</span> no valor de <span className="text-white font-black uppercase text-emerald-500">*R$40,00 (somente em espécie)*</span>, a ser <span className="text-white font-black uppercase">*iniciada*</span> no momento da entrega da documentação de matrícula.
                        </p>
                        <p className="text-zinc-500 text-xs mt-4 font-medium">
                          Para mais informações no ato da matrícula, a coordenação estará presente para esclarecer todas as dúvidas. Estamos à disposição para ajudar! 🌟
                        </p>
                      </div>
                      
                      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-emerald-500/50 font-black uppercase tracking-[0.2em] text-[10px]">
                          <Camera className="w-4 h-4" />
                          Tire um print desta tela para consulta rápida
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-zinc-500 hover:text-white uppercase font-black tracking-widest text-[10px]"
                          onClick={() => window.print()}
                        >
                          Versão para Impressão
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black h-16 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
                      onClick={() => {
                        const formattedDate = format(new Date(result.data_agendamento + "T12:00:00"), "PPPP", { locale: ptBR });
                        const scheduleTime = result.horario_agendamento || "08:00 às 17:00";
                          const msg = encodeURIComponent(`*Consulta de Matrícula*\n\nOlá, gostaria de informações sobre a matrícula do aluno *${result.nome_completo}* (Chave: ${result.chave_acesso}).\n\n📅 Agendamento: ${formattedDate}\n🕒 Horário: ${scheduleTime}`);
                          openExternalLink(`https://wa.me/5586999945135?text=${msg}`);
                        }}

                    >
                      <MessageSquare className="w-5 h-5 mr-3" />
                      Dúvidas? Falar no WhatsApp
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="md:w-1/3 border-zinc-800 bg-zinc-900/50 text-zinc-400 font-black h-16 rounded-2xl hover:bg-zinc-800 hover:text-white transition-all uppercase tracking-[0.2em] text-xs"
                      asChild
                    >
                      <Link href="/">
                        Voltar ao Início
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  export default function ConsultationPage() {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }>
        <ConsultationContent />
      </Suspense>
    );
  }
