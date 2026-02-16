"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Award,
  ChevronRight,
  ClipboardCheck,
  Search,
  UserCircle
} from "lucide-react";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-yellow-400/30 overflow-x-hidden scroll-smooth">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <StarField />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <header className="sticky top-0 z-50 p-4 md:p-6 backdrop-blur-md border-b border-zinc-900/50 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center border border-yellow-400/20 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="text-yellow-400 w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none uppercase">PFM Digital</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Força Mirim</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400 uppercase tracking-widest">
            <Link href="#inicio" className="text-yellow-400 transition-colors">Início</Link>
            <Link href="/portal" className="hover:text-yellow-400 transition-colors">Portal</Link>
          </div>

          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-full px-6 transition-all border border-zinc-800/50 font-bold uppercase text-xs">
              Acesso Restrito
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section id="inicio" className="px-4 py-20 md:py-40 text-center max-w-6xl mx-auto min-h-[90vh] flex flex-col items-center justify-center">
          <motion.div
            {...fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FUNDAÇÃO POPULUS RATIONABILIS</span>
          </motion.div>

          <motion.h1
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-6xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.85] uppercase"
          >
            PROGRAMA <br />
            <span className="bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(234,179,8,0.2)]">FORÇA MIRIM</span>
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
          >
            O Programa Força Mirim - PFM é um projeto social que capacita os jovens com conhecimento técnico, teórico e com valores essenciais para nossa sociedade. Nossas aulas práticas são projetadas para fornecer habilidades e os conhecimentos necessários para prosperar.
          </motion.p>

          {/* Centralized Action Buttons - As requested in Image 3 */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 w-full"
          >
            <Link href="/pre-matricula" className="w-full md:w-auto">
              <Button size="xl" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-10 rounded-2xl w-full flex items-center gap-3 shadow-[0_10px_30px_rgba(234,179,8,0.2)]">
                <ClipboardCheck className="w-5 h-5" />
                PRÉ-MATRÍCULA
              </Button>
            </Link>

            <Link href="/consultar" className="w-full md:w-auto">
              <Button size="xl" variant="outline" className="bg-zinc-900/50 border-white/10 hover:border-yellow-400/50 text-white font-black px-10 rounded-2xl w-full flex items-center gap-3">
                <Search className="w-5 h-5 text-yellow-400" />
                CONSULTE PRÉ-MATRICULA
              </Button>
            </Link>

            <Link href="/portal" className="w-full md:w-auto">
              <Button size="xl" variant="outline" className="bg-zinc-900/50 border-white/10 hover:border-yellow-400/50 text-white font-black px-10 rounded-2xl w-full flex items-center gap-3">
                <UserCircle className="w-5 h-5 text-yellow-500" />
                SOU ALUNO/RESPONSÁVEL
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <AveroFooter />
    </div>
  );
}
