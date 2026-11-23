import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";

export interface AdminProfile {
  id: string;
  is_admin: boolean;
  is_banned?: boolean;
  full_name: string | null;
  email: string | null;
}

export interface AdminAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  user?: User;
  profile?: AdminProfile;
  adminClient: ReturnType<typeof createAdminClient>;
}

/**
 * Server-side security barrier that verifies:
 * 1. Cryptographic session token via supabase.auth.getUser()
 * 2. Unforgeable database record check for is_admin = true via Service Role
 */
export async function verifyAdminSession(): Promise<AdminAuthResult> {
  const adminClient = createAdminClient();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Please sign in.",
        adminClient,
      };
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, is_admin, is_banned, full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        authorized: false,
        status: 404,
        error: "Profile not found.",
        adminClient,
      };
    }

    if (!profile.is_admin) {
      return {
        authorized: false,
        status: 403,
        error: "Forbidden: Admin access required.",
        adminClient,
      };
    }

    return {
      authorized: true,
      status: 200,
      user,
      profile: profile as AdminProfile,
      adminClient,
    };
  } catch (err) {
    console.error("Admin verification exception:", err);
    return {
      authorized: false,
      status: 500,
      error: "Internal server error during authorization.",
      adminClient,
    };
  }
}
