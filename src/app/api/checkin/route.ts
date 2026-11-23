import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
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

    // Fetch user profile to check last_checkin
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, last_checkin, coins")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check 24-hour limit
    if (profile.last_checkin) {
      const lastCheckinTime = new Date(profile.last_checkin).getTime();
      const now = Date.now();
      const diffHours = (now - lastCheckinTime) / (1000 * 60 * 60);

      if (diffHours < 24) {
        const remainingMs = 24 * 60 * 60 * 1000 - (now - lastCheckinTime);
        return NextResponse.json(
          {
            error: "Already claimed within 24 hours",
            remainingMs,
          },
          { status: 400 }
        );
      }
    }

    const CHECKIN_REWARD = 10;
    const nowIso = new Date().toISOString();

    // Safely increment coins using RPC or direct update with admin client
    let updatedCoins = profile.coins + CHECKIN_REWARD;
    const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
      user_uuid: user.id,
      coin_amount: CHECKIN_REWARD,
    });

    if (!rpcError && typeof rpcBal === "number") {
      updatedCoins = rpcBal;
    } else {
      // Fallback direct update if RPC is missing
      await admin
        .from("profiles")
        .update({
          coins: updatedCoins,
          last_checkin: nowIso,
        })
        .eq("id", user.id);
    }

    // Always record last_checkin time
    await admin
      .from("profiles")
      .update({ last_checkin: nowIso })
      .eq("id", user.id);

    // Record transaction
    const transId = `checkin_${user.id}_${Date.now()}`;
    await admin.from("transactions").insert({
      user_id: user.id,
      trans_id: transId,
      type: "checkin",
      amount_coins: CHECKIN_REWARD,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      reward: CHECKIN_REWARD,
      coins: updatedCoins,
      last_checkin: nowIso,
      message: "+10 Coins claimed successfully!",
    });
  } catch (error: unknown) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
