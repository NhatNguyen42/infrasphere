"""Scenario simulation routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ScenarioInput, ScenarioResult
from app.services.scenario import run_scenario

router = APIRouter()


@router.post("/run", response_model=ScenarioResult)
async def run(body: ScenarioInput):
    return run_scenario(body)


@router.get("/defaults", response_model=ScenarioInput)
async def defaults():
    """Return default scenario input values."""
    return ScenarioInput()
