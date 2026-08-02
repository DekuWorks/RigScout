import { PLAN_LIMITS } from "@rigscout/shared";
import { getSupabase } from "./supabase";
import type { PriceAlert, WatchlistEntry } from "@/types/database";
import type { ProductSummary } from "@/types/catalog";

const STORAGE_PREFIX = "rigscout:watchlists:";

type LocalWatch = WatchlistEntry & {
  product: NonNullable<WatchlistEntry["product"]> & {
    best_price_minor?: number;
    currency?: string;
  };
};

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId}`;
}

function localWatchlists(ownerId: string): LocalWatch[] {
  try {
    const value = localStorage.getItem(storageKey(ownerId));
    return value ? (JSON.parse(value) as LocalWatch[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(ownerId: string, rows: LocalWatch[]) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(rows));
}

const WATCH_SELECT =
  "*,product:products(id,slug,name,brand,category),alerts:price_alerts(*)";

function parseWatch(value: unknown): WatchlistEntry {
  const row = value as Record<string, unknown>;
  const product = row.product as WatchlistEntry["product"];
  const alerts = Array.isArray(row.alerts) ? (row.alerts as PriceAlert[]) : [];
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    product_id: String(row.product_id),
    notes: typeof row.notes === "string" ? row.notes : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    product: product ?? null,
    alerts,
  };
}

export async function listWatchlists(
  ownerId: string,
  useRemote: boolean,
): Promise<WatchlistEntry[]> {
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) return localWatchlists(ownerId);
  const { data, error } = await supabase
    .from("watchlists")
    .select(WATCH_SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(parseWatch);
}

export async function addToWatchlist(
  ownerId: string,
  product: ProductSummary,
  useRemote: boolean,
  planTier: "free" | "scout_pro" = "free",
): Promise<WatchlistEntry> {
  const existing = await listWatchlists(ownerId, useRemote);
  const found = existing.find((row) => row.product_id === product.id);
  if (found) return found;

  const limit = PLAN_LIMITS[planTier].maxWatchedProducts;
  if (existing.length >= limit) {
    throw new Error(`Watchlist limit reached (${limit}). Upgrade or remove items.`);
  }

  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) {
    const now = new Date().toISOString();
    const entry: LocalWatch = {
      id: crypto.randomUUID(),
      user_id: ownerId,
      product_id: product.id,
      notes: null,
      created_at: now,
      updated_at: now,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        best_price_minor: product.best_price_minor,
        currency: product.currency,
      },
      alerts: [],
    };
    saveLocal(ownerId, [entry, ...localWatchlists(ownerId)]);
    return entry;
  }

  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: ownerId, product_id: product.id })
    .select(WATCH_SELECT)
    .single();
  if (error) throw error;
  return parseWatch(data);
}

export async function removeFromWatchlist(
  ownerId: string,
  watchlistId: string,
  useRemote: boolean,
): Promise<void> {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("watchlists").delete().eq("id", watchlistId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localWatchlists(ownerId).filter((row) => row.id !== watchlistId),
  );
}
