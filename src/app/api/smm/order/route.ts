import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { link, quantity } = body;

    // 1. Validate Link
    const trimmedLink = (link || "").trim();
    if (!trimmedLink) {
      return NextResponse.json(
        { error: "Please enter your Instagram Reel or Post link." },
        { status: 400 }
      );
    }

    const isInstagramLink =
      trimmedLink.includes("instagram.com/") ||
      trimmedLink.includes("instagr.am/") ||
      /^https?:\/\/(www\.)?instagram\.com\//i.test(trimmedLink);

    if (!isInstagramLink) {
      return NextResponse.json(
        { error: "Invalid Instagram URL. Link must start with https://www.instagram.com/reel/ or /p/" },
        { status: 400 }
      );
    }

    // 2. Validate Quantity (Minimum 1000)
    const qty = Number(quantity);
    if (!qty || isNaN(qty) || qty < 1000) {
      return NextResponse.json(
        { error: "Minimum quantity is 1,000 views. Please enter at least 1,000." },
        { status: 400 }
      );
    }

    if (qty > 50000) {
      return NextResponse.json(
        { error: "Maximum quantity per order is 50,000 views." },
        { status: 400 }
      );
    }

    // 3. Rate calculation: ₹2 per 1000 views = 20 Coins per 1000 views
    const chargeCoins = Math.ceil((qty / 1000) * 20);
    const chargeInr = Number(((qty / 1000) * 2).toFixed(2));

    const admin = createAdminClient();

    // 4. Check user balance in Earning Wallet
    const { data: profile, error: profError } = await admin
      .from("profiles")
      .select("id, coins, is_banned")
      .eq("id", user.id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_banned) {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    if ((profile.coins || 0) < chargeCoins) {
      return NextResponse.json(
        {
          error: `Insufficient coins. You need ${chargeCoins} Coins (₹${chargeInr}), but your balance is ${profile.coins || 0} Coins. Earn more coins via surveys or check-ins to place this order.`,
          requiredCoins: chargeCoins,
          currentCoins: profile.coins || 0,
        },
        { status: 400 }
      );
    }

    // 5. Atomically deduct coins from Earning Wallet
    const { error: deductError } = await admin.rpc("increment_coins", {
      user_uuid: user.id,
      coin_amount: -chargeCoins,
    });

    if (deductError) {
      return NextResponse.json(
        { error: "Failed to deduct coins. Please try again." },
        { status: 500 }
      );
    }

    // 6. Call CheapSMMHub API v2
    const smmUrl = process.env.SMM_API_URL || "https://www.cheapsmmhub.com/api/v2";
    const smmKey = process.env.SMM_API_KEY || "63f9c84c8e452836c39154c93f633685e2434b12";
    const serviceId = process.env.SMM_IG_VIEWS_SERVICE_ID || "4483";

    try {
      const formParams = new URLSearchParams({
        key: smmKey,
        action: "add",
        service: serviceId,
        link: trimmedLink,
        quantity: qty.toString(),
      });

      const providerRes = await fetch(smmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formParams.toString(),
      });

      const providerData = await providerRes.json();

      // Check if provider returned an error or did not return an order ID
      if (!providerRes.ok || !providerData || providerData.error || !providerData.order) {
        console.error("SMM Provider Error:", providerData);

        // Immediate Refund
        await admin.rpc("increment_coins", {
          user_uuid: user.id,
          coin_amount: chargeCoins,
        });

        const providerMsg =
          typeof providerData?.error === "string"
            ? providerData.error
            : "Provider error occurred. Your coins have been automatically refunded.";

        return NextResponse.json(
          { error: providerMsg },
          { status: 502 }
        );
      }

      const providerOrderId = String(providerData.order);
      const transId = `smm_${providerOrderId}_${Date.now()}`;

      // 7 & 8. Insert order and transaction in parallel
      const [orderInsertResult] = await Promise.all([
        admin
          .from("smm_orders")
          .insert({
            user_id: user.id,
            provider_order_id: providerOrderId,
            service_id: Number(serviceId),
            link: trimmedLink,
            quantity: qty,
            charge_coins: chargeCoins,
            charge_inr: chargeInr,
            status: "Pending",
            estimated_time: "15 mins - 2 hours",
          })
          .select()
          .single(),
        admin.from("transactions").insert({
          user_id: user.id,
          trans_id: transId,
          type: "smm_order",
          amount_coins: -chargeCoins,
          status: "completed",
        }),
      ]);

      const newOrder = orderInsertResult.data;
      if (orderInsertResult.error) {
        console.error("Order DB insertion error:", orderInsertResult.error);
      }

      return NextResponse.json({
        success: true,
        message: `🎉 Order placed successfully for ${qty.toLocaleString()} views! Starts in 0-15 mins.`,
        order: newOrder,
        remainingCoins: (profile.coins || 0) - chargeCoins,
      });
    } catch (providerCallError) {
      console.error("SMM Network Exception:", providerCallError);

      // Immediate refund on network failure
      await admin.rpc("increment_coins", {
        user_uuid: user.id,
        coin_amount: chargeCoins,
      });

      return NextResponse.json(
        { error: "SMM Provider connection failed. Your coins have been safely refunded." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("SMM Order route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
