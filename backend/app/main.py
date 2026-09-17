from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, projects, sites

# Dev convenience: create tables on startup. In production use Alembic.
# (Comment this out once you've run `alembic upgrade head` to avoid surprises.)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Darukaa.Earth API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
