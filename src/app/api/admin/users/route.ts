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
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let query = admin
      .from("profiles")
      .select("id, email, full_name, phone, coins, commission_coins, referral_code, referred_by, is_admin, is_banned, ban_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,referral_code.ilike.%${search}%`
      );
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
