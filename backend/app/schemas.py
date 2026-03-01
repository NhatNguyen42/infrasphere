"""Pydantic schemas for InfraSphere API."""
from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------
class InfraNode(BaseModel):
    id: str
    name: str
    type: str
    subtype: str
    lat: float
    lng: float
    region: str
    capacity_mw: float
    utilization: float
    operator: str
    growth_rate: float
    renewable_pct: float
    capex_bn: float


class Connection(BaseModel):
    id: str
    from_id: str
    to_id: str
    capacity_mw: float
    flow_mw: float
    type: str


class GlobeData(BaseModel):
    nodes: list[InfraNode]
    connections: list[Connection]


# ---------------------------------------------------------------------------
# Securities
# ---------------------------------------------------------------------------
class Security(BaseModel):
    ticker: str
    name: str
    sector: str
    category: str
    price: float
    market_cap_bn: float
    pe_ratio: float
    dividend_yield: float
    beta: float
    ytd_return: float
    one_year_return: float
    ai_infra_revenue_pct: float
    power_demand_sensitivity: float
    regions: list[str]
    esg_score: float
    carbon_intensity: float


class SecurityFilters(BaseModel):
    category: str | None = None
    region: str | None = None
    min_ai_revenue: float | None = None
    min_esg: float | None = None
    sort_by: str = "market_cap_bn"
    sort_desc: bool = True
    search: str | None = None
    limit: int = 100


class HeatmapCell(BaseModel):
    ticker: str
    name: str
    category: str
    market_cap_bn: float
    ytd_return: float
    ai_infra_revenue_pct: float


# ---------------------------------------------------------------------------
# Regions
# ---------------------------------------------------------------------------
class Region(BaseModel):
    id: str
    name: str
    country: str
    grid_capacity_gw: float
    current_demand_gw: float
    ai_demand_gw: float
    ai_demand_growth_pct: float
    renewable_capacity_gw: float
    planned_additions_gw: float
    grid_strain_index: float
    avg_electricity_price_kwh: float
    data_center_count: int
    total_dc_capacity_mw: float


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------
class ScenarioInput(BaseModel):
    ai_demand_growth_pct: float = Field(35, ge=0, le=100, description="AI demand YoY growth %")
    interest_rate_pct: float = Field(5.0, ge=0, le=20, description="Fed funds rate %")
    power_price_change_pct: float = Field(0, ge=-50, le=100, description="Power price delta %")
    renewable_buildout_multiplier: float = Field(1.0, ge=0.1, le=5.0, description="Renewable buildout speed")


class RegionImpact(BaseModel):
    region_id: str
    region_name: str
    baseline_strain: float
    scenario_strain: float
    strain_delta: float
    capacity_gap_gw: float
    capex_required_bn: float


class SecurityImpact(BaseModel):
    ticker: str
    name: str
    category: str
    baseline_score: float
    scenario_score: float
    score_delta: float
    signal: str  # "strong_buy" | "buy" | "hold" | "sell"


class ScenarioResult(BaseModel):
    inputs: ScenarioInput
    aggregate_capex_bn: float
    aggregate_strain_delta: float
    avg_security_impact: float
    region_impacts: list[RegionImpact]
    top_beneficiaries: list[SecurityImpact]
    top_losers: list[SecurityImpact]
    insights: list[str]


# ---------------------------------------------------------------------------
# Forecasts
# ---------------------------------------------------------------------------
class DemandPoint(BaseModel):
    year: int
    total_demand_gw: float
    ai_demand_gw: float
    renewable_supply_gw: float
    capacity_gap_gw: float
    confidence_lower: float
    confidence_upper: float


class ForecastResult(BaseModel):
    region_id: str
    region_name: str
    historical: list[DemandPoint]
    forecast: list[DemandPoint]


# ---------------------------------------------------------------------------
# AI Insights
# ---------------------------------------------------------------------------
class Insight(BaseModel):
    id: str
    severity: str          # "critical" | "warning" | "info" | "opportunity"
    category: str          # "grid_strain" | "capacity" | "equity" | "capex" | "renewable"
    title: str
    description: str
    tickers: list[str]
    region: str | None = None
    metric_value: float | None = None
    metric_unit: str | None = None
