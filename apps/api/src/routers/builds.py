"""Build evaluation endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from src.core.compatibility import CompatibilityItem, evaluate_compatibility
from src.services.demo_catalog import get_product

router = APIRouter(prefix="/v1/builds", tags=["builds"])


class BuildEvaluationItem(BaseModel):
    slug: str | None = None
    category: str | None = None
    name: str | None = None
    specs: dict[str, str | int | float] | None = None
    price_minor: Annotated[int | None, Field(ge=0)] = None

    @model_validator(mode="after")
    def validate_source(self) -> BuildEvaluationItem:
        if not self.slug and not (self.category and self.name and self.specs is not None):
            raise ValueError("Provide a product slug or category, name, and specs")
        return self


class BuildEvaluationRequest(BaseModel):
    items: Annotated[list[BuildEvaluationItem], Field(min_length=1, max_length=50)]


@router.post("/evaluate")
async def evaluate_build(payload: BuildEvaluationRequest) -> dict[str, object]:
    items: list[CompatibilityItem] = []
    unknown_slugs: list[str] = []

    for requested in payload.items:
        product = get_product(requested.slug) if requested.slug else None
        if requested.slug and product is None:
            unknown_slugs.append(requested.slug)
            continue

        if product:
            best_listing = min(
                product.listings,
                key=lambda listing: listing.price_minor + listing.shipping_minor,
            )
            items.append(
                CompatibilityItem(
                    category=product.category,
                    name=product.name,
                    specs={spec.key: spec.value for spec in product.specs},
                    price_minor=requested.price_minor
                    if requested.price_minor is not None
                    else best_listing.price_minor + best_listing.shipping_minor,
                )
            )
        else:
            items.append(
                CompatibilityItem(
                    category=requested.category or "",
                    name=requested.name or "",
                    specs={key: str(value) for key, value in (requested.specs or {}).items()},
                    price_minor=requested.price_minor,
                )
            )

    if unknown_slugs:
        raise HTTPException(
            status_code=404,
            detail={"message": "Unknown demo catalog products", "slugs": unknown_slugs},
        )

    return evaluate_compatibility(items)
