/** Lightweight Supabase row types for Phase 2. Expand as features land. */

export type PlanTier = "free" | "scout_pro";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: "dark" | "light" | "system";
  currency: string;
  region: string;
  plan_tier: PlanTier;
  notify_in_app: boolean;
  notify_email: boolean;
  privacy_share_builds: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "display_name"
    | "avatar_url"
    | "theme"
    | "currency"
    | "region"
    | "notify_in_app"
    | "notify_email"
    | "privacy_share_builds"
  >
>;
