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

    const { referralCode } = await request.json();
    const sanitized = (referralCode || "").trim().toUpperCase();

    if (!sanitized || sanitized.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid 6-character referral code." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check current user profile
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, referral_code, referred_by")
      .eq("id", user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.referred_by) {
      return NextResponse.json(
        { error: `You have already linked referral code (${profile.referred_by}).` },
        { status: 400 }
      );
    }

    if (profile.referral_code === sanitized) {
      return NextResponse.json(
        { error: "You cannot enter your own referral code." },
        { status: 400 }
      );
    }

    // Verify referrer exists
    const { data: referrer, error: refErr } = await admin
      .from("profiles")
      .select("id, referral_code, full_name")
      .eq("referral_code", sanitized)
      .single();

    if (refErr || !referrer) {
      return NextResponse.json(
        { error: "Invalid referral code. No user found with this code." },
        { status: 404 }
      );
    }

    // Link referral
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ referred_by: sanitized })
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Referral code "${sanitized}" successfully linked! You are now connected with ${referrer.full_name || "your friend"}.`,
    });
  } catch (error) {
    console.error("Bind referral error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
