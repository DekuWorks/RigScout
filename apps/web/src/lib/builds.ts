import { getSupabase } from "./supabase";
import type { Build, BuildItem, BuildProduct } from "@/types/builds";

const STORAGE_PREFIX = "rigscout:builds:";

type BuildPatch = Partial<
  Pick<Build, "name" | "notes" | "target_total_minor" | "is_public" | "share_slug" | "status">
>;

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId}`;
}

function localBuilds(ownerId: string): Build[] {
  try {
    const value = localStorage.getItem(storageKey(ownerId));
    return value ? (JSON.parse(value) as Build[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(ownerId: string, builds: Build[]) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(builds));
}

function record(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function parseRemoteBuild(value: unknown): Build {
  const row = record(value);
  const rawItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: text(row.id),
    user_id: text(row.user_id),
    name: text(row.name, "Untitled build"),
    notes: typeof row.notes === "string" ? row.notes : null,
    is_public: row.is_public === true,
    share_slug: typeof row.share_slug === "string" ? row.share_slug : null,
    status:
      row.status === "completed" || row.status === "archived" ? row.status : "in_progress",
    target_total_minor:
      typeof row.target_total_minor === "number" ? row.target_total_minor : null,
    currency: text(row.currency, "USD"),
    created_at: text(row.created_at, new Date().toISOString()),
    updated_at: text(row.updated_at, new Date().toISOString()),
    items: rawItems.map((rawItem) => parseRemoteItem(rawItem, text(row.id))),
  };
}

function parseRemoteItem(value: unknown, buildId: string): BuildItem {
  const row = record(value);
  const product = record(row.product);
  const listing = record(row.listing);
  const retailer = record(listing.retailer);
  const specs = Array.isArray(product.specs)
    ? product.specs.map((value) => {
        const spec = record(value);
        return {
          key: text(spec.key),
          value: text(spec.value),
          unit: typeof spec.unit === "string" ? spec.unit : null,
        };
      })
    : [];
  const listingId = typeof row.listing_id === "string" ? row.listing_id : null;
  const price = number(listing.price_minor);
  const shipping = number(listing.shipping_minor);
  const buildProduct: BuildProduct = {
    id: text(product.id, text(row.product_id)),
    slug: text(product.slug, text(product.id, text(row.product_id))),
    name: text(product.name, "Catalog product"),
    brand: text(product.brand),
    model: text(product.model),
    category: text(product.category, text(row.category)),
    description: text(product.description),
    beginner_blurb: text(product.beginner_blurb),
    best_price_minor: price,
    best_shipping_minor: shipping,
    currency: text(listing.currency, "USD"),
    best_retailer: text(retailer.name, "Selected retailer"),
    condition: text(listing.condition, "new"),
    availability: text(listing.availability, "unknown"),
    deal_score: typeof listing.deal_score === "number" ? listing.deal_score : null,
    price_delta_minor: 0,
    listing_count: listingId ? 1 : 0,
    is_mock: false,
    specs,
    listings: listingId
      ? [
          {
            id: listingId,
            retailer: text(retailer.name, "Selected retailer"),
            retailer_slug: text(retailer.slug),
            price_minor: price,
            shipping_minor: shipping,
            currency: text(listing.currency, "USD"),
            condition: text(listing.condition, "new"),
            availability: text(listing.availability, "unknown"),
            deal_score: typeof listing.deal_score === "number" ? listing.deal_score : null,
            product_url: text(listing.product_url),
            is_marketplace: listing.is_marketplace === true,
            is_mock: false,
          },
        ]
      : [],
  };
  return {
    id: text(row.id),
    build_id: buildId,
    product_id: text(row.product_id, buildProduct.id),
    listing_id: listingId,
    category: text(row.category, buildProduct.category),
    quantity: number(row.quantity, 1),
    purchased: row.purchased === true,
    paid_price_minor:
      typeof row.paid_price_minor === "number" ? row.paid_price_minor : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    product: buildProduct,
  };
}

const BUILD_SELECT =
  "*,items:build_items(*,product:products(*,specs:product_specs(*)),listing:retailer_listings(*,retailer:retailers(name,slug)))";

export async function listBuilds(ownerId: string, useRemote: boolean): Promise<Build[]> {
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) return localBuilds(ownerId);
  const { data, error } = await supabase
    .from("builds")
    .select(BUILD_SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(parseRemoteBuild);
}

export async function getBuild(
  ownerId: string,
  buildId: string,
  useRemote: boolean,
): Promise<Build | null> {
  const builds = await listBuilds(ownerId, useRemote);
  return builds.find((build) => build.id === buildId) ?? null;
}

/** Public read for shared links — anon Supabase or guest localStorage scan. */
export async function getPublicBuildBySlug(slug: string): Promise<Build | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("builds")
      .select(BUILD_SELECT)
      .eq("share_slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw error;
    return data ? parseRemoteBuild(data) : null;
  }

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const builds = JSON.parse(localStorage.getItem(key) ?? "[]") as Build[];
      const match = builds.find((build) => build.is_public && build.share_slug === slug);
      if (match) return match;
    }
  } catch {
    /* ignore corrupt local storage */
  }
  return null;
}

export async function createBuild(
  ownerId: string,
  name: string,
  useRemote: boolean,
): Promise<Build> {
  const now = new Date().toISOString();
  const draft: Build = {
    id: crypto.randomUUID(),
    user_id: ownerId,
    name,
    notes: null,
    is_public: false,
    share_slug: null,
    status: "in_progress",
    target_total_minor: null,
    currency: "USD",
    created_at: now,
    updated_at: now,
    items: [],
  };
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) {
    saveLocal(ownerId, [draft, ...localBuilds(ownerId)]);
    return draft;
  }
  const { data, error } = await supabase
    .from("builds")
    .insert({ user_id: ownerId, name })
    .select(BUILD_SELECT)
    .single();
  if (error) throw error;
  return parseRemoteBuild(data);
}

export async function updateBuild(
  ownerId: string,
  buildId: string,
  patch: BuildPatch,
  useRemote: boolean,
): Promise<void> {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("builds").update(patch).eq("id", buildId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localBuilds(ownerId).map((build) =>
      build.id === buildId ? { ...build, ...patch, updated_at: new Date().toISOString() } : build,
    ),
  );
}

export async function deleteBuild(ownerId: string, buildId: string, useRemote: boolean) {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("builds").delete().eq("id", buildId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localBuilds(ownerId).filter((build) => build.id !== buildId),
  );
}

export async function duplicateBuild(
  ownerId: string,
  build: Build,
  useRemote: boolean,
): Promise<Build> {
  const supabase = useRemote ? getSupabase() : null;
  if (!supabase) {
    const now = new Date().toISOString();
    const copy: Build = {
      ...build,
      id: crypto.randomUUID(),
      name: `${build.name} copy`,
      is_public: false,
      share_slug: null,
      created_at: now,
      updated_at: now,
      items: [],
    };
    copy.items = build.items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      build_id: copy.id,
    }));
    saveLocal(ownerId, [copy, ...localBuilds(ownerId)]);
    return copy;
  }

  const copy = await createBuild(ownerId, `${build.name} copy`, true);
  await updateBuild(
    ownerId,
    copy.id,
    { notes: build.notes, target_total_minor: build.target_total_minor },
    true,
  );
  if (build.items.length) {
    const { error } = await supabase.from("build_items").insert(
      build.items.map((item) => ({
        build_id: copy.id,
        product_id: item.product_id,
        listing_id: item.listing_id,
        category: item.category,
        quantity: item.quantity,
        purchased: item.purchased,
        paid_price_minor: item.paid_price_minor,
        notes: item.notes,
      })),
    );
    if (error) throw error;
  }
  return { ...copy, notes: build.notes, target_total_minor: build.target_total_minor };
}

export async function addBuildItem(
  ownerId: string,
  buildId: string,
  product: BuildProduct,
  useRemote: boolean,
): Promise<void> {
  const selected = product.listings?.[0];
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("build_items").insert({
      build_id: buildId,
      product_id: product.id,
      listing_id: selected?.id ?? null,
      category: product.category,
    });
    if (error) throw error;
    return;
  }
  const builds = localBuilds(ownerId).map((build) => {
    if (build.id !== buildId) return build;
    const withoutCategory = build.items.filter((item) => item.category !== product.category);
    const item: BuildItem = {
      id: crypto.randomUUID(),
      build_id: buildId,
      product_id: product.id,
      listing_id: selected?.id ?? null,
      category: product.category,
      quantity: 1,
      purchased: false,
      paid_price_minor: null,
      notes: null,
      product,
    };
    return { ...build, items: [...withoutCategory, item], updated_at: new Date().toISOString() };
  });
  saveLocal(ownerId, builds);
}

export async function removeBuildItem(
  ownerId: string,
  buildId: string,
  itemId: string,
  useRemote: boolean,
) {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("build_items").delete().eq("id", itemId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localBuilds(ownerId).map((build) =>
      build.id === buildId
        ? { ...build, items: build.items.filter((item) => item.id !== itemId) }
        : build,
    ),
  );
}

export async function updateBuildItem(
  ownerId: string,
  buildId: string,
  itemId: string,
  patch: Pick<BuildItem, "listing_id" | "purchased" | "paid_price_minor">,
  useRemote: boolean,
) {
  const supabase = useRemote ? getSupabase() : null;
  if (supabase) {
    const { error } = await supabase.from("build_items").update(patch).eq("id", itemId);
    if (error) throw error;
    return;
  }
  saveLocal(
    ownerId,
    localBuilds(ownerId).map((build) =>
      build.id === buildId
        ? {
            ...build,
            items: build.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          }
        : build,
    ),
  );
}
