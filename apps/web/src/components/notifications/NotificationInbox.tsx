import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { getSupabase } from "@/lib/supabase";
import {
  ensureGuestDemoNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

export function NotificationInbox() {
  const { user, supabaseConfigured } = useAuth();
  const ownerId = user?.id ?? "guest";
  const useRemote = supabaseConfigured && Boolean(user);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryKey = ["notifications", ownerId, useRemote];

  const notifications = useQuery({
    queryKey,
    queryFn: async () => {
      if (!useRemote) return ensureGuestDemoNotifications(ownerId);
      return listNotifications(ownerId, true);
    },
  });

  const unread = (notifications.data ?? []).filter((n) => !n.read_at).length;

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(ownerId, id, useRemote),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(ownerId, useRemote),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
  });

  useEffect(() => {
    if (!useRemote) return;
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [useRemote, user, queryClient, queryKey]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-xl p-2 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--fg)]"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notification-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rs-primary" aria-hidden />
        ) : null}
      </button>

      {open ? (
        <div
          id="notification-panel"
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-3 py-2">
            <p className="text-sm font-semibold" id="notification-panel-title">
              Notifications
            </p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-rs-accent hover:underline"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {(notifications.data ?? []).length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                No notifications yet.
              </li>
            ) : (
              (notifications.data ?? []).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-3 text-left transition hover:bg-white/5 ${
                      item.read_at ? "opacity-70" : ""
                    }`}
                    onClick={() => {
                      if (!item.read_at) markOne.mutate(item.id);
                    }}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{item.body}</p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-[var(--card-border)] px-3 py-2">
            <Link
              to="/app/watchlist"
              className="text-xs font-medium text-rs-accent hover:underline"
              onClick={() => setOpen(false)}
            >
              Manage watchlist & alerts
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
