import { NavLink } from "react-router-dom";
import { BRAND } from "@rigscout/shared";
import { Logo } from "@/components/brand/Logo";
import { desktopNav } from "./nav";

export function Sidebar() {
  return (
    <aside
      aria-label="Application"
      className="hidden w-64 shrink-0 flex-col border-r border-[var(--card-border)] bg-[var(--card)]/40 px-4 py-5 lg:flex"
    >
      <div className="mb-8 px-2">
        <Logo />
        <p className="mt-2 text-xs text-[var(--muted)]">{BRAND.tagline}</p>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {desktopNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-rs-primary/15 text-rs-accent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-rs-primary)_35%,transparent)]"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--fg)]",
              ].join(" ")
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-md bg-rs-primary/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-rs-accent">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rs-card border-rs-primary/30 bg-gradient-to-br from-rs-primary/15 to-transparent p-4">
          <p className="font-display text-sm font-semibold">Scout Pro</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Unlock advanced tracking, alerts, and build analytics.
          </p>
          <button type="button" className="rs-btn-primary mt-3 w-full text-xs" disabled title="Billing not activated yet">
            Upgrade Now
          </button>
        </div>
        <p className="px-2 text-center text-[11px] text-[var(--muted)]">{BRAND.motto}</p>
      </div>
    </aside>
  );
}
