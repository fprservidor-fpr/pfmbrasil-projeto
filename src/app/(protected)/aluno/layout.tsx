"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  User,
  CalendarCheck,
  Award,
  BookOpen,
  Calendar,
  Megaphone,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  Bell,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";

const studentNavItems = [
  {
    title: "Início",
    href: "/aluno",
    icon: GraduationCap,
    description: "Visão geral",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    title: "Meu Perfil",
    href: "/aluno/dossie",
    icon: User,
    description: "Dados acadêmicos",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    title: "Frequência",
    href: "/aluno/frequencia",
    icon: CalendarCheck,
    description: "Histórico",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    title: "Comportamento",
    href: "/aluno/comportamento",
    icon: Award,
    description: "Pontuação",
    gradient: "from-amber-500 to-orange-600"
  },
  {
    title: "Materiais",
    href: "/aluno/materiais",
    icon: BookOpen,
    description: "Estudos",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    title: "Calendário",
    href: "/aluno/calendario",
    icon: Calendar,
    description: "Eventos",
    gradient: "from-rose-500 to-pink-600"
  },
  {
    title: "Denúncias",
    href: "/aluno/denuncias",
    icon: Megaphone,
    description: "Ocorrências",
    gradient: "from-slate-500 to-zinc-600"
  },
  {
    title: "CEPFM",
    href: "/aluno/cepfm",
    icon: Trophy,
    description: "Ranking & Votos",
    gradient: "from-yellow-400 to-amber-600"
  },
];

const Background = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
  </div>
));
Background.displayName = "Background";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentNav = studentNavItems.find(item => pathname === item.href);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-violet-500/30">
      <Background />

      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-5"
      )}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/aluno" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight uppercase leading-none">Portal do Aluno</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">PFM DIGITAL</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            {studentNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative group",
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span className="relative z-10">{item.title}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-xl bg-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl hidden lg:flex group"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </Button>

            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl hidden sm:flex">
              <Bell className="w-4 h-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right">
                <p className="text-xs font-black text-white leading-none">{profile?.full_name?.split(" ")[0]}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Aluno Ativo</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-black text-violet-400">
                {profile?.full_name?.charAt(0) || "A"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="lg:hidden text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/50 backdrop-blur-2xl border-l border-white/5 z-[70] lg:hidden overflow-y-auto"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-white text-sm uppercase tracking-widest">Menu</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 space-y-2">
                {studentNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                        isActive
                          ? "bg-white/10 border-white/10 shadow-lg"
                          : "border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md",
                        item.gradient
                      )}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase tracking-widest">{item.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{item.description}</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-slate-700", isActive && "text-white")} />
                    </Link>
                  );
                })}
              </div>

              <div className="p-6 mt-auto border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={() => signOut()}
                  className="w-full justify-start gap-4 h-14 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Sair da Conta</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {currentNav && pathname !== "/aluno" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-br shadow-xl",
                  currentNav.gradient
                )}>
                  <currentNav.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{currentNav.title}</h1>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">{currentNav.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <Link href="/aluno" className="hover:text-white transition-colors">Portal</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-violet-400">{currentNav.title}</span>
              </div>
            </motion.div>
          )}
          {children}
        </div>
      </main>

      <footer className="relative z-10 py-10 px-4 border-t border-white/5 text-center">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} PROGRAMA FORÇA MIRIM • PFM DIGITAL
        </p>
      </footer>
    </div>
  );
}
