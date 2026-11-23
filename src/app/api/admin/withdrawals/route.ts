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

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch withdrawals with user profile details
    const { data: withdrawals, error: fetchError } = await admin
      .from("withdrawals")
      .select(`
        *,
        profile:profiles(full_name, email, referral_code)
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error("Admin withdrawals fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, action } = body;

    if (!withdrawalId || !["paid", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or withdrawalId" }, { status: 400 });
    }

    // Fetch withdrawal details
    const { data: withdrawal, error: findError } = await admin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (findError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: `Withdrawal has already been marked as ${withdrawal.status}` },
        { status: 400 }
      );
    }

    if (action === "paid") {
      // Update withdrawal to paid
      await admin
        .from("withdrawals")
        .update({ status: "paid" })
        .eq("id", withdrawalId);

      return NextResponse.json({
        success: true,
        message: `Withdrawal ${withdrawalId} marked as PAID.`,
      });
    }

    if (action === "reject") {
      // 1. Update withdrawal status to rejected
      await admin
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", withdrawalId);

      // 2. Refund coins atomically using the matching wallet RPC
      if (withdrawal.wallet_type === "commission") {
        const { error: refRpcError } = await admin.rpc("increment_commission_coins", {
          user_uuid: withdrawal.user_id,
          coin_amount: withdrawal.coins,
        });
        if (refRpcError) {
          // Fallback direct update
          const { data: userProf } = await admin
            .from("profiles")
            .select("commission_coins")
            .eq("id", withdrawal.user_id)
            .single();
          await admin
            .from("profiles")
            .update({ commission_coins: (userProf?.commission_coins || 0) + withdrawal.coins })
            .eq("id", withdrawal.user_id);
        }
      } else {
        const { error: refRpcError } = await admin.rpc("increment_coins", {
          user_uuid: withdrawal.user_id,
          coin_amount: withdrawal.coins,
        });
        if (refRpcError) {
          // Fallback direct update
          const { data: userProf } = await admin
            .from("profiles")
            .select("coins")
            .eq("id", withdrawal.user_id)
            .single();
          await admin
            .from("profiles")
            .update({ coins: (userProf?.coins || 0) + withdrawal.coins })
            .eq("id", withdrawal.user_id);
        }
      }

      // 3. Log refund transaction
      const transId = `refund_${withdrawal.id}_${Date.now()}`;
      await admin.from("transactions").insert({
        user_id: withdrawal.user_id,
        trans_id: transId,
        type: "refund",
        amount_coins: withdrawal.coins,
        status: "completed",
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal ${withdrawalId} REJECTED and ${withdrawal.coins} coins refunded to user.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
