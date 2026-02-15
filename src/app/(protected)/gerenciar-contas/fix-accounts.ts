"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function fixStudentEmails() {
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;
    
    const usersToFix = users.users.filter(u => 
      u.email?.includes("@alunopfm.com") && u.email?.includes("/")
    );
    
    const results = [];
    
    for (const user of usersToFix) {
      const oldEmail = user.email!;
      const newEmail = oldEmail.replace("/", "");
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
      );
      
      if (updateError) {
        results.push({ old: oldEmail, new: newEmail, success: false, error: updateError.message });
      } else {
        results.push({ old: oldEmail, new: newEmail, success: true });
      }
    }
    
    return { success: true, fixed: results.length, results };
  } catch (error: any) {
    console.error("Error fixing emails:", error);
    return { success: false, error: error.message };
  }
}

export async function createAllStudentAccounts() {
  try {
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, nome_completo, matricula_pfm, guardian1_cpf, guardian1_name");
    
    if (studentsError) throw studentsError;
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingEmails = new Set(existingUsers?.users.map(u => u.email) || []);
    
    const results = { students: [] as any[], guardians: [] as any[] };
    
      for (const student of students || []) {
        if (!student.matricula_pfm) continue;
        
        const cleanMatricula = student.matricula_pfm.replace(/[^0-9]/g, "");
        const studentEmail = `${cleanMatricula}@pfm.com`;
        
        if (!existingEmails.has(studentEmail)) {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: studentEmail,
            password: "pfmbrasil",
            email_confirm: true,
            user_metadata: {
              full_name: student.nome_completo,
              student_id: student.id
            }
          });
          
          if (authError) {
            results.students.push({ email: studentEmail, success: false, error: authError.message });
          } else {
            await supabaseAdmin
              .from("profiles")
              .update({ role: "aluno", full_name: student.nome_completo, student_id: student.id })
              .eq("id", authData.user.id);
            results.students.push({ email: studentEmail, success: true });
            existingEmails.add(studentEmail);
          }
        }
        
        if (student.guardian1_cpf) {
          const cleanCpf = student.guardian1_cpf.replace(/\D/g, "");
          const guardianEmail = `${cleanCpf}@pfm.com`;
          const guardianPassword = cleanCpf.slice(-5);
          
          if (!existingEmails.has(guardianEmail)) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: guardianEmail,
              password: guardianPassword,
              email_confirm: true,
              user_metadata: {
                full_name: student.guardian1_name,
                cpf: cleanCpf,
                student_id: student.id
              }
            });
          
          if (authError) {
            results.guardians.push({ email: guardianEmail, success: false, error: authError.message });
          } else {
            await supabaseAdmin
              .from("profiles")
              .update({ role: "responsavel", full_name: student.guardian1_name, cpf: cleanCpf, student_id: student.id })
              .eq("id", authData.user.id);
            results.guardians.push({ email: guardianEmail, success: true });
            existingEmails.add(guardianEmail);
          }
        }
      }
    }
    
    return { 
      success: true, 
      studentsCreated: results.students.filter(s => s.success).length,
      guardiansCreated: results.guardians.filter(g => g.success).length,
      results 
    };
  } catch (error: any) {
    console.error("Error creating accounts:", error);
    return { success: false, error: error.message };
  }
}
