
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function migrateEmails() {
  console.log("Starting email migration...");

  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  console.log(`Found ${users.users.length} users.`);

  for (const user of users.users) {
    const oldEmail = user.email;
    if (!oldEmail) continue;

    let newEmail = oldEmail;
    if (oldEmail.endsWith("@alunopfm.com")) {
      newEmail = oldEmail.replace("@alunopfm.com", "@pfm.com");
    } else if (oldEmail.endsWith("@responsavel.pfm")) {
      newEmail = oldEmail.replace("@responsavel.pfm", "@pfm.com");
    }

    if (newEmail !== oldEmail) {
      console.log(`Migrating ${oldEmail} to ${newEmail}...`);

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email: newEmail }
      );

      if (updateAuthError) {
        console.error(`Error updating Auth for ${oldEmail}:`, updateAuthError.message);
        continue;
      }

      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ email: newEmail })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error(`Error updating Profile for ${oldEmail}:`, updateProfileError.message);
      } else {
        console.log(`Successfully migrated ${oldEmail} to ${newEmail}`);
      }
    }
  }

  console.log("Migration complete!");
}

migrateEmails();
