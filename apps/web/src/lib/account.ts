import { env } from "./env";
import { ApiError } from "./api";
import { getSupabase } from "./supabase";

async function authHeader(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in.");
  return { Authorization: `Bearer ${token}` };
}

async function accountFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeader();
  const url = `${env.VITE_API_BASE_URL.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail || "Request failed", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type AccountExport = {
  exported_at: string;
  user: { id: string; email?: string | null };
  profile: Record<string, unknown> | null;
  builds: unknown[];
  watchlists: unknown[];
  price_alerts: unknown[];
  notifications: unknown[];
};

export function exportAccount() {
  return accountFetch<AccountExport>("/v1/account/export");
}

export function deleteAccount() {
  return accountFetch<{ deleted: boolean; user_id: string }>("/v1/account", {
    method: "DELETE",
  });
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
