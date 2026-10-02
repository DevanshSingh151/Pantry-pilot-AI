from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import pantry as models
from app.schemas import pantry as schemas
from typing import List
from app.services.ai import generate_recipe_recommendations
from datetime import date

router = APIRouter()

@router.get("/recommend", response_model=List[schemas.RecipeSuggestion])
def get_recipes(db: Session = Depends(get_db)):
    items = db.query(models.PantryItem).all()
    today = date.today()
    
    # Sort items by expiry (putting None at the end, and closer ones first)
    valid_items = [i for i in items if i.quantity > 0]
    valid_items.sort(key=lambda x: x.expiry_date if x.expiry_date else date.max)
    
    # Send top 10 items to AI to keep prompt size reasonable
    pantry_data = [
        {
            "name": item.name,
            "quantity": item.quantity,
            "unit": item.unit,
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else "Unknown"
        }
        for item in valid_items[:10]
    ]
    
    recipes = generate_recipe_recommendations(pantry_data)
    return recipes
