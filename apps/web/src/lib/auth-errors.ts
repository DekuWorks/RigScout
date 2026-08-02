/** Map Supabase / auth errors to friendly copy. */

export function friendlyAuthError(error: unknown): string {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: string }).message)
      : String(error ?? "Something went wrong");

  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox for a confirmation link.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("password")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return message || "Authentication failed. Please try again.";
}
