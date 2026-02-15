"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createInstructorWithAccount(formData: any, createAccount: boolean) {
  try {
    // 1. Check if email already exists in auth
    if (createAccount && formData.email) {
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser.users.find(u => u.email === formData.email);
      
      if (userExists) {
        throw new Error("Já existe um usuário com este e-mail no sistema.");
      }
    }

    let profileId = null;

    // 2. Create Auth User if requested
    if (createAccount && formData.cpf) {
      // Use CPF as email and last 5 digits as password
      const cleanCpf = formData.cpf.replace(/\D/g, "");
      const defaultPassword = cleanCpf.slice(-5);
      const emailToUse = formData.email || `${cleanCpf}@instrutor.pfm`;
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emailToUse,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
          war_name: formData.war_name,
          cpf: cleanCpf,
        }
      });

      if (authError) throw authError;
      profileId = authData.user.id;

        // Create or update profile with role 'instrutor' and war_name
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({ 
              id: profileId,
              role: "instrutor", 
              war_name: formData.war_name,
              full_name: formData.full_name,
              cpf: cleanCpf,
              birth_date: formData.birth_date
            });
        
      if (profileError) console.error("Error updating profile:", profileError);
    }

    // 3. Insert Instructor record
    const { error: instError } = await supabaseAdmin
      .from("instructors")
      .insert([{
        ...formData,
        profile_id: profileId
      }]);

    if (instError) throw instError;

    revalidatePath("/instrutores");
    return { success: true };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInstructor(id: string, formData: any) {
  try {
    // Check protection for admin@admin.com
    const { data: instructor } = await supabaseAdmin
      .from("instructors")
      .select("email")
      .eq("id", id)
      .single();
    
    if (instructor?.email === "admin@admin.com") {
      throw new Error("Não é permitido alterar o acesso exclusivo do criador do sistema.");
    }

    const { error } = await supabaseAdmin
      .from("instructors")
      .update(formData)
      .eq("id", id);

    if (error) throw error;
    
    // Also update profile if profile_id exists
    const { data: instData } = await supabaseAdmin
      .from("instructors")
      .select("profile_id")
      .eq("id", id)
      .single();
      
    if (instData?.profile_id) {
      await supabaseAdmin
          .from("profiles")
          .update({ 
            war_name: formData.war_name,
            full_name: formData.full_name,
            cpf: formData.cpf,
            birth_date: formData.birth_date
          })
        .eq("id", instData.profile_id);
    }

    revalidatePath("/instrutores");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInstructor(id: string) {
  try {
    const { data: instructor } = await supabaseAdmin
      .from("instructors")
      .select("email")
      .eq("id", id)
      .single();
    
    if (instructor?.email === "admin@admin.com") {
      throw new Error("Não é permitido excluir o acesso exclusivo do criador do sistema.");
    }

    const { error } = await supabaseAdmin
      .from("instructors")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/instrutores");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
