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

    // Verify admin privileges
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 1. Total Users
    const { count: totalUsers } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // 2. Total Coins Distributed (sum of positive coins from transactions)
    const { data: transactions } = await admin
      .from("transactions")
      .select("amount_coins")
      .gt("amount_coins", 0)
      .in("type", ["survey", "checkin", "referral", "signup_bonus"]);

    const totalCoinsDistributed = (transactions || []).reduce(
      (sum, tx) => sum + (tx.amount_coins || 0),
      0
    );

    // 3. Pending Payouts INR
    const { data: pendingWithdrawals } = await admin
      .from("withdrawals")
      .select("amount_inr")
      .eq("status", "pending");

    const pendingPayoutsInr = (pendingWithdrawals || []).reduce(
      (sum, w) => sum + Number(w.amount_inr || 0),
      0
    );

    // 4. Total withdrawals count
    const { count: totalWithdrawalsCount } = await admin
      .from("withdrawals")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalCoinsDistributed,
      pendingPayoutsInr,
      totalWithdrawalsCount: totalWithdrawalsCount || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
