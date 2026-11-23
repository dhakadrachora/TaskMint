import { NextRequest } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // '1' = credited, '2' = reversal
    const trans_id = searchParams.get("trans_id");
    const user_id = searchParams.get("user_id");
    const amount_usd = searchParams.get("amount_usd");
    const hash = searchParams.get("hash");

    // Basic presence validation
    if (!status || !trans_id || !user_id || !amount_usd) {
      return new Response("Missing required parameters", { status: 400 });
    }

    const secureHashSecret = process.env.CPX_SECURE_HASH;

    // Verify MD5 hash: md5(trans_id + "-" + CPX_SECURE_HASH)
    if (secureHashSecret) {
      const expectedHash = crypto
        .createHash("md5")
        .update(`${trans_id}-${secureHashSecret}`)
        .digest("hex");

      if (!hash || hash.toLowerCase() !== expectedHash.toLowerCase()) {
        console.warn(`[CPX Postback] Invalid hash for trans_id=${trans_id}. Provided: ${hash}, Expected: ${expectedHash}`);
        return new Response("Forbidden: Invalid Hash", { status: 403 });
      }
    }

    const admin = createAdminClient();

    // Verify user exists
    const { data: userProfile, error: profileError } = await admin
      .from("profiles")
      .select("id, referred_by")
      .eq("id", user_id)
      .single();

    if (profileError || !userProfile) {
      console.error(`[CPX Postback] User not found: ${user_id}`);
      return new Response("User not found", { status: 404 });
    }

    // Conversion math: $1 USD = 1000 Coins base value.
    // Credit user 70% (Math.round(parseFloat(amount_usd) * 700) Coins)
    const amountUsdNum = parseFloat(amount_usd);
    if (isNaN(amountUsdNum) || amountUsdNum < 0) {
      return new Response("Invalid amount_usd", { status: 400 });
    }

    const userCoins = Math.round(amountUsdNum * 700);

    // STATUS 1: Successful completion
    if (status === "1") {
      // 1. Check if trans_id already exists to prevent duplicate crediting
      const { data: existingTx } = await admin
        .from("transactions")
        .select("id")
        .eq("trans_id", trans_id)
        .maybeSingle();

      if (existingTx) {
        // Return OK immediately to acknowledge CPX postback without double-crediting
        return new Response("OK", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      // 2. Insert into transactions
      await admin.from("transactions").insert({
        user_id,
        trans_id,
        type: "survey",
        amount_coins: userCoins,
        status: "completed",
      });

      // 3. Atomically increment user coins
      await admin.rpc("increment_coins", {
        user_uuid: user_id,
        coin_amount: userCoins,
      });

      // 4. Check if profile.referred_by exists -> credit 10% lifetime commission to referrer
      if (userProfile.referred_by && userCoins > 0) {
        const { data: referrer } = await admin
          .from("profiles")
          .select("id")
          .eq("referral_code", userProfile.referred_by)
          .single();

        if (referrer && referrer.id !== user_id) {
          const referralCoins = Math.round(userCoins * 0.1);
          if (referralCoins > 0) {
            const refTransId = `ref_${trans_id}_${referrer.id}`;

            // Check duplicate referral tx
            const { data: existingRefTx } = await admin
              .from("transactions")
              .select("id")
              .eq("trans_id", refTransId)
              .maybeSingle();

            if (!existingRefTx) {
              await admin.from("transactions").insert({
                user_id: referrer.id,
                trans_id: refTransId,
                type: "referral",
                amount_coins: referralCoins,
                status: "completed",
              });

              await admin.rpc("increment_coins", {
                user_uuid: referrer.id,
                coin_amount: referralCoins,
              });
            }
          }
        }
      }

      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // STATUS 2: Reversal / Chargeback
    if (status === "2") {
      // Update transaction status to reversed
      await admin
        .from("transactions")
        .update({ status: "reversed" })
        .eq("trans_id", trans_id);

      // Deduct coins from user balance
      await admin.rpc("increment_coins", {
        user_uuid: user_id,
        coin_amount: -userCoins,
      });

      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Fallback for unhandled statuses
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[CPX Postback] Unhandled error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
