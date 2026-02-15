"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info, Sparkles } from "lucide-react";

const classifications = [
  {
    label: "EXCEPCIONAL",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    color: "bg-blue-600",
    manter: "80 a 100 pontos",
    regressao: "Menos de 80 pts"
  },
  {
    label: "ÓTIMO",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    color: "bg-emerald-600",
    manter: "40 a 69 pontos",
    promocao: "70 pts ou mais",
    regressao: "Menos de 40 pts"
  },
  {
    label: "BOM",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    color: "bg-amber-600",
    manter: "40 a 69 pontos",
    promocao: "70 pts ou mais",
    regressao: "Menos de 40 pts"
  },
  {
    label: "REGULAR",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    color: "bg-orange-600",
    manter: "40 a 69 pontos",
    promocao: "70 pts ou mais",
    regressao: "Menos de 40 pts"
  },
  {
    label: "INSUFICIENTE",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    color: "bg-red-600",
    manter: "30 a 59 pontos",
    promocao: "60 pts ou mais",
    regressao: "Menos de 30 pts"
  },
  {
    label: "MAU",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/20",
    color: "bg-zinc-600",
    manter: "0 a 29 pontos",
    promocao: "Conselho Disciplinar"
  }
];

interface ClassificationTableProps {
  showTitle?: boolean;
  compact?: boolean;
}

export function ClassificationTable({ showTitle = true, compact = false }: ClassificationTableProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div

        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20 rounded-3xl overflow-hidden"
      >
        {showTitle && (
          <div className="flex items-center justify-between px-6 py-6 border-b border-violet-500/10 bg-violet-500/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Escala de Comportamento
                </h3>
                <p className="text-zinc-500 text-sm">
                  Entenda como funciona a pontuação institucional
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-950/50 px-3 py-1.5 rounded-full border border-white/5">
              VER: 2024.1
            </span>
          </div>
        )}

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 ${compact ? 'gap-2 p-3' : 'gap-4 p-6'}`}>
          {classifications.map((c, idx) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className={`${c.bgColor} border ${c.borderColor} rounded-2xl ${compact ? 'p-3' : 'p-4'} space-y-4`}
            >
              <div className={`inline-block px-3 py-1 ${c.color} rounded-lg shadow-lg shadow-${c.color.split('-')[1]}-500/20`}>
                <span className={`text-[11px] font-black text-white uppercase tracking-wider`}>
                  {c.label}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 opacity-60">Manter</p>
                  <p className={`text-sm font-black text-white ${c.label === "MAU" ? "text-xs" : ""}`}>
                    {c.manter}
                  </p>
                </div>

                {c.promocao && (
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-80">Promoção</p>
                    <p className="text-[11px] font-bold text-emerald-400/90 leading-tight">{c.promocao}</p>
                  </div>
                )}

                {c.regressao && (
                  <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 opacity-80">Regressão</p>
                    <p className="text-[11px] font-bold text-red-400/90 leading-tight">{c.regressao}</p>
                  </div>
                )}

                {c.label === "MAU" && (
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-80">Promoção</p>
                    <p className="text-[11px] font-bold text-emerald-400/90 leading-tight">{c.promocao}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      <div className="px-6 py-4 border-t border-violet-500/10 bg-violet-500/5 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Info className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <p className="text-xs text-zinc-500 font-medium">
          A pontuação é calculada mensalmente. Todos iniciam com 100 pontos e a classificação é atualizada conforme méritos e deméritos registrados.
        </p>
      </div>
    </motion.div>
  );
}
