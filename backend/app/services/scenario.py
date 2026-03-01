"""
Scenario simulation engine — what-if analysis for AI infrastructure
demand shocks, interest-rate changes, power-price delta, and renewable
buildout pace.
"""
from __future__ import annotations

import math

from app.data.regions import get_regions
from app.data.securities import get_securities
from app.schemas import (
    ScenarioInput,
    ScenarioResult,
    RegionImpact,
    SecurityImpact,
)


def _compute_region_impact(region: dict, inp: ScenarioInput) -> RegionImpact:
    """Compute how a region's grid strain shifts under the scenario."""
    base_ai = region["ai_demand_gw"]
    # New AI demand = base * (scenario_growth / baseline_growth)
    baseline_growth = region["ai_demand_growth_pct"] / 100
    scenario_growth = inp.ai_demand_growth_pct / 100
    growth_ratio = scenario_growth / max(baseline_growth, 0.01)
    new_ai = base_ai * growth_ratio

    # Renewable additions affected by buildout multiplier
    planned = region["planned_additions_gw"] * inp.renewable_buildout_multiplier
    effective_capacity = region["grid_capacity_gw"] + planned

    # Demand delta from power price elasticity (higher prices → ~10% demand reduction per +20%)
    price_elasticity = -0.005  # per % price change
    demand_adj = 1 + (inp.power_price_change_pct * price_elasticity)

    new_total = (region["current_demand_gw"] - base_ai + new_ai) * demand_adj
    new_strain = min(new_total / effective_capacity, 1.0)
    baseline_strain = region["grid_strain_index"]
    strain_delta = new_strain - baseline_strain

    gap = max(new_total - effective_capacity, 0)
    # Rough capex: ~$1.5B per GW of new needed capacity, scaled by interest rate
    rate_factor = 1 + (inp.interest_rate_pct - 4.5) * 0.05  # above neutral → more expensive
    capex = gap * 1.5 * rate_factor

    return RegionImpact(
        region_id=region["id"],
        region_name=region["name"],
        baseline_strain=round(baseline_strain, 4),
        scenario_strain=round(new_strain, 4),
        strain_delta=round(strain_delta, 4),
        capacity_gap_gw=round(gap, 2),
        capex_required_bn=round(capex, 2),
    )


def _compute_security_impact(sec: dict, inp: ScenarioInput, region_impacts: dict[str, RegionImpact]) -> SecurityImpact:
    """Score a security based on how much the scenario helps or hurts it."""
    base_score = 50.0  # neutral

    # AI demand growth benefits high-AI-revenue names
    ai_rev = sec["ai_infra_revenue_pct"] / 100
    demand_boost = (inp.ai_demand_growth_pct - 25) * 0.8 * ai_rev  # 25% is baseline

    # Power price sensitivity
    power_sens = sec["power_demand_sensitivity"]
    # Utilities & power equipment BENEFIT from higher prices; hyperscalers LOSE
    if sec["category"] in ("utility", "nuclear", "renewable", "power_equipment"):
        price_effect = inp.power_price_change_pct * 0.3 * power_sens
    else:
        price_effect = -inp.power_price_change_pct * 0.2 * power_sens

    # Interest rate hurts capital-intensive REITs more
    rate_penalty = 0.0
    if sec["category"] in ("data_center_reit",):
        rate_penalty = -(inp.interest_rate_pct - 4.5) * 3.0
    elif sec["category"] in ("nuclear", "renewable"):
        rate_penalty = -(inp.interest_rate_pct - 4.5) * 2.0

    # Renewable buildout helps renewables, hurts fossil/nuclear slightly
    renew_effect = 0.0
    if sec["category"] == "renewable":
        renew_effect = (inp.renewable_buildout_multiplier - 1.0) * 20.0
    elif sec["category"] == "nuclear":
        renew_effect = -(inp.renewable_buildout_multiplier - 1.0) * 5.0

    # Regional strain bonus: if a security's regions are highly strained, more investment flows there
    strain_bonus = 0.0
    for r in sec.get("regions", []):
        ri = region_impacts.get(r)
        if ri and ri.strain_delta > 0:
            strain_bonus += ri.strain_delta * 30 * power_sens

    score = base_score + demand_boost + price_effect + rate_penalty + renew_effect + strain_bonus
    score = max(0, min(100, score))

    delta = score - base_score
    if delta > 15:
        signal = "strong_buy"
    elif delta > 5:
        signal = "buy"
    elif delta > -5:
        signal = "hold"
    else:
        signal = "sell"

    return SecurityImpact(
        ticker=sec["ticker"],
        name=sec["name"],
        category=sec["category"],
        baseline_score=round(base_score, 1),
        scenario_score=round(score, 1),
        score_delta=round(delta, 1),
        signal=signal,
    )


def run_scenario(inp: ScenarioInput) -> ScenarioResult:
    regions = get_regions()
    securities = get_securities()

    region_impacts_list = [_compute_region_impact(r, inp) for r in regions]
    region_impacts_map = {ri.region_id: ri for ri in region_impacts_list}

    sec_impacts = [_compute_security_impact(s, inp, region_impacts_map) for s in securities]
    sec_impacts.sort(key=lambda s: s.score_delta, reverse=True)

    aggregate_capex = sum(ri.capex_required_bn for ri in region_impacts_list)
    aggregate_strain = sum(ri.strain_delta for ri in region_impacts_list) / max(len(region_impacts_list), 1)
    avg_sec_impact = sum(si.score_delta for si in sec_impacts) / max(len(sec_impacts), 1)

    # Generate scenario insights
    insights: list[str] = []
    worst_region = max(region_impacts_list, key=lambda ri: ri.scenario_strain)
    if worst_region.scenario_strain > 0.90:
        insights.append(
            f"{worst_region.region_name} grid strain hits {worst_region.scenario_strain:.0%} — "
            f"critical capacity risk. ${worst_region.capex_required_bn:.1f}B capex needed."
        )
    if inp.ai_demand_growth_pct > 35:
        insights.append(
            f"AI demand growth at {inp.ai_demand_growth_pct}% accelerates power-equipment "
            f"and cooling names — VRT, ETN, GEV top beneficiaries."
        )
    if inp.renewable_buildout_multiplier > 1.5:
        insights.append(
            "Accelerated renewable buildout narrows capacity gaps and lifts FSLR, BEP, CWEN."
        )
    if inp.interest_rate_pct > 6.0:
        insights.append(
            f"Elevated rates ({inp.interest_rate_pct:.1f}%) compress REIT multiples — "
            f"EQIX and DLR face ~{abs(sec_impacts[0].score_delta):.0f}pt headwind."
        )
    if not insights:
        insights.append("Scenario within normal parameters — no extreme signals detected.")

    return ScenarioResult(
        inputs=inp,
        aggregate_capex_bn=round(aggregate_capex, 2),
        aggregate_strain_delta=round(aggregate_strain, 4),
        avg_security_impact=round(avg_sec_impact, 2),
        region_impacts=region_impacts_list,
        top_beneficiaries=sec_impacts[:8],
        top_losers=list(reversed(sec_impacts[-5:])),
        insights=insights,
    )
