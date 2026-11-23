import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.NEXT_PUBLIC_CPX_APP_ID || "";
    const secureHashSecret = process.env.CPX_SECURE_HASH || "";

    let md5Hash = "";
    if (secureHashSecret) {
      // MD5(user_id + "-" + CPX_SECURE_HASH)
      md5Hash = crypto
        .createHash("md5")
        .update(`${user.id}-${secureHashSecret}`)
        .digest("hex");
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email || "",
      appId,
      md5Hash,
      configured: Boolean(appId && secureHashSecret),
    });
  } catch (error: unknown) {
    console.error("CPX Hash route error:", error);
    return NextResponse.json(
      { error: "Failed to generate CPX hash" },
      { status: 500 }
    );
  }
}
