import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get current profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id, referral_code")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Count invited friends
    const { count: invitedCount, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", profile.referral_code);

    // Fetch invited users list
    const { data: invitedUsers } = await admin
      .from("profiles")
      .select("id, full_name, created_at")
      .eq("referred_by", profile.referral_code)
      .order("created_at", { ascending: false })
      .limit(30);

    // Fetch referral bonus transactions
    const { data: transactions, error: transError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "referral")
      .order("created_at", { ascending: false })
      .limit(50);

    const safeTransactions = transactions || [];
    const totalCommissionCoins = safeTransactions.reduce(
      (sum, tx) => sum + (tx.amount_coins || 0),
      0
    );

    return NextResponse.json({
      referralCode: profile.referral_code,
      invitedCount: invitedCount || 0,
      invitedUsers: invitedUsers || [],
      totalCommissionCoins,
      transactions: safeTransactions,
    });
  } catch (error) {
    console.error("Referral fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
