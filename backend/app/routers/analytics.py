from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import pantry as models
from app.schemas import pantry as schemas
from datetime import date
from sqlalchemy import func
from app.services.ai import generate_pantry_insights

router = APIRouter()

@router.get("/", response_model=schemas.AnalyticsOut)
def get_analytics(db: Session = Depends(get_db)):
    total_items = db.query(func.sum(models.PantryItem.quantity)).scalar() or 0
    today = date.today()
    
    items = db.query(models.PantryItem).all()
    
    expired = 0
    expiring_soon = 0
    fresh = 0
    low_stock = 0
    
    for item in items:
        if item.quantity <= item.min_stock_level:
            low_stock += 1
            
        if item.expiry_date:
            days_to_expiry = (item.expiry_date - today).days
            if days_to_expiry < 0:
                expired += 1
            elif days_to_expiry <= 7:
                expiring_soon += 1
            else:
                fresh += 1
        else:
            fresh += 1
            
    stats = {
        "total_items": len(items),
        "total_quantity": total_items,
        "expired": expired,
        "expiring_soon": expiring_soon,
        "fresh": fresh,
        "low_stock": low_stock
    }
    
    # Generate insights via AI
    insights = generate_pantry_insights(stats)
    
    stats["insights"] = insights
    return stats
