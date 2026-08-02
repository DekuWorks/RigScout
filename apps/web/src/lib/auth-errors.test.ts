import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("maps invalid credentials", () => {
    expect(friendlyAuthError({ message: "Invalid login credentials" })).toMatch(/incorrect/i);
  });

  it("maps unconfirmed email", () => {
    expect(friendlyAuthError({ message: "Email not confirmed" })).toMatch(/verify/i);
  });
});
