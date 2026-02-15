"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { 
  Users, 
  ChevronRight, 
  UserCircle,
  Shield,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  turma: string;
  graduacao: string;
};

export default function SelecionarAlunoPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (profile?.cpf) {
      fetchLinkedStudents(profile.cpf);
    } else {
      setLoading(false);
    }
  }, [profile]);

    async function fetchLinkedStudents(cpf: string) {
      try {
        setLoading(true);
        
      const normalizedCpf = cpf.replace(/\D/g, '').padStart(11, '0');
      const formattedCpf = normalizedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      const { data, error } = await supabase
        .from("students")
        .select("id, nome_completo, nome_guerra, matricula_pfm, turma, graduacao, status")
        .or(`guardian1_cpf.eq.${normalizedCpf},guardian2_cpf.eq.${normalizedCpf},responsavel_cpf.eq.${normalizedCpf},guardian1_cpf.eq.${formattedCpf},guardian2_cpf.eq.${formattedCpf},responsavel_cpf.eq.${formattedCpf}`)
        .eq("status", "ativo");

        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
      console.error("Erro ao buscar alunos vinculados:", error);
      toast.error("Erro ao carregar seus dependentes.");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectStudent = (studentId: string) => {
    sessionStorage.setItem("selectedStudentId", studentId);
    toast.success("Aluno selecionado com sucesso!");
    router.push("/aluno/dossie");
  };

  const getGraduacaoLabel = (val: string) => {
    const mapping: Record<string, string> = {
      "ASPIRANTE_MONITOR": "Aspirante a Monitor",
      "2_CMD_PELOTAO": "2º Comandante de Pelotão",
      "1_CMD_PELOTAO": "1º Comandante de Pelotão",
      "CHEFE_TURMA": "Chefe de Turma",
      "2_SENIOR": "2º Sênior",
      "1_SENIOR": "1º Sênior",
      "APRENDIZ": "Aprendiz"
    };
    return mapping[val] || val || "Aprendiz";
  };

  const filteredStudents = students.filter(s => 
    s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <Users className="text-emerald-500 w-8 h-8" />
          Selecionar Aluno
        </h1>
        <p className="text-zinc-500 mt-1">
          Escolha qual dependente você deseja visualizar as informações hoje.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <Input 
          placeholder="Buscar dependente pelo nome..."
          className="pl-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 h-12 rounded-xl focus:ring-emerald-500/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-zinc-900/50 animate-pulse rounded-2xl border border-zinc-800" />
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => handleSelectStudent(student.id)}
              className="group text-left bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                  <UserCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-500 transition-colors">
                    {student.nome_guerra}
                  </h3>
                  <p className="text-zinc-500 text-xs truncate max-w-[150px]">
                    {student.nome_completo}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                      {student.turma}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {getGraduacaoLabel(student.graduacao)}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
          <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300">Nenhum aluno vinculado</h3>
          <p className="text-zinc-500">
            Não encontramos alunos vinculados ao CPF: <span className="text-zinc-300">{profile?.cpf || "Não informado"}</span>
          </p>
        </div>
      )}
    </div>
  );
}
