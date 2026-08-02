import { Link } from "react-router-dom";
import iconUrl from "@/assets/rigscout-icon.png";

type LogoProps = {
  variant?: "full" | "icon" | "wordmark";
  className?: string;
  to?: string;
};

export function Logo({ variant = "full", className = "", to = "/" }: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {(variant === "full" || variant === "icon") && (
        <img
          src={iconUrl}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-xl shadow-md shadow-rs-primary/20"
        />
      )}
      {(variant === "full" || variant === "wordmark") && (
        <span className="font-display text-lg font-bold tracking-tight">
          <span className="text-[var(--fg)]">RIG</span>
          <span className="rs-gradient-text">SCOUT</span>
        </span>
      )}
      {variant === "icon" && <span className="sr-only">RigScout</span>}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="rounded-lg focus-visible:outline-offset-4">
        {content}
      </Link>
    );
  }

  return content;
}
