"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { PrintableReuniaoSheet } from "@/components/printable-reuniao-sheet";
import { useAuth } from "@/components/auth-provider";

interface Student {
  id: string;
  nome_completo: string;
  nome_guerra: string;
  matricula_pfm: string;
  guardian1_name: string;
  guardian1_cpf: string;
}

interface FamilyGroup {
  id: string;
  guardian1: { name: string; cpf: string; titulo: string };
  guardian2?: { name: string; cpf: string; titulo: string };
  students: Student[];
  signed: boolean;
  signatureUrl?: string;
  signedByName?: string;
}

function PrintReuniaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { simulatedRole } = useAuth();
  const eventId = searchParams.get("eventId");
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        const { data: eventData } = await supabase
          .from("calendario_letivo")
          .select("*")
          .eq("id", eventId)
          .single();
        setEvent(eventData);

        // Only show test records when admin is simulating another profile
        const showTestRecords = !!simulatedRole;
        
        let studentsQuery = supabase
          .from("students")
          .select("id, nome_completo, nome_guerra, matricula_pfm, guardian1_name, guardian1_cpf, guardian1_titulo, guardian2_name, guardian2_cpf, guardian2_titulo")
          .eq("status", "ativo");
          
        if (!showTestRecords) {
          studentsQuery = studentsQuery.eq("is_test", false);
        }

        const { data: studentsData } = await studentsQuery;

        const { data: presenceData } = await supabase
          .from("reunioes_presenca")
          .select("*")
          .eq("evento_id", eventId);

        if (studentsData) {
          const familyGroupsMap = new Map<string, FamilyGroup>();

          studentsData.forEach((student: any) => {
            const cpfs = [student.guardian1_cpf, student.guardian2_cpf].filter(Boolean).sort();
            const familyKey = cpfs.join(":") || `sem-responsavel-${student.id}`;
            
            if (!familyGroupsMap.has(familyKey)) {
              familyGroupsMap.set(familyKey, {
                id: familyKey,
                guardian1: { 
                  name: student.guardian1_name || "NÃO INFORMADO", 
                  cpf: student.guardian1_cpf || "", 
                  titulo: student.guardian1_titulo || "Responsável" 
                },
                guardian2: student.guardian2_cpf ? { 
                  name: student.guardian2_name, 
                  cpf: student.guardian2_cpf, 
                  titulo: student.guardian2_titulo || "Responsável" 
                } : undefined,
                students: [],
                signed: false
              });
            }
            familyGroupsMap.get(familyKey)!.students.push(student);
          });

            familyGroupsMap.forEach((group, key) => {
              const cpfs = key.split(":").filter(c => !c.startsWith("sem-responsavel") && c !== "");
              const presence = presenceData?.find(p => cpfs.includes(p.guardian_cpf) || p.guardian_cpf === `AUSENTE_${group.students[0].id}`);
              if (presence) {
                group.signed = presence.present;
                group.signatureUrl = presence.signature_url;
                group.signedByCpf = presence.guardian_cpf;
                group.signedByName = presence.guardian_name;
              }
            });

          const sortMatricula = (a: string, b: string) => {
            if (!a && !b) return 0;
            if (!a) return 1;
            if (!b) return -1;
            const [numA, yearA] = a.split("/").map(Number);
            const [numB, yearB] = b.split("/").map(Number);
            if (yearA !== yearB) return (yearA || 0) - (yearB || 0);
            return (numA || 0) - (numB || 0);
          };

          const getMinMatricula = (group: FamilyGroup) => {
            return group.students.reduce((min, student) => {
              const current = student.matricula_pfm || "";
              if (!min) return current;
              return sortMatricula(current, min) < 0 ? current : min;
            }, "");
          };

          setGroups(Array.from(familyGroupsMap.values()).sort((a, b) => {
            if (a.guardian1.name === "RESPONSÁVEL AUSENTE") return 1;
            if (b.guardian1.name === "RESPONSÁVEL AUSENTE") return -1;
            const matA = getMinMatricula(a);
            const matB = getMinMatricula(b);
            return sortMatricula(matA, matB);
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: event ? `Ata_Reuniao_${event.descricao?.replace(/\s+/g, '_')}` : 'Ata_Reuniao',
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Evento não encontrado.</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-8 print:p-0">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button 
          onClick={() => handlePrint()} 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4" />
          Imprimir (Ctrl+P)
        </Button>
      </div>

      <div className="print:m-0 print:p-0 flex justify-center">
        <PrintableReuniaoSheet ref={componentRef} groups={groups} event={event} />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintReuniaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <PrintReuniaoContent />
    </Suspense>
  );
}
