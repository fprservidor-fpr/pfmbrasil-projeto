import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USERS_TO_FIX = [
  {
    id: "aa376f6a-fb41-446e-b922-b7605c48bc31",
    email: "admin@admin.com",
    password: "pfmbrasil",
    role: "admin",
    nome: "Administrador Geral",
    nome_guerra: "ADMIN"
  },
  {
    id: "f58965d2-1351-46d8-8871-fc4e3caf20f9",
    email: "maressa@pfm.com",
    password: "pfmbrasil",
    role: "instrutor",
    nome: "Maressa Instrutora",
    nome_guerra: "MARESSA"
  }
];

async function fixUsers() {
  for (const user of USERS_TO_FIX) {
    console.log(`Fixing user: ${user.email}`);
    
    // Reset password in Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        password: user.password, 
        email_confirm: true,
        user_metadata: { role: user.role }
      }
    );

    if (authError) {
      console.error(`Error updating auth for ${user.email}:`, authError);
    } else {
      console.log(`Auth updated for ${user.email}`);
    }

    // Upsert into profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        role: user.role,
        full_name: user.nome,
        war_name: user.nome_guerra
      });

    if (profileError) {
      console.error(`Error updating profile for ${user.email}:`, profileError);
    } else {
      console.log(`Profile updated for ${user.email}`);
    }
  }
  console.log("Fix complete!");
}

fixUsers();
