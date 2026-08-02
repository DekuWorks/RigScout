import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase: string;
};

export function PlaceholderPage({ title, description, phase }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-accent">{phase}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{title}</h1>
      </div>
      <EmptyState
        title={`${title} coming online`}
        description={description}
        action={
          <Link to="/app" className="rs-btn-secondary">
            Back to Overview
          </Link>
        }
      />
    </div>
  );
}
