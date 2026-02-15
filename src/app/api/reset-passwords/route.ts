import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const { data: profiles, error: profileError } = await supabaseAdmin.from("profiles").select("id, role, cpf");
    if (profileError) throw profileError;

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const results = [];

    for (const user of users.users) {
      const profile = profileMap.get(user.id);
      let password = "pfmbrasil"; // Default password

      if (profile?.role === "responsavel" || profile?.role === "instrutor") {
        const cpf = profile.cpf || user.email?.split("@")[0] || "";
        const cleanCpf = cpf.replace(/\D/g, "");
        if (cleanCpf.length >= 5) {
          password = "pfm" + cleanCpf.slice(-5); // "pfm" + 5 digits = 8 chars
        } else if (cleanCpf.length > 0) {
          password = "pfm" + cleanCpf.padStart(5, '0');
        } else {
          password = "pfmbrasil";
        }
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password
      });

      results.push({
        email: user.email,
        role: profile?.role,
        password: password,
        success: !error,
        error: error?.message
      });
    }

    return NextResponse.json({
      success: true,
      totalUsers: users.users.length,
      results
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
