"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ChevronRight,
  User,
  ShieldCheck,
  UserCircle,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "student", label: "Aluno", icon: UserCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "instructor", label: "Instrutor", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "guardian", label: "Responsável", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "coord_geral", label: "Coord. Geral", icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "coord_nucleo", label: "Coord. Núcleo", icon: ShieldAlert, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export function AdminSimulationBanner() {
  const { profile, simulatedRole, setSimulatedRole, originalRole } = useAuth();

  if (originalRole !== "admin") return null;

  const currentRole = ROLES.find(r => r.id === simulatedRole);

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-1 pl-4 rounded-full border shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-10",
      simulatedRole 
        ? "bg-zinc-900 border-amber-500/50 ring-4 ring-amber-500/10" 
        : "bg-zinc-900/80 backdrop-blur-md border-zinc-800"
    )}>
      <div className="flex items-center gap-2">
        {simulatedRole ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Simulando:</span>
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-tight", currentRole?.color)}>
              {currentRole?.label || simulatedRole}
            </span>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Modo Admin</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
            simulatedRole 
              ? "bg-amber-500 text-zinc-950 hover:bg-amber-400 scale-105" 
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          )}>
            {simulatedRole ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white shadow-xl">
          <DropdownMenuLabel className="text-zinc-500 text-[10px] uppercase tracking-widest px-3 py-2">
            Simular Acesso
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          {ROLES.map((role) => (
            <DropdownMenuItem 
              key={role.id}
              onClick={() => setSimulatedRole(role.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-zinc-800 transition-colors",
                simulatedRole === role.id && "bg-zinc-800/50"
              )}
            >
              <div className={cn("p-1.5 rounded-lg", role.bg)}>
                <role.icon className={cn("w-4 h-4", role.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{role.label}</span>
                <span className="text-[10px] text-zinc-500 font-normal">Ver visão de {role.label.toLowerCase()}</span>
              </div>
              {simulatedRole === role.id && (
                <ChevronRight className="w-3 h-3 ml-auto text-amber-500" />
              )}
            </DropdownMenuItem>
          ))}
          
          {simulatedRole && (
            <>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => setSimulatedRole(null)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-red-500/10 text-red-400 hover:text-red-400"
              >
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Voltar para Admin</span>
                  <span className="text-[10px] text-red-500/60 font-normal">Encerrar simulação</span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
