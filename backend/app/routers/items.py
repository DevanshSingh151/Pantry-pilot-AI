from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import pantry as models
from app.schemas import pantry as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.PantryItemOut])
def get_items(db: Session = Depends(get_db)):
    return db.query(models.PantryItem).all()

@router.post("/", response_model=schemas.PantryItemOut)
def create_item(item: schemas.PantryItemCreate, db: Session = Depends(get_db)):
    db_item = models.PantryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=schemas.PantryItemOut)
def update_item(item_id: int, item: schemas.PantryItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.model_dump().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}

@router.post("/upload-bill")
async def upload_bill(file: UploadFile = File(...)):
    import base64
    from app.services.ai import analyze_bill
    contents = await file.read()
    b64 = base64.b64encode(contents).decode('utf-8')
    items = analyze_bill(b64, file.content_type)
    return {"items": items}
