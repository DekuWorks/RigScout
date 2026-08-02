"""In-memory MOCK catalog for local/demo use when Supabase is empty or offline.

Clearly labeled placeholder data — replace with live ingestion + Supabase reads later.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from statistics import mean

from src.core.deal_score import compute_deal_score


@dataclass(frozen=True)
class DemoSpec:
    key: str
    value: str
    unit: str | None = None


@dataclass
class DemoListing:
    id: str
    retailer: str
    retailer_slug: str
    source: str
    external_listing_id: str
    product_url: str
    price_minor: int
    shipping_minor: int
    currency: str
    condition: str
    availability: str
    is_marketplace: bool
    deal_score: float | None = None
    is_mock: bool = True


@dataclass
class DemoProduct:
    id: str
    slug: str
    name: str
    brand: str
    model: str
    category: str
    description: str
    beginner_blurb: str
    specs: list[DemoSpec]
    listings: list[DemoListing]
    history: list[tuple[datetime, int]]  # recorded_at, price_minor


def _history(base: int, days: int = 90, drift: int = 15) -> list[tuple[datetime, int]]:
    now = datetime.now(UTC)
    points: list[tuple[datetime, int]] = []
    for day in range(days, -1, -1):
        # Gentle wave so charts look realistic
        wobble = int(2500 * __import__("math").sin(day / 7.0))
        trend = int((days - day) * drift * 0.3)
        price = max(1000, base + wobble - trend + (day % 5) * 120)
        points.append((now - timedelta(days=day), price))
    # Ensure latest point matches "current" closely (caller may overwrite)
    return points


def _score_for(product: DemoProduct, listing: DemoListing) -> float | None:
    prices = [p for _, p in product.history]
    if not prices:
        return None
    recent_30 = prices[-30:] if len(prices) >= 30 else prices
    recent_90 = prices[-90:] if len(prices) >= 90 else prices
    return compute_deal_score(
        current_price_minor=listing.price_minor,
        avg_30d_minor=int(mean(recent_30)),
        avg_90d_minor=int(mean(recent_90)),
        historical_low_minor=min(prices),
        history_points=len(prices),
        available=listing.availability == "in_stock",
        condition=listing.condition,
        shipping_minor=listing.shipping_minor,
        retailer_confidence=0.88,
    )


def _build_catalog() -> list[DemoProduct]:
    raw: list[DemoProduct] = [
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000001",
            slug="amd-ryzen-7-7800x3d",
            name="AMD Ryzen 7 7800X3D",
            brand="AMD",
            model="7800X3D",
            category="cpu",
            description="8-core gaming CPU with 3D V-Cache. MOCK catalog entry.",
            beginner_blurb="The CPU is the brain of your PC. This chip is excellent for high-refresh gaming.",
            specs=[
                DemoSpec("socket", "AM5"),
                DemoSpec("tdp", "120", "W"),
                DemoSpec("cores", "8"),
            ],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000001",
                    "Amazon (MOCK)",
                    "amazon-mock",
                    "amazon-mock",
                    "mock-cpu-7800x3d",
                    "https://example.com/mock/7800x3d",
                    35999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    True,
                ),
                DemoListing(
                    "c0000001-0000-4000-8000-000000000002",
                    "Newegg (MOCK)",
                    "newegg-mock",
                    "newegg-mock",
                    "mock-cpu-7800x3d-ne",
                    "https://example.com/mock/7800x3d-ne",
                    36999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(38000, drift=20),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000002",
            slug="nvidia-rtx-4070-super",
            name="NVIDIA GeForce RTX 4070 Super",
            brand="NVIDIA",
            model="RTX 4070 Super",
            category="gpu",
            description="1440p gaming GPU. MOCK catalog entry.",
            beginner_blurb="The GPU draws your games. More VRAM and CUDA cores usually means smoother frames.",
            specs=[
                DemoSpec("length_mm", "304", "mm"),
                DemoSpec("tdp", "220", "W"),
                DemoSpec("vram_gb", "12", "GB"),
            ],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000003",
                    "Amazon (MOCK)",
                    "amazon-mock",
                    "amazon-mock",
                    "mock-gpu-4070s",
                    "https://example.com/mock/4070-super",
                    59999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    True,
                ),
                DemoListing(
                    "c0000001-0000-4000-8000-000000000004",
                    "Best Buy (MOCK)",
                    "bestbuy-mock",
                    "bestbuy-mock",
                    "mock-gpu-4070s-bb",
                    "https://example.com/mock/4070-super-bb",
                    62999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(64000, drift=25),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000003",
            slug="msi-b650-tomahawk",
            name="MSI MAG B650 Tomahawk WiFi",
            brand="MSI",
            model="B650 Tomahawk WiFi",
            category="motherboard",
            description="AM5 ATX motherboard. MOCK catalog entry.",
            beginner_blurb="The motherboard connects every part. Match its socket to your CPU.",
            specs=[
                DemoSpec("socket", "AM5"),
                DemoSpec("ram_type", "DDR5"),
                DemoSpec("form_factor", "ATX"),
            ],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000005",
                    "Newegg (MOCK)",
                    "newegg-mock",
                    "newegg-mock",
                    "mock-mobo-b650",
                    "https://example.com/mock/b650",
                    21999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(23999, drift=8),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000004",
            slug="gskill-32gb-ddr5-6000",
            name="G.Skill Flare X5 32GB DDR5-6000",
            brand="G.Skill",
            model="Flare X5",
            category="ram",
            description="32GB (2x16) DDR5 kit. MOCK catalog entry.",
            beginner_blurb="RAM is short-term memory. 32GB is a sweet spot for gaming and multitasking.",
            specs=[DemoSpec("ram_type", "DDR5"), DemoSpec("capacity_gb", "32", "GB")],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000006",
                    "Micro Center (MOCK)",
                    "microcenter-mock",
                    "microcenter-mock",
                    "mock-ram-32",
                    "https://example.com/mock/ram32",
                    9499,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(10999, drift=5),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000005",
            slug="samsung-990-pro-2tb",
            name="Samsung 990 PRO 2TB NVMe",
            brand="Samsung",
            model="990 PRO",
            category="storage",
            description="PCIe 4.0 NVMe SSD. MOCK catalog entry.",
            beginner_blurb="Storage holds your games and files. NVMe SSDs are much faster than hard drives.",
            specs=[DemoSpec("interface", "NVMe"), DemoSpec("capacity_gb", "2000", "GB")],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000007",
                    "B&H (MOCK)",
                    "bh-mock",
                    "bh-mock",
                    "mock-ssd-990",
                    "https://example.com/mock/990pro",
                    15999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(17999, drift=10),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000006",
            slug="corsair-rm850x",
            name="Corsair RM850x 850W 80+ Gold",
            brand="Corsair",
            model="RM850x",
            category="psu",
            description="Fully modular 850W PSU. MOCK catalog entry.",
            beginner_blurb="The PSU feeds power to every component. Leave headroom above estimated wattage.",
            specs=[DemoSpec("wattage", "850", "W"), DemoSpec("efficiency", "80+ Gold")],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000008",
                    "Amazon (MOCK)",
                    "amazon-mock",
                    "amazon-mock",
                    "mock-psu-850",
                    "https://example.com/mock/rm850x",
                    13999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    True,
                ),
            ],
            history=_history(15499, drift=6),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000007",
            slug="lian-li-lancool-216",
            name="Lian Li Lancool 216",
            brand="Lian Li",
            model="Lancool 216",
            category="case",
            description="ATX mid-tower with strong airflow. MOCK catalog entry.",
            beginner_blurb="The case houses your build. Check GPU length clearance before buying a large card.",
            specs=[
                DemoSpec("form_factor_support", "ATX,mATX,ITX"),
                DemoSpec("gpu_clearance_mm", "392", "mm"),
            ],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000009",
                    "Newegg (MOCK)",
                    "newegg-mock",
                    "newegg-mock",
                    "mock-case-216",
                    "https://example.com/mock/lancool216",
                    10999,
                    599,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(11999, drift=4),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000008",
            slug="thermalright-peerless-assassin",
            name="Thermalright Peerless Assassin 120 SE",
            brand="Thermalright",
            model="PA120 SE",
            category="cooling",
            description="Dual-tower air cooler. MOCK catalog entry.",
            beginner_blurb="Cooling keeps your CPU safe under load. Confirm socket support before purchase.",
            specs=[
                DemoSpec("socket_support", "AM5,AM4,LGA1700"),
                DemoSpec("tdp_support", "220", "W"),
            ],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000010",
                    "Amazon (MOCK)",
                    "amazon-mock",
                    "amazon-mock",
                    "mock-cooler-pa120",
                    "https://example.com/mock/pa120",
                    3599,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    True,
                ),
            ],
            history=_history(3999, drift=2),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000009",
            slug="lg-27gp850",
            name='LG 27GP850-B 27" 1440p 165Hz',
            brand="LG",
            model="27GP850-B",
            category="monitor",
            description="1440p gaming monitor. MOCK catalog entry.",
            beginner_blurb="A monitor displays your image. Match resolution to what your GPU can drive well.",
            specs=[DemoSpec("resolution", "2560x1440"), DemoSpec("refresh_hz", "165", "Hz")],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000011",
                    "Best Buy (MOCK)",
                    "bestbuy-mock",
                    "bestbuy-mock",
                    "mock-monitor-27gp850",
                    "https://example.com/mock/27gp850",
                    34999,
                    0,
                    "USD",
                    "new",
                    "in_stock",
                    False,
                ),
            ],
            history=_history(37999, drift=12),
        ),
        DemoProduct(
            id="b0000001-0000-4000-8000-000000000010",
            slug="logitech-g-pro-x-superlight",
            name="Logitech G Pro X Superlight",
            brand="Logitech",
            model="GPX",
            category="peripherals",
            description="Wireless gaming mouse. MOCK catalog entry.",
            beginner_blurb="Peripherals are how you interact with the PC — comfort matters as much as specs.",
            specs=[DemoSpec("weight_g", "63", "g"), DemoSpec("connection", "wireless")],
            listings=[
                DemoListing(
                    "c0000001-0000-4000-8000-000000000012",
                    "Amazon (MOCK)",
                    "amazon-mock",
                    "amazon-mock",
                    "mock-mouse-gpx",
                    "https://example.com/mock/gpx",
                    11999,
                    0,
                    "USD",
                    "refurbished",
                    "in_stock",
                    True,
                ),
            ],
            history=_history(13999, drift=7),
        ),
    ]

    for product in raw:
        # Align latest history point with best listing price for cleaner charts
        best = min(product.listings, key=lambda item: item.price_minor + (item.shipping_minor or 0))
        if product.history:
            last_dt, _ = product.history[-1]
            product.history[-1] = (last_dt, best.price_minor)
        for listing in product.listings:
            listing.deal_score = _score_for(product, listing)
    return raw


_CATALOG = _build_catalog()


def list_products() -> list[DemoProduct]:
    return list(_CATALOG)


def get_product(slug_or_id: str) -> DemoProduct | None:
    for product in _CATALOG:
        if product.slug == slug_or_id or product.id == slug_or_id:
            return product
    return None


def product_summary(product: DemoProduct) -> dict[str, object]:
    best = min(product.listings, key=lambda item: item.price_minor + (item.shipping_minor or 0))
    prices = [p for _, p in product.history]
    prev = prices[-8] if len(prices) > 8 else prices[0] if prices else best.price_minor
    delta = best.price_minor - prev
    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "brand": product.brand,
        "model": product.model,
        "category": product.category,
        "description": product.description,
        "beginner_blurb": product.beginner_blurb,
        "best_price_minor": best.price_minor,
        "best_shipping_minor": best.shipping_minor,
        "currency": best.currency,
        "best_retailer": best.retailer,
        "condition": best.condition,
        "availability": best.availability,
        "deal_score": best.deal_score,
        "price_delta_minor": delta,
        "listing_count": len(product.listings),
        "is_mock": all(listing.is_mock for listing in product.listings),
    }
