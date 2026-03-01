"""
AI Insights engine — rule-based statistical analysis that generates
natural-language investment insights from infrastructure and securities data.
Designed to mimic an AI co-pilot sidebar.
"""
from __future__ import annotations

import hashlib
import statistics
from datetime import datetime

from app.data.regions import get_regions
from app.data.securities import get_securities
from app.data.infrastructure import get_nodes
from app.schemas import Insight

# Module-level cache
_cached_insights: list[Insight] = []


def generate_insights() -> list[Insight]:
    """Analyse all data and produce a set of insights."""
    global _cached_insights
    insights: list[Insight] = []
    regions = get_regions()
    securities = get_securities()
    nodes = get_nodes()

    # ── 1. Grid strain alerts ────────────────────────────────────────────
    strain_values = [r["grid_strain_index"] for r in regions]
    mean_strain = statistics.mean(strain_values)
    std_strain = statistics.stdev(strain_values) if len(strain_values) > 1 else 0.05

    for r in regions:
        strain = r["grid_strain_index"]
        z = (strain - mean_strain) / std_strain if std_strain else 0
        if strain > 0.80:
            # Find related tickers
            related = [s["ticker"] for s in securities
                       if r["id"] in s.get("regions", []) and s["power_demand_sensitivity"] > 0.7]
            severity = "critical" if strain > 0.85 else "warning"
            z_str = f"{abs(z):.1f}σ"
            insights.append(Insight(
                id=_make_id(f"strain-{r['id']}"),
                severity=severity,
                category="grid_strain",
                title=f"{r['name']} grid at {strain:.0%} capacity",
                description=(
                    f"Grid strain is {z_str} {'above' if z > 0 else 'below'} average. "
                    f"AI demand ({r['ai_demand_gw']:.1f} GW) growing {r['ai_demand_growth_pct']}% YoY. "
                    + (f"Exposure to {', '.join(related[:3])} becomes attractive." if related else "")
                ),
                tickers=related[:5],
                region=r["id"],
                metric_value=round(strain * 100, 1),
                metric_unit="%",
            ))

    # ── 2. Capacity growth hotspots ──────────────────────────────────────
    growth_rates = [r["ai_demand_growth_pct"] for r in regions]
    mean_growth = statistics.mean(growth_rates)
    std_growth = statistics.stdev(growth_rates) if len(growth_rates) > 1 else 5

    for r in regions:
        g = r["ai_demand_growth_pct"]
        if g > mean_growth + std_growth:
            dc_nodes = [n for n in nodes if n["type"] == "data_center" and n["region"] == r["id"]]
            total_capex = sum(n.get("capex_bn", 0) for n in dc_nodes)
            hints = [s["ticker"] for s in securities
                     if r["id"] in s.get("regions", []) and s["category"] in ("data_center_reit", "dc_services")]
            insights.append(Insight(
                id=_make_id(f"growth-{r['id']}"),
                severity="opportunity",
                category="capacity",
                title=f"{r['name']}: AI demand growing {g}% YoY",
                description=(
                    f"Data-centre capacity in {r['name']} expanding rapidly. "
                    f"${total_capex:.1f}B capex committed. "
                    + (f"{', '.join(hints[:3])} positioned to capture build-out." if hints else "")
                ),
                tickers=hints[:5],
                region=r["id"],
                metric_value=g,
                metric_unit="% YoY",
            ))

    # ── 3. Top security movers ───────────────────────────────────────────
    ytd_values = [s["ytd_return"] for s in securities]
    mean_ytd = statistics.mean(ytd_values)
    std_ytd = statistics.stdev(ytd_values) if len(ytd_values) > 1 else 10

    for s in securities:
        z = (s["ytd_return"] - mean_ytd) / std_ytd if std_ytd else 0
        if abs(z) > 1.8:
            direction = "outperforming" if z > 0 else "underperforming"
            insights.append(Insight(
                id=_make_id(f"mover-{s['ticker']}"),
                severity="info" if z > 0 else "warning",
                category="equity",
                title=f"{s['ticker']} {direction} at {z:.1f}σ",
                description=(
                    f"{s['name']} ({s['category'].replace('_', ' ').title()}) "
                    f"YTD return {s['ytd_return']:+.0f}%. "
                    f"AI-infra revenue share: {s['ai_infra_revenue_pct']}%. "
                    f"Power-demand sensitivity: {s['power_demand_sensitivity']:.2f}."
                ),
                tickers=[s["ticker"]],
                metric_value=round(z, 2),
                metric_unit="σ",
            ))

    # ── 4. Renewable vs fossil balance ───────────────────────────────────
    total_renew = sum(r["renewable_capacity_gw"] for r in regions)
    total_cap = sum(r["grid_capacity_gw"] for r in regions)
    renew_share = total_renew / total_cap if total_cap else 0
    insights.append(Insight(
        id=_make_id("renewable-global"),
        severity="info",
        category="renewable",
        title=f"Global renewable share at {renew_share:.0%}",
        description=(
            f"Total renewable capacity: {total_renew:.0f} GW across tracked regions. "
            f"Planned additions: {sum(r['planned_additions_gw'] for r in regions):.0f} GW. "
            f"FSLR, BEP, CWEN, NEE are primary beneficiaries of accelerating build-out."
        ),
        tickers=["FSLR", "BEP", "CWEN", "NEE"],
        metric_value=round(renew_share * 100, 1),
        metric_unit="%",
    ))

    # ── 5. Capex mega-trend ──────────────────────────────────────────────
    total_dc_capex = sum(n.get("capex_bn", 0) for n in nodes if n["type"] == "data_center")
    insights.append(Insight(
        id=_make_id("capex-total"),
        severity="opportunity",
        category="capex",
        title=f"${total_dc_capex:.0f}B global DC capex committed",
        description=(
            f"Hyperscalers and colocators have committed ${total_dc_capex:.0f}B in data-centre capex. "
            f"Equipment suppliers (GEV, ETN, HUBB) and cooling (VRT) are direct beneficiaries. "
            f"Nuclear restarts (CEG, CCJ) signal a multi-decade power shift."
        ),
        tickers=["GEV", "ETN", "HUBB", "VRT", "CEG", "CCJ"],
        metric_value=total_dc_capex,
        metric_unit="$B",
    ))

    # Sort: critical first, then warnings, then opportunities, then info
    severity_order = {"critical": 0, "warning": 1, "opportunity": 2, "info": 3}
    insights.sort(key=lambda i: severity_order.get(i.severity, 4))

    _cached_insights = insights
    return insights


def get_insights() -> list[Insight]:
    """Return cached insights, generating them if necessary."""
    if not _cached_insights:
        generate_insights()
    return _cached_insights


def _make_id(key: str) -> str:
    return hashlib.md5(key.encode()).hexdigest()[:12]
