type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rs-card flex flex-col items-start gap-3 border-rs-danger/40 bg-rs-danger/5 p-6"
    >
      <h3 className="font-display text-lg font-semibold text-rs-danger">{title}</h3>
      <p className="text-sm text-[var(--muted)]">{message}</p>
      {onRetry ? (
        <button type="button" className="rs-btn-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
