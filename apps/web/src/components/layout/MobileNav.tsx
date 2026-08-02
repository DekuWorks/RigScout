import { NavLink } from "react-router-dom";
import { mobileNav } from "./nav";

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {mobileNav.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/app"}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition",
                  isActive ? "text-rs-accent" : "text-[var(--muted)]",
                ].join(" ")
              }
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
