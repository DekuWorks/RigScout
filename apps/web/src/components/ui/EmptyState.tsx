import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rs-card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="text-rs-accent">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-[var(--muted)]">{description}</p>
      {action}
    </div>
  );
}
