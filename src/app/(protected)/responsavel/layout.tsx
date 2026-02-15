"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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
    ShieldCheck,
    Users,
    ChevronDown,
    ClipboardEdit,
    FileSignature
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const responsibleNavItems = [
  {
    title: "Dossiê do Aluno",
    href: "/responsavel/dossie",
    icon: User,
    description: "Dados e informações do dependente",
    gradient: "from-blue-500 to-indigo-600"
  },
  {
    title: "Frequência",
    href: "/responsavel/frequencia",
    icon: CalendarCheck,
    description: "Controle de presença",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    title: "Comportamento",
    href: "/responsavel/comportamento",
    icon: Award,
    description: "Méritos e deméritos",
    gradient: "from-amber-500 to-orange-600"
  },
  {
    title: "Materiais",
    href: "/responsavel/materiais",
    icon: BookOpen,
    description: "Conteúdos didáticos",
    gradient: "from-violet-500 to-purple-600"
  },
  {
    title: "Calendário",
    href: "/responsavel/calendario",
    icon: Calendar,
    description: "Agenda institucional",
    gradient: "from-rose-500 to-pink-600"
  },
    {
      title: "Denúncias",
      href: "/responsavel/denuncias",
      icon: Megaphone,
      description: "Canal de ocorrências",
      gradient: "from-slate-500 to-zinc-600"
    },
      {
        title: "Alteração de Dados",
        href: "/responsavel/solicitar-alteracao",
        icon: ClipboardEdit,
        description: "Solicite atualização de dados",
        gradient: "from-purple-600 to-violet-700"
      },
      {
        title: "Minha Assinatura",
        href: "/cadastro-assinatura",
        icon: FileSignature,
        description: "Cadastrar assinatura digital",
        gradient: "from-teal-500 to-cyan-600"
      },
    ];

type Student = {
  id: string;
  nome_guerra: string;
  nome_completo: string;
  turma: string;
};

export default function ResponsibleLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (profile?.role === 'aluno') {
        router.push("/aluno/dossie");
    }
  }, [user, loading, router, profile]);

  useEffect(() => {
    if (profile?.cpf) {
      fetchStudents(profile.cpf);
    }
  }, [profile]);

  async function fetchStudents(cpf: string) {
    const normalizedCpf = cpf.replace(/\D/g, '').padStart(11, '0');
    const { data } = await supabase
      .from("students")
      .select("id, nome_guerra, nome_completo, turma")
      .or(`guardian1_cpf.eq.${normalizedCpf},guardian2_cpf.eq.${normalizedCpf},responsavel_cpf.eq.${normalizedCpf}`)
      .eq("status", "ativo");
    
    if (data) {
      setStudents(data);
      const savedId = sessionStorage.getItem("selectedStudentId");
      const current = data.find(s => s.id === savedId) || data[0];
      if (current) {
        setSelectedStudent(current);
        sessionStorage.setItem("selectedStudentId", current.id);
      }
    }
  }

  const handleSwitchStudent = (student: Student) => {
    setSelectedStudent(student);
    sessionStorage.setItem("selectedStudentId", student.id);
    window.location.reload();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentNav = responsibleNavItems.find(item => pathname === item.href);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white">Portal do Responsável</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Gestão de Dependentes</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {responsibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                  <Link
                    key={item.href}
                    href={item.href}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all relative group overflow-hidden",
                        isActive 
                          ? "text-white shadow-xl shadow-purple-500/20" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="relative z-20 mix-blend-plus-lighter">{item.title}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator-resp"
                          className={cn("absolute inset-0 z-10 bg-gradient-to-r", item.gradient)}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {students.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="max-w-[120px] truncate">{selectedStudent?.nome_guerra || "Selecionar Aluno"}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10 text-white">
                  <DropdownMenuLabel className="text-slate-400 text-[10px] uppercase tracking-wider">Seus Dependentes</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {students.map((student) => (
                    <DropdownMenuItem 
                      key={student.id}
                      onClick={() => handleSwitchStudent(student)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 p-3 focus:bg-blue-500/10 cursor-pointer",
                        selectedStudent?.id === student.id && "bg-blue-500/5"
                      )}
                    >
                      <span className={cn("font-bold", selectedStudent?.id === student.id ? "text-blue-400" : "text-slate-200")}>
                        {student.nome_guerra}
                      </span>
                      <span className="text-[10px] text-slate-500">{student.turma}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white leading-none">{profile?.full_name?.split(" ")[0]}</p>
                <p className="text-[10px] text-slate-500">Responsável</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-slate-400"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-white/10 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                    {profile?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{profile?.full_name?.split(" ")[0]}</p>
                    <p className="text-xs text-slate-500">Responsável</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Visualizando Aluno</p>
                  <div className="space-y-1">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSwitchStudent(student)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                          selectedStudent?.id === student.id 
                            ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                            : "bg-white/5 border-transparent text-slate-400"
                        )}
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold">{student.nome_guerra}</p>
                          <p className="text-[10px] opacity-70">{student.turma}</p>
                        </div>
                        {selectedStudent?.id === student.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <nav className="space-y-1">
                  {responsibleNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          isActive 
                            ? "bg-white/5 border border-white/10 text-white" 
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br", item.gradient)}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-white/5 mt-auto">
                <Button variant="ghost" onClick={() => signOut()} className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-20 pb-8 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {currentNav && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl", currentNav.gradient)}>
                  <currentNav.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">{currentNav.title}</h1>
                  <p className="text-slate-400">{currentNav.description}</p>
                </div>
              </div>
            </motion.div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
