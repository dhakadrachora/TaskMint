import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Profile } from "@/lib/types";
import { ProfileProvider } from "@/context/ProfileContext";
import { MobileContainer } from "@/components/MobileContainer";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile does not exist yet (e.g. trigger delay or direct signup), create initial profile
  if (!profile) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newRefCode = "";
    for (let i = 0; i < 6; i++) {
      newRefCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data: newProfile } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User",
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "",
        coins: 20,
        referral_code: newRefCode,
        is_admin: false,
      })
      .select()
      .single();

    profile = newProfile;
  }

  const typedProfile = profile as Profile | null;

  return (
    <ProfileProvider initialProfile={typedProfile}>
      <MobileContainer>
        <AppHeader profile={typedProfile} />
        <main className="flex-1 px-4 py-4 space-y-4">
          {children}
        </main>
        <BottomNav />
      </MobileContainer>
    </ProfileProvider>
  );
}
