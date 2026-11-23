import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-auth";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized || !auth.adminClient) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = auth.adminClient;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    let query = admin
      .from("smm_orders")
      .select(`
        *,
        profile:profiles(full_name, email, phone)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.ilike("status", `%${status}%`);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("Admin SMM fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized || !auth.adminClient) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = auth.adminClient;
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await admin
      .from("smm_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "SMM Order not found" }, { status: 404 });
    }

    // Call CheapSMMHub API v2 to check live status
    const smmUrl = process.env.SMM_API_URL || "https://www.cheapsmmhub.com/api/v2";
    const smmKey = process.env.SMM_API_KEY || "63f9c84c8e452836c39154c93f633685e2434b12";

    const formParams = new URLSearchParams({
      key: smmKey,
      action: "status",
      order: order.provider_order_id,
    });

    const res = await fetch(smmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formParams.toString(),
    });

    const data = await res.json();

    if (res.ok && data && !data.error && data.status) {
      const updatedStatus = data.status;
      const startCount = data.start_count ? String(data.start_count) : order.start_count;
      const remains = data.remains ? String(data.remains) : order.remains;

      await admin
        .from("smm_orders")
        .update({
          status: updatedStatus,
          start_count: startCount,
          remains: remains,
        })
        .eq("id", orderId);

      return NextResponse.json({
        success: true,
        message: `Status synced: ${updatedStatus}`,
        status: updatedStatus,
        startCount,
        remains,
      });
    }

    return NextResponse.json({
      success: false,
      error: data?.error || "Provider could not find status for this order ID",
    }, { status: 400 });
  } catch (error) {
    console.error("Admin SMM sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
