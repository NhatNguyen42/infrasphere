"""Infrastructure routes — globe data, nodes, connections."""
from __future__ import annotations

from fastapi import APIRouter

from app.data.infrastructure import get_nodes, get_connections, get_node_by_id
from app.data.regions import get_regions
from app.schemas import GlobeData, InfraNode, Connection, Region
from app.services.insights import get_insights

router = APIRouter()


@router.get("/globe", response_model=GlobeData)
async def globe_data():
    """Return all infrastructure nodes and connections for 3D globe."""
    return GlobeData(
        nodes=[InfraNode(**n) for n in get_nodes()],
        connections=[Connection(**c) for c in get_connections()],
    )


@router.get("/nodes", response_model=list[InfraNode])
async def list_nodes(node_type: str | None = None, region: str | None = None):
    nodes = get_nodes()
    if node_type:
        nodes = [n for n in nodes if n["type"] == node_type]
    if region:
        nodes = [n for n in nodes if n["region"] == region]
    return [InfraNode(**n) for n in nodes]


@router.get("/nodes/{node_id}", response_model=InfraNode | None)
async def get_node(node_id: str):
    n = get_node_by_id(node_id)
    return InfraNode(**n) if n else None


@router.get("/regions", response_model=list[Region])
async def list_regions():
    return [Region(**r) for r in get_regions()]


@router.get("/insights")
async def list_insights():
    return get_insights()
