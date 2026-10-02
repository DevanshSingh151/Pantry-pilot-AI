from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class PantryItemBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    quantity: float = 1.0
    unit: str = "pcs"
    purchase_date: Optional[date] = None
    expiry_date: Optional[date] = None
    min_stock_level: float = 0.0
    image_url: Optional[str] = None

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemOut(PantryItemBase):
    id: int
    category: Optional[CategoryOut] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class ShoppingListItemBase(BaseModel):
    pantry_item_id: Optional[int] = None
    name: str
    required_quantity: float = 1.0
    status: str = "pending"

class ShoppingListItemCreate(ShoppingListItemBase):
    pass

class ShoppingListItemOut(ShoppingListItemBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

class RecipeSuggestion(BaseModel):
    name: str
    description: str
    prep_time: str
    difficulty: str
    ingredients_used: List[str]
    missing_ingredients: List[str]
    reason: str

class OCRResult(BaseModel):
    items: List[PantryItemCreate]

class AnalyticsOut(BaseModel):
    total_items: int
    total_quantity: float
    expired: int
    expiring_soon: int
    fresh: int
    low_stock: int
    insights: List[str] = []
