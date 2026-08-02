import {
  Bell,
  BookOpen,
  Compass,
  Home,
  LayoutDashboard,
  Search,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
};

/** Desktop primary navigation (requirements). */
export const desktopNav: NavItem[] = [
  { label: "Overview", to: "/app", icon: LayoutDashboard },
  { label: "Discover Parts", to: "/app/discover", icon: Compass },
  { label: "Build Lab", to: "/app/builds", icon: Wrench },
  { label: "Deals", to: "/app/deals", icon: Tag, badge: "NEW" },
  { label: "Watchlist", to: "/app/watchlist", icon: Bell },
  { label: "Learn", to: "/app/learn", icon: BookOpen },
];

/** Mobile bottom navigation (requirements). */
export const mobileNav: NavItem[] = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Search", to: "/app/discover", icon: Search },
  { label: "Build", to: "/app/builds", icon: Wrench },
  { label: "Alerts", to: "/app/watchlist", icon: Bell },
  { label: "Profile", to: "/app/settings", icon: User },
];
