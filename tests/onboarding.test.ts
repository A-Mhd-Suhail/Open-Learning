import { describe, expect, it } from "vitest";
import {
  callbackErrorFromParams, isOnboarded, nameStepRedirect, onboardingRedirect, parseDisplayName, postAuthDestination, safeNext, suggestedName,
} from "@/lib/onboarding";

const q = (s: string) => new URLSearchParams(s);

describe("parseDisplayName", () => {
  it("trims and collapses whitespace", () => {
    expect(parseDisplayName("  Aarav   Sharma ")).toEqual({ ok: true, name: "Aarav Sharma" });
  });
  it("accepts non-latin and digits from Google names", () => {
    expect(parseDisplayName("राहुल शर्मा").ok).toBe(true);
    expect(parseDisplayName("Sam 2").ok).toBe(true);
  });
  it("rejects empty, whitespace, too short, too long, markup, control chars, non-strings", () => {
    for (const v of ["", "   ", "A", "x".repeat(51), "<b>hi</b>", "ab\u0000c", null, 42, undefined])
      expect(parseDisplayName(v).ok, String(v)).toBe(false);
  });
  it("allows exactly the DB bounds (2 and 50)", () => {
    expect(parseDisplayName("Al").ok).toBe(true);
    expect(parseDisplayName("x".repeat(50)).ok).toBe(true);
  });
});

describe("completion and redirects", () => {
  it("isOnboarded", () => {
    expect(isOnboarded({ onboarded_at: null })).toBe(false);
    expect(isOnboarded({ onboarded_at: "2026-01-01T00:00:00Z" })).toBe(true);
    expect(isOnboarded({})).toBe(true); // column absent (old DB): never lock anyone out
  });
  it("/onboarding", () => {
    expect(onboardingRedirect({ signedIn: false, onboarded: false })).toBeNull();
    expect(onboardingRedirect({ signedIn: true, onboarded: true })).toBe("/dashboard");
    expect(onboardingRedirect({ signedIn: true, onboarded: false })).toBe("/onboarding/name");
  });
  it("/onboarding/name", () => {
    expect(nameStepRedirect({ signedIn: false, onboarded: false })).toBe("/onboarding");
    expect(nameStepRedirect({ signedIn: true, onboarded: true })).toBe("/dashboard");
    expect(nameStepRedirect({ signedIn: true, onboarded: false })).toBeNull();
  });
});

describe("oauth callback", () => {
  it("maps cancel, provider errors and missing code", () => {
    expect(callbackErrorFromParams(q("error=access_denied"))).toBe("auth_cancelled");
    expect(callbackErrorFromParams(q("error=server_error&error_description=User+cancelled"))).toBe("auth_cancelled");
    expect(callbackErrorFromParams(q("error=server_error&error_description=boom"))).toBe("auth_failed");
    expect(callbackErrorFromParams(q(""))).toBe("auth_failed");
    expect(callbackErrorFromParams(q("code=abc"))).toBeNull();
  });
  it("routes by completion, never trusting next for new students", () => {
    expect(postAuthDestination(false, "/admin")).toBe("/onboarding/name");
    expect(postAuthDestination(true, null)).toBe("/dashboard");
    expect(postAuthDestination(true, "/learn")).toBe("/learn");
    expect(postAuthDestination(true, "//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
  });
});

describe("suggestedName", () => {
  it("prefers Google full name, truncates, falls back", () => {
    expect(suggestedName({ full_name: " Priya  Nair " }, "priya")).toBe("Priya Nair");
    expect(suggestedName({ name: "Only Name" }, "x")).toBe("Only Name");
    expect(suggestedName({ full_name: "a".repeat(80) }, "x")).toBe("a".repeat(50));
    expect(suggestedName({ full_name: 5 }, "fallback")).toBe("fallback");
    expect(suggestedName(undefined, "fallback")).toBe("fallback");
  });
});
