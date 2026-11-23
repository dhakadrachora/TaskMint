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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch order from DB
    const { data: order, error: orderErr } = await admin
      .from("smm_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Call CheapSMMHub status API
    const smmUrl = process.env.SMM_API_URL || "https://www.cheapsmmhub.com/api/v2";
    const smmKey = process.env.SMM_API_KEY || "63f9c84c8e452836c39154c93f633685e2434b12";

    const formParams = new URLSearchParams({
      key: smmKey,
      action: "status",
      order: order.provider_order_id,
    });

    const providerRes = await fetch(smmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParams.toString(),
    });

    if (!providerRes.ok) {
      return NextResponse.json({ order, updated: false });
    }

    const providerData = await providerRes.json();

    if (providerData?.error) {
      return NextResponse.json({ order, updated: false, error: providerData.error });
    }

    // Normalize status string (e.g. "In progress", "Completed", "Pending", "Partial", "Canceled")
    const cleanStatus = providerData.status || order.status;
    const startCount = providerData.start_count !== undefined ? String(providerData.start_count) : order.start_count;
    const remains = providerData.remains !== undefined ? String(providerData.remains) : order.remains;

    // Update in database
    const { data: updatedOrder, error: updateErr } = await admin
      .from("smm_orders")
      .update({
        status: cleanStatus,
        start_count: startCount,
        remains: remains,
      })
      .eq("id", order.id)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      order: updatedOrder || { ...order, status: cleanStatus, start_count: startCount, remains },
      updated: true,
    });
  } catch (error) {
    console.error("SMM Status route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
