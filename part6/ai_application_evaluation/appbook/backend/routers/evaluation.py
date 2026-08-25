from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from backend.config import settings
from backend.core.catalog import FORM_FACTOR_BY_ID
from backend.core.evaluator import run_suite
from backend.core.repository import repository
from backend.core.sse import sse_response


router = APIRouter(prefix="/api/evaluate", tags=["evaluation"])


@router.post("/{form_factor}")
async def evaluate(form_factor: str):
    if form_factor not in FORM_FACTOR_BY_ID:
        raise HTTPException(404, f"Unknown form factor: {form_factor}")
    result = run_suite(form_factor)
    run_id = repository.start_run(form_factor)

    async def events():
        yield {"type":"start","run_id":run_id,"form_factor":form_factor,
               "total":len(result["rows"]),"mode":"deterministic regression fixtures"}
        for index,row in enumerate(result["rows"],1):
            repository.add_result(run_id,row)
            yield {"type":"case","run_id":run_id,"index":index,"total":len(result["rows"]),**row}
            if settings.suite_delay_ms:
                await asyncio.sleep(settings.suite_delay_ms/1000)
        repository.complete_run(run_id,result["summary"],result["gates"],result["passed"])
        yield {"type":"summary","run_id":run_id,"summary":result["summary"],
               "gates":result["gates"],"passed":result["passed"]}

    return sse_response(events())
