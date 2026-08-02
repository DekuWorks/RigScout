from fastapi.testclient import TestClient

from src.core.compatibility import CompatibilityItem, evaluate_compatibility
from src.main import app

client = TestClient(app)


def _codes(result: dict[str, object]) -> set[str]:
    messages = result["messages"]
    assert isinstance(messages, list)
    return {str(message["code"]) for message in messages}


def test_compatible_demo_build_has_no_errors() -> None:
    response = client.post(
        "/v1/builds/evaluate",
        json={
            "items": [
                {"slug": "amd-ryzen-7-7800x3d"},
                {"slug": "msi-b650-tomahawk"},
                {"slug": "gskill-32gb-ddr5-6000"},
                {"slug": "nvidia-rtx-4070-super"},
                {"slug": "lian-li-lancool-216"},
                {"slug": "thermalright-peerless-assassin"},
                {"slug": "corsair-rm850x"},
            ]
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["guidance_only"] is True
    assert data["totals"]["price_minor"] > 0
    assert not [message for message in data["messages"] if message["severity"] == "error"]


def test_detects_socket_ram_fit_and_clearance_conflicts() -> None:
    result = evaluate_compatibility(
        [
            CompatibilityItem("cpu", "CPU", {"socket": "AM5", "tdp": "150"}),
            CompatibilityItem(
                "motherboard",
                "Board",
                {"socket": "LGA1700", "ram_type": "DDR5", "form_factor": "ATX"},
            ),
            CompatibilityItem("ram", "RAM", {"ram_type": "DDR4"}),
            CompatibilityItem("gpu", "GPU", {"length_mm": "350", "tdp": "300"}),
            CompatibilityItem(
                "case",
                "Case",
                {"form_factor_support": "mATX,ITX", "gpu_clearance_mm": "320"},
            ),
            CompatibilityItem("cooling", "Cooler", {"socket_support": "AM4,LGA1700"}),
            CompatibilityItem("psu", "PSU", {"wattage": "500"}),
        ]
    )
    assert {
        "cpu_motherboard_socket",
        "ram_motherboard_type",
        "motherboard_case_form_factor",
        "gpu_case_clearance",
        "cooler_cpu_socket",
        "psu_headroom",
    }.issubset(_codes(result))


def test_evaluate_accepts_custom_specs_and_rejects_unknown_slug() -> None:
    custom = client.post(
        "/v1/builds/evaluate",
        json={
            "items": [
                {
                    "category": "cpu",
                    "name": "Custom CPU",
                    "specs": {"socket": "AM5", "tdp": 105},
                    "price_minor": 25000,
                }
            ]
        },
    )
    assert custom.status_code == 200
    assert custom.json()["totals"]["known_tdp_watts"] == 105

    unknown = client.post(
        "/v1/builds/evaluate",
        json={"items": [{"slug": "missing-product"}]},
    )
    assert unknown.status_code == 404
