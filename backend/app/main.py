"""
InfraSphere — 3D AI Infrastructure & Power Grid Convergence Platform
FastAPI Backend — Main Application
Created by Nhat Nguyen
"""
from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — pre-compute insights
    from app.services.insights import generate_insights
    generate_insights()
    print("Insights engine warmed up.")
    yield


app = FastAPI(
    title="InfraSphere API",
    version="1.0.0",
    description=(
        "3D AI Infrastructure & Power Grid Convergence Platform — "
        "globe data, securities analytics, scenario simulation, "
        "power-demand forecasting, and AI-driven insights."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

origins = [
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
from app.routes.infrastructure import router as infra_router
from app.routes.securities import router as securities_router
from app.routes.scenarios import router as scenarios_router
from app.routes.forecasts import router as forecasts_router

app.include_router(infra_router, prefix="/api/infra", tags=["Infrastructure"])
app.include_router(securities_router, prefix="/api/securities", tags=["Securities"])
app.include_router(scenarios_router, prefix="/api/scenarios", tags=["Scenarios"])
app.include_router(forecasts_router, prefix="/api/forecasts", tags=["Forecasts"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "infrasphere-backend"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
