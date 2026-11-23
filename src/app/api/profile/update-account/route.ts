import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, phone, newPassword } = body;

    const admin = createAdminClient();

    // Prepare auth updates
    const authUpdates: {
      email?: string;
      password?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, unknown>;
    } = {
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: fullName?.trim() || user.user_metadata?.full_name,
        phone: phone?.trim() || user.user_metadata?.phone,
        is_guest: false,
      },
    };

    if (email && email.trim() && !email.includes("@taskmint.app") && email.trim() !== user.email) {
      authUpdates.email = email.trim();
      authUpdates.email_confirm = true;
    }

    if (newPassword && newPassword.trim().length >= 6) {
      authUpdates.password = newPassword.trim();
    }

    // Update auth user
    const { error: updateUserError } = await admin.auth.admin.updateUserById(
      user.id,
      authUpdates
    );

    if (updateUserError) {
      return NextResponse.json({ error: updateUserError.message }, { status: 400 });
    }

    // Prepare profiles table updates
    const profileUpdates: Record<string, unknown> = {};
    if (fullName?.trim()) {
      profileUpdates.full_name = fullName.trim();
    }
    if (email?.trim() && !email.includes("@taskmint.app")) {
      profileUpdates.email = email.trim();
    }
    if (phone?.trim()) {
      profileUpdates.phone = phone.trim();
    }

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      await admin.from("profiles").update(profileUpdates).eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Account settings updated and secured successfully!",
    });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
