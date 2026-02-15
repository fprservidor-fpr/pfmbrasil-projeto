import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fix existing emails with "/" (iterate multiple times)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    if (listError) throw listError;
    
    const usersToFix = users.users.filter(u => 
      u.email?.includes("/")
    );
    
    const fixResults = [];
    
    for (const user of usersToFix) {
      const oldEmail = user.email!;
      const newEmail = oldEmail.replace(/\//g, "");
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
      );
      
      if (updateError) {
        fixResults.push({ old: oldEmail, new: newEmail, success: false, error: updateError.message });
      } else {
        fixResults.push({ old: oldEmail, new: newEmail, success: true });
      }
    }

    // 2. Get updated list of existing emails
    const { data: updatedUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingEmails = new Set(updatedUsers?.users.map(u => u.email) || []);

    // 3. Get all students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, nome_completo, matricula_pfm, guardian1_cpf, guardian1_name");
    
    if (studentsError) throw studentsError;
    
    const createResults = { students: [] as any[], guardians: [] as any[] };
    
    for (const student of students || []) {
      if (!student.matricula_pfm) continue;
      
        const cleanMatricula = student.matricula_pfm.replace(/[^0-9]/g, "");
        const studentEmail = `${cleanMatricula}@pfm.com`;
        
        // Create student account if not exists
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
          createResults.students.push({ email: studentEmail, success: false, error: authError.message });
        } else {
          await supabaseAdmin
            .from("profiles")
            .update({ role: "aluno", full_name: student.nome_completo, student_id: student.id })
            .eq("id", authData.user.id);
          createResults.students.push({ email: studentEmail, success: true });
          existingEmails.add(studentEmail);
        }
      }
      
        // Create guardian account if not exists
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
            createResults.guardians.push({ email: guardianEmail, success: false, error: authError.message });
          } else {
            await supabaseAdmin
              .from("profiles")
              .update({ role: "responsavel", full_name: student.guardian1_name, cpf: cleanCpf, student_id: student.id })
              .eq("id", authData.user.id);
            createResults.guardians.push({ email: guardianEmail, success: true });
            existingEmails.add(guardianEmail);
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      emailsFixed: fixResults.filter(r => r.success).length,
      studentsCreated: createResults.students.filter(s => s.success).length,
      guardiansCreated: createResults.guardians.filter(g => g.success).length,
      fixResults,
      createResults
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
