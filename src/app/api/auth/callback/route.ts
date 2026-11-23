import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const ref = requestUrl.searchParams.get("ref");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError && sessionData?.user) {
      const user = sessionData.user;
      const adminClient = createAdminClient();

      // Check if user's profile already has referred_by set
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, referral_code, referred_by")
        .eq("id", user.id)
        .single();

      // If referral code is provided and user has no referred_by yet
      if (ref && profile && !profile.referred_by) {
        const sanitizedRef = ref.trim().toUpperCase();

        // Make sure user is not referring themselves
        if (sanitizedRef !== profile.referral_code) {
          // Check if referrer exists
          const { data: referrer } = await adminClient
            .from("profiles")
            .select("id, referral_code")
            .eq("referral_code", sanitizedRef)
            .single();

          if (referrer) {
            await adminClient
              .from("profiles")
              .update({ referred_by: sanitizedRef })
              .eq("id", user.id);
          }
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  const next = requestUrl.searchParams.get("next") || "/";
  const redirectPath = next.startsWith("/") ? next : `/${next}`;
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
