import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUpiId, coinsToInr } from "@/lib/utils";

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
    const { upiId, coins } = body;

    // Validate inputs
    if (!upiId || typeof upiId !== "string" || !validateUpiId(upiId)) {
      return NextResponse.json(
        { error: "Please enter a valid UPI ID (e.g. yourname@oksbi or 9876543210@paytm)" },
        { status: 400 }
      );
    }

    const requestedCoins = Number(coins);
    if (!requestedCoins || isNaN(requestedCoins) || requestedCoins <= 0) {
      return NextResponse.json(
        { error: "Invalid coin amount requested" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check user's previous withdrawals to determine minimum limit
    const { data: previousWithdrawals, error: prevError } = await admin
      .from("withdrawals")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "paid"]);

    const hasPriorWithdrawals = Boolean(
      !prevError && previousWithdrawals && previousWithdrawals.length > 0
    );

    const minCoinsRequired = hasPriorWithdrawals ? 1000 : 500;
    const minInr = hasPriorWithdrawals ? 100 : 50;

    if (requestedCoins < minCoinsRequired) {
      return NextResponse.json(
        {
          error: hasPriorWithdrawals
            ? `Subsequent withdrawals require a minimum of 1000 Coins (₹100).`
            : `First withdrawal requires a minimum of 500 Coins (₹50).`,
          minCoinsRequired,
        },
        { status: 400 }
      );
    }

    // Check user's current balance
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, coins")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.coins < requestedCoins) {
      return NextResponse.json(
        {
          error: `Insufficient balance. You have ${profile.coins} Coins, but requested ${requestedCoins} Coins.`,
        },
        { status: 400 }
      );
    }

    // Calculate INR equivalent
    const amountInr = coinsToInr(requestedCoins);

    // Atomically deduct coins using RPC
    let newBal = profile.coins - requestedCoins;
    const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
      user_uuid: user.id,
      coin_amount: -requestedCoins,
    });

    if (!rpcError && typeof rpcBal === "number") {
      newBal = rpcBal;
    } else {
      // Direct update fallback if RPC function not available
      const { error: updateError } = await admin
        .from("profiles")
        .update({ coins: newBal })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to deduct coins. Please try again." },
          { status: 500 }
        );
      }
    }

    // Insert withdrawal record
    const { data: withdrawal, error: withdrawError } = await admin
      .from("withdrawals")
      .insert({
        user_id: user.id,
        upi_id: upiId.trim(),
        coins: requestedCoins,
        amount_inr: amountInr,
        status: "pending",
      })
      .select()
      .single();

    if (withdrawError) {
      // In case of insertion failure, refund deducted coins
      await admin.rpc("increment_coins", {
        user_uuid: user.id,
        coin_amount: requestedCoins,
      });
      return NextResponse.json(
        { error: "Failed to record withdrawal request" },
        { status: 500 }
      );
    }

    // Log withdrawal transaction
    const transId = `withdraw_${withdrawal.id}`;
    await admin.from("transactions").insert({
      user_id: user.id,
      trans_id: transId,
      type: "withdrawal",
      amount_coins: -requestedCoins,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal of ₹${amountInr} requested to ${upiId.trim()}`,
      newBalance: newBal,
      withdrawal,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
