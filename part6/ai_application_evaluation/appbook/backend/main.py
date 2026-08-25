from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import FRONTEND_DIR
from backend.routers import data_explorer, evaluation, meta


app = FastAPI(title="AI Application Evaluation Studio",version="1.0.0")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
for router in (meta.router,evaluation.router,data_explorer.router):
    app.include_router(router)
app.mount("/",StaticFiles(directory=str(FRONTEND_DIR),html=True),name="frontend")


if __name__ == "__main__":
    import uvicorn
    from backend.config import settings
    uvicorn.run("backend.main:app",host=settings.host,port=settings.port,reload=False)
