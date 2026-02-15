import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET() {
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

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ success: false, error: error.message, accounts: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    if (action === "resetPassword") {
      const { userId, newPassword } = data;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "deleteAccount") {
      const { userId } = data;
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (user?.user?.email === "admin@admin.com") {
        throw new Error("Não é permitido excluir a conta do administrador principal.");
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "createAccount") {
      const { email, password, fullName, role, cpf, studentId } = data;

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers.users.find(u => u.email === email);

      if (userExists) {
        throw new Error("Já existe um usuário com este e-mail.");
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          cpf,
        }
      });

      if (authError) throw authError;

      await supabaseAdmin
        .from("profiles")
        .update({
          role,
          full_name: fullName,
          cpf,
          student_id: studentId
        })
        .eq("id", authData.user.id);

      return NextResponse.json({ success: true, userId: authData.user.id });
    }

    return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
