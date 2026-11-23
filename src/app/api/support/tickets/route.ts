import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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
    const { data: tickets, error } = await admin
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ tickets: [] });
      }
      throw error;
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    console.error("Fetch user support tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { category, subject, message } = body;

    // Strict input validation & sanitization
    const validCategories = ["withdrawal", "survey", "views", "account", "other"];
    const sanitizedCat = validCategories.includes(category) ? category : "other";

    const trimmedSubject = (subject || "").trim();
    const trimmedMessage = (message || "").trim();

    if (!trimmedSubject || trimmedSubject.length < 3) {
      return NextResponse.json(
        { error: "Please enter a subject (at least 3 characters)." },
        { status: 400 }
      );
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      return NextResponse.json(
        { error: "Please explain your problem in detail (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Maximum 2,000 characters allowed." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Generate unique random Ticket ID e.g. TM-6824
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TM-${randomNum}`;

    const { data: newTicket, error: insertError } = await admin
      .from("support_tickets")
      .insert({
        user_id: user.id,
        ticket_number: ticketNumber,
        category: sanitizedCat,
        subject: trimmedSubject,
        message: trimmedMessage,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Support ticket insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit ticket. Please try again or reach out on Telegram." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Ticket #${ticketNumber} created successfully! Our admin team will review it shortly.`,
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
