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

    // Count surveys completed
    const { count: surveysCount } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "survey")
      .eq("status", "completed");

    // Calculate total earned coins across all earning types
    const { data: earningTx } = await admin
      .from("transactions")
      .select("amount_coins")
      .eq("user_id", user.id)
      .gt("amount_coins", 0)
      .in("type", ["survey", "checkin", "referral", "signup_bonus"]);

    const totalEarnedCoins = (earningTx || []).reduce(
      (sum, tx) => sum + tx.amount_coins,
      0
    );

    return NextResponse.json({
      surveysCompleted: surveysCount || 0,
      totalEarnedCoins,
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
