import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function reset() {
  // Reset Instructor
  const { data: inst } = await supabaseAdmin.auth.admin.listUsers();
  const maressa = inst.users.find(u => u.email === "maressa@pfm.com");
  if (maressa) {
    await supabaseAdmin.auth.admin.updateUserById(maressa.id, { password: "pfmbrasil" });
    console.log("Instructor maressa@pfm.com reset to pfmbrasil");
  }

  // Reset a Responsible for testing (picking one from the list)
  const resp = inst.users.find(u => u.email === "2762244340@pfm.com");
  if (resp) {
    await supabaseAdmin.auth.admin.updateUserById(resp.id, { password: "44340" }); // last 5 digits of 2762244340
    console.log("Responsible 2762244340@pfm.com reset to 44340");
  }
}

reset();
