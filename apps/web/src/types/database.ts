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

export type WatchlistEntry = {
  id: string;
  user_id: string;
  product_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
  } | null;
  alerts?: PriceAlert[];
};

export type PriceAlert = {
  id: string;
  user_id: string;
  product_id: string;
  watchlist_id: string | null;
  target_price_minor: number | null;
  percent_drop: number | null;
  channel_in_app: boolean;
  channel_email: boolean;
  is_active: boolean;
  last_triggered_at: string | null;
  last_triggered_price_minor: number | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
  } | null;
};

export type AlertInput = {
  product_id: string;
  watchlist_id?: string | null;
  target_price_minor?: number | null;
  percent_drop?: number | null;
  channel_in_app?: boolean;
  channel_email?: boolean;
};

export type AppNotification = {
  id: string;
  user_id: string;
  alert_id: string | null;
  product_id: string | null;
  title: string;
  body: string;
  event_key: string;
  read_at: string | null;
  created_at: string;
};
