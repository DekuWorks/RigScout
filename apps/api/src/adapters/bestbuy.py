"""Best Buy Products API adapter (official Remix / developer API).

Requires ``BEST_BUY_API_KEY``. Signup: https://developer.bestbuy.com/
Docs: https://bestbuyapis.github.io/api-documentation/
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote, urlencode

import httpx

from src.adapters.base import Availability, ListingCondition, NormalizedListing, RetailerAdapter

BESTBUY_API_BASE = "https://api.bestbuy.com/v1"
PRODUCT_SHOW = ",".join(
    [
        "sku",
        "name",
        "manufacturer",
        "modelNumber",
        "salePrice",
        "regularPrice",
        "url",
        "image",
        "onlineAvailability",
        "orderable",
        "condition",
        "type",
    ]
)


class BestBuyAdapterError(RuntimeError):
    """Raised when the Best Buy API rejects a request or returns unexpected data."""


def dollars_to_minor(value: object) -> int | None:
    """Convert a dollar amount (int/float/str) to integer cents."""
    if value is None:
        return None
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return None
    if amount < 0:
        return None
    return int(round(amount * 100))


def map_availability(product: dict[str, Any]) -> Availability:
    orderable = str(product.get("orderable") or "").lower()
    if orderable in {"preorder", "pre-order"}:
        return "preorder"
    online = product.get("onlineAvailability")
    if online is True:
        return "in_stock"
    if online is False:
        return "out_of_stock"
    if orderable in {"available", "soldonlineonly"}:
        return "in_stock"
    if orderable in {"soldout", "unavailable"}:
        return "out_of_stock"
    return "unknown"


def map_condition(product: dict[str, Any]) -> ListingCondition:
    raw = str(product.get("condition") or "new").strip().lower()
    if "refurb" in raw:
        return "refurbished"
    if raw in {"used", "pre-owned", "preowned", "open box", "open-box"}:
        return "used"
    return "new"


def normalize_bestbuy_product(product: dict[str, Any], *, now: datetime | None = None) -> NormalizedListing | None:
    """Map a Best Buy Products API object to NormalizedListing."""
    sku = product.get("sku")
    if sku is None:
        return None
    price_minor = dollars_to_minor(product.get("salePrice"))
    if price_minor is None:
        price_minor = dollars_to_minor(product.get("regularPrice"))
    if price_minor is None:
        return None

    url = product.get("url")
    if not isinstance(url, str) or not url.startswith("http"):
        url = f"https://www.bestbuy.com/site/{sku}.p"

    title = product.get("name")
    if not isinstance(title, str) or not title.strip():
        title = f"Best Buy SKU {sku}"

    brand = product.get("manufacturer")
    if brand is not None and not isinstance(brand, str):
        brand = str(brand)

    image = product.get("image")
    if image is not None and not isinstance(image, str):
        image = None

    checked = now or datetime.now(UTC)
    return NormalizedListing(
        source="bestbuy",
        external_listing_id=str(sku),
        product_url=url,
        title=title.strip(),
        brand=brand.strip() if isinstance(brand, str) and brand.strip() else None,
        category=None,
        price_minor=price_minor,
        currency="USD",
        shipping_minor=None,
        condition=map_condition(product),
        availability=map_availability(product),
        last_checked_at=checked,
        image_url=image,
        is_mock=False,
    )


def build_search_query(query: str) -> str:
    """Build Best Buy keyword search filter: search=term1&search=term2."""
    tokens = [t for t in query.replace(",", " ").split() if t]
    if not tokens:
        raise ValueError("search query is empty")
    # Ampersand between search= terms = AND (Best Buy keyword search semantics)
    return "&".join(f"search={quote(token, safe='')}" for token in tokens[:8])


class BestBuyAdapter(RetailerAdapter):
    name = "bestbuy"

    def __init__(
        self,
        api_key: str,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = BESTBUY_API_BASE,
        page_size: int = 5,
    ) -> None:
        if not api_key.strip():
            raise ValueError("BEST_BUY_API_KEY is required for BestBuyAdapter")
        self._api_key = api_key.strip()
        self._client = client
        self._owns_client = client is None
        self._base_url = base_url.rstrip("/")
        self._page_size = page_size

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _request_products(self, filter_expr: str) -> list[dict[str, Any]]:
        client = await self._get_client()
        # Filter expression lives in the path (must keep raw & / parentheses).
        query = urlencode(
            {
                "apiKey": self._api_key,
                "format": "json",
                "show": PRODUCT_SHOW,
                "pageSize": str(self._page_size),
            }
        )
        url = f"{self._base_url}/products({filter_expr})?{query}"
        response = await client.get(url)
        if response.status_code == 403:
            raise BestBuyAdapterError(
                "Best Buy API rejected the key (HTTP 403). Check BEST_BUY_API_KEY activation."
            )
        if response.status_code == 401:
            raise BestBuyAdapterError("Best Buy API unauthorized (HTTP 401). Check BEST_BUY_API_KEY.")
        if response.status_code >= 400:
            raise BestBuyAdapterError(
                f"Best Buy API error HTTP {response.status_code}: {response.text[:300]}"
            )
        data = response.json()
        products = data.get("products") if isinstance(data, dict) else None
        if not isinstance(products, list):
            raise BestBuyAdapterError("Best Buy API response missing products list")
        return [p for p in products if isinstance(p, dict)]

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        if not query or not query.strip():
            raise ValueError("BestBuyAdapter.fetch_listings requires a search query")
        filter_expr = build_search_query(query.strip())
        products = await self._request_products(filter_expr)
        now = datetime.now(UTC)
        listings: list[NormalizedListing] = []
        for product in products:
            normalized = normalize_bestbuy_product(product, now=now)
            if normalized is not None:
                listings.append(normalized)
        return listings

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        sku = external_id.strip()
        if not sku:
            return None
        client = await self._get_client()
        response = await client.get(
            f"{self._base_url}/products/{quote(sku, safe='')}.json",
            params={
                "apiKey": self._api_key,
                "show": PRODUCT_SHOW,
            },
        )
        if response.status_code == 404:
            return None
        if response.status_code >= 400:
            raise BestBuyAdapterError(
                f"Best Buy API error HTTP {response.status_code}: {response.text[:300]}"
            )
        data = response.json()
        if not isinstance(data, dict):
            return None
        return normalize_bestbuy_product(data)
