"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AveroFooter() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="w-full py-8 flex flex-col justify-center items-center gap-4 border-t border-zinc-900/50 bg-zinc-950/20 backdrop-blur-xl print:fixed print:bottom-0 print:left-0 print:w-full print:bg-white print:text-black print:border-t print:py-4 z-30 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">© {year ?? "..."} PFM SYSTEM</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="text-zinc-600">Direitos Reservados</span>
        </div>

        <div className="hidden md:block w-px h-3 bg-zinc-900" />

        <div className="flex items-center gap-2">
          <span className="text-zinc-600 font-bold lowercase italic tracking-widest opacity-60">desenvolvido por</span>
          <Link 
            href="https://averoagency.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500 hover:text-black transition-all duration-500 hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.05)] hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
          >
            <span className="text-yellow-500 group-hover:text-black transition-colors duration-300">AVERO AGENCY</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-20">
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-zinc-500" />
        <div className="w-1 h-1 rounded-full bg-zinc-500" />
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-zinc-500" />
      </div>
    </motion.footer>
  );
}
