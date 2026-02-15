import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get all students with their matricula
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, matricula_pfm");
    
    if (studentsError) throw studentsError;
    
    const results = [];
    
    for (const student of students || []) {
      if (!student.matricula_pfm) continue;
      
      const cleanMatricula = student.matricula_pfm.replace(/[^0-9]/g, "");
      const studentEmail = `${cleanMatricula}@alunopfm.com`;
      
      // Find user with this email
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users.find(u => u.email === studentEmail);
      
      if (user) {
        // Update profile with student_id and role
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            student_id: student.id,
            role: "aluno"
          })
          .eq("id", user.id);
        
        results.push({
          email: studentEmail,
          studentId: student.id,
          success: !updateError,
          error: updateError?.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      updated: results.filter(r => r.success).length,
      results
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
