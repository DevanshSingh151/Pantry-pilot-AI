from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import pantry as models
from app.schemas import pantry as schemas
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.ShoppingListItemOut])
def get_shopping_list(db: Session = Depends(get_db)):
    return db.query(models.ShoppingListItem).all()

@router.post("/", response_model=schemas.ShoppingListItemOut)
def create_shopping_item(item: schemas.ShoppingListItemCreate, db: Session = Depends(get_db)):
    db_item = models.ShoppingListItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=schemas.ShoppingListItemOut)
def update_shopping_item(item_id: int, item: schemas.ShoppingListItemBase, db: Session = Depends(get_db)):
    db_item = db.query(models.ShoppingListItem).filter(models.ShoppingListItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_shopping_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.ShoppingListItem).filter(models.ShoppingListItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}
