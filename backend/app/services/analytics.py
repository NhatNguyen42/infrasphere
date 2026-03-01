"""
Securities analytics — filtering, sorting, heatmap data, sector breakdown,
and power-sensitivity analysis.
"""
from __future__ import annotations

from app.data.securities import get_securities, CATEGORY_LABELS
from app.schemas import SecurityFilters, HeatmapCell


def filter_securities(filters: SecurityFilters) -> list[dict]:
    """Apply filters, search, and sort to the securities universe."""
    data = get_securities()

    if filters.search:
        q = filters.search.lower()
        data = [s for s in data if q in s["ticker"].lower() or q in s["name"].lower()]

    if filters.category:
        data = [s for s in data if s["category"] == filters.category]

    if filters.region:
        data = [s for s in data if filters.region in s.get("regions", [])]

    if filters.min_ai_revenue is not None:
        data = [s for s in data if s["ai_infra_revenue_pct"] >= filters.min_ai_revenue]

    if filters.min_esg is not None:
        data = [s for s in data if s["esg_score"] >= filters.min_esg]

    # Sort
    key = filters.sort_by
    data.sort(key=lambda s: s.get(key, 0) or 0, reverse=filters.sort_desc)

    return data[: filters.limit]


def get_heatmap() -> list[HeatmapCell]:
    """Return heatmap-ready data: ticker, name, category, market_cap (size),
    ytd_return (color), ai_revenue."""
    secs = get_securities()
    # Exclude ETFs from heatmap
    secs = [s for s in secs if s["category"] != "etf"]
    return [
        HeatmapCell(
            ticker=s["ticker"],
            name=s["name"],
            category=s["category"],
            market_cap_bn=s["market_cap_bn"],
            ytd_return=s["ytd_return"],
            ai_infra_revenue_pct=s["ai_infra_revenue_pct"],
        )
        for s in secs
    ]


def get_sector_breakdown() -> list[dict]:
    """Aggregate market cap and count by category."""
    secs = get_securities()
    agg: dict[str, dict] = {}
    for s in secs:
        cat = s["category"]
        if cat not in agg:
            agg[cat] = {"category": cat, "label": CATEGORY_LABELS.get(cat, cat),
                        "count": 0, "total_market_cap_bn": 0, "avg_ytd_return": 0, "avg_ai_revenue": 0}
        agg[cat]["count"] += 1
        agg[cat]["total_market_cap_bn"] += s["market_cap_bn"]
        agg[cat]["avg_ytd_return"] += s["ytd_return"]
        agg[cat]["avg_ai_revenue"] += s["ai_infra_revenue_pct"]

    result = []
    for cat, v in agg.items():
        n = v["count"]
        v["avg_ytd_return"] = round(v["avg_ytd_return"] / n, 1)
        v["avg_ai_revenue"] = round(v["avg_ai_revenue"] / n, 1)
        v["total_market_cap_bn"] = round(v["total_market_cap_bn"], 1)
        result.append(v)

    result.sort(key=lambda x: x["total_market_cap_bn"], reverse=True)
    return result


def get_top_movers(n: int = 5) -> list[dict]:
    """Return top N movers by absolute YTD return."""
    secs = get_securities()
    secs.sort(key=lambda s: abs(s["ytd_return"]), reverse=True)
    return [{"ticker": s["ticker"], "name": s["name"],
             "ytd_return": s["ytd_return"], "category": s["category"]}
            for s in secs[:n]]


def get_power_sensitivity_data() -> list[dict]:
    """Scatter data: power_demand_sensitivity vs ytd_return."""
    secs = get_securities()
    return [
        {
            "ticker": s["ticker"],
            "name": s["name"],
            "category": s["category"],
            "power_demand_sensitivity": s["power_demand_sensitivity"],
            "ytd_return": s["ytd_return"],
            "ai_infra_revenue_pct": s["ai_infra_revenue_pct"],
            "market_cap_bn": s["market_cap_bn"],
        }
        for s in secs
        if s["category"] != "etf"
    ]
