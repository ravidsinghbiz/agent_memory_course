from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.core.repository import repository


router = APIRouter(prefix="/api/data-explorer", tags=["data-explorer"])


@router.get("/tables")
def tables():
    return {"backend":"SQLite evaluation evidence store","tables":repository.tables()}


@router.get("/tables/{table}/rows")
def rows(table: str, limit: int = Query(50,ge=1,le=200), offset: int = Query(0,ge=0)):
    try:
        return repository.rows(table,limit,offset)
    except KeyError:
        raise HTTPException(404,"Table is not exposed")


@router.get("/activity")
def activity():
    return {"items":repository.recent()}
