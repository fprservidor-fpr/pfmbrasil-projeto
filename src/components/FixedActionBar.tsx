"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  UserCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FixedActionBar() {
  return (
    <motion.div
      initial={{ y: 100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ delay: 1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[min(90%,500px)] md:w-auto"
    >
      <div className="bg-zinc-950/40 backdrop-blur-2xl border border-white/10 p-1.5 md:p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center gap-1.5 md:gap-3">

        {/* Realizar Pré-Matrícula */}
        <Link href="/pre-matricula" className="group shrink-0 sm:shrink">
          <div className={cn(
            "h-12 md:h-16 px-4 md:px-8 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-3 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]",
            "bg-yellow-500 text-black shadow-[0_10px_20px_rgba(234,179,8,0.2)]"
          )}>
            <ClipboardCheck className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-black text-[10px] md:text-sm uppercase tracking-tight whitespace-nowrap hidden sm:inline">Pré-Matrícula</span>
            <span className="font-black text-[10px] uppercase tracking-tight sm:hidden">Matrícula</span>
          </div>
        </Link>

        {/* Consultar Status */}
        <Link href="/consultar" className="group">
          <div className={cn(
            "h-12 md:h-16 px-4 md:px-8 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-3 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]",
            "bg-zinc-900/50 text-zinc-400 hover:text-white border border-white/5 hover:border-yellow-400/30"
          )}>
            <Search className="w-5 h-5 md:w-6 md:h-6 group-hover:text-yellow-400 transition-colors" />
            <span className="font-black text-[10px] md:text-sm uppercase tracking-tight whitespace-nowrap">Status</span>
          </div>
        </Link>

        {/* Área do Aluno (Redireciona para o Portal Informativo) */}
        <Link href="/portal" className="group">
          <div className={cn(
            "h-12 md:h-16 px-4 md:px-8 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-3 transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]",
            "bg-zinc-900/50 text-zinc-400 hover:text-white border border-white/5 hover:border-yellow-400/30"
          )}>
            <UserCircle className="w-5 h-5 md:w-6 md:h-6 group-hover:text-yellow-400 transition-colors" />
            <span className="font-black text-[10px] md:text-sm uppercase tracking-tight whitespace-nowrap">Portal</span>
          </div>
        </Link>

      </div>
    </motion.div>
  );
}
