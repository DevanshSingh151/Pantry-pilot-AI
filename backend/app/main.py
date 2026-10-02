from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import items, analytics, recipes

# Create database tables (SQLite local dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PantryPilot AI", description="Smart Pantry & Expiry Management Assistant API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, update in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import items, analytics, recipes, shopping

# Include routers
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["recipes"])
app.include_router(shopping.router, prefix="/api/shopping", tags=["shopping"])

@app.get("/")
def read_root():
    return {"message": "Welcome to PantryPilot AI API"}
