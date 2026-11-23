import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 });
    }

    const cleanPhone = phone.toString().replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 7) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email, phone")
      .ilike("phone", `%${cleanPhone}%`)
      .not("email", "is", null)
      .not("email", "ilike", "%@taskmint.app")
      .maybeSingle();

    if (error || !profile || !profile.email) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: profile.email });
  } catch (error) {
    console.error("Lookup phone error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
