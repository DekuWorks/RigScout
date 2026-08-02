import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
});

vi.mock("./supabase", () => ({
  getSupabase: () => null,
}));

import { getPublicBuildBySlug, updateBuild } from "./builds";
import type { Build } from "@/types/builds";

function sampleBuild(slug: string, isPublic: boolean): Build {
  return {
    id: "build-1",
    user_id: "guest",
    name: "Shared Rig",
    notes: null,
    is_public: isPublic,
    share_slug: slug,
    status: "in_progress",
    target_total_minor: null,
    currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
  };
}

describe("getPublicBuildBySlug", () => {
  beforeEach(() => {
    store.clear();
  });

  it("returns a public local build by slug", async () => {
    store.set("rigscout:builds:guest", JSON.stringify([sampleBuild("demo-share", true)]));
    const build = await getPublicBuildBySlug("demo-share");
    expect(build?.name).toBe("Shared Rig");
  });

  it("hides private local builds", async () => {
    store.set("rigscout:builds:guest", JSON.stringify([sampleBuild("private-share", false)]));
    await expect(getPublicBuildBySlug("private-share")).resolves.toBeNull();
  });

  it("unshare clears public flags via updateBuild", async () => {
    store.set("rigscout:builds:guest", JSON.stringify([sampleBuild("demo-share", true)]));
    await updateBuild("guest", "build-1", { is_public: false, share_slug: null }, false);
    await expect(getPublicBuildBySlug("demo-share")).resolves.toBeNull();
  });
});
