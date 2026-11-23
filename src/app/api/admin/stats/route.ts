import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-auth";

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized || !auth.adminClient) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = auth.adminClient;

    // Run independent metric queries in parallel
    const [
      usersCountRes,
      transactionsRes,
      pendingWithdrawalsRes,
      paidWithdrawalsRes,
      smmOrdersRes,
      ticketsRes,
    ] = await Promise.all([
      // 1. Total users
      admin.from("profiles").select("id", { count: "exact", head: true }),
      // 2. Coins distributed
      admin
        .from("transactions")
        .select("amount_coins")
        .gt("amount_coins", 0)
        .in("type", ["survey", "checkin", "referral", "signup_bonus"]),
      // 3. Pending withdrawals
      admin.from("withdrawals").select("amount_inr").eq("status", "pending"),
      // 4. Paid withdrawals
      admin.from("withdrawals").select("amount_inr").eq("status", "paid"),
      // 5. SMM orders
      admin.from("smm_orders").select("charge_coins, charge_inr"),
      // 6. Open support tickets
      admin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);

    const totalUsers = usersCountRes.count || 0;

    const totalCoinsDistributed = (transactionsRes.data || []).reduce(
      (sum, tx) => sum + (tx.amount_coins || 0),
      0
    );

    const pendingPayoutsInr = (pendingWithdrawalsRes.data || []).reduce(
      (sum, w) => sum + Number(w.amount_inr || 0),
      0
    );

    const totalWithdrawalsCount =
      (pendingWithdrawalsRes.data?.length || 0) + (paidWithdrawalsRes.data?.length || 0);

    const smmOrders = smmOrdersRes.data || [];
    const totalSmmOrdersCount = smmOrders.length;
    const totalSmmCoinsCharged = smmOrders.reduce((sum, o) => sum + (o.charge_coins || 0), 0);

    const openSupportTicketsCount = ticketsRes.count || 0;

    return NextResponse.json({
      totalUsers,
      totalCoinsDistributed,
      pendingPayoutsInr,
      totalWithdrawalsCount,
      totalSmmOrdersCount,
      totalSmmCoinsCharged,
      openSupportTicketsCount,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
