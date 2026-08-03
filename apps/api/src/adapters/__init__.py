"""Retailer adapters."""

from src.adapters.amazon_paapi import AmazonPaapiAdapter
from src.adapters.base import NormalizedListing, RetailerAdapter
from src.adapters.bestbuy import BestBuyAdapter
from src.adapters.manual_feed import ManualFeedAdapter
from src.adapters.microcenter import MicroCenterAdapter
from src.adapters.mock import MockRetailerAdapter
from src.adapters.newegg import NeweggAdapter

__all__ = [
    "AmazonPaapiAdapter",
    "BestBuyAdapter",
    "ManualFeedAdapter",
    "MicroCenterAdapter",
    "MockRetailerAdapter",
    "NeweggAdapter",
    "NormalizedListing",
    "RetailerAdapter",
]
