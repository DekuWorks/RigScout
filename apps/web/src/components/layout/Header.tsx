import { Bell, Moon, Search, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useThemeStore } from "@/stores/theme";

export function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--card-border)] bg-[var(--bg)]/80 px-4 backdrop-blur-md lg:px-6">
      <div className="lg:hidden">
        <Logo variant="icon" to="/app" />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 items-center">
        <label className="relative w-full">
          <span className="sr-only">Search parts, builds, or brands</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search parts, builds, or brands..."
            className="rs-input pl-10 pr-16"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--card-border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:inline">
            ⌘ K
          </kbd>
        </label>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative rounded-xl p-2 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--fg)]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rs-primary" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2 text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--fg)]"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <Link
          to="/app/settings"
          className="ml-1 hidden items-center gap-2 rounded-xl border border-[var(--card-border)] px-2 py-1.5 transition hover:border-rs-primary/40 sm:flex"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rs-primary/20 text-xs font-bold text-rs-accent">
            RS
          </span>
          <span className="pr-1 text-left text-xs leading-tight">
            <span className="block font-semibold">Guest</span>
            <span className="text-[var(--muted)]">Free plan</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
