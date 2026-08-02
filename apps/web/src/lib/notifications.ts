import { getSupabase } from "./supabase";
import type { AppNotification } from "@/types/database";

const STORAGE_PREFIX = "rigscout:notifications:";

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId}`;
}

function localNotifications(ownerId: string): AppNotification[] {
  try {
    const value = localStorage.getItem(storageKey(ownerId));
    return value ? (JSON.parse(value) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(ownerId: string, rows: AppNotification[]) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(rows));
}

function parseNotification(value: unknown): AppNotification {
  const row = value as Record<string, unknown>;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    alert_id: typeof row.alert_id === "string" ? row.alert_id : null,
    product_id: typeof row.product_id === "string" ? row.product_id : null,
    title: String(row.title),
    body: String(row.body),
    event_key: String(row.event_key),
    read_at: typeof row.read_at === "string" ? row.read_at : null,
    created_at: String(row.created_at),
  };
}

export async function listNotifications(
  ownerId: string,
  useRemote: boolean,
): Promise<AppNotification[]> {
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) return localNotifications(ownerId);
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(parseNotification);
}

export async function markNotificationRead(
  ownerId: string,
  notificationId: string,
  useRemote: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", notificationId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localNotifications(ownerId).map((row) =>
      row.id === notificationId ? { ...row, read_at: now } : row,
    ),
  );
}

export async function markAllNotificationsRead(
  ownerId: string,
  useRemote: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .is("read_at", null);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localNotifications(ownerId).map((row) => ({ ...row, read_at: row.read_at ?? now })),
  );
}

/** Seed a local demo notification when guest has none (inbox never empty in demo). */
export function ensureGuestDemoNotifications(ownerId: string): AppNotification[] {
  const existing = localNotifications(ownerId);
  if (existing.length) return existing;
  const demo: AppNotification = {
    id: crypto.randomUUID(),
    user_id: ownerId,
    alert_id: null,
    product_id: "b0000001-0000-4000-8000-000000000002",
    title: "Demo: RTX 4070 Super near your target",
    body: "In-app alerts work offline in guest mode. Connect Supabase for live evaluation.",
    event_key: `guest-demo-${ownerId}`,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  saveLocal(ownerId, [demo]);
  return [demo];
}
