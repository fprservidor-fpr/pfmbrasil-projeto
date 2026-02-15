"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createStudentAccount(data: {
  email: string;
  password: string;
  fullName: string;
  studentId: string;
}) {
  try {
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === data.email);
    
    if (userExists) {
      throw new Error("Já existe um usuário com este e-mail no sistema.");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        student_id: data.studentId,
      }
    });

    if (authError) throw authError;

    await supabaseAdmin
      .from("profiles")
      .update({ 
        role: "aluno", 
        full_name: data.fullName,
        student_id: data.studentId
      })
      .eq("id", authData.user.id);

    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error("Error creating student account:", error);
    return { success: false, error: error.message };
  }
}

export async function createGuardianAccount(data: {
  cpf: string;
  password: string;
  fullName: string;
  studentId: string;
}) {
  try {
    const cleanCpf = data.cpf.replace(/\D/g, "");
    const email = `${cleanCpf}@pfm.com`;

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === email);
    
    if (userExists) {
      throw new Error("Já existe uma conta de responsável com este CPF.");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        cpf: cleanCpf,
        student_id: data.studentId,
      }
    });

    if (authError) throw authError;

    await supabaseAdmin
      .from("profiles")
      .update({ 
        role: "responsavel", 
        full_name: data.fullName,
        cpf: cleanCpf,
        student_id: data.studentId
      })
      .eq("id", authData.user.id);

    return { success: true, userId: authData.user.id, email };
  } catch (error: any) {
    console.error("Error creating guardian account:", error);
    return { success: false, error: error.message };
  }
}
