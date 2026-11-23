import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, refCode } = body;

    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }

    const admin = createAdminClient();
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const guestEmail = `guest_${uniqueId}@taskmint.app`;
    const guestPassword = `TaskMint_${Math.random().toString(36).substring(2, 12)}!9`;

    // Create user via admin API with email confirmed
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: guestEmail,
      password: guestPassword,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        referred_by: refCode ? refCode.trim().toUpperCase() : undefined,
        is_guest: true,
      },
    });

    if (createError || !newUser?.user) {
      console.error("Quick user creation failed:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to create quick account" },
        { status: 500 }
      );
    }

    // Sign in using server client to establish session cookies
    const supabase = await createClient();
    let sessionUser = null;

    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password: guestPassword,
    });

    if (signInError) {
      // If email/password login is disabled, use OTP token hash from admin link
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: guestEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: "email",
        });

        if (!verifyError && verifyData.user) {
          sessionUser = verifyData.user;
        }
      }

      if (!sessionUser) {
        console.error("Sign in after quick create failed:", signInError, linkError);
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
      }
    } else {
      sessionUser = sessionData.user;
    }

    // Ensure full_name in profiles is updated
    await admin
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", newUser.user.id);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error) {
    console.error("Quick login route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
