"""Build compatibility guidance shared by API and future ingestion paths."""

from __future__ import annotations

from dataclasses import dataclass
from math import ceil
from typing import Literal

Severity = Literal["error", "warning", "info"]


@dataclass(frozen=True)
class CompatibilityItem:
    category: str
    name: str
    specs: dict[str, str]
    price_minor: int | None = None


def _values(value: str | None) -> set[str]:
    if not value:
        return set()
    return {part.strip().upper() for part in value.split(",") if part.strip()}


def _number(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def evaluate_compatibility(items: list[CompatibilityItem]) -> dict[str, object]:
    """Return conservative guidance; physical fit and firmware support need verification."""
    by_category = {item.category: item for item in items}
    messages: list[dict[str, str]] = []

    def add(severity: Severity, code: str, message: str) -> None:
        messages.append({"severity": severity, "code": code, "message": message})

    cpu = by_category.get("cpu")
    motherboard = by_category.get("motherboard")
    ram = by_category.get("ram")
    case = by_category.get("case")
    gpu = by_category.get("gpu")
    cooler = by_category.get("cooling")
    psu = by_category.get("psu")

    if cpu and motherboard:
        cpu_socket = cpu.specs.get("socket")
        board_socket = motherboard.specs.get("socket")
        if cpu_socket and board_socket and cpu_socket.upper() != board_socket.upper():
            add(
                "error",
                "cpu_motherboard_socket",
                f"CPU socket {cpu_socket} does not match motherboard socket {board_socket}.",
            )

    if ram and motherboard:
        ram_type = ram.specs.get("ram_type")
        board_ram = motherboard.specs.get("ram_type")
        if ram_type and board_ram and ram_type.upper() != board_ram.upper():
            add(
                "error",
                "ram_motherboard_type",
                f"RAM type {ram_type} does not match motherboard memory type {board_ram}.",
            )

    if motherboard and case:
        board_form = motherboard.specs.get("form_factor")
        supported = _values(case.specs.get("form_factor_support"))
        if board_form and supported and board_form.upper() not in supported:
            add(
                "error",
                "motherboard_case_form_factor",
                f"{board_form} motherboard is not listed in the case form-factor support.",
            )

    if gpu and case:
        gpu_length = _number(gpu.specs.get("length_mm"))
        clearance = _number(case.specs.get("gpu_clearance_mm"))
        if gpu_length is not None and clearance is not None and gpu_length > clearance:
            add(
                "error",
                "gpu_case_clearance",
                f"GPU length {gpu_length:g} mm exceeds case clearance {clearance:g} mm.",
            )

    if cooler and cpu:
        cpu_socket = cpu.specs.get("socket")
        supported = _values(cooler.specs.get("socket_support"))
        if cpu_socket and supported and cpu_socket.upper() not in supported:
            add(
                "error",
                "cooler_cpu_socket",
                f"Cooler does not list support for CPU socket {cpu_socket}.",
            )

    known_tdp = sum(
        value
        for item in items
        if (value := _number(item.specs.get("tdp"))) is not None
    )
    # 40% headroom plus 100 W for motherboard, memory, storage, fans, and transient load.
    recommended_psu = ceil((known_tdp * 1.4 + 100) / 50) * 50 if known_tdp else 0
    psu_wattage = _number(psu.specs.get("wattage")) if psu else None
    if recommended_psu and psu_wattage is not None:
        if psu_wattage < recommended_psu:
            add(
                "warning",
                "psu_headroom",
                (
                    f"{psu_wattage:g} W PSU is below the {recommended_psu} W guidance "
                    "based on known TDPs and headroom."
                ),
            )
        else:
            add(
                "info",
                "psu_headroom",
                f"PSU meets the {recommended_psu} W headroom guidance.",
            )

    if not any(message["severity"] in {"error", "warning"} for message in messages):
        add(
            "info",
            "no_known_conflicts",
            "No conflicts found in the available specs. This is guidance, not a guarantee.",
        )

    return {
        "guidance_only": True,
        "messages": messages,
        "totals": {
            "item_count": len(items),
            "price_minor": sum(item.price_minor or 0 for item in items),
            "known_tdp_watts": round(known_tdp),
            "recommended_psu_watts": recommended_psu,
        },
    }
