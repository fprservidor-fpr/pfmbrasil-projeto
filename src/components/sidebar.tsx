"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  CalendarCheck,
  FileSpreadsheet,
  Shield,
  Medal,
  Megaphone,
  Calendar,
  Database,
  ChevronLeft,
  Menu,
  BookOpen,
  UserCircle,
  ClipboardEdit,
  Key,
  ChevronRight,
  Heart,
  Shirt,
  Package as InventoryIcon,
  FileSignature,
  FileText,
  Trophy
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navSections = [
  {
    label: "Início",
    items: [
      {
        title: "Início",
        href: "/aluno",
        icon: LayoutDashboard,
        allowedRoles: ["aluno", "student"],
      },
      {
        title: "Início",
        href: "/responsavel/inicio",
        icon: LayoutDashboard,
        allowedRoles: ["guardian", "responsavel"],
      },
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],
      },
      {
        title: "Selecionar Aluno",
        href: "/selecionar-aluno",
        icon: Users,
        allowedRoles: ["guardian", "responsavel"],
      },
      {
        title: "Meu Dossiê",
        href: "/aluno/dossie",
        icon: UserCircle,
        allowedRoles: ["aluno", "student"],
      },
      {
        title: "Dossiê do Aluno",
        href: "/aluno/dossie",
        icon: UserCircle,
        allowedRoles: ["guardian", "responsavel"],
      },
    ]
  },
  {
    label: "Gestão Operacional",
    items: [
      {
        title: "Pré-Matrículas",
        href: "/pre-matriculas",
        icon: FileSpreadsheet,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
      {
        title: "Alunos",
        href: "/alunos",
        icon: Users,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
      {
        title: "Solicitações",
        href: "/solicitacoes",
        icon: ClipboardEdit,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Instrutores",
        href: "/instrutores",
        icon: ShieldCheck,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Turmas",
        href: "/turmas",
        icon: Shield,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
    ]
  },
  {
    label: "Controle Diário",
    items: [
      {
        title: "Frequência",
        href: "/frequencia",
        icon: CalendarCheck,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
      {
        title: "Saúde PFM",
        href: "/saude-pfm",
        icon: Heart,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor", "guardian", "responsavel", "aluno", "student"],
      },
      {
        title: "Reunião de Pais",
        href: "/reuniao-pais",
        icon: Users,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
      {
        title: "Doação",
        href: "/doacao",
        icon: Heart,
        allowedRoles: ["admin", "instrutor", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Doação de Material",
        href: "/doacao-material",
        icon: InventoryIcon,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],
      },
      {
        title: "Pedido de Fardamento",
        href: "/pedido-fardamento",
        icon: Shirt,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Comportamento",
        href: "/comportamento",
        icon: Medal,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
    ]
  },
  {
    label: "Assinaturas Digitais",
    items: [
      {
        title: "Gerenciar Assinaturas",
        href: "/cadastro-assinatura",
        icon: FileSignature,
        allowedRoles: ["admin", "coord_geral", "instrutor"],
      },
      {
        title: "Minha Assinatura",
        href: "/cadastro-assinatura",
        icon: FileSignature,
        allowedRoles: ["guardian", "responsavel"],
      },
      {
        title: "Termos Assinados",
        href: "/assinaturas",
        icon: FileText,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
    ]
  },
  {
    label: "Pedagógico",
    items: [
      {
        title: "Materiais de Estudo",
        href: "/materiais",
        icon: BookOpen,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor", "guardian", "responsavel"],
      },
      {
        title: "Materiais",
        href: "/aluno/materiais",
        icon: BookOpen,
        allowedRoles: ["aluno", "student"],
      },
      {
        title: "Calendário",
        href: "/calendario",
        icon: Calendar,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instructor", "instrutor", "guardian", "responsavel"],
      },
      {
        title: "Calendário Letivo",
        href: "/aluno/calendario",
        icon: Calendar,
        allowedRoles: ["aluno", "student"],
      },
    ]
  },
  {
    label: "Comunicação",
    items: [
      {
        title: "Gestão de Denúncias",
        href: "/denuncias",
        icon: Megaphone,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],

      },
      {
        title: "Minhas Denúncias",
        href: "/minhas-denuncias",
        icon: Megaphone,
        allowedRoles: ["guardian", "responsavel"],
      },
      {
        title: "Denúncias",
        href: "/aluno/denuncias",
        icon: Megaphone,
        allowedRoles: ["aluno", "student"],
      },
      {
        title: "Avisos e Comunicados",
        href: "/avisos",
        icon: Megaphone,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor", "guardian", "responsavel", "aluno", "student"],
      },
      {
        title: "Alteração de Dados",
        href: "/solicitar-alteracao",
        icon: ClipboardEdit,
        allowedRoles: ["guardian", "responsavel"],
      },
    ]
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Gestão do Sistema",
        href: "/gestao-sistema",
        icon: Database,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Gerenciar Contas",
        href: "/gerenciar-contas",
        icon: Key,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
      {
        title: "Configurações",
        href: "/configuracoes",
        icon: Settings,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo"],
      },
    ]
  },
  {
    label: "Eventos",
    items: [
      {
        title: "CEPFM 2026",
        href: "/cepfm2026",
        icon: Trophy,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor", "guardian", "responsavel", "aluno", "student"],
      },
      {
        title: "Gerenciar CEPFM",
        href: "/cepfmgerenciar",
        icon: ClipboardEdit,
        allowedRoles: ["admin", "coord_geral", "coord_nucleo", "instrutor"],
      },
    ]
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isMobileMenuOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobile = false,
  isMobileMenuOpen = false,
  onCloseMobile
}: SidebarProps) {
  const { profile, simulatedRole, signOut } = useAuth();
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingDenuncias, setPendingDenuncias] = useState(0);

  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "coord_geral" || profile?.role === "coord_nucleo") {
      fetchPendingRequests();
      fetchPendingDenuncias();
    }
  }, [profile]);

  async function fetchPendingRequests() {
    try {
      const { count, error } = await supabase
        .from("data_update_requests")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pendente");

      if (!error && count !== null) {
        setPendingRequests(count);
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações pendentes:", error);
    }
  }

  async function fetchPendingDenuncias() {
    try {
      const { count, error } = await supabase
        .from("denuncias")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pendente");

      if (!error && count !== null) {
        setPendingDenuncias(count);
      }
    } catch (error) {
      console.error("Erro ao buscar denúncias pendentes:", error);
    }
  }

  const sidebarVariants = {
    desktop: {
      width: isCollapsed ? 88 : 280,
    },
    mobile: {
      x: isMobileMenuOpen ? 0 : -320,
      width: 280,
    }
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={isMobile ? "mobile" : "desktop"}
        variants={sidebarVariants}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 text-zinc-100 flex flex-col z-50 overflow-hidden print:hidden",
          isMobile && "shadow-[20px_0_50px_rgba(0,0,0,0.8)]"
        )}
      >
        <div className={cn(
          "relative p-6 flex items-center justify-between",
          (isCollapsed && !isMobile) && "px-3 justify-center"
        )}>
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {(!isCollapsed || isMobile) ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 relative z-10"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] group cursor-pointer overflow-hidden relative">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Shield className="w-5 h-5 text-white relative z-10" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <h1 className="text-xl font-black text-white tracking-tighter">PFM</h1>
                    <span className="text-xl font-black text-violet-400 tracking-tighter">Digital</span>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.25em] mt-1">Polícia Forças Mirins</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="logo-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="text-white w-6 h-6 relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>


          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                "text-zinc-500 hover:text-white hover:bg-white/5 rounded-full h-8 w-8 relative z-10 border border-white/5 transition-all",
                isCollapsed && "rotate-180"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-8 mt-4 overflow-y-auto scrollbar-hide pb-10">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.allowedRoles || item.allowedRoles.includes(profile?.role || "")
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="space-y-2">
                {(!isCollapsed || isMobile) && (
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4 mb-3">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={isMobile ? onCloseMobile : undefined}
                        title={isCollapsed && !isMobile ? item.title : ""}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative group overflow-hidden",
                          isActive
                            ? "bg-violet-500/10 text-violet-400"
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5",
                          (isCollapsed && !isMobile) && "justify-center px-0"
                        )}
                      >
                        {isActive && (
                          <>
                            <motion.div
                              layoutId="sidebar-active-pill"
                              className="absolute left-0 w-1 h-6 bg-violet-400 rounded-r-full"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                            <div className="absolute inset-0 bg-violet-400/5 blur-xl" />
                          </>
                        )}
                        <item.icon className={cn(
                          "w-[20px] h-[20px] shrink-0 transition-all relative z-10",
                          isActive ? "text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" : "group-hover:text-zinc-200",
                          "group-hover:scale-110"
                        )} />
                        {(!isCollapsed || isMobile) && (
                          <span className={cn(
                            "text-[13.5px] truncate relative z-10 transition-colors",
                            isActive ? "font-black text-violet-400" : "font-semibold"
                          )}>
                            {item.title}
                          </span>
                        )}
                        {item.href === "/solicitacoes" && pendingRequests > 0 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-red-500/30 animate-pulse">
                            {pendingRequests}
                          </div>
                        )}
                        {item.href === "/denuncias" && pendingDenuncias > 0 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-red-500/30 animate-pulse">
                            {pendingDenuncias}
                          </div>
                        )}
                        {!isCollapsed && isActive && (
                          <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400/50" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={cn(
          "p-5 border-t border-white/5 bg-black/40 backdrop-blur-2xl space-y-4",
          (isCollapsed && !isMobile) && "px-3"
        )}>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-2xl relative group transition-all",
            (!isCollapsed || isMobile) && "bg-white/5 border border-white/5 hover:bg-white/10"
          )}>
            {simulatedRole && (
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none rounded-2xl" />
            )}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg relative overflow-hidden",
              simulatedRole
                ? "bg-amber-500 shadow-amber-500/20"
                : "bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-500/20"
            )}>

              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              {profile?.full_name?.charAt(0) ?? "U"}
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-[13px] font-bold truncate text-white">
                  {profile?.full_name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    simulatedRole ? "text-amber-400" : "text-zinc-500"
                  )}>
                    {profile?.role === "admin" ? "Administrador" :
                      profile?.role === "instrutor" ? "Instrutor" :
                        profile?.role === "responsavel" ? "Responsável" :
                          profile?.role === "aluno" ? "Aluno" : profile?.role}
                  </span>
                  {simulatedRole && (
                    <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-sm font-black uppercase">Simulado</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl h-12 transition-all group",
              (isCollapsed && !isMobile) && "px-0 justify-center"
            )}
            onClick={() => signOut()}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 group-hover:rotate-12 transition-transform" />
            {(!isCollapsed || isMobile) && <span className="text-[11px] font-black uppercase tracking-widest">Sair</span>}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
