"use client";

import Link from "next/link";
import { 
  ClipboardCheck, 
  Search, 
  User,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

export function FixedActionBar() {
  return (
    <motion.div 
      initial={{ y: 100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl"
    >
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-2 items-stretch justify-center">
        <Link href="/pre-matricula" className="group flex-1">
          <div className="h-full bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg">
            <ClipboardCheck className="w-5 h-5" />
            <span className="font-black text-sm uppercase tracking-tight">Pré-Matrícula</span>
          </div>
        </Link>

        <Link href="/consultar" className="group flex-1">
          <div className="h-full bg-zinc-900/50 hover:bg-zinc-800 text-white border border-white/5 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <Search className="w-5 h-5 text-yellow-500" />
            <span className="font-black text-sm uppercase tracking-tight">Status</span>
          </div>
        </Link>

        <Link href="/login" className="group flex-1">
          <div className="h-full bg-zinc-900/50 hover:bg-zinc-800 text-white border border-white/5 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <User className="w-5 h-5 text-yellow-500" />
            <span className="font-black text-sm uppercase tracking-tight">Área do Aluno</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
