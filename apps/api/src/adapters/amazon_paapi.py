"""Amazon Product Advertising API 5.0 (PA-API) adapter — no HTML scraping.

Requires:
  AMAZON_PAAPI_ACCESS_KEY
  AMAZON_PAAPI_SECRET_KEY
  AMAZON_PAAPI_PARTNER_TAG

Signup: Amazon Associates (https://affiliate-program.amazon.com/), then request
Product Advertising / Creators API access from Associates Central.

Note (2025–2026): Amazon has deprecated PA-API 5 in favour of the Creators API.
This adapter implements the PA-API 5 SearchItems / GetItems wire format with
AWS SigV4 so existing Associates credentials can be used if still authorised.
If Amazon returns AccessDenied deprecation errors, migrate credentials via:
https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi
"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote

import httpx

from src.adapters.base import Availability, ListingCondition, NormalizedListing, RetailerAdapter

PAAPI_HOST = "webservices.amazon.com"
PAAPI_REGION = "us-east-1"
PAAPI_SERVICE = "ProductAdvertisingAPI"
PAAPI_MARKETPLACE = "www.amazon.com"

SEARCH_RESOURCES = [
    "Images.Primary.Large",
    "ItemInfo.Title",
    "ItemInfo.ByLineInfo",
    "ItemInfo.Classifications",
    "Offers.Listings.Price",
    "Offers.Listings.Availability.Type",
    "Offers.Listings.Availability.Message",
    "Offers.Listings.Condition",
    "Offers.Listings.DeliveryInfo.IsFreeShippingEligible",
]


class AmazonPaapiError(RuntimeError):
    """Raised when PA-API rejects a request or returns an error payload."""


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _hmac_sha256(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def sign_aws_v4(
    *,
    method: str,
    host: str,
    path: str,
    payload: bytes,
    access_key: str,
    secret_key: str,
    amz_date: str,
    region: str = PAAPI_REGION,
    service: str = PAAPI_SERVICE,
    amz_target: str,
) -> dict[str, str]:
    """Build AWS Signature Version 4 headers for a PA-API POST."""
    date_stamp = amz_date[:8]
    canonical_headers = (
        f"content-encoding:amz-1.0\n"
        f"content-type:application/json; charset=utf-8\n"
        f"host:{host}\n"
        f"x-amz-date:{amz_date}\n"
        f"x-amz-target:{amz_target}\n"
    )
    signed_headers = "content-encoding;content-type;host;x-amz-date;x-amz-target"
    canonical_request = "\n".join(
        [
            method,
            path,
            "",  # query string
            canonical_headers,
            signed_headers,
            _sha256_hex(payload),
        ]
    )
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        [
            "AWS4-HMAC-SHA256",
            amz_date,
            credential_scope,
            _sha256_hex(canonical_request.encode("utf-8")),
        ]
    )
    k_date = _hmac_sha256(("AWS4" + secret_key).encode("utf-8"), date_stamp)
    k_region = hmac.new(k_date, region.encode("utf-8"), hashlib.sha256).digest()
    k_service = hmac.new(k_region, service.encode("utf-8"), hashlib.sha256).digest()
    k_signing = hmac.new(k_service, b"aws4_request", hashlib.sha256).digest()
    signature = hmac.new(k_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
    authorization = (
        f"AWS4-HMAC-SHA256 Credential={access_key}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    return {
        "content-encoding": "amz-1.0",
        "content-type": "application/json; charset=utf-8",
        "host": host,
        "x-amz-date": amz_date,
        "x-amz-target": amz_target,
        "Authorization": authorization,
    }


def _nested(data: dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def dollars_to_minor(amount: object) -> int | None:
    if amount is None:
        return None
    try:
        value = float(amount)
    except (TypeError, ValueError):
        return None
    if value < 0:
        return None
    return int(round(value * 100))


def map_paapi_availability(listing: dict[str, Any]) -> Availability:
    avail_type = str(_nested(listing, "Availability", "Type") or "").lower()
    message = str(_nested(listing, "Availability", "Message") or "").lower()
    if "preorder" in avail_type or "pre-order" in message:
        return "preorder"
    if avail_type in {"now", "available"} or "in stock" in message:
        return "in_stock"
    if "out" in avail_type or "unavailable" in message or "out of stock" in message:
        return "out_of_stock"
    # Offers present usually means buyable
    if listing.get("Price"):
        return "in_stock"
    return "unknown"


def map_paapi_condition(listing: dict[str, Any]) -> ListingCondition:
    value = str(_nested(listing, "Condition", "Value") or "New").lower()
    if "refurb" in value:
        return "refurbished"
    if value in {"used", "collectible", "renewed"}:
        return "used"
    return "new"


def normalize_paapi_item(item: dict[str, Any], *, now: datetime | None = None) -> NormalizedListing | None:
    """Map a PA-API SearchItems/GetItems item to NormalizedListing."""
    asin = item.get("ASIN")
    if not isinstance(asin, str) or not asin.strip():
        return None

    offers = _nested(item, "Offers", "Listings")
    offer = offers[0] if isinstance(offers, list) and offers else {}
    if not isinstance(offer, dict):
        offer = {}

    amount = _nested(offer, "Price", "Amount")
    price_minor = dollars_to_minor(amount)
    if price_minor is None:
        return None

    title = _nested(item, "ItemInfo", "Title", "DisplayValue")
    if not isinstance(title, str) or not title.strip():
        title = f"Amazon ASIN {asin}"

    brand = _nested(item, "ItemInfo", "ByLineInfo", "Brand", "DisplayValue")
    if brand is not None and not isinstance(brand, str):
        brand = str(brand)

    url = item.get("DetailPageURL")
    if not isinstance(url, str) or not url.startswith("http"):
        url = f"https://www.amazon.com/dp/{quote(asin, safe='')}"

    image = _nested(item, "Images", "Primary", "Large", "URL")
    if image is not None and not isinstance(image, str):
        image = None

    shipping_minor = 0 if _nested(offer, "DeliveryInfo", "IsFreeShippingEligible") is True else None

    checked = now or datetime.now(UTC)
    return NormalizedListing(
        source="amazon",
        external_listing_id=asin.strip(),
        product_url=url,
        title=title.strip(),
        brand=brand.strip() if isinstance(brand, str) and brand.strip() else None,
        category=None,
        price_minor=price_minor,
        currency=str(_nested(offer, "Price", "Currency") or "USD"),
        shipping_minor=shipping_minor,
        condition=map_paapi_condition(offer),
        availability=map_paapi_availability(offer),
        last_checked_at=checked,
        image_url=image,
        is_mock=False,
    )


class AmazonPaapiAdapter(RetailerAdapter):
    name = "amazon"

    def __init__(
        self,
        access_key: str,
        secret_key: str,
        partner_tag: str,
        *,
        client: httpx.AsyncClient | None = None,
        host: str = PAAPI_HOST,
        marketplace: str = PAAPI_MARKETPLACE,
        item_count: int = 5,
    ) -> None:
        if not access_key.strip() or not secret_key.strip() or not partner_tag.strip():
            raise ValueError(
                "AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, and "
                "AMAZON_PAAPI_PARTNER_TAG are required"
            )
        self._access_key = access_key.strip()
        self._secret_key = secret_key.strip()
        self._partner_tag = partner_tag.strip()
        self._client = client
        self._owns_client = client is None
        self._host = host
        self._marketplace = marketplace
        self._item_count = item_count

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _post(self, path: str, target: str, body: dict[str, Any]) -> dict[str, Any]:
        payload = json.dumps(body).encode("utf-8")
        amz_date = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        headers = sign_aws_v4(
            method="POST",
            host=self._host,
            path=path,
            payload=payload,
            access_key=self._access_key,
            secret_key=self._secret_key,
            amz_date=amz_date,
            amz_target=target,
        )
        client = await self._get_client()
        response = await client.post(
            f"https://{self._host}{path}",
            content=payload,
            headers=headers,
        )
        data = response.json() if response.content else {}
        if not isinstance(data, dict):
            raise AmazonPaapiError("PA-API returned a non-object JSON body")

        errors = data.get("Errors")
        if response.status_code >= 400 or errors:
            message = "PA-API request failed"
            if isinstance(errors, list) and errors:
                first = errors[0] if isinstance(errors[0], dict) else {}
                code = first.get("Code", "Error")
                msg = first.get("Message", response.text[:300])
                message = f"{code}: {msg}"
                if "deprecated" in str(msg).lower() or code == "AccessDenied":
                    message += (
                        " — Amazon deprecated PA-API 5; migrate to Creators API "
                        "(see docs/RETAILER_ADAPTERS.md)."
                    )
            raise AmazonPaapiError(message)

        return data

    async def fetch_listings(self, query: str | None = None) -> list[NormalizedListing]:
        if not query or not query.strip():
            raise ValueError("AmazonPaapiAdapter.fetch_listings requires a search query")
        body = {
            "PartnerTag": self._partner_tag,
            "PartnerType": "Associates",
            "Keywords": query.strip(),
            "SearchIndex": "Electronics",
            "ItemCount": self._item_count,
            "Resources": SEARCH_RESOURCES,
            "Marketplace": self._marketplace,
        }
        data = await self._post(
            "/paapi5/searchitems",
            "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
            body,
        )
        items = _nested(data, "SearchResult", "Items")
        if not isinstance(items, list):
            return []
        now = datetime.now(UTC)
        listings: list[NormalizedListing] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            normalized = normalize_paapi_item(item, now=now)
            if normalized is not None:
                listings.append(normalized)
        return listings

    async def fetch_listing(self, external_id: str) -> NormalizedListing | None:
        asin = external_id.strip()
        if not asin:
            return None
        body = {
            "PartnerTag": self._partner_tag,
            "PartnerType": "Associates",
            "ItemIds": [asin],
            "Resources": SEARCH_RESOURCES,
            "Marketplace": self._marketplace,
        }
        data = await self._post(
            "/paapi5/getitems",
            "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
            body,
        )
        items = _nested(data, "ItemsResult", "Items")
        if not isinstance(items, list) or not items:
            return None
        first = items[0]
        if not isinstance(first, dict):
            return None
        return normalize_paapi_item(first)
