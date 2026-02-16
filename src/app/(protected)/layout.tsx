"use client";

import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { AdminSimulationBanner } from "@/components/admin-simulation-banner";
import { useRouter, usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarField } from "@/components/StarField";
import { AveroFooter } from "@/components/AveroFooter";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem("sidebar-collapsed", String(newState));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  const isStudentRole = profile?.role === "aluno" || profile?.role === "student";
  const isGuardianRole = profile?.role === "responsavel" || profile?.role === "guardian";

  const isStudentRoute = pathname?.startsWith("/aluno") || pathname?.startsWith("/materiais");
  const isGuardianRoute = pathname?.startsWith("/responsavel") || pathname?.startsWith("/selecionar-aluno") || pathname?.startsWith("/minhas-denuncias") || pathname?.startsWith("/solicitar-alteracao") || pathname?.startsWith("/materiais");
  const isPrintPage = pathname?.includes("/imprimir");

  // Redirect students to their portal
  if (isStudentRole && !isStudentRoute && !isPrintPage) {
    router.push("/aluno");
    return null;
  }

  // Redirect guardians to their portal
  if (isGuardianRole && !isGuardianRoute && !isStudentRoute && !isPrintPage) {
    router.push("/responsavel");
    return null;
  }

  // Render layout with shared effects
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none print:hidden">
        <StarField />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 blur-[100px] rounded-full" />
      </div>

      {!(isStudentRole || isGuardianRole) && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={cn(
        "flex-1 overflow-auto relative z-10 transition-all duration-300",
        !isPrintPage && !isMobile && (!(isStudentRole || isGuardianRole) ? (isCollapsed ? "pl-20" : "pl-[280px]") : "pl-0"),
        isPrintPage && "pl-0",
        isMobile && !isPrintPage && !(isStudentRole || isGuardianRole) ? "pt-16 pl-0" : isMobile ? "pl-0" : ""
      )}>
        {isMobile && !isPrintPage && !isStudentRole && !isGuardianRole && (
          <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Shield className="text-white w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">PFM</span>
                <span className="text-sm font-black text-violet-400">Digital</span>
              </div>
            </div>
            {!(isStudentRole || isGuardianRole) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-zinc-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </Button>
            )}
          </header>
        )}
        <div className={cn(
          "max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 min-h-[calc(100vh-4rem)] flex flex-col",
          !isPrintPage ? "p-4 md:p-8" : "p-0"
        )}>
          <div className="flex-1">
            {children}
          </div>
          {!isPrintPage && <AveroFooter />}
        </div>
      </main>

      <AdminSimulationBanner />
    </div>
  );
}
