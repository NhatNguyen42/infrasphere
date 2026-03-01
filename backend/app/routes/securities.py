"""Securities routes — list, filter, heatmap, sector breakdown."""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import io

from app.schemas import SecurityFilters, HeatmapCell
from app.services.analytics import (
    filter_securities,
    get_heatmap,
    get_sector_breakdown,
    get_top_movers,
    get_power_sensitivity_data,
)
from app.services.report import generate_report

router = APIRouter()


@router.get("/list")
async def list_securities(
    category: str | None = None,
    region: str | None = None,
    min_ai_revenue: float | None = None,
    min_esg: float | None = None,
    sort_by: str = "market_cap_bn",
    sort_desc: bool = True,
    search: str | None = None,
    limit: int = 100,
):
    filters = SecurityFilters(
        category=category,
        region=region,
        min_ai_revenue=min_ai_revenue,
        min_esg=min_esg,
        sort_by=sort_by,
        sort_desc=sort_desc,
        search=search,
        limit=limit,
    )
    return filter_securities(filters)


@router.get("/heatmap", response_model=list[HeatmapCell])
async def heatmap():
    return get_heatmap()


@router.get("/sectors")
async def sectors():
    return get_sector_breakdown()


@router.get("/top-movers")
async def top_movers(n: int = Query(5, ge=1, le=20)):
    return get_top_movers(n)


@router.get("/power-sensitivity")
async def power_sensitivity():
    return get_power_sensitivity_data()


@router.get("/report")
async def download_report():
    pdf_bytes = generate_report()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=infrasphere_report.pdf"},
    )
