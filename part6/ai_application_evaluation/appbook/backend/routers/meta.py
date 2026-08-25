from __future__ import annotations

from fastapi import APIRouter

from backend.core.catalog import public_catalog
from backend.core.repository import repository


router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health():
    return {"ready":True,"mode":"deterministic regression fixtures","storage":"sqlite",
            "database_path":repository.path.name,"counts":repository.counts()}


@router.get("/catalog")
def catalog():
    return public_catalog()
