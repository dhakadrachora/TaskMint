import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// In-flight concurrency lock to prevent simultaneous race conditions
const checkinLocks = new Set<string>();

export async function POST() {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;

    // Prevent concurrent duplicate requests from same user
    if (checkinLocks.has(userId)) {
      return NextResponse.json(
        { error: "Check-in claim in progress, please wait..." },
        { status: 429 }
      );
    }
    checkinLocks.add(userId);

    const admin = createAdminClient();

    // Fetch user profile to check last_checkin
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, last_checkin, coins, is_banned")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Check 24-hour limit
    const now = Date.now();
    if (profile.last_checkin) {
      const lastCheckinTime = new Date(profile.last_checkin).getTime();
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

    const CHECKIN_REWARD = 2;
    const nowIso = new Date().toISOString();
    const transId = `checkin_${user.id}_${now}`;
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Atomic conditional DB check: only update if last_checkin is NULL or older than 24 hours
    const { data: updatedProfile, error: updateError } = await admin
      .from("profiles")
      .update({ last_checkin: nowIso })
      .eq("id", user.id)
      .or(`last_checkin.is.null,last_checkin.lte.${twentyFourHoursAgo}`)
      .select("id")
      .single();

    if (updateError || !updatedProfile) {
      return NextResponse.json(
        { error: "Daily check-in already claimed or in cooldown." },
        { status: 400 }
      );
    }

    // Safely increment coins atomically with row lock
    const { data: rpcBal, error: rpcError } = await admin.rpc("increment_coins", {
      user_uuid: user.id,
      coin_amount: CHECKIN_REWARD,
    });

    let updatedCoins = profile.coins + CHECKIN_REWARD;
    if (!rpcError && typeof rpcBal === "number") {
      updatedCoins = rpcBal;
    } else {
      await admin
        .from("profiles")
        .update({ coins: updatedCoins })
        .eq("id", user.id);
    }

    // Record ledger transaction
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
      message: "+2 Coins claimed successfully!",
    });
  } catch (error: unknown) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (userId) {
      checkinLocks.delete(userId);
    }
  }
}
