"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, Phone, FileText, X, MapPin, ExternalLink, Camera, MessageSquare, ShieldCheck, Heart } from "lucide-react";
import { cn, openExternalLink } from "@/lib/utils";
import { Button } from "./ui/button";

interface EnrollmentDetailsModalProps {
  enrollment: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollmentDetailsModal({ enrollment, isOpen, onClose }: EnrollmentDetailsModalProps) {
  if (!enrollment) return null;

    const handleWhatsApp = () => {
      const dateStr = enrollment.data_agendamento ? format(new Date(enrollment.data_agendamento + "T12:00:00"), "dd/MM/yyyy") : "---";
      const msg = encodeURIComponent(`*Detalhes da Pré-Matrícula*\n\nOlá, gostaria de tratar sobre a matrícula do aluno *${enrollment.nome_completo}* (Chave: ${enrollment.chave_acesso}).\nAgendamento: ${dateStr}`);
      const whatsappNumber = enrollment.responsavel_whatsapp?.replace(/\D/g, "");
      const url = `https://wa.me/55${whatsappNumber}?text=${msg}`;
      openExternalLink(url);
    };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f2e] border-zinc-800 text-white max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-xl font-bold">Detalhes da Pré-Matrícula</DialogTitle>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* ID Militar Highlight */}
          <div className="bg-[#11141d] p-5 rounded-xl border border-zinc-800/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-12 h-12 text-amber-500" />
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Chave de Identificação</p>
            <p className="text-3xl font-black text-amber-500 flex items-center gap-3">
              {enrollment.chave_acesso} 
              <span className="text-white text-xl font-bold uppercase">{enrollment.nome_guerra || enrollment.nome_completo.split(' ')[0]}</span>
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">
              <Camera className="w-3 h-3" />
              Tire um print desta tela para consulta
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados do Aluno */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <User className="w-4 h-4" />
                <h3 className="uppercase tracking-wide text-sm">Dados do Aluno</h3>
              </div>
              <div className="bg-[#11141d] p-4 rounded-xl border border-zinc-800/50 space-y-4">
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Nome Completo</p>
                  <p className="font-bold uppercase text-sm leading-tight">{enrollment.nome_completo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Nascimento</p>
                    <p className="font-bold text-sm">
                      {enrollment.data_nascimento ? format(new Date(enrollment.data_nascimento + "T12:00:00"), "dd/MM/yyyy") : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Idade</p>
                    <p className="font-bold text-sm">{enrollment.idade} anos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Responsável */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Phone className="w-4 h-4" />
                <h3 className="uppercase tracking-wide text-sm">Responsável</h3>
              </div>
              <div className="bg-[#11141d] p-4 rounded-xl border border-zinc-800/50 space-y-4">
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Nome</p>
                  <p className="font-bold uppercase text-sm leading-tight">{enrollment.responsavel_nome}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">CPF</p>
                    <p className="font-bold text-sm">{enrollment.responsavel_cpf || "---"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">WhatsApp</p>
                    <button 
                      onClick={handleWhatsApp}
                      className="font-bold text-sm text-emerald-500 hover:underline flex items-center gap-1"
                    >
                      {enrollment.responsavel_whatsapp || "---"}
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agendamento e Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Calendar className="w-4 h-4" />
                <h3 className="uppercase tracking-wide text-sm">Agendamento</h3>
              </div>
              <div className="bg-[#11141d] p-4 rounded-xl border border-zinc-800/50 flex items-center gap-4">
                <div className="bg-amber-500/10 p-3 rounded-lg shrink-0">
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Data Agendada</p>
                  <p className="text-lg font-bold leading-tight">
                    {enrollment.data_agendamento ? format(new Date(enrollment.data_agendamento + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "---"}
                  </p>
                  <p className="text-zinc-500 text-[10px] font-bold">Horário: 08:00 às 17:00</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <MapPin className="w-4 h-4" />
                <h3 className="uppercase tracking-wide text-sm">Localização</h3>
              </div>
              <div className="bg-[#11141d] p-4 rounded-xl border border-zinc-800/50 flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-lg shrink-0">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Endereço de Entrega</p>
                  <p className="text-white text-[11px] font-bold leading-tight mb-1">Rua Arnaldo Lacerda, 1496 - Pq. Piauí</p>
                  <a 
                    href="https://bit.ly/localizacaofpr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 text-[10px] font-bold hover:underline flex items-center gap-1"
                  >
                    Abrir no Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* O que trazer */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-4">
            <h4 className="text-emerald-500 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
              <FileText className="w-4 h-4" />
              O que trazer para finalizar:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-zinc-300 text-xs font-bold border-b border-emerald-500/10 pb-1">📄 Documentos Aluno(a)</p>
                <ul className="text-zinc-400 text-xs space-y-1">
                  <li className="flex items-center gap-2">• Certidão de Nascimento (cópia)</li>
                  <li className="flex items-center gap-2">• 2 fotos 3x4</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-300 text-xs font-bold border-b border-emerald-500/10 pb-1">👤 Documentos Responsável</p>
                <ul className="text-zinc-400 text-xs space-y-1">
                  <li className="flex items-center gap-2">• RG e CPF (cópias)</li>
                  <li className="flex items-center gap-2">• Título de Eleitor (cópia)</li>
                  <li className="flex items-center gap-2">• Comprovante de Residência (cópia)</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500 font-bold">
                <Heart className="w-4 h-4 fill-emerald-500/20" />
                <span className="text-sm">Doação: R$ 40,00 (em espécie)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#11141d] border-t border-zinc-800 flex flex-col md:flex-row gap-3 shrink-0">
          <Button 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
            onClick={handleWhatsApp}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Enviar Mensagem WhatsApp
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            className="md:w-32 border-zinc-700 text-zinc-400 hover:text-white h-11"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
