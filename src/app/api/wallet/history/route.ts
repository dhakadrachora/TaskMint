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

    // Fetch withdrawals
    const { data: withdrawals, error: withError } = await admin
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch earning transactions (survey, checkin, referral, signup_bonus, refund)
    const { data: transactions, error: txError } = await admin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Check if user has prior withdrawals
    const hasPriorWithdrawals = Boolean(
      withdrawals &&
        withdrawals.some((w) => w.status === "pending" || w.status === "paid")
    );

    return NextResponse.json({
      withdrawals: withdrawals || [],
      transactions: transactions || [],
      hasPriorWithdrawals,
      minCoinsRequired: hasPriorWithdrawals ? 1000 : 500,
    });
  } catch (error) {
    console.error("Wallet history fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
