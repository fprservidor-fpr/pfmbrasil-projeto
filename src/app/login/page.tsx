"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ArrowLeft, Loader2, Lock, Mail, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

function FloatingParticle({ delay, duration, size, x, y }: { delay: number; duration: number; size: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute rounded-full bg-emerald-500/20"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.2, 0.5, 0.2],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function GlowingOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      localStorage.removeItem("pfm_simulated_role");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      toast.success("Login realizado com sucesso!");

      if (profile?.role === "aluno" || profile?.role === "student") {
        router.push("/aluno");
      } else if (profile?.role === "responsavel" || profile?.role === "guardian") {
        router.push("/responsavel");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const particles = [
    { delay: 0, duration: 4, size: 6, x: "10%", y: "20%" },
    { delay: 1, duration: 5, size: 8, x: "20%", y: "60%" },
    { delay: 2, duration: 6, size: 4, x: "80%", y: "30%" },
    { delay: 0.5, duration: 4.5, size: 10, x: "70%", y: "70%" },
    { delay: 1.5, duration: 5.5, size: 5, x: "30%", y: "80%" },
    { delay: 2.5, duration: 4, size: 7, x: "90%", y: "50%" },
    { delay: 0.8, duration: 5, size: 6, x: "15%", y: "40%" },
    { delay: 1.8, duration: 6, size: 8, x: "85%", y: "15%" },
    { delay: 3, duration: 4.5, size: 5, x: "50%", y: "10%" },
    { delay: 2.2, duration: 5.2, size: 9, x: "60%", y: "85%" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 relative overflow-hidden">
      <GridPattern />
      
      <GlowingOrb className="w-[600px] h-[600px] bg-emerald-500/10 -top-48 -left-48" />
      <GlowingOrb className="w-[500px] h-[500px] bg-blue-500/10 -bottom-32 -right-32" />
      <GlowingOrb className="w-[300px] h-[300px] bg-violet-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {mounted && particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 relative z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar ao início</span>
        </Link>
      </motion.div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative inline-block mb-6"
                >
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Shield className="text-white w-10 h-10" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                    PFM <span className="text-emerald-400">Digital</span>
                  </h1>
                  <p className="text-zinc-500 text-sm">
                    Polícia Forças Mirins - Área Restrita
                  </p>
                </motion.div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="login-email" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 bg-zinc-800/50 border-zinc-700/50 text-white h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="login-password" className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-11 bg-zinc-800/50 border-zinc-700/50 text-white h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-12 font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 pt-6 border-t border-zinc-800/50"
              >
                <p className="text-center text-zinc-600 text-xs">
                  Acesso restrito a membros autorizados
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
