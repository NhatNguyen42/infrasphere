"""
Power-demand forecasting engine.
Uses exponential + saturation model for AI demand, linear trend for
base load, and generates confidence bands.
"""
from __future__ import annotations

import math

from app.data.regions import get_regions, get_demand_history, get_region_by_id
from app.schemas import DemandPoint, ForecastResult


def _forecast_region(region: dict, horizon_years: int = 5) -> ForecastResult:
    """Generate historical + forecast demand for a region."""
    history_raw = get_demand_history(region["id"])

    # Build historical DemandPoints
    historical: list[DemandPoint] = []
    for h in history_raw:
        renewable_frac = region["renewable_capacity_gw"] / max(region["grid_capacity_gw"], 1)
        # Rough renewable supply scaled by year progression
        years_offset = h["year"] - 2026
        renew_supply = region["renewable_capacity_gw"] * max(0.5, 1 + years_offset * 0.05)
        gap = max(h["total"] - region["grid_capacity_gw"], 0)
        historical.append(DemandPoint(
            year=h["year"],
            total_demand_gw=h["total"],
            ai_demand_gw=h["ai"],
            renewable_supply_gw=round(renew_supply, 2),
            capacity_gap_gw=round(gap, 2),
            confidence_lower=h["total"] * 0.98,
            confidence_upper=h["total"] * 1.02,
        ))

    # Forecast: project forward
    base_total = region["current_demand_gw"]
    base_ai = region["ai_demand_gw"]
    ai_growth = region["ai_demand_growth_pct"] / 100
    base_load_growth = 0.012  # 1.2% p.a. base load growth

    renew_capacity = region["renewable_capacity_gw"]
    planned = region["planned_additions_gw"]

    forecast: list[DemandPoint] = []
    for y in range(1, horizon_years + 1):
        year = 2026 + y
        # AI demand: exponential with saturation (logistic-ish cap at 3x current)
        ai_cap = base_ai * 4
        ai = ai_cap / (1 + ((ai_cap / base_ai) - 1) * math.exp(-ai_growth * y * 1.5))

        # Base load (non-AI) grows linearly
        non_ai_base = (base_total - base_ai) * (1 + base_load_growth * y)
        total = non_ai_base + ai

        # Renewable supply grows with planned additions spread over 5 years
        renew = renew_capacity + (planned * min(y / 5, 1.0))

        gap = max(total - region["grid_capacity_gw"] - planned * min(y / 5, 1.0), 0)

        # Confidence bands widen with horizon
        spread = 0.02 + 0.015 * y
        forecast.append(DemandPoint(
            year=year,
            total_demand_gw=round(total, 2),
            ai_demand_gw=round(ai, 2),
            renewable_supply_gw=round(renew, 2),
            capacity_gap_gw=round(gap, 2),
            confidence_lower=round(total * (1 - spread), 2),
            confidence_upper=round(total * (1 + spread), 2),
        ))

    return ForecastResult(
        region_id=region["id"],
        region_name=region["name"],
        historical=historical,
        forecast=forecast,
    )


def get_forecast(region_id: str, horizon: int = 5) -> ForecastResult | None:
    region = get_region_by_id(region_id)
    if not region:
        return None
    return _forecast_region(region, horizon)


def get_all_forecasts(horizon: int = 5) -> list[ForecastResult]:
    regions = get_regions()
    # Only forecast regions with historical data (US regions)
    forecastable = [r for r in regions if get_demand_history(r["id"])]
    return [_forecast_region(r, horizon) for r in forecastable]
