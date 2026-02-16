"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Award,
  ChevronRight,
  CalendarCheck,
  LineChart,
  BookOpen,
  Bell
} from "lucide-react";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";
import { FixedActionBar } from "@/components/FixedActionBar";
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-yellow-400/30 overflow-x-hidden scroll-smooth pb-32">
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
            <Link href="#inicio" className="hover:text-yellow-400 transition-colors">Início</Link>
            <Link href="/portal" className="hover:text-yellow-400 transition-colors">Portal</Link>
            <Link href="#recursos" className="hover:text-yellow-400 transition-colors">Recursos</Link>
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
        <section id="inicio" className="px-4 pt-20 pb-32 md:pt-40 md:pb-60 text-center max-w-6xl mx-auto min-h-[80vh] flex flex-col items-center justify-center">
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
            className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            O Programa Força Mirim - PFM é um projeto social que capacita os jovens com conhecimento técnico, teórico e com valores essenciais para nossa sociedade. Nossas aulas práticas são projetadas para fornecer habilidades e os conhecimentos necessários para prosperar.
          </motion.p>
        </section>

        {/* Features Section */}
        <section id="recursos" className="py-32 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/5 border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Diferenciais</span>
            </motion.div>
            <motion.h2 {...fadeInUp} className="text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter">
              Recursos da Plataforma <span className="text-yellow-400">PFM Digital</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CalendarCheck, title: "Calendário Acadêmico", desc: "Acompanhe todas as atividades, eventos e prazos importantes em tempo real." },
              { icon: LineChart, title: "Boletim Online", desc: "Acesso instantâneo a frequência escolar e desempenho em todas as disciplinas." },
              { icon: BookOpen, title: "Material Didático", desc: "Biblioteca digital com conteúdos de apoio e recursos exclusivos para alunos." },
              { icon: Bell, title: "Notificações", desc: "Receba alertas instantâneos sobre eventos e comunicados diretamente na plataforma." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2rem] hover:border-yellow-400/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center mb-6 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h4 className="font-black uppercase tracking-tight text-lg mb-3">{feature.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Improved CTA Section */}
        <section className="py-32 px-4 relative overflow-hidden bg-zinc-900/10">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.h2
              {...fadeInUp}
              className="text-5xl md:text-7xl font-black mb-8 uppercase italic leading-none"
            >
              PRONTO PARA <br /> <span className="text-yellow-400 drop-shadow-2xl">EVOLUIR?</span>
            </motion.h2>
            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12"
            >
              Transforme o futuro através da educação. Explore nosso portal para mais informações ou inicie sua pré-matrícula agora.
            </motion.p>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <Link href="/portal">
                <Button size="xl" className="bg-zinc-900 border border-white/10 hover:border-yellow-400/50 text-white font-black px-12 h-20 rounded-3xl shadow-2xl text-xl group transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter italic">
                  Acessar Portal Informativo
                  <ChevronRight className="w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
      </main>

      <AveroFooter />
      <FixedActionBar />
    </div>
  );
}
