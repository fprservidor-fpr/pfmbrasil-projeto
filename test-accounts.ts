import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAll() {
  const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }

  const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

  const list = usersData.users.map(u => ({
    email: u.email,
    role: profilesMap.get(u.id)?.role || "user",
    name: profilesMap.get(u.id)?.full_name || "---"
  }));

  console.log(JSON.stringify(list, null, 2));
}

listAll();
