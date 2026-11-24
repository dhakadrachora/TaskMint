import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AD_REWARD_COINS = 10;
const MAX_ADS_PER_DAY = 20;
const COOLDOWN_SECONDS = 15;

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, coins, is_banned")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: "Your account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    // 2. Check today's ad claims count & recent cooldown
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayClaims, error: claimsError } = await admin
      .from("transactions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .or("type.eq.ad_reward,trans_id.ilike.ad_%")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false });

    if (!claimsError && todayClaims) {
      // Check daily maximum
      if (todayClaims.length >= MAX_ADS_PER_DAY) {
        return NextResponse.json(
          {
            error: `Daily limit reached! You have watched ${MAX_ADS_PER_DAY} ads today. Come back tomorrow for more rewards!`,
            adsWatchedToday: todayClaims.length,
            remainingToday: 0,
          },
          { status: 429 }
        );
      }

      // Check anti-bot cooldown (at least 15s since last claim)
      if (todayClaims.length > 0) {
        const lastClaimTime = new Date(todayClaims[0].created_at).getTime();
        const diffSeconds = (Date.now() - lastClaimTime) / 1000;
        if (diffSeconds < COOLDOWN_SECONDS) {
          const waitSecs = Math.ceil(COOLDOWN_SECONDS - diffSeconds);
          return NextResponse.json(
            {
              error: `Please wait ${waitSecs} seconds before claiming another ad reward.`,
              cooldownRemaining: waitSecs,
            },
            { status: 429 }
          );
        }
      }
    }

    // 3. Atomically credit 10 Coins
    let updatedCoins = profile.coins + AD_REWARD_COINS;
    const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
      user_uuid: user.id,
      coin_amount: AD_REWARD_COINS,
    });

    if (!rpcError && typeof rpcBal === "number") {
      updatedCoins = rpcBal;
    } else {
      await admin
        .from("profiles")
        .update({ coins: updatedCoins })
        .eq("id", user.id);
    }

    // 4. Record transaction in ledger
    const transId = `ad_${user.id}_${Date.now()}`;
    const insertRes = await admin.from("transactions").insert({
      user_id: user.id,
      trans_id: transId,
      type: "ad_reward",
      amount_coins: AD_REWARD_COINS,
      status: "completed",
    });

    // Fallback if DB check constraint on type restricts ad_reward
    if (insertRes.error && insertRes.error.message?.includes("transactions_type_check")) {
      await admin.from("transactions").insert({
        user_id: user.id,
        trans_id: transId,
        type: "checkin",
        amount_coins: AD_REWARD_COINS,
        status: "completed",
      });
    }

    const adsWatchedCount = (todayClaims?.length || 0) + 1;
    const remainingToday = Math.max(0, MAX_ADS_PER_DAY - adsWatchedCount);

    return NextResponse.json({
      success: true,
      reward: AD_REWARD_COINS,
      newBalance: updatedCoins,
      adsWatchedToday: adsWatchedCount,
      remainingToday,
      message: `🎉 +${AD_REWARD_COINS} Coins (₹1.00) Added to your wallet!`,
    });
  } catch (error) {
    console.error("Ad claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
