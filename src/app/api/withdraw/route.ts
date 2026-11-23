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
    const { upiId, coins, walletType = "earning" } = body;
    const isCommission = walletType === "commission";

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

    // Fetch profile and check previous withdrawals in parallel
    const [profileRes, prevWithdrawalsRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, coins, commission_coins, is_banned")
        .eq("id", user.id)
        .single(),
      admin
        .from("withdrawals")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "paid"]),
    ]);

    const profile = profileRes.data;
    if (profileRes.error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: "Your account has been suspended for security review. Please contact support." },
        { status: 403 }
      );
    }

    // Minimum limit rules:
    // Commission Wallet rule: strictly min 1000 Coins (₹100)
    // Earning Wallet rule: 500 Coins (first time) or 1000 Coins (subsequent)
    let minCoinsRequired = 500;
    let minInr = 50;

    if (isCommission) {
      minCoinsRequired = 1000;
      minInr = 100;
      if (requestedCoins < minCoinsRequired) {
        return NextResponse.json(
          {
            error: "Commission balance withdrawal requires a minimum of 1000 Coins (₹100).",
            minCoinsRequired,
          },
          { status: 400 }
        );
      }

      const commissionCoins = profile.commission_coins || 0;
      if (commissionCoins < requestedCoins) {
        return NextResponse.json(
          {
            error: `Insufficient commission balance. You have ${commissionCoins} Coins (₹${coinsToInr(commissionCoins)}), but requested ${requestedCoins} Coins.`,
          },
          { status: 400 }
        );
      }
    } else {
      // Check user's previous withdrawals for Earning Wallet tier
      const previousWithdrawals = prevWithdrawalsRes.data;
      const hasPriorWithdrawals = Boolean(
        !prevWithdrawalsRes.error && previousWithdrawals && previousWithdrawals.length > 0
      );

      minCoinsRequired = hasPriorWithdrawals ? 1000 : 500;
      minInr = hasPriorWithdrawals ? 100 : 50;

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

      if (profile.coins < requestedCoins) {
        return NextResponse.json(
          {
            error: `Insufficient earning balance. You have ${profile.coins} Coins, but requested ${requestedCoins} Coins.`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate INR equivalent
    const amountInr = coinsToInr(requestedCoins);

    // Atomically deduct coins using the appropriate RPC function
    let newBal = 0;
    if (isCommission) {
      const { data: rpcBal, error: rpcError } = await admin.rpc("increment_commission_coins", {
        user_uuid: user.id,
        coin_amount: -requestedCoins,
      });

      if (!rpcError && typeof rpcBal === "number") {
        newBal = rpcBal;
      } else {
        const updatedBal = Math.max(0, (profile.commission_coins || 0) - requestedCoins);
        await admin
          .from("profiles")
          .update({ commission_coins: updatedBal })
          .eq("id", user.id);
        newBal = updatedBal;
      }
    } else {
      const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
        user_uuid: user.id,
        coin_amount: -requestedCoins,
      });

      if (!rpcError && typeof rpcBal === "number") {
        newBal = rpcBal;
      } else {
        const updatedBal = Math.max(0, profile.coins - requestedCoins);
        await admin
          .from("profiles")
          .update({ coins: updatedBal })
          .eq("id", user.id);
        newBal = updatedBal;
      }
    }

    // Insert withdrawal record with wallet_type
    const { data: withdrawal, error: withdrawError } = await admin
      .from("withdrawals")
      .insert({
        user_id: user.id,
        upi_id: upiId.trim(),
        coins: requestedCoins,
        amount_inr: amountInr,
        wallet_type: isCommission ? "commission" : "earning",
        status: "pending",
      })
      .select()
      .single();

    if (withdrawError) {
      // In case of insertion failure, refund deducted coins
      if (isCommission) {
        await admin.rpc("increment_commission_coins", {
          user_uuid: user.id,
          coin_amount: requestedCoins,
        });
      } else {
        await admin.rpc("increment_coins", {
          user_uuid: user.id,
          coin_amount: requestedCoins,
        });
      }
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
      message: `Withdrawal of ₹${amountInr} requested from ${isCommission ? "Commission" : "Earning"} Wallet to ${upiId.trim()}`,
      newBalance: newBal,
      walletType: isCommission ? "commission" : "earning",
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
