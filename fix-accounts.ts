import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USERS = [
  {
    email: "admin@admin.com",
    password: "pfmbrasil",
    role: "admin",
    nome: "Administrador Geral",
    nome_guerra: "ADMIN"
  },
  {
    email: "maressa@pfm.com",
    password: "pfmbrasil",
    role: "instrutor",
    nome: "Maressa Instrutora",
    nome_guerra: "MARESSA"
  }
];

async function setupUsers() {
  for (const user of USERS) {
    console.log(`Setting up user: ${user.email}`);
    
    // Check if user exists in auth
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      continue;
    }

    let authUser = users.users.find(u => u.email === user.email);

    if (authUser) {
      console.log(`User ${user.email} already exists in auth. Resetting password...`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        { password: user.password, email_confirm: true }
      );
      if (updateError) console.error("Error updating user:", updateError);
    } else {
      console.log(`Creating user ${user.email} in auth...`);
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role }
      });
      
      if (createError) {
        console.error("Error creating user:", createError);
        continue;
      }
      authUser = newAuthUser.user;
    }

    if (authUser) {
      // Upsert into profiles
      const { error: profileError } = await supabaseAdmin
        .from("perfis")
        .upsert({
          id: authUser.id,
          email: user.email,
          role: user.role,
          nome_completo: user.nome,
          nome_guerra: user.nome_guerra
        });

      if (profileError) {
        console.error("Error updating profile:", profileError);
      } else {
        console.log(`Profile for ${user.email} updated successfully.`);
      }
    }
  }
  console.log("Setup complete!");
}

setupUsers();
