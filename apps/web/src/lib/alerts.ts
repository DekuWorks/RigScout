import { getSupabase } from "./supabase";
import type { AlertInput, PriceAlert } from "@/types/database";

const STORAGE_PREFIX = "rigscout:alerts:";

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId}`;
}

function localAlerts(ownerId: string): PriceAlert[] {
  try {
    const value = localStorage.getItem(storageKey(ownerId));
    return value ? (JSON.parse(value) as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(ownerId: string, rows: PriceAlert[]) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(rows));
}

const ALERT_SELECT = "*,product:products(id,slug,name,brand,category)";

function parseAlert(value: unknown): PriceAlert {
  const row = value as Record<string, unknown>;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    product_id: String(row.product_id),
    watchlist_id: typeof row.watchlist_id === "string" ? row.watchlist_id : null,
    target_price_minor:
      typeof row.target_price_minor === "number" ? row.target_price_minor : null,
    percent_drop: typeof row.percent_drop === "number" ? Number(row.percent_drop) : null,
    channel_in_app: row.channel_in_app !== false,
    channel_email: row.channel_email === true,
    is_active: row.is_active !== false,
    last_triggered_at:
      typeof row.last_triggered_at === "string" ? row.last_triggered_at : null,
    last_triggered_price_minor:
      typeof row.last_triggered_price_minor === "number"
        ? row.last_triggered_price_minor
        : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    product: (row.product as PriceAlert["product"]) ?? null,
  };
}

export async function listAlerts(ownerId: string, useRemote: boolean): Promise<PriceAlert[]> {
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) return localAlerts(ownerId);
  const { data, error } = await supabase
    .from("price_alerts")
    .select(ALERT_SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(parseAlert);
}

export async function createAlert(
  ownerId: string,
  input: AlertInput,
  useRemote: boolean,
): Promise<PriceAlert> {
  if (input.target_price_minor == null && input.percent_drop == null) {
    throw new Error("Set a target price or percent drop.");
  }

  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) {
    const now = new Date().toISOString();
    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      user_id: ownerId,
      product_id: input.product_id,
      watchlist_id: input.watchlist_id ?? null,
      target_price_minor: input.target_price_minor ?? null,
      percent_drop: input.percent_drop ?? null,
      channel_in_app: input.channel_in_app ?? true,
      channel_email: input.channel_email ?? false,
      is_active: true,
      last_triggered_at: null,
      last_triggered_price_minor: null,
      created_at: now,
      updated_at: now,
      product: null,
    };
    saveLocal(ownerId, [alert, ...localAlerts(ownerId)]);
    return alert;
  }

  const { data, error } = await supabase
    .from("price_alerts")
    .insert({
      user_id: ownerId,
      product_id: input.product_id,
      watchlist_id: input.watchlist_id ?? null,
      target_price_minor: input.target_price_minor ?? null,
      percent_drop: input.percent_drop ?? null,
      channel_in_app: input.channel_in_app ?? true,
      channel_email: input.channel_email ?? false,
    })
    .select(ALERT_SELECT)
    .single();
  if (error) throw error;
  return parseAlert(data);
}

export async function setAlertActive(
  ownerId: string,
  alertId: string,
  isActive: boolean,
  useRemote: boolean,
): Promise<void> {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase
      .from("price_alerts")
      .update({ is_active: isActive })
      .eq("id", alertId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localAlerts(ownerId).map((alert) =>
      alert.id === alertId
        ? { ...alert, is_active: isActive, updated_at: new Date().toISOString() }
        : alert,
    ),
  );
}

export async function deleteAlert(
  ownerId: string,
  alertId: string,
  useRemote: boolean,
): Promise<void> {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("price_alerts").delete().eq("id", alertId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localAlerts(ownerId).filter((alert) => alert.id !== alertId),
  );
}
