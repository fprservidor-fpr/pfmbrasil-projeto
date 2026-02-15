"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function deleteStudent(studentId: string) {
  try {
    // 1. Delete related records first (comportamentos, frequencias, reunioes_presenca)
    await supabaseAdmin
      .from("comportamentos")
      .delete()
      .eq("aluno_id", studentId);

    await supabaseAdmin
      .from("frequencias")
      .delete()
      .eq("aluno_id", studentId);

    // 1.1 Remove from reunioes_presenca array
    const { data: reunioes } = await supabaseAdmin
      .from("reunioes_presenca")
      .select("id, student_ids")
      .contains("student_ids", [studentId]);

    if (reunioes && reunioes.length > 0) {
      for (const r of reunioes) {
        const newIds = r.student_ids.filter((id: string) => id !== studentId);
        await supabaseAdmin
          .from("reunioes_presenca")
          .update({ student_ids: newIds })
          .eq("id", r.id);
      }
    }

    // 2. Delete the student record
    const { error } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", studentId);

    if (error) throw error;

    revalidatePath("/alunos");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStudentStatus(studentId: string, newStatus: string, reason: string) {
  try {
    // 1. Get student data to find related profiles (student and guardians)
    const { data: student, error: sError } = await supabaseAdmin
      .from("students")
      .select("responsavel_cpf, guardian1_cpf, guardian2_cpf")
      .eq("id", studentId)
      .single();

    if (sError) throw sError;

    // 2. Update student status and reason
    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ status: newStatus, status_reason: reason })
      .eq("id", studentId);

    if (updateError) throw updateError;

    const isActive = newStatus === "ativo";

    // 3. Update student's own profile
    await supabaseAdmin
      .from("profiles")
      .update({ is_active: isActive })
      .eq("student_id", studentId);

    // 4. Update guardians' profiles
    const cpfs = Array.from(new Set([
      student.responsavel_cpf,
      student.guardian1_cpf,
      student.guardian2_cpf
    ])).filter(Boolean);

    for (const cpf of cpfs) {
      if (!isActive) {
        // Deactivating student: check if guardian has other active students
        const { count, error: countError } = await supabaseAdmin
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("status", "ativo")
          .eq("is_test", false)
          .or(`responsavel_cpf.eq.${cpf},guardian1_cpf.eq.${cpf},guardian2_cpf.eq.${cpf}`);

        if (countError) throw countError;

        if (count === 0) {
          // No other active students, deactivate guardian account
          await supabaseAdmin
            .from("profiles")
            .update({ is_active: false })
            .eq("cpf", cpf)
            .eq("role", "responsavel");
        }
      } else {
        // Activating student: always reactivate guardian account
        await supabaseAdmin
          .from("profiles")
          .update({ is_active: true })
          .eq("cpf", cpf)
          .eq("role", "responsavel");
      }
    }

    revalidatePath("/alunos");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating student status:", error);
    return { success: false, error: error.message };
  }
}

