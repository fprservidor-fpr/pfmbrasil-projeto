"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAllAccounts() {
  try {
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) throw error;

      allUsers = [...allUsers, ...usersData.users];

      if (usersData.users.length < perPage) break;
      page++;
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*");

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const accounts = allUsers.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || profilesMap.get(user.id)?.full_name || "",
      role: profilesMap.get(user.id)?.role || "user",
      cpf: profilesMap.get(user.id)?.cpf || user.user_metadata?.cpf || "",
      student_id: profilesMap.get(user.id)?.student_id || user.user_metadata?.student_id || "",
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
    }));

    return { success: true, accounts };
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    return { success: false, error: error.message, accounts: [] };
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;

    revalidatePath("/gerenciar-contas");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(userId: string) {
  try {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (user?.user?.email === "admin@admin.com") {
      throw new Error("Não é permitido excluir a conta do administrador principal.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;

    revalidatePath("/gerenciar-contas");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message };
  }
}

export async function createAccount(data: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  cpf?: string;
}) {
  try {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.find(u => u.email === data.email);

    if (userExists) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        cpf: data.cpf,
      }
    });

    if (authError) throw authError;

    await supabaseAdmin
      .from("profiles")
      .update({
        role: data.role,
        full_name: data.fullName,
        cpf: data.cpf
      })
      .eq("id", authData.user.id);

    revalidatePath("/gerenciar-contas");
    return { success: true, userId: authData.user.id };
  } catch (error: any) {
    console.error("Error creating account:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAccount(data: {
  userId: string;
  fullName?: string;
  role?: string;
  cpf?: string;
  studentId?: string;
}) {
  try {
    // 1. Update auth metadata if provided
    const updateData: any = {};
    if (data.fullName) updateData.full_name = data.fullName;
    if (data.cpf) updateData.cpf = data.cpf;
    if (data.studentId !== undefined) updateData.student_id = data.studentId;

    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        user_metadata: updateData
      });
      if (authError) throw authError;
    }

    // 2. Update profile table
    const profileUpdate: any = {};
    if (data.fullName) profileUpdate.full_name = data.fullName;
    if (data.role) profileUpdate.role = data.role;
    if (data.cpf) profileUpdate.cpf = data.cpf;
    if (data.studentId !== undefined) profileUpdate.student_id = data.studentId;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", data.userId);

      if (profileError) throw profileError;
    }

    revalidatePath("/gerenciar-contas");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating account:", error);
    return { success: false, error: error.message };
  }
}
