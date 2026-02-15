import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Award, 
  ChevronRight,
  MapPin,
  User
} from "lucide-react";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-yellow-400/30 overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <StarField />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <header className="sticky top-0 z-50 p-4 md:p-6 backdrop-blur-md border-b border-zinc-800/50 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center border border-yellow-400/20 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="text-yellow-400 w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none">PFM SYSTEM</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Força Mirim</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#inicio" className="hover:text-yellow-400 transition-colors">Início</Link>
            <Link href="#contato" className="hover:text-yellow-400 transition-colors">Contato</Link>
          </div>

          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full px-6 transition-all border border-zinc-800/50">
              Acesso Restrito
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <section id="inicio" className="px-4 pt-20 pb-32 md:pt-32 md:pb-48 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Award className="w-3 h-3" />
            <span>FUNDAÇÃO POPULUS RATIONABILIS</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            PROGRAMA <br />
            <span className="bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text text-transparent">FORÇA MIRIM</span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            O Programa Força Mirim - PFM é um projeto social que capacita os jovens com conhecimento técnico, teórico e com valores essenciais para nossa sociedade. Aqui, jovens entre 06 a 17 anos tem acesso há uma variedade de programas e projetos adequados para cada tipo e nível de aprendizado. Nossas aulas práticas são projetadas para fornecer habilidades e os conhecimentos necessários para prosperar na carreira do(a) aluno(a).
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/pre-matricula" className="w-full md:w-auto">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-10 h-14 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all hover:scale-105 active:scale-95 w-full">
                Realizar Pré-Matrícula
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/consultar" className="w-full md:w-auto">
              <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/50 text-white font-bold px-10 h-14 rounded-2xl hover:bg-zinc-800 transition-all w-full">
                Consultar Status
              </Button>
            </Link>
            <Link href="/login" className="w-full md:w-auto">
              <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/50 text-white font-bold px-10 h-14 rounded-2xl hover:bg-zinc-800 transition-all w-full flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-400" />
                ACESSAR ÁREA DO ALUNO/RESPONSÁVEL
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <AveroFooter />
    </div>
  );
}

