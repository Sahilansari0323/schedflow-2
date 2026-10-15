from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, campus, conflicts_api, master, public, substitutions, system, timetables
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.seed import seed

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(master.router)
app.include_router(timetables.router)
app.include_router(system.router)
app.include_router(conflicts_api.router)
app.include_router(substitutions.router)
app.include_router(campus.router)
app.include_router(campus.user_router)
app.include_router(campus.teacher_router)
app.include_router(public.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
