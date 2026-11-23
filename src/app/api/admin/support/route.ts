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
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let query = admin
      .from("support_tickets")
      .select(`
        *,
        profile:profiles(id, full_name, email, phone, coins, commission_coins)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: tickets, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ tickets: [] });
      }
      throw error;
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    console.error("Admin fetch support error:", error);
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
    const { ticketId, reply, status } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updated_at: nowIso,
    };

    if (reply && typeof reply === "string" && reply.trim()) {
      updatePayload.admin_reply = reply.trim();
      updatePayload.admin_replied_at = nowIso;
    }

    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      updatePayload.status = status;
      if (status === "resolved" || status === "closed") {
        updatePayload.resolved_at = nowIso;
      }
    }

    const { data: updatedTicket, error: updateError } = await admin
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticketId)
      .select(`
        *,
        profile:profiles(id, full_name, email, phone)
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `Support ticket updated to status: ${updatedTicket.status}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Admin update support error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
