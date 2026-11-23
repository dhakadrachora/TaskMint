import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-auth";

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized || !auth.adminClient) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = auth.adminClient;
    const body = await request.json();
    const { action, userId, amount, walletType = "earning", reason, banned } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields: action and userId" }, { status: 400 });
    }

    // Verify target user exists
    const { data: targetUser, error: findError } = await admin
      .from("profiles")
      .select("id, full_name, email, coins, commission_coins, is_banned")
      .eq("id", userId)
      .single();

    if (findError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // ACTION 1: Adjust Coins (Credit or Debit)
    if (action === "adjust_coins") {
      const coinDelta = Number(amount);
      if (!coinDelta || isNaN(coinDelta)) {
        return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
      }

      const note = (reason || "Admin manual balance adjustment").trim();
      const isCommission = walletType === "commission";
      let newBal = 0;

      if (isCommission) {
        const { data: rpcBal, error: rpcError } = await admin.rpc("increment_commission_coins", {
          user_uuid: userId,
          coin_amount: coinDelta,
        });

        if (!rpcError && typeof rpcBal === "number") {
          newBal = rpcBal;
        } else {
          newBal = Math.max(0, (targetUser.commission_coins || 0) + coinDelta);
          await admin
            .from("profiles")
            .update({ commission_coins: newBal })
            .eq("id", userId);
        }
      } else {
        const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
          user_uuid: userId,
          coin_amount: coinDelta,
        });

        if (!rpcError && typeof rpcBal === "number") {
          newBal = rpcBal;
        } else {
          newBal = Math.max(0, (targetUser.coins || 0) + coinDelta);
          await admin
            .from("profiles")
            .update({ coins: newBal })
            .eq("id", userId);
        }
      }

      // Record transaction
      const transId = `admin_adj_${userId}_${Date.now()}`;
      await admin.from("transactions").insert({
        user_id: userId,
        trans_id: transId,
        type: coinDelta > 0 ? "admin_credit" : "admin_debit",
        amount_coins: coinDelta,
        status: "completed",
      });

      return NextResponse.json({
        success: true,
        message: `Successfully ${coinDelta > 0 ? "added" : "deducted"} ${Math.abs(coinDelta)} coins to ${targetUser.full_name || targetUser.email || "user"}. New balance: ${newBal} coins.`,
        newBalance: newBal,
      });
    }

    // ACTION 2: Toggle Ban / Active Status
    if (action === "toggle_ban") {
      const shouldBan = Boolean(banned);
      const banNote = (reason || (shouldBan ? "Suspicious activity detected by admin" : "")).trim();

      await admin
        .from("profiles")
        .update({
          is_banned: shouldBan,
          ban_reason: shouldBan ? banNote : null,
        })
        .eq("id", userId);

      return NextResponse.json({
        success: true,
        message: shouldBan
          ? `User ${targetUser.full_name || targetUser.email || userId} has been BANNED.`
          : `User ${targetUser.full_name || targetUser.email || userId} has been UNBANNED.`,
        isBanned: shouldBan,
      });
    }

    return NextResponse.json({ error: "Unknown action specified" }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
