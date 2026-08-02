"""Retailer adapters."""

from src.adapters.amazon_paapi import AmazonPaapiAdapter
from src.adapters.base import NormalizedListing, RetailerAdapter
from src.adapters.bestbuy import BestBuyAdapter
from src.adapters.microcenter import MicroCenterAdapter
from src.adapters.mock import MockRetailerAdapter
from src.adapters.newegg import NeweggAdapter

__all__ = [
    "AmazonPaapiAdapter",
    "BestBuyAdapter",
    "MicroCenterAdapter",
    "MockRetailerAdapter",
    "NeweggAdapter",
    "NormalizedListing",
    "RetailerAdapter",
]
