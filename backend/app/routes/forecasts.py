"""Forecast routes — power-demand projections by region."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas import ForecastResult
from app.services.forecast import get_forecast, get_all_forecasts

router = APIRouter()


@router.get("/region/{region_id}", response_model=ForecastResult)
async def forecast_region(region_id: str, horizon: int = Query(5, ge=1, le=10)):
    result = get_forecast(region_id, horizon)
    if not result:
        raise HTTPException(404, f"No forecast data for region '{region_id}'")
    return result


@router.get("/all", response_model=list[ForecastResult])
async def forecast_all(horizon: int = Query(5, ge=1, le=10)):
    return get_all_forecasts(horizon)
