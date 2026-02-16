"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Award,
  ChevronRight,
  User,
  Lock,
  UserCheck,
  GraduationCap,
  Mail,
  Key,
  Copy,
  Headset,
  Phone,
  CalendarCheck,
  LineChart,
  BookOpen,
  Bell,
  FileText,
  Download,
  Info
} from "lucide-react";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";
import { FixedActionBar } from "@/components/FixedActionBar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!", {
      description: `${text} copiado para a área de transferência.`,
      duration: 2000,
    });
  };

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
            <Link href="#acesso" className="hover:text-yellow-400 transition-colors">Portal</Link>
            <Link href="#recursos" className="hover:text-yellow-400 transition-colors">Recursos</Link>
          </div>

          <Link href="/login">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full px-6 transition-all border border-zinc-800/50 font-bold uppercase text-xs">
              Acesso Restrito
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section id="inicio" className="px-4 pt-20 pb-32 md:pt-32 md:pb-48 text-center max-w-6xl mx-auto">
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

        {/* Access Instructions Section */}
        <section id="acesso" className="py-24 bg-zinc-900/30 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-400/[0.02] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Lock className="w-3 h-3" />
                <span>Portal de Acesso</span>
              </motion.div>
              <motion.h2 {...fadeInUp} className="text-4xl md:text-5xl font-black mb-4 uppercase italic tracking-tighter">
                COMO ACESSAR SUA CONTA <span className="text-yellow-400">PFM</span>?
              </motion.h2>
              <motion.p {...fadeInUp} className="text-zinc-500 font-medium">Siga as instruções abaixo de acordo com seu perfil de acesso</motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Responsável Card */}
              <motion.div
                {...fadeInUp}
                className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 hover:border-yellow-400/30 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <UserCheck className="w-32 h-32 text-white" />
                </div>

                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-500">
                    <UserCheck className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sou Responsável</h3>
                  <p className="text-zinc-500 text-sm font-medium">Acesse para acompanhar o desenvolvimento do seu filho(a)</p>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">01</div>
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-400">
                        <Mail className="w-3.5 h-3.5" /> E-mail de Acesso
                      </h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">Digite seu número de CPF (somente números) seguido de <strong className="text-white">@pfm.com</strong></p>

                      <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/code gap-4">
                        <code className="text-yellow-400 font-mono text-xs md:text-sm font-bold truncate">12345678900@pfm.com</code>
                        <button
                          onClick={() => copyToClipboard('12345678900@pfm.com')}
                          className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black text-yellow-500 rounded-xl transition-all active:scale-90"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">02</div>
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-400">
                        <Key className="w-3.5 h-3.5" /> Senha de Acesso
                      </h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">Utilize a senha padrão fornecida pela administração do PFM para o seu primeiro acesso.</p>
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-blue-200/80 leading-relaxed font-medium">Após o primeiro login, você deve alterar sua senha para uma senha pessoal e segura.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Aluno Card */}
              <motion.div
                {...fadeInUp}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 hover:border-yellow-400/30 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <GraduationCap className="w-32 h-32 text-white" />
                </div>

                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-500">
                    <GraduationCap className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Sou Aluno</h3>
                  <p className="text-zinc-500 text-sm font-medium">Acesse sua área para ver materiais e atividades</p>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">01</div>
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-400">
                        <Mail className="w-3.5 h-3.5" /> E-mail de Acesso
                      </h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">Digite seu número de matrícula seguido de <strong className="text-white">@pfm.com</strong></p>

                      <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/code gap-4">
                        <code className="text-yellow-400 font-mono text-xs md:text-sm font-bold truncate">0126@pfm.com</code>
                        <button
                          onClick={() => copyToClipboard('0126@pfm.com')}
                          className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500 hover:text-black text-yellow-500 rounded-xl transition-all active:scale-90"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-yellow-400 font-black text-sm">02</div>
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest text-yellow-400">
                        <Key className="w-3.5 h-3.5" /> Senha de Acesso
                      </h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">Utilize a senha padrão fornecida pela administração para seu primeiro login no sistema.</p>
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex gap-4">
                        <Info className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-yellow-200/80 leading-relaxed font-medium">Após o primeiro login, altere sua senha para uma senha segura de sua preferência.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Help Box */}
            <motion.div
              {...fadeInUp}
              className="mt-16 max-w-4xl mx-auto bg-gradient-to-r from-zinc-900 to-zinc-800 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                <Headset className="w-8 h-8 text-black" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black uppercase tracking-tight mb-1 text-yellow-400">Precisa de Ajuda?</h3>
                <p className="text-zinc-400 text-sm font-medium">Nossa equipe de suporte está pronta para auxiliá-lo</p>
              </div>
              <Link
                href="https://api.whatsapp.com/send/?phone=5586999945135&text&type=phone_number&app_absent=0"
                target="_blank"
                className="flex items-center gap-3 px-6 py-3 bg-zinc-950 border border-white/10 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all group font-black uppercase text-xs tracking-widest"
              >
                <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Suporte WhatsApp
              </Link>
            </motion.div>
          </div>
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
                className="p-8 bg-zinc-900/40 border border-white/5 rounded-3xl hover:border-yellow-400/30 transition-all group"
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

        {/* Downloads Section */}
        <section className="py-24 px-4 bg-zinc-900/10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <motion.div {...fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                <Download className="w-3.5 h-3.5" />
                <span>Documentos</span>
              </motion.div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-4 italic">Arquivos Disponíveis para <span className="text-yellow-400">Download</span></h2>
              <p className="text-zinc-500 font-medium">Acesse e baixe documentos importantes do Programa Força Mirim</p>
            </div>

            <motion.div
              {...fadeInUp}
              className="p-1 px-1 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem]"
            >
              <div className="bg-zinc-950 rounded-[2.4rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 hover:bg-zinc-900/50 transition-colors">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-10 h-10 text-red-500" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h4 className="text-2xl font-black uppercase tracking-tight mb-1">Ficha de Avaliação Mensal 2026</h4>
                    <p className="text-zinc-500 text-sm font-medium">Documento oficial para avaliação mensal do desempenho dos alunos</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </span>
                    <span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-lg text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5" /> 2026
                    </span>
                  </div>
                </div>
                <Link
                  href="https://drive.google.com/file/d/1LVK9c7BNfs0bfbPPIPlJunnBme6DkQiK/view?usp=sharing"
                  target="_blank"
                  className="w-full md:w-auto px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Baixar
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.h2
              {...fadeInUp}
              className="text-5xl md:text-7xl font-black mb-8 uppercase italic leading-none"
            >
              FAÇA PARTE DA FAMÍLIA <br /> <span className="text-yellow-400 drop-shadow-2xl">PFM</span>
            </motion.h2>
            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12"
            >
              Transforme o futuro do seu filho através da educação de qualidade e valores que formam cidadãos conscientes.
            </motion.p>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <Link href="/login">
                <Button size="xl" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-12 h-20 rounded-3xl shadow-2xl shadow-yellow-500/10 text-xl group transition-all hover:scale-105 active:scale-95 border-b-4 border-yellow-700 active:border-b-0 uppercase tracking-tighter italic">
                  Acessar Sistema PFM Digital
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
